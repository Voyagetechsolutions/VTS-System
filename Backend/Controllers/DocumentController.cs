using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase {
        private readonly AppDbContext _db;
        public DocumentController(AppDbContext db) { _db = db; }

        // GET: api/document
        [HttpGet]
        public async Task<IActionResult> GetDocuments([FromQuery] int? companyId = null, [FromQuery] string? userId = null, [FromQuery] string? type = null) {
            var cid = companyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            
            var query = _db.Documents.AsQueryable();
            
            if (cid.HasValue) {
                query = query.Where(d => d.CompanyId == cid.Value);
            }
            
            if (!string.IsNullOrEmpty(userId)) {
                query = query.Where(d => d.UserId == userId);
            }
            
            if (!string.IsNullOrEmpty(type)) {
                query = query.Where(d => d.Type == type);
            }
            
            var items = await query.OrderByDescending(d => d.UploadedAt).Take(200).ToListAsync();
            return Ok(items);
        }

        // POST: api/document
        [HttpPost]
        public async Task<IActionResult> CreateDocument([FromBody] Document document) {
            if (document == null) return BadRequest("Document data is required");
            
            var cid = document.CompanyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            
            document.CompanyId = cid;
            document.UploadedAt = DateTime.UtcNow;
            
            _db.Documents.Add(document);
            await _db.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetDocuments), new { id = document.DocumentId }, document);
        }

        // PUT: api/document/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDocument(int id, [FromBody] Document document) {
            if (id != document.DocumentId) return BadRequest();
            
            var existing = await _db.Documents.FindAsync(id);
            if (existing == null) return NotFound();
            
            existing.Title = document.Title;
            existing.Type = document.Type;
            existing.Description = document.Description;
            existing.ExpiryDate = document.ExpiryDate;
            existing.Status = document.Status;
            
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/document/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id) {
            var document = await _db.Documents.FindAsync(id);
            if (document == null) return NotFound();
            
            _db.Documents.Remove(document);
            await _db.SaveChangesAsync();
            
            return NoContent();
        }
    }
}
