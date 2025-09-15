using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class IncidentController : ControllerBase {
        private readonly AppDbContext _db;
        public IncidentController(AppDbContext db) { _db = db; }

        // GET: api/incident
        [HttpGet]
        public async Task<IActionResult> GetIncidents([FromQuery] int? companyId = null, [FromQuery] string? status = null, [FromQuery] string? severity = null) {
            var cid = companyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            
            var query = _db.Incidents.AsQueryable();
            
            if (cid.HasValue) {
                query = query.Where(i => i.CompanyId == cid.Value);
            }
            
            if (!string.IsNullOrEmpty(status)) {
                query = query.Where(i => i.Status == status);
            }
            
            if (!string.IsNullOrEmpty(severity)) {
                query = query.Where(i => i.Severity == severity);
            }
            
            var items = await query
                .Include(i => i.ReportedByUser)
                .Include(i => i.AssignedToUser)
                .OrderByDescending(i => i.ReportedAt)
                .Take(200)
                .ToListAsync();
            
            return Ok(items);
        }

        // POST: api/incident
        [HttpPost]
        public async Task<IActionResult> CreateIncident([FromBody] Incident incident) {
            if (incident == null) return BadRequest("Incident data is required");
            
            var cid = incident.CompanyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            
            incident.CompanyId = cid;
            incident.ReportedAt = DateTime.UtcNow;
            incident.Status = "Open";
            
            _db.Incidents.Add(incident);
            await _db.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetIncidents), new { id = incident.IncidentId }, incident);
        }

        // PUT: api/incident/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIncident(int id, [FromBody] Incident incident) {
            if (id != incident.IncidentId) return BadRequest();
            
            var existing = await _db.Incidents.FindAsync(id);
            if (existing == null) return NotFound();
            
            existing.Title = incident.Title;
            existing.Description = incident.Description;
            existing.Severity = incident.Severity;
            existing.Status = incident.Status;
            existing.AssignedToUserId = incident.AssignedToUserId;
            existing.Resolution = incident.Resolution;
            existing.ResolvedAt = incident.ResolvedAt;
            
            if (incident.Status == "Resolved" && existing.ResolvedAt == null) {
                existing.ResolvedAt = DateTime.UtcNow;
            }
            
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/incident/{id}/assign
        [HttpPut("{id}/assign")]
        public async Task<IActionResult> AssignIncident(int id, [FromBody] AssignIncidentRequest request) {
            var incident = await _db.Incidents.FindAsync(id);
            if (incident == null) return NotFound();
            
            incident.AssignedToUserId = request.AssignedToUserId;
            incident.Status = "Assigned";
            
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/incident/{id}/resolve
        [HttpPut("{id}/resolve")]
        public async Task<IActionResult> ResolveIncident(int id, [FromBody] ResolveIncidentRequest request) {
            var incident = await _db.Incidents.FindAsync(id);
            if (incident == null) return NotFound();
            
            incident.Status = "Resolved";
            incident.Resolution = request.Resolution;
            incident.ResolvedAt = DateTime.UtcNow;
            
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    public class AssignIncidentRequest {
        public string AssignedToUserId { get; set; } = string.Empty;
    }

    public class ResolveIncidentRequest {
        public string Resolution { get; set; } = string.Empty;
    }
}
