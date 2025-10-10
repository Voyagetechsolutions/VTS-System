using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Backend.Services;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly AppDbContext _db;
        private readonly IEmailService _email;

        public AuthController(AuthService authService, AppDbContext db, IEmailService email)
        {
            _authService = authService;
            _db = db;
            _email = email;
        }

        public class LoginDto
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public bool RememberMe { get; set; } = true;
        }

        public class RefreshRequest
        {
            public string RefreshToken { get; set; } = string.Empty;
        }

        public class ForgotPasswordRequest
        {
            public string Email { get; set; } = string.Empty;
        }

        public class ResetPasswordRequest
        {
            public string Token { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto body)
        {
            var result = await _authService.LoginAsync(body.Email, body.Password);
            if (!result.Success || result.User == null)
            {
                return Unauthorized(new { error = result.Message });
            }

            // Issue refresh token
            var refreshRaw = _authService.GenerateRefreshToken();
            await _authService.SaveRefreshTokenAsync(result.User.Id, refreshRaw, body.RememberMe ? 14 : 7);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !Request.Host.Host.Contains("localhost"),
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(body.RememberMe ? 14 : 7)
            };
            Response.Cookies.Append("refreshToken", refreshRaw, cookieOptions);

            return Ok(new
            {
                message = result.Message,
                accessToken = result.Token,
                user = result.User
            });
        }

        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
        {
            // Prefer cookie; fallback to body during transition
            var cookieToken = Request.Cookies["refreshToken"];
            var provided = string.IsNullOrWhiteSpace(cookieToken) ? req.RefreshToken : cookieToken;
            if (string.IsNullOrWhiteSpace(provided))
                return BadRequest(new { error = "Missing refresh token" });

            var (valid, user, token) = await _authService.ValidateRefreshTokenAsync(provided);
            if (!valid || user == null || token == null)
            {
                return Unauthorized(new { error = "Invalid or expired refresh token" });
            }

            // Rotate token
            var newRefreshRaw = _authService.GenerateRefreshToken();
            await _authService.RotateRefreshTokenAsync(token, newRefreshRaw);

            // Issue new access token
            var access = _authService.GenerateAccessToken(user);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !Request.Host.Host.Contains("localhost"),
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("refreshToken", newRefreshRaw, cookieOptions);

            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role,
                CompanyId = user.CompanyId,
                Name = user.Name,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                IsActive = user.IsActive
            };

            return Ok(new
            {
                accessToken = access,
                user = userDto
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshRequest req)
        {
            var cookieToken = Request.Cookies["refreshToken"];
            var provided = string.IsNullOrWhiteSpace(cookieToken) ? req.RefreshToken : cookieToken;
            if (string.IsNullOrWhiteSpace(provided))
            {
                // Clear cookie anyway
                Response.Cookies.Append("refreshToken", "", new CookieOptions { Expires = DateTimeOffset.UtcNow.AddDays(-1) });
                return Ok(new { message = "Logged out" });
            }

            var (valid, user, token) = await _authService.ValidateRefreshTokenAsync(provided);
            if (!valid || token == null)
            {
                return Ok(new { message = "Logged out" }); // already invalid
            }

            await _authService.RevokeRefreshTokenAsync(token, "User logout");
            Response.Cookies.Append("refreshToken", "", new CookieOptions { Expires = DateTimeOffset.UtcNow.AddDays(-1), HttpOnly = true, SameSite = SameSiteMode.None, Secure = !Request.Host.Host.Contains("localhost") });
            return Ok(new { message = "Logged out" });
        }

        // Minimal stubs for forgot/reset password (wire to email service later)
        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            var user = await _db.UserProfiles.FirstOrDefaultAsync(u => u.Email.ToLower() == req.Email.ToLower());
            if (user == null)
            {
                // do not reveal existence
                return Ok(new { message = "If the email exists, a reset link was sent." });
            }
            // generate short-lived reset token and persist
            var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
            var hash = _authService.HashToken(raw);
            var token = new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = hash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                CreatedAt = DateTime.UtcNow
            };
            _db.PasswordResetTokens.Add(token);
            await _db.SaveChangesAsync();

            // send via email service (minimal sender logs for now)
            await _email.SendPasswordResetAsync(user.Email, raw);

            // In dev, return message without exposing token
            return Ok(new { message = "If the email exists, a reset link was sent." });
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrWhiteSpace(req.NewPassword))
            {
                return BadRequest(new { error = "Invalid request" });
            }

            // Find reset token
            var hash = _authService.HashToken(req.Token);
            var prt = await _db.PasswordResetTokens
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(p => p.TokenHash == hash);

            if (prt == null || prt.UsedAt != null || prt.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { error = "Invalid or expired token" });
            }

            var user = await _db.UserProfiles.FirstOrDefaultAsync(u => u.Id == prt.UserId);
            if (user == null)
            {
                return BadRequest(new { error = "Invalid token user" });
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, BCrypt.Net.BCrypt.GenerateSalt(12));
            prt.UsedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Password reset successful" });
        }
    }
}
