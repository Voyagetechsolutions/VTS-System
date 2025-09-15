### Incident Alerts (Slack/Email)

- Use Sentry alert rules for error thresholds → Slack webhook or Email.
- For custom incidents (e.g., high refund risk), create scheduled jobs (Edge Functions/cron) to query tables and post to Slack via webhook.
- Slack: create incoming webhook, store secret, post JSON payloads with summary and deep links.
