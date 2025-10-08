using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("")]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _db;
        public HealthController(AppDbContext db) { _db = db; }

        // GET /health
        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult Health()
        {
            return Ok(new {
                status = "OK",
                time = DateTime.UtcNow,
            });
        }

        // GET /health/db
        [HttpGet("health/db")]
        [AllowAnonymous]
        public async Task<IActionResult> HealthDb()
        {
            try
            {
                var canConnect = await _db.Database.CanConnectAsync();
                if (!canConnect) return StatusCode(500, new { status = "DB_UNAVAILABLE" });
                // lightweight query
                await _db.Database.ExecuteSqlRawAsync("SELECT 1");
                return Ok(new { status = "OK", db = "Connected" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "DB_ERROR", error = ex.Message });
            }
        }
    }
}
