using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class BusLocationHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int BusId { get; set; }
        [ForeignKey(nameof(BusId))]
        public virtual Bus? Bus { get; set; }

        [Required]
        public int CompanyId { get; set; }
        [ForeignKey(nameof(CompanyId))]
        public virtual Company? Company { get; set; }

        [Column(TypeName = "decimal(9,6)")]
        public decimal Latitude { get; set; }

        [Column(TypeName = "decimal(9,6)")]
        public decimal Longitude { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Speed { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; }
    }
}
