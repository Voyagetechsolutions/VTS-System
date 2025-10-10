using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Backend.Services;
using Backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly UserService _userService;

        public UserController(AuthService authService, UserService userService)
        {
            _authService = authService;
            _userService = userService;
        }

        // Admin/Developer dedicated endpoint to create users
        [Authorize(Roles = "admin,developer")]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] RegisterRequest request)
        {
            try
            {
                var result = await _authService.RegisterAsync(
                    request.Email,
                    request.Password,
                    request.Role,
                    request.CompanyId,
                    request.Name,
                    request.PhoneNumber);

                if (result.Success)
                {
                    return Ok(new {
                        message = result.Message,
                        user = result.User
                    });
                }

                return BadRequest(new { error = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [Authorize(Roles = "admin,developer")]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var result = await _authService.RegisterAsync(
                    request.Email, 
                    request.Password, 
                    request.Role, 
                    request.CompanyId,
                    request.Name,
                    request.PhoneNumber);

                if (result.Success)
                {
                    return Ok(new { 
                        message = result.Message,
                        user = result.User
                    });
                }

                return BadRequest(new { error = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var result = await _authService.LoginAsync(request.Email, request.Password);

                if (result.Success)
                {
                    return Ok(new
                    {
                        message = result.Message,
                        token = result.Token,
                        user = result.User
                    });
                }

                return Unauthorized(new { error = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // For custom auth, logout is handled on the client side by removing the token
            return Ok(new { message = "Logged out successfully" });
        }

        [Authorize(Policy = "CompanyScoped")]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _authService.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return NotFound();
                }

                return Ok(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    Role = user.Role,
                    CompanyId = user.CompanyId,
                    Name = user.Name,
                    PhoneNumber = user.PhoneNumber,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    IsActive = user.IsActive,
                    CompanyName = user.Company?.Name
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var result = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
                
                if (result.Success)
                {
                    return Ok(new { message = result.Message });
                }

                return BadRequest(new { error = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [Authorize(Roles = "admin,developer")]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                // This should be restricted to admin users only
                var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (currentUserRole != "admin" && currentUserRole != "developer")
                {
                    return Forbid();
                }

                var result = await _authService.ResetPasswordAsync(request.UserId, request.NewPassword);
                
                if (result.Success)
                {
                    return Ok(new { message = result.Message });
                }

                return BadRequest(new { error = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string? Name { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
