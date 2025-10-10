using Microsoft.AspNetCore.Mvc;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly SupabaseRestService _supabase;
        private readonly ILogger<DiagnosticsController> _logger;

        public DiagnosticsController(SupabaseRestService supabase, ILogger<DiagnosticsController> logger)
        {
            _supabase = supabase;
            _logger = logger;
        }

        public class PingRow { public string? ping { get; set; } }

        [HttpGet("supabase")]
        public async Task<IActionResult> Supabase()
        {
            try
            {
                // Attempt a harmless insert into a temp table name that likely doesn't exist
                // If Supabase config is wrong, we should get a 401/403/404 that we can surface
                var (ok, body, status) = await _supabase.InsertAsync("__diagnostic__", new { ping = "ok" });
                return StatusCode(status, new { ok, status, body });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Supabase diagnostics failed");
                return StatusCode(500, new { ok = false, error = ex.Message });
            }
        }
    }
}
