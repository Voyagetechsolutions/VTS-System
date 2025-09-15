### Disaster Recovery & Backups

- Nightly logical backups of Postgres (pg_dump) retained 30 days.
- Weekly full + daily incremental object storage backups.
- Verify restores monthly in a staging project.
- Runbook:
  1) Declare incident, freeze writes.
  2) Restore database snapshot to new instance.
  3) Re-point Supabase project to restored DB or import.
  4) Re-generate service keys; rotate secrets.


