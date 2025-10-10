using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "developer,admin")]
    public class ApiKeysController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ApiKeysController(AppDbContext db) { _db = db; }

        [HttpGet]
        public IActionResult List() => Ok(new { message = "Use Supabase for storage or add EF model for api_keys" });

        [HttpPost]
        public IActionResult Create([FromBody] dynamic payload) => Ok(new { message = "Stub: Implement EF model for api_keys or keep Supabase" });

        [HttpPost("{id}/revoke")]
        public IActionResult Revoke(int id) => Ok(new { message = "Stub: Implement revoke" });
    }
}


