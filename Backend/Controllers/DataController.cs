using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DataController : ControllerBase
    {
        private readonly SupabaseRestService _supabase;
        private static readonly HashSet<string> AllowedTables = new(StringComparer.OrdinalIgnoreCase)
        {
            // Core allowlist of tables we create from the app
            "branches",
            "routes",
            "buses",
            "drivers",
            "support_tickets",
            "lost_found",
            "maintenance_tasks",
            "maintenance_kb",
            "recycling_logs",
            "maintenance_carbon",
            "expenses",
            "workshop_bays",
            "workshop_jobs",
            "route_stops",
            "route_schedules",
            "customers",
            "bookings",
            "messages",
            "announcements",
        };

        public DataController(SupabaseRestService supabase)
        {
            _supabase = supabase;
        }

        [HttpPost("{table}")]
        public async Task<IActionResult> Insert(string table, [FromBody] object row)
        {
            if (string.IsNullOrWhiteSpace(table) || !AllowedTables.Contains(table))
            {
                return BadRequest(new { error = "Table not allowed" });
            }
            var (ok, body, status) = await _supabase.InsertAsync(table, row);
            if (!ok) return StatusCode(status, new { error = body });
            return Content(body, "application/json");
        }

        [HttpPatch("{table}/update")]
        public async Task<IActionResult> Update(string table, [FromQuery] string idColumn, [FromQuery] string idValue, [FromBody] object updates)
        {
            if (string.IsNullOrWhiteSpace(table) || !AllowedTables.Contains(table))
                return BadRequest(new { error = "Table not allowed" });
            if (string.IsNullOrWhiteSpace(idColumn) || string.IsNullOrWhiteSpace(idValue))
                return BadRequest(new { error = "idColumn and idValue are required" });

            var (ok, body, status) = await _supabase.UpdateAsync(table, idColumn, idValue, updates);
            if (!ok) return StatusCode(status, new { error = body });
            return Content(body, "application/json");
        }

        [HttpDelete("{table}/delete")]
        public async Task<IActionResult> Delete(string table, [FromQuery] string idColumn, [FromQuery] string idValue)
        {
            if (string.IsNullOrWhiteSpace(table) || !AllowedTables.Contains(table))
                return BadRequest(new { error = "Table not allowed" });
            if (string.IsNullOrWhiteSpace(idColumn) || string.IsNullOrWhiteSpace(idValue))
                return BadRequest(new { error = "idColumn and idValue are required" });

            var (ok, body, status) = await _supabase.DeleteAsync(table, idColumn, idValue);
            if (!ok) return StatusCode(status, new { error = body });
            return Content(body, "application/json");
        }
    }
}
