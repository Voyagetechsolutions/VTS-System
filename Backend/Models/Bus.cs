using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Bus
    {
        [Key]
        public int BusId { get; set; }
        
        public int CompanyId { get; set; }
        
        [Required]
        [StringLength(20)]
        public string LicensePlate { get; set; } = string.Empty;
        
        public int Capacity { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual Company? Company { get; set; }
        public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}
