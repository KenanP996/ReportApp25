# ReportApp25

ReportApp25 is a single-page operations dashboard that will help regional managers coordinate electronics donation pickups across Canada. The backend will be powered by FlightPHP and MySQL, while the frontend uses vanilla JavaScript, Bootstrap 5, and Chart.js.

This repository currently reflects Milestone 5 of the project plan: the static SPA from Milestone 1, a MySQL schema and DAO layer from Milestone 2, service-layer validation and OpenAPI from Milestone 3, JWT auth/RBAC from Milestone 4, plus frontend service refactor, validation, and deployment assets.

## Repository Layout

```
ReportApp25/
├─ backend/
│  ├─ public/index.php        # FlightPHP entry point
│  ├─ routes/                 # REST route definitions
│  ├─ services/               # Business logic layer (validation + orchestration)
│  ├─ dao/                    # PDO-based data access classes
│  ├─ config/                 # Bootstrap + environment loading
│  ├─ src/                    # Namespaced PHP classes
│  ├─ tests/                  # PHPUnit scaffolding
│  └─ composer.json
├─ frontend/
│  ├─ index.html              # SPA shell that loads CSS/JS once
│  ├─ css/styles.css          # Custom theme
│  ├─ services/               # SPA controller, API client, form validation
│  ├─ views/                  # HTML fragments for each feature/page
│  └─ assets/logo.svg
├─ docs/
│  ├─ ERD.md                  # Draft entity relationship diagram (Mermaid)
│  ├─ schema.sql              # MySQL DDL used for Milestone 2
│  └─ openapi.yaml            # OpenAPI 3 spec (Milestone 3+)
├─ docker-compose.yml         # Local/dev deployment stack (MySQL, backend, frontend)
└─ scripts/                   # Tooling helpers (deploy.sh, seed-manager.php)
```

## Frontend Prototype (Milestone 1)

- Implements SPA navigation that fetches view fragments without full reloads.
- Provides static pages for Dashboard, Reports, Teams, Pickups, Applications, Profile, Login, Register, Recover, Privacy, and Terms.
- Demonstrates responsive design with Bootstrap 5 and a custom theme.
- Visualizes placeholder metrics using Chart.js.
- Includes mock data that reflects the planned entities and roles (Manager, Team Lead).

## Backend Progress (Milestone 5)

- Environment + PDO bootstrap via FlightPHP and `vlucas/phpdotenv`.
- DAO classes for Users, Teams, Companies, Reports, Pickups, and Team Applications, plus service-layer validation.
- JWT auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) and middleware (`requireAuth`, `requireRole`).
- CRUD endpoints under `/api/*` for all entities with manager-only mutations and read access for authenticated users.
- Presentation layer routes at `/` (endpoint summary) and `/docs` (Swagger UI reading `docs/openapi.yaml`).
- Deployment assets: `docker-compose.yml`, backend Dockerfile, frontend Dockerfile, and Docker env example.

## Frontend Progress (Milestone 5)

- JS refactor into frontend/services (API client, form validation, SPA controller).
- Auth-connected SPA that enforces route guards, renders role-aware UI (admin only for managers), and consumes live API data across dashboard, admin, teams, reports, pickups, applications, and profile.
- Client-side validations for login/register forms (email/password length checks) with inline error display.

## Deployment

Local/dev Docker stack:
```bash
docker-compose up --build
# backend on http://localhost:8080, frontend on http://localhost:5173, MySQL on 3307
```

Backend Docker env example: `backend/.env.docker.example` (adjust secrets in a real deployment).

Live URL: https://project.noxfleet.org (SPA + proxied API under the same domain).

## What’s Next

1. Seed development data and extend the SPA with full CRUD forms and optimistic updates.
2. Add production-grade auth hardening (refresh tokens, rate limiting) and e2e tests.
3. Wire CI/CD to build Docker images, run tests, and deploy to your infra.
