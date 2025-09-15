using System.Text.Json;

namespace Backend.Logging
{
    public class ElkLogger
    {
        private readonly string _elasticsearchUrl;
        private readonly string _indexName;
        private readonly HttpClient _httpClient;

        public ElkLogger(IConfiguration configuration)
        {
            _elasticsearchUrl = configuration["Elasticsearch:Url"] ?? "http://localhost:9200";
            _indexName = configuration["Elasticsearch:IndexName"] ?? "busmgmt-logs";
            _httpClient = new HttpClient();
        }

        public async Task LogAsync(string level, string message, object? data = null, string? userId = null)
        {
            try
            {
                var logEntry = new
                {
                    timestamp = DateTime.UtcNow,
                    level = level.ToLower(),
                    message = message,
                    data = data,
                    userId = userId,
                    service = "BusManagementSystem"
                };

                var json = JsonSerializer.Serialize(logEntry);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(
                    $"{_elasticsearchUrl}/{_indexName}/_doc",
                    content
                );

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Failed to send log to ELK: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error logging to ELK: {ex.Message}");
            }
        }

        public async Task LogInformationAsync(string message, object? data = null, string? userId = null)
        {
            await LogAsync("INFO", message, data, userId);
        }

        public async Task LogWarningAsync(string message, object? data = null, string? userId = null)
        {
            await LogAsync("WARN", message, data, userId);
        }

        public async Task LogErrorAsync(string message, Exception? exception = null, object? data = null, string? userId = null)
        {
            var errorData = new
            {
                error = exception?.Message,
                stackTrace = exception?.StackTrace,
                additionalData = data
            };

            await LogAsync("ERROR", message, errorData, userId);
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}
