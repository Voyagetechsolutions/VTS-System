using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FleetController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<FleetController> _logger;
        public FleetController(AppDbContext db, ILogger<FleetController> logger)
        {
            _db = db; _logger = logger;
        }

        [HttpGet("buses/{busId:int}/history")]
        public async Task<IActionResult> GetHistory([FromRoute] int busId, [FromQuery] DateTime start, [FromQuery] DateTime end, CancellationToken ct)
        {
            if (!Request.Headers.TryGetValue("X-Company-Id", out var cidHeader) || !int.TryParse(cidHeader, out var companyId))
                return BadRequest("Missing X-Company-Id header");
            if (start == default || end == default || end <= start)
                return BadRequest("Invalid date range");

            var exists = await _db.Buses.AsNoTracking().AnyAsync(b => b.BusId == busId && b.CompanyId == companyId, ct);
            if (!exists) return NotFound("Bus not found for this company");

            var data = await _db.BusLocationHistories.AsNoTracking()
                .Where(x => x.CompanyId == companyId && x.BusId == busId && x.Timestamp >= start && x.Timestamp <= end)
                .OrderBy(x => x.Timestamp)
                .Select(x => new { x.Timestamp, x.Latitude, x.Longitude, x.Speed, x.Status })
                .ToListAsync(ct);
            return Ok(data);
        }

        [HttpGet("buses/status")]
        public async Task<IActionResult> GetLatestStatuses([FromQuery] int? companyIdOverride, CancellationToken ct)
        {
            // Prefer header, allow query override for tooling
            int companyId;
            if (companyIdOverride.HasValue) companyId = companyIdOverride.Value;
            else if (!Request.Headers.TryGetValue("X-Company-Id", out var cidHeader) || !int.TryParse(cidHeader, out companyId))
                return BadRequest("Missing X-Company-Id header");

            // latest record per bus for the company
            var latestByBus = await _db.BusLocationHistories.AsNoTracking()
                .Where(x => x.CompanyId == companyId)
                .GroupBy(x => x.BusId)
                .Select(g => g.OrderByDescending(x => x.Timestamp).First())
                .Select(x => new { x.BusId, x.Latitude, x.Longitude, x.Speed, x.Status, x.Timestamp })
                .ToListAsync(ct);

            return Ok(latestByBus);
        }
    }
}
