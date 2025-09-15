using System.ComponentModel.DataAnnotations;

namespace Backend.Models {
    public class Incident {
        [Key]
        public int IncidentId { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public string Type { get; set; } = "General"; // Accident, Delay, Mechanical, Customer, Safety
        
        [Required]
        public string Severity { get; set; } = "Medium"; // Low, Medium, High, Critical
        
        [Required]
        public string Status { get; set; } = "Open"; // Open, Assigned, In Progress, Resolved, Closed
        
        public string? Location { get; set; }
        
        public DateTime? IncidentDate { get; set; }
        
        public DateTime ReportedAt { get; set; }
        
        public DateTime? ResolvedAt { get; set; }
        
        [Required]
        public string ReportedByUserId { get; set; } = string.Empty;
        
        public string? AssignedToUserId { get; set; }
        
        public string? Resolution { get; set; }
        
        public int? CompanyId { get; set; }
        
        public int? TripId { get; set; }
        
        public int? BusId { get; set; }
        
        // Navigation properties
        public User? ReportedByUser { get; set; }
        public User? AssignedToUser { get; set; }
        public Company? Company { get; set; }
        public Trip? Trip { get; set; }
        public Bus? Bus { get; set; }
    }
}
