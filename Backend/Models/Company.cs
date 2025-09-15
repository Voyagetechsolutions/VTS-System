using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Company
    {
        [Key]
        public int CompanyId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string? Address { get; set; }
        
        [StringLength(20)]
        public string? ContactNumber { get; set; }
        
        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        public virtual ICollection<User> Users { get; set; } = new List<User>();
        public virtual ICollection<Bus> Buses { get; set; } = new List<Bus>();
        public virtual ICollection<BusRoute> Routes { get; set; } = new List<BusRoute>();
    }
}
