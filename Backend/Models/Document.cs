using System.ComponentModel.DataAnnotations;

namespace Backend.Models {
    public class Document {
        [Key]
        public int DocumentId { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Type { get; set; } = string.Empty; // driver_license, permit, insurance, etc.
        
        public string? Description { get; set; }
        
        [Required]
        public string FilePath { get; set; } = string.Empty;
        
        [Required]
        public string FileName { get; set; } = string.Empty;
        
        public long FileSize { get; set; }
        
        [Required]
        public string MimeType { get; set; } = string.Empty;
        
        public DateTime? ExpiryDate { get; set; }
        
        [Required]
        public string Status { get; set; } = "Active"; // Active, Expired, Revoked
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public int? CompanyId { get; set; }
        
        public DateTime UploadedAt { get; set; }
        
        public string? UploadedBy { get; set; }
        
        // Navigation properties
        public User? User { get; set; }
        public Company? Company { get; set; }
    }
}
