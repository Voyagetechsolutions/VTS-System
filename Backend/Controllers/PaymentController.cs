using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
<<<<<<< HEAD
using Backend.Payments;
=======
>>>>>>> 04b39f5 (Add route schedules and update authentication system)

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
<<<<<<< HEAD
    [Authorize]
=======
    [Authorize(Policy = "CompanyScoped")]
>>>>>>> 04b39f5 (Add route schedules and update authentication system)
    public class PaymentController : ControllerBase {
        private readonly AppDbContext _db;
        private readonly PayGateService _payGate;
        public PaymentController(AppDbContext db, PayGateService payGate) { _db = db; _payGate = payGate; }
        // GET: api/payment
        [Authorize(Roles = "admin,developer,finance_manager")]
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

        // GET: api/payment/{id} - fetch by TransactionId (fallback: PaymentId)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPaymentById(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest();
            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.TransactionId == id) 
                           ?? await _db.Payments.FirstOrDefaultAsync(p => p.PaymentId == id);
            if (payment == null) return NotFound();
            return Ok(payment);
        }

        // POST: api/payment/paygate - initiate payment
        [HttpPost("paygate")]
        public async Task<IActionResult> InitiatePayGate([FromBody] InitiatePaymentRequest request)
        {
            if (request == null || request.Amount <= 0) return BadRequest(new { error = "Invalid amount" });
            var payment = await _payGate.ProcessPaymentAsync(request.Amount, string.IsNullOrWhiteSpace(request.Currency) ? "ZAR" : request.Currency!);
            // Persist initial payment record
            if (request.BookingId.HasValue) payment.BookingId = request.BookingId.Value;
            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();
            return Ok(new { transactionId = payment.TransactionId, status = payment.Status });
        }

        // POST: api/payment/notify - PayGate webhook
        [HttpPost("notify")]
        [AllowAnonymous]
        public async Task<IActionResult> PayGateNotify()
        {
            // Read form-encoded payload
            var dict = new Dictionary<string, string>();
            foreach (var key in Request.HasFormContentType ? Request.Form.Keys : Array.Empty<string>())
            {
                dict[key] = Request.Form[key];
            }
            // If not form, try read body as text and parse key=value
            if (dict.Count == 0)
            {
                using var reader = new StreamReader(Request.Body);
                var body = await reader.ReadToEndAsync();
                var pairs = body.Split('&', StringSplitOptions.RemoveEmptyEntries)
                    .Select(p => p.Split('=', 2))
                    .Where(a => a.Length == 2)
                    .ToDictionary(a => Uri.UnescapeDataString(a[0]), a => Uri.UnescapeDataString(a[1]));
                foreach (var kv in pairs) dict[kv.Key] = kv.Value;
            }

            if (dict.Count == 0) return BadRequest(new { error = "Empty notification" });

            // Verify signature
            if (!_payGate.VerifySignature(dict)) return Unauthorized(new { error = "Invalid signature" });

            // Extract fields
            var transactionId = dict.ContainsKey("transaction_id") ? dict["transaction_id"] :
                                dict.ContainsKey("pg_transaction_id") ? dict["pg_transaction_id"] :
                                dict.ContainsKey("reference") ? dict["reference"] : null;
            var status = dict.ContainsKey("status") ? dict["status"] : (dict.ContainsKey("result") ? dict["result"] : null);

            if (string.IsNullOrEmpty(transactionId)) return BadRequest(new { error = "Missing transaction id" });

            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.TransactionId == transactionId);
            if (payment == null)
            {
                // Create a record if not found
                payment = new Payment
                {
                    PaymentId = Guid.NewGuid().ToString(),
                    Amount = 0,
                    Status = status ?? "Pending",
                    PaymentMethod = "PayGate",
                    TransactionId = transactionId,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Payments.Add(payment);
            }
            else
            {
                payment.Status = status ?? payment.Status;
                payment.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok(new { ok = true });
        }

        public class InitiatePaymentRequest
        {
            public decimal Amount { get; set; }
            public string? Currency { get; set; }
            public int? BookingId { get; set; }
        }
        // POST: api/payment
        [Authorize(Roles = "admin,developer,finance_manager")]
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
