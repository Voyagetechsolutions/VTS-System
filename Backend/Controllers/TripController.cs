using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class TripController : ControllerBase {
        private readonly AppDbContext _db;
        public TripController(AppDbContext db) { _db = db; }
        // GET: api/trip
        [HttpGet]
        public async Task<IActionResult> GetTrips([FromQuery] int? companyId = null) {
            var cid = companyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            var query = _db.Trips
                .Include(t => t.Route)
                .Include(t => t.Bus)
                .AsQueryable();
            if (cid.HasValue) query = query.Where(t => t.Route != null && t.Route.CompanyId == cid.Value);
            var items = await query.Take(200).ToListAsync();
            return Ok(items);
        }
        // POST: api/trip
        [HttpPost]
        public async Task<IActionResult> CreateTrip([FromBody] Trip trip) {
            if (trip == null) return BadRequest();
            _db.Trips.Add(trip);
            await _db.SaveChangesAsync();
            return Ok(trip);
        }
        // ...other CRUD endpoints...
    }
}
