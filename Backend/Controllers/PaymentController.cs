using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase {
        private readonly AppDbContext _db;
        public PaymentController(AppDbContext db) { _db = db; }
        // GET: api/payment
        [HttpGet]
        public async Task<IActionResult> GetPayments([FromQuery] int? companyId = null) {
            var cid = companyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            // Assuming payments have TransactionId and are global; extend with CompanyId if your schema has it
            var items = await _db.Payments.OrderByDescending(p => p.CreatedAt).Take(200).ToListAsync();
            return Ok(items);
        }
        // POST: api/payment
        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] Payment payment) {
            if (payment == null) return BadRequest();
            payment.CreatedAt = DateTime.UtcNow;
            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();
            return Ok(payment);
        }
        // ...other CRUD endpoints...
    }
}
