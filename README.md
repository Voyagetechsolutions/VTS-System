# Multi-Tenant Bus Management System

## Overview
A scalable bus management platform for multiple companies, featuring:
- ASP.NET Core 8 backend
- React.js frontend with Material-UI
- PostgreSQL shared schema multi-tenancy
- ASP.NET Identity (JWT, RBAC)
- SignalR for real-time updates
- Stripe/PayGate payments
- Logging & analytics (Application Insights/ELK)

## Features
- Multi-tenant architecture (CompanyId on all tables)
- Role-based dashboards: Developer, Company Admin, Operations Manager, Booking Office, Boarding Operator
- CRUD APIs for all entities
- Real-time bus tracking & alerts
- Payment processing
- Audit logs & analytics

## Project Structure
- `/Backend` - ASP.NET Core API, SignalR, Auth, Payments, Logging
- `/Frontend` - React.js app, Material-UI, role dashboards, RBAC
- `/Database` - PostgreSQL models, seeders

## Getting Started
1. Build backend (ASP.NET Core 8)
2. Build frontend (React.js)
3. Configure PostgreSQL connection
4. Run migrations & seed data
5. Start backend & frontend

## Notes
- All tables include `CompanyId` for multi-tenancy
- Role-based navigation and access control
- Replace payment/logging integrations with real credentials

---
For details, see `/Backend/README.md` and `/Frontend/README.md`.
