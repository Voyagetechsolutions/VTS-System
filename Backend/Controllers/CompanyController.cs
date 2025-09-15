using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class CompanyController : ControllerBase {
        private readonly AppDbContext _db;
        public CompanyController(AppDbContext db) { _db = db; }

        // GET: api/company?search=&status=
        [HttpGet]
        public async Task<IActionResult> GetCompanies([FromQuery] string? search = null, [FromQuery] string? status = null) {
            var query = _db.Companies.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(search)) {
                var s = search.ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(s));
            }
            if (!string.IsNullOrWhiteSpace(status)) {
                var isActive = status.Equals("active", StringComparison.OrdinalIgnoreCase);
                query = query.Where(c => c.IsActive == isActive);
            }
            var companies = await query
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new {
                    c.CompanyId,
                    c.Name,
                    c.Email,
                    c.ContactNumber,
                    c.IsActive,
                    c.CreatedAt
                })
                .ToListAsync();
            return Ok(companies);
        }

        // POST: api/company
        [HttpPost]
        public async Task<IActionResult> CreateCompany([FromBody] Company company) {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            company.CreatedAt = DateTime.UtcNow;
            _db.Companies.Add(company);
            await _db.SaveChangesAsync();
            return Ok(company);
        }

        // PUT: api/company/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] Company update) {
            var existing = await _db.Companies.FindAsync(id);
            if (existing == null) return NotFound();
            existing.Name = update.Name ?? existing.Name;
            existing.Email = update.Email ?? existing.Email;
            existing.ContactNumber = update.ContactNumber ?? existing.ContactNumber;
            existing.IsActive = update.IsActive;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/company/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id) {
            var existing = await _db.Companies.FindAsync(id);
            if (existing == null) return NotFound();
            _db.Companies.Remove(existing);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
