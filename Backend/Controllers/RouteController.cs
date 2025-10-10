using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "CompanyScoped")]
    public class RouteController : ControllerBase {
        private readonly AppDbContext _db;
        public RouteController(AppDbContext db) { _db = db; }

        // GET: api/route?companyId=1
        [Authorize(Roles = "admin,developer,ops_manager")]
        [HttpGet]
        public async Task<IActionResult> GetRoutes([FromQuery] int? companyId) {
            var query = _db.Routes.AsNoTracking();
            if (companyId.HasValue) query = query.Where(r => r.CompanyId == companyId);
            var data = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.RouteId,
                    r.CompanyId,
                    r.Origin,
                    r.Destination,
                    r.Distance,
                    r.EstimatedDuration,
                    r.IsActive,
                    r.CreatedAt
                })
                .ToListAsync();
            return Ok(data);
        }

        // POST: api/route
        [Authorize(Roles = "admin,developer,ops_manager")]
        [HttpPost]
        public async Task<IActionResult> CreateRoute([FromBody] BusRoute route) {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            route.CreatedAt = DateTime.UtcNow;
            _db.Routes.Add(route);
            await _db.SaveChangesAsync();
            return Ok(route);
        }

        // PUT: api/route/{id}
        [Authorize(Roles = "admin,developer,ops_manager")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoute(int id, [FromBody] BusRoute update) {
            var existing = await _db.Routes.FindAsync(id);
            if (existing == null) return NotFound();
            existing.Origin = update.Origin ?? existing.Origin;
            existing.Destination = update.Destination ?? existing.Destination;
            existing.Distance = update.Distance != 0 ? update.Distance : existing.Distance;
            existing.EstimatedDuration = update.EstimatedDuration != 0 ? update.EstimatedDuration : existing.EstimatedDuration;
            existing.IsActive = update.IsActive;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/route/{id}
        [Authorize(Roles = "admin,developer,ops_manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoute(int id) {
            var existing = await _db.Routes.FindAsync(id);
            if (existing == null) return NotFound();
            _db.Routes.Remove(existing);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
