using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class BusController : ControllerBase {
        private readonly AppDbContext _db;
        public BusController(AppDbContext db) { _db = db; }

        // GET: api/bus?companyId=1
        [HttpGet]
        public async Task<IActionResult> GetBuses([FromQuery] int? companyId) {
            var query = _db.Buses.AsNoTracking();
            if (companyId.HasValue) query = query.Where(b => b.CompanyId == companyId);
            var data = await query
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new {
                    b.BusId,
                    b.CompanyId,
                    b.LicensePlate,
                    b.Capacity,
                    b.Status,
                    b.CreatedAt
                })
                .ToListAsync();
            return Ok(data);
        }

        // POST: api/bus
        [HttpPost]
        public async Task<IActionResult> CreateBus([FromBody] Bus bus) {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            bus.CreatedAt = DateTime.UtcNow;
            _db.Buses.Add(bus);
            await _db.SaveChangesAsync();
            return Ok(bus);
        }

        // PUT: api/bus/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBus(int id, [FromBody] Bus update) {
            var existing = await _db.Buses.FindAsync(id);
            if (existing == null) return NotFound();
            existing.LicensePlate = update.LicensePlate ?? existing.LicensePlate;
            existing.Capacity = update.Capacity != 0 ? update.Capacity : existing.Capacity;
            existing.Status = update.Status ?? existing.Status;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/bus/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBus(int id) {
            var existing = await _db.Buses.FindAsync(id);
            if (existing == null) return NotFound();
            _db.Buses.Remove(existing);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
