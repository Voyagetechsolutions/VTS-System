using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;

namespace Backend.Logging
{
    public class AppInsightsLogger
    {
        private readonly TelemetryClient _telemetryClient;

        public AppInsightsLogger(TelemetryClient telemetryClient)
        {
            _telemetryClient = telemetryClient;
        }

        public void LogInformation(string message, Dictionary<string, string>? properties = null)
        {
            _telemetryClient.TrackTrace(message, SeverityLevel.Information, properties);
        }

        public void LogWarning(string message, Dictionary<string, string>? properties = null)
        {
            _telemetryClient.TrackTrace(message, SeverityLevel.Warning, properties);
        }

        public void LogError(string message, Exception? exception = null, Dictionary<string, string>? properties = null)
        {
            if (exception != null)
            {
                _telemetryClient.TrackException(exception, properties);
            }
            _telemetryClient.TrackTrace(message, SeverityLevel.Error, properties);
        }

        public void LogEvent(string eventName, Dictionary<string, string>? properties = null)
        {
            _telemetryClient.TrackEvent(eventName, properties);
        }

        public void LogMetric(string metricName, double value, Dictionary<string, string>? properties = null)
        {
            _telemetryClient.TrackMetric(metricName, value, properties);
        }
    }
}
