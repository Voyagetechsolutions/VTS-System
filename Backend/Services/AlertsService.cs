using Backend.Data;
using Backend.Models;
using Backend.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class AlertsService
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<BusTrackingHub> _hub;
        private readonly ILogger<AlertsService> _logger;
        public AlertsService(AppDbContext db, IHubContext<BusTrackingHub> hub, ILogger<AlertsService> logger)
        {
            _db = db; _hub = hub; _logger = logger;
        }

        public async Task<IEnumerable<Alert>> EvaluateAndEmitAsync(int companyId, int busId, int? tripId, decimal speed, DateTime timestamp, CancellationToken ct = default)
        {
            var alerts = new List<Alert>();

            // Speeding rule (placeholder threshold 100 km/h)
            if (speed > 100)
            {
                var a = new Alert
                {
                    CompanyId = companyId,
                    BusId = busId,
                    TripId = tripId,
                    Type = "speeding",
                    Message = $"Bus {busId} speeding at {speed} km/h",
                    Severity = "warning",
                    Timestamp = timestamp,
                    Resolved = false
                };
                _db.Alerts.Add(a);
                alerts.Add(a);
            }

            // TODO: Geofence/off-route and delay detection can be added here.

            if (alerts.Count > 0)
            {
                await _db.SaveChangesAsync(ct);
                foreach (var a in alerts)
                {
                    await _hub.Clients.Group($"company_{companyId}").SendAsync("AlertReceived", new
                    {
                        a.AlertId,
                        a.CompanyId,
                        a.BusId,
                        a.TripId,
                        a.Type,
                        a.Message,
                        a.Severity,
                        a.Timestamp,
                        a.Resolved
                    }, ct);
                }
            }

            return alerts;
        }
    }
}
