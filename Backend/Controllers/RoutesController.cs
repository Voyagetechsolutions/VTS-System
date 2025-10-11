using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoutesController : ControllerBase
    {
        private readonly string _connStr;
        private readonly ILogger<RoutesController> _logger;

        public RoutesController(IConfiguration config, ILogger<RoutesController> logger)
        {
            _connStr = config.GetConnectionString("DefaultConnection") ?? string.Empty;
            _logger = logger;
        }

        public class CreateRouteRequest
        {
            public Guid CompanyId { get; set; }
            public string? RouteName { get; set; }
            public string? Origin { get; set; }
            public string? Destination { get; set; }
            public decimal? Price { get; set; }
            public string? Currency { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRouteRequest req)
        {
            if (req.CompanyId == Guid.Empty)
            {
                return BadRequest(new { error = "companyId is required" });
            }
            try
            {
                await using var conn = new NpgsqlConnection(_connStr);
                await conn.OpenAsync();
                var cmd = new NpgsqlCommand(@"insert into public.routes (company_id, origin, destination, price, currency, route_code, status)
                                             values (@company_id, @origin, @destination, @price, @currency, @route_code, 'active')
                                             returning route_id, company_id, origin, destination, price, currency, status, created_at", conn);
                cmd.Parameters.AddWithValue("company_id", req.CompanyId);
                cmd.Parameters.AddWithValue("origin", (object?)req.Origin ?? DBNull.Value);
                cmd.Parameters.AddWithValue("destination", (object?)req.Destination ?? DBNull.Value);
                cmd.Parameters.AddWithValue("price", (object?)req.Price ?? DBNull.Value);
                cmd.Parameters.AddWithValue("currency", (object?)req.Currency ?? DBNull.Value);
                cmd.Parameters.AddWithValue("route_code", (object?)req.RouteName ?? DBNull.Value);
                await using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    var row = new
                    {
                        route_id = reader.GetGuid(0),
                        company_id = reader.GetGuid(1),
                        origin = reader.IsDBNull(2) ? null : reader.GetString(2),
                        destination = reader.IsDBNull(3) ? null : reader.GetString(3),
                        price = reader.IsDBNull(4) ? (decimal?)null : reader.GetDecimal(4),
                        currency = reader.IsDBNull(5) ? null : reader.GetString(5),
                        status = reader.IsDBNull(6) ? null : reader.GetString(6),
                        created_at = reader.IsDBNull(7) ? (DateTime?)null : reader.GetDateTime(7)
                    };
                    return Ok(row);
                }
                return StatusCode(500, new { error = "Insert failed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create route");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
