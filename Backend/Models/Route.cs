using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class BusRoute
    {
        [Key]
        public int RouteId { get; set; }
        
        public int CompanyId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Origin { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Destination { get; set; } = string.Empty;
        
        public decimal Distance { get; set; }
        
        public int EstimatedDuration { get; set; } // in minutes
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        public virtual Company? Company { get; set; }
        public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}
