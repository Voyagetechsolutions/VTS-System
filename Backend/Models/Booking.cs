using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Booking
    {
        [Key]
        public int BookingId { get; set; }
        
        public int TripId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string PassengerName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string ContactInfo { get; set; } = string.Empty;
        
        public int SeatNumber { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual Trip? Trip { get; set; }
    }
}
