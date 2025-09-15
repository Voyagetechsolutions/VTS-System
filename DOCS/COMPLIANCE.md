### GDPR / POPIA / PCI Quick Notes

Data Minimization:
- Avoid storing unnecessary PII. Mask in logs/replays.

Access Controls:
- RBAC + RLS enforced by `company_id` and `user_id`.

Data Subject Rights:
- Add endpoints for export/delete upon verified request.

PCI Scoping:
- Do not store card PANs. Use payment gateway tokens.

Security:
- TLS enforced end-to-end. CSP, HSTS, frame protections in `public/index.html`.


