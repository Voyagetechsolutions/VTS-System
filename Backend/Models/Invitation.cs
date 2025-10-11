using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Invitation
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Role { get; set; } = string.Empty;
        public int? CompanyId { get; set; }
        [Required]
        public string TokenHash { get; set; } = string.Empty;
        [Required]
        public DateTime ExpiresAt { get; set; }
        public bool Accepted { get; set; } = false;
        public string? InviterUserId { get; set; }
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
