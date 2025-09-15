using System.ComponentModel.DataAnnotations;

namespace Backend.Models {
    public class Message {
        [Key]
        public int MessageId { get; set; }
        
        [Required]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [Required]
        public string Type { get; set; } = "General"; // General, Alert, Emergency, Announcement
        
        [Required]
        public string FromUserId { get; set; } = string.Empty;
        
        public string? ToUserId { get; set; } // null for broadcast messages
        
        public int? CompanyId { get; set; }
        
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? ReadAt { get; set; }
        
        public string? Priority { get; set; } = "Normal"; // Low, Normal, High, Urgent
        
        // Navigation properties
        public User? FromUser { get; set; }
        public User? ToUser { get; set; }
        public Company? Company { get; set; }
    }
}
