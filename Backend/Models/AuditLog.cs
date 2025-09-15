using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class AuditLog
    {
        [Key]
        public int AuditLogId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string EntityName { get; set; } = string.Empty;
        
        public string? EntityId { get; set; }
        
        public string? UserId { get; set; }
        
        public string? OldValues { get; set; }
        
        public string? NewValues { get; set; }
        
        public DateTime CreatedAt { get; set; }
        
        public string? IpAddress { get; set; }
        
        public string? UserAgent { get; set; }
    }
}
