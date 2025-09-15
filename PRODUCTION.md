# Production Readiness

## Environments
- Required env vars:
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_ANON_KEY
  - REACT_APP_USE_TEST_LOGIN=false

## Security Headers
- Set in reverse proxy (Nginx/Caddy/Cloudflare):
  - Content-Security-Policy
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: no-referrer
  - Permissions-Policy: camera=(), microphone=()

## Monitoring
- Attach Sentry/LogRocket in App root (ErrorBoundary hooks)
- Backend logs via Supabase logs

## Backups
- Enable daily database backups in Supabase
- Export storage buckets weekly

## Rate Limiting
- Use Supabase rate limits + edge function quotas

## Deployment
- Build: `npm run build`
- Serve behind CDN/HTTPS

## Testing
- Add unit/integration/e2e suites (Jest/RTL/Cypress)
- Critical flows: booking, payment, boarding, approvals
