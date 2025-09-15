### Cloudflare: Rate Limiting & WAF

Rules:
- Rate limit: URI Path contains `/rest/v1/` or `/functions/v1/`, Threshold: 300 per minute per IP, Action: Throttle.
- WAF custom rule: Block requests without `Authorization` to API paths.
- Bot management: enable (where available).

Headers (via Transform Rules):
- Enforce security headers on responses for the app domain.


