using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string UserId { get; set; } = string.Empty;
        // Store a hash of the refresh token for security
        [Required]
        public string TokenHash { get; set; } = string.Empty;
        [Required]
        public DateTime ExpiresAt { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? ReplacedByTokenHash { get; set; }
        public DateTime? RevokedAt { get; set; }
        public string? ReasonRevoked { get; set; }

        // Navigation
        public virtual User? User { get; set; }
    }
}
