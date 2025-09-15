### CI/CD Gates

- Jobs:
  - Lint: `npm run lint`
  - Unit tests: `npm run test`
  - E2E (optional on staging): `npm run cy:run`
  - Dep check: `npm run depcheck`
  - SAST (e.g., CodeQL) and dependency audit.

Release process:
- Tag with `REACT_APP_RELEASE` and set Sentry release.


