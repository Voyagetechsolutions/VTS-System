### Testing Overview

- Unit: Vitest on helpers (`npm run test`).
- E2E: Cypress programmatic tests using Supabase RPCs.

E2E included:
- `smoke.cy.js`: booking → payment → verify.
- `maintenance_flow.cy.js`: maintenance request → approval → task complete.
- `hr_finance_flow.cy.js`: shift → payroll → finance KPIs.


