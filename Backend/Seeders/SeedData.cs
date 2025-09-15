using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Seeders
{
    public class SeedData
    {
        private readonly AppDbContext _context;

        public SeedData(AppDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            try
            {
                // Ensure database is created
                await _context.Database.EnsureCreatedAsync();

                // Seed companies if none exist
                if (!await _context.Companies.AnyAsync())
                {
                    var companies = new List<Company>
                    {
                        new Company
                        {
                            CompanyId = 1,
                            Name = "Alpha Transit",
                            Address = "123 Main Street, City Center",
                            ContactNumber = "+1-555-0101",
                            Email = "info@alphatransit.com",
                            CreatedAt = DateTime.UtcNow
                        },
                        new Company
                        {
                            CompanyId = 2,
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
                            RouteId = 1,
                            CompanyId = 1,
                            Origin = "City Center",
                            Destination = "Airport",
                            Distance = 25.5m,
                            EstimatedDuration = 45,
                            CreatedAt = DateTime.UtcNow
                        },
                        new BusRoute
                        {
                            RouteId = 2,
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
                            BusId = 1,
                            CompanyId = 1,
                            LicensePlate = "ABC-123",
                            Capacity = 45,
                            Status = "Active",
                            CreatedAt = DateTime.UtcNow
                        },
                        new Bus
                        {
                            BusId = 2,
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
