using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Alert
    {
        [Key]
        public int AlertId { get; set; }

        [Required]
        public int CompanyId { get; set; }
        [ForeignKey(nameof(CompanyId))]
        public virtual Company? Company { get; set; }

        public int? BusId { get; set; }
        [ForeignKey(nameof(BusId))]
        public virtual Bus? Bus { get; set; }

        public int? TripId { get; set; }
        [ForeignKey(nameof(TripId))]
        public virtual Trip? Trip { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // geofence|speeding|delay

        [Required]
        [StringLength(250)]
        public string Message { get; set; } = string.Empty;

        [StringLength(20)]
        public string Severity { get; set; } = "info"; // info|warning|critical

        public DateTime Timestamp { get; set; }

        public bool Resolved { get; set; } = false;
    }
}
