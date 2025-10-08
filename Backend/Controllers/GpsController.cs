using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GpsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<BusTrackingHub> _hub;
        private readonly AlertsService _alerts;
        private readonly ILogger<GpsController> _logger;
        public GpsController(AppDbContext db, IHubContext<BusTrackingHub> hub, AlertsService alerts, ILogger<GpsController> logger)
        {
            _db = db; _hub = hub; _alerts = alerts; _logger = logger;
        }

        public class GpsUpdateDto
        {
            public int BusId { get; set; }
            public int? TripId { get; set; }
            public decimal Latitude { get; set; }
            public decimal Longitude { get; set; }
            public decimal Speed { get; set; }
            public string? Status { get; set; }
            public DateTime? Timestamp { get; set; }
        }

        [HttpPost("update")]
        public async Task<IActionResult> Update([FromBody] GpsUpdateDto dto, CancellationToken ct)
        {
            if (dto == null || dto.BusId <= 0) return BadRequest("Invalid payload");

            // Tenant isolation from header
            if (!Request.Headers.TryGetValue("X-Company-Id", out var cidHeader) || !int.TryParse(cidHeader, out var companyId))
                return BadRequest("Missing X-Company-Id header");

            var busExists = await _db.Buses.AsNoTracking().AnyAsync(b => b.BusId == dto.BusId && b.CompanyId == companyId, ct);
            if (!busExists) return NotFound("Bus not found for this company");

            var record = new BusLocationHistory
            {
                BusId = dto.BusId,
                CompanyId = companyId,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Speed = dto.Speed,
                Status = dto.Status ?? string.Empty,
                Timestamp = dto.Timestamp?.ToUniversalTime() ?? DateTime.UtcNow
            };
            _db.BusLocationHistories.Add(record);
            await _db.SaveChangesAsync(ct);

            // Broadcast realtime update to company group
            var payload = new
            {
                BusId = record.BusId,
                Latitude = record.Latitude,
                Longitude = record.Longitude,
                Speed = record.Speed,
                Status = record.Status,
                Timestamp = record.Timestamp
            };
            await _hub.Clients.Group($"company_{companyId}").SendAsync("BusLocationUpdated", payload, ct);

            // Evaluate alerts
            await _alerts.EvaluateAndEmitAsync(companyId, record.BusId, dto.TripId, record.Speed, record.Timestamp, ct);

            return Ok(new { ok = true });
        }
    }
}
