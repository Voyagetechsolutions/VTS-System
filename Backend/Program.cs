using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.SignalR;
using Backend.Services;
using Backend.Payments;
using Backend.Logging;
using Backend.Seeders;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Backend.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// HttpContext accessor for custom authorization handler
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();

// Add SignalR for real-time updates
builder.Services.AddSignalR();

// Add CORS (for cookies, we must not use AllowAnyOrigin)
var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:3000";
var additionalOrigin = builder.Configuration["AdditionalFrontendOrigin"] ?? "http://127.0.0.1:3000";
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(new[] { frontendOrigin, additionalOrigin })
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add DbContext - Use SQLite for easier testing
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=busmgmt.db"));

// Add Identity
builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Configure Identity options
builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 6;
    options.Password.RequiredUniqueChars = 1;
});

// Add JWT Authentication
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSection["SecretKey"] ?? "";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = !string.IsNullOrEmpty(jwtSection["Issuer"]),
        ValidIssuer = jwtSection["Issuer"],
        ValidateAudience = !string.IsNullOrEmpty(jwtSection["Audience"]),
        ValidAudience = jwtSection["Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

// Add Authorization with company scoping policy
builder.Services.AddSingleton<IAuthorizationHandler, CompanyScopeHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CompanyScoped", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new CompanyScopeRequirement());
    });
});

// Add Services
builder.Services.AddScoped<StripeService>();
builder.Services.AddScoped<PayGateService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddScoped<SupabaseAdminService>();
builder.Services.AddScoped<SupabaseRestService>();

// Add Logging
builder.Services.AddApplicationInsightsTelemetry();
builder.Services.AddLogging();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // In development, avoid forcing HTTPS to prevent mixed content or self-signed cert issues
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("Frontend");

// Centralized exception handling
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var payload = System.Text.Json.JsonSerializer.Serialize(new
        {
            error = app.Environment.IsDevelopment() ? ex.Message : "An unexpected error occurred.",
            stack = app.Environment.IsDevelopment() ? ex.StackTrace : null
        });
        await context.Response.WriteAsync(payload);
    }
});
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<BusTrackingHub>("/busTrackingHub");

// Seed database - temporarily commented out due to connection issues
/*
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var seeder = new SeedData(context);
    await seeder.SeedAsync();
}
*/

app.Run();
