using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Backend.Models;

namespace Backend.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        /// <summary>
        /// Register a new user with hashed password
        /// </summary>
        public async Task<AuthResult> RegisterAsync(string email, string password, string role, int companyId, string? name = null, string? phoneNumber = null)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _context.UserProfiles
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

                if (existingUser != null)
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = "User with this email already exists"
                    };
                }

                // Hash the password
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));

                // Create new user
                var user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = email.ToLower(),
                    PasswordHash = passwordHash,
                    Role = role,
                    CompanyId = companyId,
                    Name = name,
                    PhoneNumber = phoneNumber,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.UserProfiles.Add(user);
                await _context.SaveChangesAsync();

                return new AuthResult
                {
                    Success = true,
                    Message = "User registered successfully",
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        Role = user.Role,
                        CompanyId = user.CompanyId,
                        Name = user.Name,
                        PhoneNumber = user.PhoneNumber,
                        CreatedAt = user.CreatedAt,
                        IsActive = user.IsActive
                    }
                };
            }
            catch (Exception ex)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = $"Registration failed: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Authenticate user with email and password
        /// </summary>
        public async Task<AuthResult> LoginAsync(string email, string password)
        {
            try
            {
                var user = await _context.UserProfiles
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower() && u.IsActive);

                if (user == null)
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = "Invalid email or password"
                    };
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = "Invalid email or password"
                    };
                }

                // Update last login
                user.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Generate JWT token
                var token = GenerateJwtToken(user);

                return new AuthResult
                {
                    Success = true,
                    Message = "Login successful",
                    Token = token,
                    User = new UserDto
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
                    }
                };
            }
            catch (Exception ex)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = $"Login failed: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Change user password
        /// </summary>
        public async Task<AuthResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            try
            {
                var user = await _context.UserProfiles.FindAsync(userId);
                if (user == null)
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = "User not found"
                    };
                }

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = "Current password is incorrect"
                    };
                }

                // Hash new password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, BCrypt.Net.BCrypt.GenerateSalt(12));
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new AuthResult
                {
                    Success = true,
                    Message = "Password changed successfully"
                };
            }
            catch (Exception ex)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = $"Password change failed: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Reset user password (admin function)
        /// </summary>
        public async Task<AuthResult> ResetPasswordAsync(string userId, string newPassword)
        {
            try
            {
                var user = await _context.UserProfiles.FindAsync(userId);
                if (user == null)
                {
                    return new AuthResult
                    {
                        Success = false,
                        Message = "User not found"
                    };
                }

                // Hash new password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, BCrypt.Net.BCrypt.GenerateSalt(12));
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new AuthResult
                {
                    Success = true,
                    Message = "Password reset successfully"
                };
            }
            catch (Exception ex)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = $"Password reset failed: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        public async Task<User?> GetUserByIdAsync(string userId)
        {
            return await _context.UserProfiles
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
        }

        /// <summary>
        /// Get user by email
        /// </summary>
        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.UserProfiles
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower() && u.IsActive);
        }

        /// <summary>
        /// Generate JWT token for authenticated user
        /// </summary>
        private string GenerateJwtToken(User user)
        {
            var jwtSection = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSection["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured");
            var issuer = jwtSection["Issuer"];
            var audience = jwtSection["Audience"];
            var expirationMinutesStr = jwtSection["ExpirationMinutes"];
            var expirationMinutes = 60;
            if (!string.IsNullOrEmpty(expirationMinutesStr) && int.TryParse(expirationMinutesStr, out var exp))
            {
                expirationMinutes = exp;
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Role, user.Role ?? string.Empty),
                new Claim("companyId", user.CompanyId.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Refresh token helpers
        public string GenerateRefreshToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes);
        }

        public string HashToken(string token)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        public async Task<RefreshToken> SaveRefreshTokenAsync(string userId, string refreshToken, int daysValid = 7)
        {
            var entity = new RefreshToken
            {
                UserId = userId,
                TokenHash = HashToken(refreshToken),
                ExpiresAt = DateTime.UtcNow.AddDays(daysValid),
                CreatedAt = DateTime.UtcNow
            };
            _context.RefreshTokens.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<(bool valid, User? user, RefreshToken? token)> ValidateRefreshTokenAsync(string refreshToken)
        {
            var tokenHash = HashToken(refreshToken);
            var tokenEntity = await _context.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash);
            if (tokenEntity == null) return (false, null, null);
            if (tokenEntity.RevokedAt != null) return (false, null, tokenEntity);
            if (tokenEntity.ExpiresAt < DateTime.UtcNow) return (false, null, tokenEntity);
            var user = await _context.UserProfiles.FirstOrDefaultAsync(u => u.Id == tokenEntity.UserId && u.IsActive);
            if (user == null) return (false, null, tokenEntity);
            return (true, user, tokenEntity);
        }

        public async Task<RefreshToken> RotateRefreshTokenAsync(RefreshToken oldToken, string newRefreshToken)
        {
            oldToken.RevokedAt = DateTime.UtcNow;
            oldToken.ReasonRevoked = "Rotated";
            oldToken.ReplacedByTokenHash = HashToken(newRefreshToken);
            var newEntity = new RefreshToken
            {
                UserId = oldToken.UserId,
                TokenHash = HashToken(newRefreshToken),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };
            _context.RefreshTokens.Add(newEntity);
            await _context.SaveChangesAsync();
            return newEntity;
        }

        public async Task RevokeRefreshTokenAsync(RefreshToken token, string reason = "Revoked")
        {
            token.RevokedAt = DateTime.UtcNow;
            token.ReasonRevoked = reason;
            await _context.SaveChangesAsync();
        }

        public string GenerateAccessToken(User user) => GenerateJwtToken(user);
    }

    public class AuthResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public UserDto? User { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string? Name { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; }
        public string? CompanyName { get; set; }
    }
}
