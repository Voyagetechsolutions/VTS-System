using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
<<<<<<< HEAD
    [Authorize]
=======
    [Authorize(Policy = "CompanyScoped")]
>>>>>>> 04b39f5 (Add route schedules and update authentication system)
    public class BookingController : ControllerBase {
        private readonly AppDbContext _db;
        public BookingController(AppDbContext db) { _db = db; }
        // GET: api/booking
        [Authorize(Roles = "admin,developer,ops_manager,booking_officer,boarding_operator")]
        [HttpGet]
        public async Task<IActionResult> GetBookings([FromQuery] int? companyId = null) {
            var cid = companyId;
            // Try to infer from header if not provided
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            var query = _db.Bookings.AsQueryable();
            if (cid.HasValue) {
                query = query.Where(b => b.Trip != null && b.Trip.Route != null && b.Trip.Route.CompanyId == cid.Value);
            }
            var items = await query.Take(200).ToListAsync();
            return Ok(items);
        }
        // POST: api/booking
        [Authorize(Roles = "admin,developer,ops_manager")]
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] Booking booking, [FromQuery] int? companyId = null) {
            if (booking == null) return BadRequest();
            booking.CreatedAt = DateTime.UtcNow;
            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();
            return Ok(booking);
        }
        // ...other CRUD endpoints...
    }
}
