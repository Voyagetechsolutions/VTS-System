using System.Net;
using System.Net.Mail;

namespace Backend.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetAsync(string toEmail, string resetToken);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendPasswordResetAsync(string toEmail, string resetToken)
        {
            // Build a simple reset link (front-end should handle the route)
            var frontendOrigin = _config["FrontendOrigin"] ?? "http://localhost:3000";
            var resetLink = $"{frontendOrigin}/reset-password?token={Uri.EscapeDataString(resetToken)}";

            var smtp = _config.GetSection("SmtpSettings");
            var host = smtp["Host"];
            var portStr = smtp["Port"];
            var username = smtp["Username"];
            var password = smtp["Password"];
            var fromEmail = smtp["FromEmail"] ?? "no-reply@localhost";
            var fromName = smtp["FromName"] ?? "Bus Management";
            var useSsl = bool.TryParse(smtp["UseSsl"], out var vssl) && vssl;
            var useStartTls = bool.TryParse(smtp["UseStartTls"], out var vstart) && vstart;

            var subject = "Password Reset";
            var body = $"You requested a password reset. Click the link to reset your password: {resetLink}\n\nIf you did not request this, please ignore this email.";

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(portStr) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning("SMTP not fully configured. Logging password reset link for {Email}: {Link}", toEmail, resetLink);
                return;
            }

            if (!int.TryParse(portStr, out var port)) port = 587;

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = useSsl || useStartTls,
                Credentials = new NetworkCredential(username, password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            message.To.Add(toEmail);

            try
            {
                await client.SendMailAsync(message);
                _logger.LogInformation("Password reset email sent to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reset email. Logging link instead.");
                _logger.LogInformation("Password reset link for {Email}: {Link}", toEmail, resetLink);
            }
        }
    }
}
