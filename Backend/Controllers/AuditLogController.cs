using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogController : ControllerBase {
        private readonly AppDbContext _db;
        public AuditLogController(AppDbContext db) { _db = db; }
        // GET: api/auditlog
        [HttpGet]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int? companyId = null) {
            var cid = companyId;
            if (!cid.HasValue) {
                if (Request.Headers.TryGetValue("X-Company-Id", out var header) && int.TryParse(header.ToString(), out var parsed)) cid = parsed;
            }
            var query = _db.AuditLogs.AsQueryable();
            if (cid.HasValue) query = query.Where(a => a.CompanyId == cid.Value);
            var items = await query.OrderByDescending(a => a.Timestamp).Take(200).ToListAsync();
            return Ok(items);
        }
        // ...other CRUD endpoints...
    }
}
