### Sentry
- Configure `REACT_APP_SENTRY_DSN` and `REACT_APP_RELEASE`.
- Errors captured via ErrorBoundary and BrowserTracing with sample rate 0.2.

### LogRocket (optional)
- Set `REACT_APP_LOGROCKET_ID=org/project` to enable dynamic import.
- PII filtered: DOM text sanitized; network bodies dropped.
- Linked to Sentry via session URL context.


