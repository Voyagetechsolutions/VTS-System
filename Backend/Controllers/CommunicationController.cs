using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class CommunicationController : ControllerBase {
        private readonly AppDbContext _db;
        public CommunicationController(AppDbContext db) { _db = db; }

        // GET: api/communication
        [HttpGet]
        public async Task<IActionResult> GetMessages([FromQuery] int? companyId = null, [FromQuery] string? userId = null, [FromQuery] string? type = null) {
            var cid = companyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            
            var query = _db.Messages.AsQueryable();
            
            if (cid.HasValue) {
                query = query.Where(m => m.CompanyId == cid.Value);
            }
            
            if (!string.IsNullOrEmpty(userId)) {
                query = query.Where(m => m.FromUserId == userId || m.ToUserId == userId);
            }
            
            if (!string.IsNullOrEmpty(type)) {
                query = query.Where(m => m.Type == type);
            }
            
            var items = await query
                .Include(m => m.FromUser)
                .Include(m => m.ToUser)
                .OrderByDescending(m => m.CreatedAt)
                .Take(200)
                .ToListAsync();
            
            return Ok(items);
        }

        // POST: api/communication
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] Message message) {
            if (message == null) return BadRequest("Message data is required");
            
            var cid = message.CompanyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            
            message.CompanyId = cid;
            message.CreatedAt = DateTime.UtcNow;
            message.IsRead = false;
            
            _db.Messages.Add(message);
            await _db.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetMessages), new { id = message.MessageId }, message);
        }

        // PUT: api/communication/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id) {
            var message = await _db.Messages.FindAsync(id);
            if (message == null) return NotFound();
            
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
            
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/communication/announcements
        [HttpGet("announcements")]
        public async Task<IActionResult> GetAnnouncements([FromQuery] int? companyId = null) {
            var cid = companyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            
            var query = _db.Announcements.AsQueryable();
            
            if (cid.HasValue) {
                query = query.Where(a => a.CompanyId == cid.Value);
            }
            
            var items = await query
                .Where(a => a.IsActive && (a.ExpiryDate == null || a.ExpiryDate > DateTime.UtcNow))
                .OrderByDescending(a => a.CreatedAt)
                .Take(50)
                .ToListAsync();
            
            return Ok(items);
        }

        // POST: api/communication/announcements
        [HttpPost("announcements")]
        public async Task<IActionResult> CreateAnnouncement([FromBody] Announcement announcement) {
            if (announcement == null) return BadRequest("Announcement data is required");
            
            var cid = announcement.CompanyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            
            announcement.CompanyId = cid;
            announcement.CreatedAt = DateTime.UtcNow;
            announcement.IsActive = true;
            
            _db.Announcements.Add(announcement);
            await _db.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetAnnouncements), new { id = announcement.AnnouncementId }, announcement);
        }
    }
}
