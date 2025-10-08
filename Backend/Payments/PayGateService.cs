using Backend.Models;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;

namespace Backend.Payments
{
    public class PayGateService
    {
        private readonly string? _merchantId;
        private readonly string? _secretKey;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string? _apiBaseUrl;
        private readonly string? _returnUrl;
        private readonly string? _notifyUrl;
        private readonly string _signatureAlgorithm;

        public PayGateService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _merchantId = configuration["PayGate:MerchantId"];
            _secretKey = configuration["PayGate:SecretKey"];
            _apiBaseUrl = configuration["PayGate:ApiBaseUrl"]; // e.g. https://secure.paygate.co.za/payhost/process.trans
            _returnUrl = configuration["PayGate:ReturnUrl"]; // your front-end return URL
            _notifyUrl = configuration["PayGate:NotifyUrl"]; // your backend webhook URL
            _signatureAlgorithm = configuration["PayGate:SignatureAlgorithm"] ?? "HMACSHA256";
            _httpClientFactory = httpClientFactory;
        }

        private void EnsureConfigured()
        {
            if (string.IsNullOrWhiteSpace(_merchantId) || string.IsNullOrWhiteSpace(_secretKey))
            {
                throw new InvalidOperationException("PayGate is not configured. Set PayGate:MerchantId and PayGate:SecretKey in configuration.");
            }
            if (string.IsNullOrWhiteSpace(_apiBaseUrl))
            {
                throw new InvalidOperationException("PayGate API base URL is not configured. Set PayGate:ApiBaseUrl in configuration.");
            }
            if (string.IsNullOrWhiteSpace(_returnUrl))
            {
                throw new InvalidOperationException("PayGate ReturnUrl is not configured. Set PayGate:ReturnUrl in configuration.");
            }
            if (string.IsNullOrWhiteSpace(_notifyUrl))
            {
                throw new InvalidOperationException("PayGate NotifyUrl is not configured. Set PayGate:NotifyUrl in configuration.");
            }
        }

        private static string Canonicalize(IDictionary<string, string> parameters)
        {
            var ordered = parameters.OrderBy(kvp => kvp.Key, StringComparer.Ordinal);
            return string.Join("&", ordered.Select(kvp => $"{kvp.Key}={kvp.Value}"));
        }

        private string ComputeSignature(IDictionary<string, string> parameters)
        {
            var data = Canonicalize(parameters);
            var keyBytes = Encoding.UTF8.GetBytes(_secretKey!);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            byte[] hash;
            if (string.Equals(_signatureAlgorithm, "HMACSHA256", StringComparison.OrdinalIgnoreCase))
            {
                using var hmac = new HMACSHA256(keyBytes);
                hash = hmac.ComputeHash(dataBytes);
            }
            else if (string.Equals(_signatureAlgorithm, "HMACSHA512", StringComparison.OrdinalIgnoreCase))
            {
                using var hmac = new HMACSHA512(keyBytes);
                hash = hmac.ComputeHash(dataBytes);
            }
            else
            {
                throw new NotSupportedException($"Unsupported signature algorithm: {_signatureAlgorithm}");
            }
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        public bool VerifySignature(IDictionary<string, string> parametersWithSignature)
        {
            if (!parametersWithSignature.TryGetValue("signature", out var signature)) return false;
            var compareParams = parametersWithSignature
                .Where(kvp => !string.Equals(kvp.Key, "signature", StringComparison.OrdinalIgnoreCase))
                .ToDictionary(k => k.Key, v => v.Value);
            var expected = ComputeSignature(compareParams);
            return string.Equals(signature, expected, StringComparison.OrdinalIgnoreCase);
        }

        private static (string transactionId, string status) ParseResponseBody(string body)
        {
            // Try JSON first
            try
            {
                var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;
                string txn = root.TryGetProperty("transaction_id", out var t) ? t.GetString() ?? string.Empty :
                              root.TryGetProperty("pg_transaction_id", out var pgt) ? pgt.GetString() ?? string.Empty :
                              root.TryGetProperty("reference", out var refEl) ? refEl.GetString() ?? string.Empty : string.Empty;
                string status = root.TryGetProperty("status", out var s) ? s.GetString() ?? string.Empty :
                                root.TryGetProperty("result", out var r) ? r.GetString() ?? string.Empty : string.Empty;
                if (!string.IsNullOrEmpty(txn)) return (txn, string.IsNullOrEmpty(status) ? "Pending" : status);
            }
            catch { }

            // Try urlencoded key=value pairs
            try
            {
                var pairs = body.Split('&', StringSplitOptions.RemoveEmptyEntries)
                    .Select(p => p.Split('=', 2))
                    .Where(a => a.Length == 2)
                    .ToDictionary(a => Uri.UnescapeDataString(a[0]), a => Uri.UnescapeDataString(a[1]));
                var txn = pairs.ContainsKey("transaction_id") ? pairs["transaction_id"] :
                          pairs.ContainsKey("pg_transaction_id") ? pairs["pg_transaction_id"] :
                          pairs.ContainsKey("reference") ? pairs["reference"] : string.Empty;
                var status = pairs.ContainsKey("status") ? pairs["status"] :
                             pairs.ContainsKey("result") ? pairs["result"] : "";
                if (!string.IsNullOrEmpty(txn)) return (txn, string.IsNullOrEmpty(status) ? "Pending" : status);
            }
            catch { }

            return (Guid.NewGuid().ToString("N"), "Pending");
        }

        public async Task<Payment> ProcessPaymentAsync(decimal amount, string currency = "ZAR")
        {
            EnsureConfigured();
            // Build request parameters (example; align with PayGate's documented fields)
            var reference = $"PG_{DateTime.UtcNow:yyyyMMddHHmmssfff}";
            var amountInCents = (int)Math.Round(amount * 100m);
            var parameters = new Dictionary<string, string>
            {
                { "merchant_id", _merchantId! },
                { "reference", reference },
                { "amount", amountInCents.ToString() },
                { "currency", currency },
                { "return_url", _returnUrl! },
                { "notify_url", _notifyUrl! },
                { "timestamp", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") }
            };

            // Compute signature and append
            var signature = ComputeSignature(parameters);
            parameters.Add("signature", signature);

            // Form POST (PayGate typically expects form data)
            var client = _httpClientFactory.CreateClient();
            using var content = new FormUrlEncodedContent(parameters);
            var response = await client.PostAsync(_apiBaseUrl, content);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"PayGate payment failed: {(int)response.StatusCode} {response.ReasonPhrase}. Body: {body}");
            }

            var (transactionId, status) = ParseResponseBody(body);
            return new Payment
            {
                PaymentId = Guid.NewGuid().ToString(),
                Amount = amount,
                Status = status,
                PaymentMethod = "PayGate",
                TransactionId = transactionId,
                CreatedAt = DateTime.UtcNow
            };
        }

        public async Task<bool> ValidatePaymentAsync(string transactionId)
        {
            EnsureConfigured();
            var client = _httpClientFactory.CreateClient();
            // TODO: Call PayGate to validate transactionId
            // For now explicitly fail until implemented to avoid false positives
            throw new NotImplementedException("PayGate payment validation not implemented. Integrate with PayGate validation endpoint.");
        }
    }
}
