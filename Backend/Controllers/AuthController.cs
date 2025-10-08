using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly IConfiguration _config;

        public AuthController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IConfiguration config)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
        }

        public class TokenRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("token")]
        [AllowAnonymous]
        public async Task<IActionResult> IssueToken([FromBody] TokenRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { error = "Email and Password are required" });

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Unauthorized(new { error = "Invalid credentials" });

            var passwordValid = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
            if (!passwordValid.Succeeded)
                return Unauthorized(new { error = "Invalid credentials" });

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwt(user, roles);
            var refreshToken = GenerateRefreshToken(user);
            SetRefreshCookie(refreshToken);
            return Ok(new { token });
        }

        [HttpGet("whoami")]
        [Authorize]
        public IActionResult WhoAmI()
        {
            var claims = new
            {
                sub = User.FindFirstValue(ClaimTypes.NameIdentifier),
                email = User.FindFirstValue(ClaimTypes.Email),
                roles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToArray()
            };
            return Ok(claims);
        }

        private string GenerateJwt(IdentityUser user, IEnumerable<string> roles)
        {
            var jwtSection = _config.GetSection("JwtSettings");
            var secret = jwtSection["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey missing");
            var issuer = jwtSection["Issuer"] ?? "BusManagementSystem";
            var audience = jwtSection["Audience"] ?? "BusManagementUsers";
            var expirationMinutes = int.TryParse(jwtSection["ExpirationMinutes"], out var m) ? m : 60;

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            };
            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken(IdentityUser user)
        {
            var section = _config.GetSection("JwtRefresh");
            var secret = section["SecretKey"] ?? throw new InvalidOperationException("Refresh SecretKey missing");
            var issuer = section["Issuer"] ?? "BusManagementSystem";
            var audience = section["Audience"] ?? "BusManagementUsers";
            var expirationMinutes = int.TryParse(section["ExpirationMinutes"], out var m) ? m : 43200; // 30 days

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim("typ", "refresh")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private ClaimsPrincipal? ValidateRefreshToken(string token)
        {
            var section = _config.GetSection("JwtRefresh");
            var secret = section["SecretKey"] ?? throw new InvalidOperationException("Refresh SecretKey missing");
            var issuer = section["Issuer"] ?? "BusManagementSystem";
            var audience = section["Audience"] ?? "BusManagementUsers";
            var validation = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ClockSkew = TimeSpan.Zero
            };
            var handler = new JwtSecurityTokenHandler();
            try
            {
                var principal = handler.ValidateToken(token, validation, out var _);
                if (principal.FindFirst("typ")?.Value != "refresh") return null;
                return principal;
            }
            catch { return null; }
        }

        private void SetRefreshCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(30)
            };
            Response.Cookies.Append("refresh_token", refreshToken, cookieOptions);
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh()
        {
            if (!Request.Cookies.TryGetValue("refresh_token", out var refresh))
                return Unauthorized(new { error = "Missing refresh token" });
            var principal = ValidateRefreshToken(refresh);
            if (principal == null)
                return Unauthorized(new { error = "Invalid refresh token" });
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized(new { error = "Invalid refresh token" });
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Unauthorized(new { error = "Invalid refresh token" });
            var roles = await _userManager.GetRolesAsync(user);
            var newAccess = GenerateJwt(user, roles);
            var newRefresh = GenerateRefreshToken(user);
            SetRefreshCookie(newRefresh);
            return Ok(new { token = newAccess });
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Clear refresh token cookie
            if (Request.Cookies.ContainsKey("refresh_token"))
            {
                Response.Cookies.Append("refresh_token", "", new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddDays(-1)
                });
            }
            return Ok(new { message = "Logged out" });
        }
    }
}
