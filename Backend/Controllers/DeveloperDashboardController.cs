using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeveloperDashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DeveloperDashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("system-overview")]
        public IActionResult GetSystemOverview()
        {
            try
            {
                var totalCompanies = _context.Companies.Count();
                var totalUsers = _context.UserProfiles.Count();
                var totalBuses = _context.Buses.Count();
                var totalRoutes = _context.Routes.Count();

                // Simple rankings as placeholders
                var topCompanies = _context.Companies
                    .OrderByDescending(c => c.Routes.Count + c.Buses.Count + _context.UserProfiles.Count(u => u.CompanyId == c.CompanyId))
                    .Take(5)
                    .Select(c => new { name = c.Name, score = c.Routes.Count + c.Buses.Count + _context.UserProfiles.Count(u => u.CompanyId == c.CompanyId) })
                    .ToList();
                var worstCompanies = _context.Companies
                    .OrderBy(c => c.Routes.Count + c.Buses.Count + _context.UserProfiles.Count(u => u.CompanyId == c.CompanyId))
                    .Take(5)
                    .Select(c => new { name = c.Name, score = c.Routes.Count + c.Buses.Count + _context.UserProfiles.Count(u => u.CompanyId == c.CompanyId) })
                    .ToList();
                var topRoutes = _context.Routes
                    .OrderByDescending(r => r.Trips.Count)
                    .Take(5)
                    .Select(r => new { name = r.Origin + "-" + r.Destination, score = r.Trips.Count })
                    .ToList();
                var worstRoutes = _context.Routes
                    .OrderBy(r => r.Trips.Count)
                    .Take(5)
                    .Select(r => new { name = r.Origin + "-" + r.Destination, score = r.Trips.Count })
                    .ToList();

                var overview = new
                {
                    TotalCompanies = totalCompanies,
                    TotalUsers = totalUsers,
                    TotalBuses = totalBuses,
                    TotalRoutes = totalRoutes,
                    TopCompanies = topCompanies,
                    WorstCompanies = worstCompanies,
                    TopRoutes = topRoutes,
                    WorstRoutes = worstRoutes,
                    SystemStatus = "Healthy",
                    LastUpdated = DateTime.UtcNow
                };

                return Ok(overview);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Spec alias: GET /developer/overview
        [HttpGet("overview")]
        public IActionResult OverviewAlias()
        {
            return GetSystemOverview();
        }

        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            try
            {
                var users = _context.UserProfiles
                    .Include(u => u.Company)
                    .Select(u => new
                    {
                        u.Id,
                        Email = u.Email,
                        Role = u.Role,
                        Company = u.Company != null ? u.Company.Name : null,
                        IsActive = u.IsActive
                    })
                    .ToList();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("audit-logs")]
        public IActionResult GetAuditLogs([FromQuery] int limit = 200)
        {
            try
            {
                var logs = _context.AuditLogs
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(limit)
                    .Select(a => new
                    {
                        a.Action,
                        Entity = a.EntityName,
                        Time = a.CreatedAt,
                        a.UserId,
                        a.OldValues,
                        a.NewValues,
                        a.IpAddress
                    })
                    .ToList();
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpGet("companies")]
        public IActionResult GetCompanies()
        {
            try
            {
                var companies = _context.Companies
                    .Select(c => new
                    {
                        c.CompanyId,
                        c.Name,
                        c.Email,
                        c.ContactNumber,
                        c.IsActive,
                        c.CreatedAt
                    })
                    .ToList();

                return Ok(companies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("system-health")]
        public IActionResult GetSystemHealth()
        {
            try
            {
                var health = new
                {
                    Database = "Connected",
                    Api = "Running",
                    SignalR = "Active",
                    Timestamp = DateTime.UtcNow
                };

                return Ok(health);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
