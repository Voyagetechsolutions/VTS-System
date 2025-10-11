using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Backend.Services
{
    public class SupabaseRestService
    {
        private readonly HttpClient _http;
        private readonly ILogger<SupabaseRestService> _logger;
        private readonly string _supabaseUrl;
        private readonly string _serviceRoleKey;

        public SupabaseRestService(IConfiguration config, IHttpClientFactory httpFactory, ILogger<SupabaseRestService> logger)
        {
            _http = httpFactory.CreateClient();
            _logger = logger;
            _supabaseUrl = (config["Supabase:SupabaseUrl"] ?? config["Supabase:Url"] ?? string.Empty).TrimEnd('/');
            _serviceRoleKey = config["Supabase:ServiceRoleKey"] ?? string.Empty;
        }

        private void Prepare()
        {
            _http.DefaultRequestHeaders.Clear();
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
            _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            _http.DefaultRequestHeaders.Add("apikey", _serviceRoleKey);
            _http.DefaultRequestHeaders.Add("Prefer", "return=representation");
        }

        public async Task<(bool ok, string body, int status)> InsertAsync(string table, object row)
        {
            if (string.IsNullOrWhiteSpace(_supabaseUrl) || string.IsNullOrWhiteSpace(_serviceRoleKey))
            {
                return (false, "Missing Supabase config", 500);
            }
            Prepare();
            var url = new Uri($"{_supabaseUrl}/rest/v1/{table}");
            var json = JsonSerializer.Serialize(row);
            var resp = await _http.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));
            var body = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Supabase REST insert failed: {Status} {Body}", resp.StatusCode, body);
                return (false, body, (int)resp.StatusCode);
            }
            return (true, body, (int)resp.StatusCode);
        }

        public async Task<(bool ok, string body, int status)> UpdateAsync(string table, string idColumn, string idValue, object updates)
        {
            if (string.IsNullOrWhiteSpace(_supabaseUrl) || string.IsNullOrWhiteSpace(_serviceRoleKey))
            {
                return (false, "Missing Supabase config", 500);
            }
            Prepare();
            var url = new Uri($"{_supabaseUrl}/rest/v1/{table}?{Uri.EscapeDataString(idColumn)}=eq.{Uri.EscapeDataString(idValue)}");
            var json = JsonSerializer.Serialize(updates);
            var req = new HttpRequestMessage(HttpMethod.Patch, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            var resp = await _http.SendAsync(req);
            var body = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Supabase REST update failed: {Status} {Body}", resp.StatusCode, body);
                return (false, body, (int)resp.StatusCode);
            }
            return (true, body, (int)resp.StatusCode);
        }

        public async Task<(bool ok, string body, int status)> DeleteAsync(string table, string idColumn, string idValue)
        {
            if (string.IsNullOrWhiteSpace(_supabaseUrl) || string.IsNullOrWhiteSpace(_serviceRoleKey))
            {
                return (false, "Missing Supabase config", 500);
            }
            Prepare();
            var url = new Uri($"{_supabaseUrl}/rest/v1/{table}?{Uri.EscapeDataString(idColumn)}=eq.{Uri.EscapeDataString(idValue)}");
            var resp = await _http.DeleteAsync(url);
            var body = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Supabase REST delete failed: {Status} {Body}", resp.StatusCode, body);
                return (false, body, (int)resp.StatusCode);
            }
            return (true, body, (int)resp.StatusCode);
        }
    }
}
