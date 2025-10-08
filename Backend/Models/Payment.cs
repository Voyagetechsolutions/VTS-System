using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Payment
    {
        [Key]
        public string PaymentId { get; set; } = string.Empty;
        
        public decimal Amount { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? TransactionId { get; set; }

        // Optional link to booking
        public int? BookingId { get; set; }
        [ForeignKey(nameof(BookingId))]
        public virtual Booking? Booking { get; set; }
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
    }
}
