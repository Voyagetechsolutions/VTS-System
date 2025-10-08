using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Seeders
{
    public class SeedData
    {
        private readonly AppDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public SeedData(AppDbContext context, UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task SeedAsync()
        {
            try
            {
                // Ensure database is created
                await _context.Database.EnsureCreatedAsync();

                // 1) Seed roles
                var roles = new [] { "admin", "developer", "ops_manager", "booking_officer", "boarding_operator", "driver", "depot_manager", "maintenance_manager", "finance_manager", "hr_manager" };
                foreach (var role in roles)
                {
                    if (!await _roleManager.RoleExistsAsync(role))
                    {
                        await _roleManager.CreateAsync(new IdentityRole(role));
                    }
                }

                // 2) Seed default admin user (dev-safe defaults)
                const string defaultAdminEmail = "admin@vts.local";
                const string defaultAdminPassword = "Admin@12345"; // For development only; change in production
                var existingAdmin = await _userManager.FindByEmailAsync(defaultAdminEmail);
                if (existingAdmin == null)
                {
                    var adminUser = new IdentityUser { UserName = defaultAdminEmail, Email = defaultAdminEmail, EmailConfirmed = true };
                    var createResult = await _userManager.CreateAsync(adminUser, defaultAdminPassword);
                    if (createResult.Succeeded)
                    {
                        await _userManager.AddToRoleAsync(adminUser, "admin");

                        // Ensure default company exists for admin
                        var company = await _context.Companies.FirstOrDefaultAsync() ?? new Company
                        {
                            Name = "Alpha Transit",
                            Address = "123 Main Street, City Center",
                            ContactNumber = "+1-555-0101",
                            Email = "info@alphatransit.com",
                            CreatedAt = DateTime.UtcNow
                        };
                        if (company.CompanyId == 0) {
                            _context.Companies.Add(company);
                            await _context.SaveChangesAsync();
                        }

                        // Link profile
                        if (!await _context.UserProfiles.AnyAsync(u => u.Id == adminUser.Id))
                        {
                            _context.UserProfiles.Add(new User
                            {
                                Id = adminUser.Id,
                                Email = defaultAdminEmail,
                                Role = "admin",
                                CompanyId = company.CompanyId,
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow
                            });
                            await _context.SaveChangesAsync();
                        }
                    }
                }

                // Seed companies if none exist
                if (!await _context.Companies.AnyAsync())
                {
                    var companies = new List<Company>
                    {
                        new Company
                        {
                            Name = "Alpha Transit",
                            Address = "123 Main Street, City Center",
                            ContactNumber = "+1-555-0101",
                            Email = "info@alphatransit.com",
                            CreatedAt = DateTime.UtcNow
                        },
                        new Company
                        {
                            Name = "Beta Bus Lines",
                            Address = "456 Oak Avenue, Downtown",
                            ContactNumber = "+1-555-0102",
                            Email = "info@betabuslines.com",
                            CreatedAt = DateTime.UtcNow
                        }
                    };

                    _context.Companies.AddRange(companies);
                    await _context.SaveChangesAsync();
                }

                // Seed routes if none exist
                if (!await _context.Routes.AnyAsync())
                {
                    var routes = new List<BusRoute>
                    {
                        new BusRoute
                        {
                            CompanyId = 1,
                            Origin = "City Center",
                            Destination = "Airport",
                            Distance = 25.5m,
                            EstimatedDuration = 45,
                            CreatedAt = DateTime.UtcNow
                        },
                        new BusRoute
                        {
                            CompanyId = 1,
                            Origin = "Downtown",
                            Destination = "Shopping Mall",
                            Distance = 12.3m,
                            EstimatedDuration = 25,
                            CreatedAt = DateTime.UtcNow
                        }
                    };

                    _context.Routes.AddRange(routes);
                    await _context.SaveChangesAsync();
                }

                // Seed buses if none exist
                if (!await _context.Buses.AnyAsync())
                {
                    var buses = new List<Bus>
                    {
                        new Bus
                        {
                            CompanyId = 1,
                            LicensePlate = "ABC-123",
                            Capacity = 45,
                            Status = "Active",
                            CreatedAt = DateTime.UtcNow
                        },
                        new Bus
                        {
                            CompanyId = 1,
                            LicensePlate = "XYZ-789",
                            Capacity = 30,
                            Status = "Active",
                            CreatedAt = DateTime.UtcNow
                        }
                    };

                    _context.Buses.AddRange(buses);
                    await _context.SaveChangesAsync();
                }

                Console.WriteLine("Database seeded successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding database: {ex.Message}");
            }
        }
    }
}
