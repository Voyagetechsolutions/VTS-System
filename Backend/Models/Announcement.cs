using System.ComponentModel.DataAnnotations;

namespace Backend.Models {
    public class Announcement {
        [Key]
        public int AnnouncementId { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [Required]
        public string Type { get; set; } = "General"; // General, Alert, Policy, Schedule
        
        public int? CompanyId { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? ExpiryDate { get; set; }
        
        public string? CreatedBy { get; set; }
        
        public string? Priority { get; set; } = "Normal"; // Low, Normal, High, Urgent
        
        // Navigation properties
        public Company? Company { get; set; }
    }
}
