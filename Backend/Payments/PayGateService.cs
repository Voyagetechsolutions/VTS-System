using Backend.Models;

namespace Backend.Payments
{
    public class PayGateService
    {
        private readonly string? _merchantId;
        private readonly string? _secretKey;

        public PayGateService(IConfiguration configuration)
        {
            _merchantId = configuration["PayGate:MerchantId"];
            _secretKey = configuration["PayGate:SecretKey"];
        }

        public async Task<Payment> ProcessPaymentAsync(decimal amount, string currency = "ZAR")
        {
            // Simulate PayGate payment processing
            await Task.Delay(1000); // Simulate API call

            var payment = new Payment
            {
                PaymentId = Guid.NewGuid().ToString(),
                Amount = amount,
                Status = "Completed",
                PaymentMethod = "PayGate",
                TransactionId = $"PG_{DateTime.UtcNow:yyyyMMddHHmmss}",
                CreatedAt = DateTime.UtcNow
            };

            return payment;
        }

        public async Task<bool> ValidatePaymentAsync(string transactionId)
        {
            // Simulate payment validation
            await Task.Delay(500);
            return true;
        }
    }
}
