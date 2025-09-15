### Rate Limiting (Nginx / Cloudflare)

Nginx example (per-IP burst, token bucket):

```
http {
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
  limit_conn_zone $binary_remote_addr zone=addr:10m;

  server {
    location /api/ {
      limit_req zone=api_limit burst=40 nodelay;
      limit_conn addr 20;
      proxy_pass http://backend;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  }
}
```

Cloudflare WAF/Rules:
- Create a Rate Limiting rule: When URI Path contains `/rest/v1/` or `/functions/v1/`, threshold 300 req/1 min per IP → action: throttle or challenge.
- Add Bot Fight Mode and WAF rules to block known bad UA/IPs.

Other protections:
- Enforce `Authorization` header presence; drop anonymous writes.
- Use `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` headers.

### File Upload Security
- Keep Supabase Storage `documents` bucket private.
- Client-side checks: MIME allowlist, size limit.
- Server-side: integrate antivirus scanning (e.g., Cloud Functions + ClamAV) before making files accessible.
- Serve via short-lived signed URLs only; never public URLs.

### MFA for Admins
- Use Supabase MFA TOTP factors for admin accounts.
- Require factor challenge on login; enforce via UI and RLS where possible.


