using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Backend.Services
{
    public class SupabaseAdminService
    {
        private readonly HttpClient _http;
        private readonly ILogger<SupabaseAdminService> _logger;
        private readonly string _supabaseUrl;
        private readonly string _serviceRoleKey;

        public SupabaseAdminService(IConfiguration config, IHttpClientFactory httpFactory, ILogger<SupabaseAdminService> logger)
        {
            _http = httpFactory.CreateClient();
            _logger = logger;
            _supabaseUrl = config["Supabase:SupabaseUrl"] ?? config["Supabase:Url"] ?? string.Empty;
            _serviceRoleKey = config["Supabase:ServiceRoleKey"] ?? string.Empty;
        }

        private void PrepareAuthHeaders()
        {
            _http.DefaultRequestHeaders.Clear();
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
            _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            _http.DefaultRequestHeaders.Add("apikey", _serviceRoleKey);
        }

        public async Task<(bool ok, string? error)> InviteUserByEmailAsync(string email, string? redirectTo)
        {
            if (string.IsNullOrWhiteSpace(_supabaseUrl) || string.IsNullOrWhiteSpace(_serviceRoleKey))
            {
                return (false, "Supabase configuration missing");
            }
            PrepareAuthHeaders();

            var url = new Uri(new Uri(_supabaseUrl), "/auth/v1/invite");
            var payload = new
            {
                email,
                data = new { },
                redirectTo
            };
            var json = JsonSerializer.Serialize(payload);
            var resp = await _http.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));
            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync();
                _logger.LogWarning("InviteUserByEmail failed: {Status} {Body}", resp.StatusCode, body);
                return (false, $"{(int)resp.StatusCode}: {body}");
            }
            return (true, null);
        }
    }
}
