using Microsoft.AspNetCore.SignalR;
using Backend.Models;

namespace Backend.SignalR
{
    public class BusTrackingHub : Hub
    {
        public async Task UpdateBusLocation(string busId, double latitude, double longitude, string status)
        {
            var busLocation = new
            {
                BusId = busId,
                Latitude = latitude,
                Longitude = longitude,
                Status = status,
                Timestamp = DateTime.UtcNow
            };

            await Clients.All.SendAsync("BusLocationUpdated", busLocation);
        }

        public async Task SendAlert(string companyId, string message, string severity)
        {
            var alert = new
            {
                CompanyId = companyId,
                Message = message,
                Severity = severity,
                Timestamp = DateTime.UtcNow
            };

            await Clients.All.SendAsync("AlertReceived", alert);
        }

        public async Task JoinCompanyGroup(string companyId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"company_{companyId}");
        }

        public async Task LeaveCompanyGroup(string companyId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"company_{companyId}");
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("UserConnected", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Clients.All.SendAsync("UserDisconnected", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}
