using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin,developer,company_admin")]
    public class InvitationsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly SupabaseAdminService _supabaseAdmin;
        private readonly ILogger<InvitationsController> _logger;
        private readonly IConfiguration _config;

        public InvitationsController(AppDbContext db, SupabaseAdminService supabaseAdmin, ILogger<InvitationsController> logger, IConfiguration config)
        {
            _db = db;
            _supabaseAdmin = supabaseAdmin;
            _logger = logger;
            _config = config;
        }

        public class CreateInvitationRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Role { get; set; } = string.Empty;
            public int? CompanyId { get; set; }
            public int? ExpiresHours { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInvitationRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Role))
            {
                return BadRequest(new { error = "Email and Role are required" });
            }

            var expires = DateTime.UtcNow.AddHours(req.ExpiresHours.HasValue && req.ExpiresHours > 0 ? req.ExpiresHours.Value : 24);
            var rawToken = Guid.NewGuid().ToString("N");

            // Store invitation for audit/reference (token not used for Supabase link itself)
            var inv = new Invitation
            {
                Email = req.Email.Trim().ToLowerInvariant(),
                Role = req.Role.Trim().ToLowerInvariant(),
                CompanyId = req.CompanyId,
                TokenHash = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken))),
                ExpiresAt = expires,
                InviterUserId = User?.Identity?.Name
            };
            _db.Invitations.Add(inv);
            await _db.SaveChangesAsync();

            // Send Supabase invite email via Admin API
            var frontendOrigin = _config["FrontendOrigin"] ?? "http://localhost:3000";
            var redirectTo = $"{frontendOrigin}/accept-invite?token={rawToken}";
            var (ok, err) = await _supabaseAdmin.InviteUserByEmailAsync(inv.Email, redirectTo);
            if (!ok)
            {
                _logger.LogWarning("Supabase invite failed for {Email}: {Error}", inv.Email, err);
                return StatusCode(500, new { error = "Failed to send invite email" });
            }

            return Ok(new { id = inv.Id, email = inv.Email, role = inv.Role, companyId = inv.CompanyId, expiresAt = inv.ExpiresAt });
        }

        public class ResendInvitationRequest
        {
            public Guid InvitationId { get; set; }
        }

        [HttpPost("resend")]
        public async Task<IActionResult> Resend([FromBody] ResendInvitationRequest req)
        {
            var inv = await _db.Invitations.FirstOrDefaultAsync(i => i.Id == req.InvitationId);
            if (inv == null) return NotFound(new { error = "Invitation not found" });
            if (inv.Accepted) return BadRequest(new { error = "Invitation already accepted" });
            if (inv.ExpiresAt < DateTime.UtcNow) return BadRequest(new { error = "Invitation expired" });

            var frontendOrigin = _config["FrontendOrigin"] ?? "http://localhost:3000";
            // We do not have the raw token again (we only stored hash). Generate a new audit row + token and send a fresh invite.
            var rawToken = Guid.NewGuid().ToString("N");
            var newInv = new Invitation
            {
                Email = inv.Email,
                Role = inv.Role,
                CompanyId = inv.CompanyId,
                TokenHash = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken))),
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                InviterUserId = User?.Identity?.Name
            };
            _db.Invitations.Add(newInv);
            await _db.SaveChangesAsync();

            var redirectTo = $"{frontendOrigin}/accept-invite?token={rawToken}";
            var (ok, err) = await _supabaseAdmin.InviteUserByEmailAsync(newInv.Email, redirectTo);
            if (!ok)
            {
                _logger.LogWarning("Supabase invite resend failed for {Email}: {Error}", newInv.Email, err);
                return StatusCode(500, new { error = "Failed to resend invite email" });
            }

            return Ok(new { id = newInv.Id, email = newInv.Email, role = newInv.Role, companyId = newInv.CompanyId, expiresAt = newInv.ExpiresAt });
        }

        public class ResolveInvitationResponse
        {
            public string Email { get; set; } = string.Empty;
            public string Role { get; set; } = string.Empty;
            public int? CompanyId { get; set; }
            public DateTime ExpiresAt { get; set; }
        }

        [AllowAnonymous]
        [HttpGet("resolve")]
        public async Task<IActionResult> Resolve([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return BadRequest(new { error = "Missing token" });
            var hash = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));
            var inv = await _db.Invitations
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync(i => i.TokenHash == hash);
            if (inv == null || inv.Accepted || inv.ExpiresAt < DateTime.UtcNow)
                return NotFound(new { error = "Invalid or expired invitation" });

            return Ok(new ResolveInvitationResponse
            {
                Email = inv.Email,
                Role = inv.Role,
                CompanyId = inv.CompanyId,
                ExpiresAt = inv.ExpiresAt
            });
        }

        public class MarkAcceptedRequest
        {
            public string Token { get; set; } = string.Empty;
        }

        [AllowAnonymous]
        [HttpPost("mark-accepted")]
        public async Task<IActionResult> MarkAccepted([FromBody] MarkAcceptedRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest(new { error = "Missing token" });
            var hash = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(req.Token)));
            var inv = await _db.Invitations
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync(i => i.TokenHash == hash);
            if (inv == null) return NotFound(new { error = "Invitation not found" });
            if (inv.Accepted) return Ok(new { message = "Already accepted" });
            inv.Accepted = true;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Accepted" });
        }
    }
}
