using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BranchesController : ControllerBase
    {
        private readonly ILogger<BranchesController> _logger;
        private readonly SupabaseRestService _supabase;

        public BranchesController(IConfiguration _config, ILogger<BranchesController> logger, SupabaseRestService supabase)
        {
            _logger = logger;
            _supabase = supabase;
        }

        public class CreateBranchRequest
        {
            // Accept as string to support either numeric IDs or GUIDs depending on Supabase schema
            public string? CompanyId { get; set; }
            public string Name { get; set; } = string.Empty;
            public string? Location { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBranchRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.CompanyId) || string.IsNullOrWhiteSpace(req.Name))
            {
                return BadRequest(new { error = "companyId and name are required" });
            }
            try
            {
                // Attempt to coerce companyId to a numeric value if possible; otherwise, pass through as string (for GUID schemas)
                object companyIdValue = req.CompanyId!;
                if (long.TryParse(req.CompanyId, out var companyIdNumeric))
                {
                    companyIdValue = companyIdNumeric;
                }
                var payload = new { company_id = companyIdValue, name = req.Name, location = req.Location };
                var (ok, body, status) = await _supabase.InsertAsync("branches", payload);
                if (!ok) return StatusCode(status, new { error = body });
                return Content(body, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create branch");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
