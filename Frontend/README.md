## Frontend Dev Notes

- Env vars:
  - `REACT_APP_SENTRY_DSN`, `REACT_APP_RELEASE`
  - `REACT_APP_LOGROCKET_ID` (optional)
  - `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
  - Feature flags (optional):
    - `REACT_APP_FF_VOICE_CONTROL` (default true)
    - `REACT_APP_FF_OFFLINE_QUEUE_V2` (default true)
- Scripts:
  - `npm run start`, `npm run build`
  - `npm run cy:open`, `npm run cy:run`
  - `npm run test`, `npm run test:watch`
  - `npm run depcheck`

# Bus Management System Frontend

## Setup
1. Install dependencies:
   npm install
2. Start development server:
   npm start

## Structure
- src/pages: Role-based dashboards
- src/components: UI components
- src/services: API calls
- src/layouts: App layouts

## Notes
- Uses Material-UI for UI
- Role-based navigation
- Connects to ASP.NET Core backend
