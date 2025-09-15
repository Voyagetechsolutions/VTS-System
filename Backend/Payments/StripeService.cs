using Stripe;
using Backend.Models;

namespace Backend.Payments
{
    public class StripeService
    {
        private readonly string? _secretKey;

        public StripeService(IConfiguration configuration)
        {
            _secretKey = configuration["Stripe:SecretKey"];
            if (!string.IsNullOrEmpty(_secretKey))
            {
                StripeConfiguration.ApiKey = _secretKey;
            }
        }

        public async Task<PaymentIntent> CreatePaymentIntentAsync(decimal amount, string currency = "usd")
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(amount * 100), // Convert to cents
                Currency = currency,
                PaymentMethodTypes = new List<string> { "card" }
            };

            var service = new PaymentIntentService();
            return await service.CreateAsync(options);
        }

        public async Task<Payment> ProcessPaymentAsync(string paymentIntentId)
        {
            var service = new PaymentIntentService();
            var paymentIntent = await service.GetAsync(paymentIntentId);

            if (paymentIntent.Status == "succeeded")
            {
                return new Payment
                {
                    PaymentId = Guid.NewGuid().ToString(),
                    Amount = paymentIntent.Amount / 100m,
                    Status = "Completed",
                    PaymentMethod = "Stripe",
                    TransactionId = paymentIntentId,
                    CreatedAt = DateTime.UtcNow
                };
            }

            throw new Exception($"Payment failed with status: {paymentIntent.Status}");
        }
    }
}
