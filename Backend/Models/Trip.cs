using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Trip
    {
        [Key]
        public int TripId { get; set; }
        
        public int BusId { get; set; }
        
        public int RouteId { get; set; }
        
        public DateTime ScheduledDeparture { get; set; }
        
        public DateTime? ActualDeparture { get; set; }
        
        public DateTime? ActualArrival { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual Bus? Bus { get; set; }
        public virtual BusRoute? Route { get; set; }
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
