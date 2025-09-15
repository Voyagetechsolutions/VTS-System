using System.ComponentModel.DataAnnotations;

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
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
    }
}
