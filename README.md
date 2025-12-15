# ReportApp25

ReportApp25 is a single-page operations dashboard that helps regional managers coordinate electronics donation pickups across Canada. The backend is powered by FlightPHP + MySQL and the frontend uses vanilla JavaScript, Bootstrap 5, and Chart.js.

This branch reflects the cumulative work through Milestone 5:
- Milestone 1 SPA shell + responsive UI
- Milestone 2 schema/DAO layer
- Milestone 3 validation + OpenAPI 3 spec
- Milestone 4 JWT auth and role-based middleware
- Milestone 5 feature parity with the React playground reference (live dashboards, pickups, reports, exports, and deployment assets)

## Repository Layout

```
ReportApp25/
├─ backend/
│  ├─ public/index.php        # FlightPHP entry point
│  ├─ routes/                 # REST route definitions
│  ├─ services/               # Business logic layer (validation + orchestration)
│  ├─ dao/                    # PDO-based data access classes
│  ├─ config/                 # Bootstrap + environment loading
│  ├─ src/                    # Shared helpers (Points, etc.)
│  ├─ tests/                  # PHPUnit scaffolding
│  └─ composer.json
├─ frontend/
│  ├─ index.html              # SPA shell (loads CSS/JS once)
│  ├─ css/styles.css          # Custom theme variables
│  ├─ services/               # SPA controller, API client, forms, charts
│  ├─ views/                  # HTML fragments (dashboard, reports, pickups, etc.)
│  └─ assets/logo.svg
├─ docs/                      # ERD, schema, OpenAPI, deployment notes
├─ deploy/ + scripts/         # Helper scripts for dev/prod (docker, seeding)
├─ docker-compose*.yml        # Local + production stacks
└─ frontend/backend Dockerfiles
```

## Feature Highlights

1. **Authentication & RBAC**
   - JWT login/register endpoints with hashed passwords.
   - `requireAuth` and `requireRole` middleware guard CRUD routes.
   - SPA navigation enforces route-level guards and hides manager-only CTAs in the UI.

2. **Pickup + Company Workflow**
   - Single pickup request form mirrors the playground UI.
   - Users search companies via datalist; new companies are auto-created when needed.
   - Backend creates the pickup and an associated report so users never enter numeric IDs.

3. **Reports Library & Exports**
   - Filter fields: month, year, province, status, company name.
   - KPI tiles, per-province/city tables with per-device columns, monthly trend chart, province pie chart, “Top Users,” and detailed company rollups.
   - CSV export mirrors the grid (company, device counts, memberships, points, submitter info, timestamps).
   - Frontend prefers `/api/reports/statistics` but can rebuild the same summaries client-side if only `/api/reports` is exposed.

4. **Dashboard**
   - Live quick stats (reports, pickups, teams, total points) plus upcoming pickups and recent reports driven by the same summarized dataset.
   - Productivity chart uses actual monthly points, not mocked data.

5. **Admin & Teams**
   - Managers can inspect user/team counts and recent reports.
   - Everyone can browse teams with server-provided data.

## Data Flow & Points Calculation

- `ReportApp25\Utils\Points` normalizes both camelCase and snake_case item keys (`numPcs`, `num_pcs`, `pcs`, etc.) before computing points, so migrated data remains accurate.
- The statistics endpoint aggregates totals, province/city summaries, per-user standings, company rollups, and monthly charts for the dashboards.
- When statistics are unavailable, the SPA fetches `/api/reports`, `/api/companies`, and `/api/users`, normalizes item counts, and rebuilds the same structures client-side. This guarantees demos never break even on constrained hosting.
- Each pickup submission feeds the same helper, so dashboards, reports, and exports always reconcile with stored data.

## Running Locally

```bash
# copy env template and adjust secrets
cp backend/.env.docker.example backend/.env

# launch the full stack
docker-compose up --build
# Backend API:   http://localhost:8080
# Frontend SPA:  http://localhost:5173
# MySQL:         localhost:3307 (credentials from backend/.env)
```

Manual run:

```bash
# backend
cd backend
composer install
php -S localhost:8080 -t public

# frontend
cd frontend
npm install
npm run dev -- --host
```

## Demo / Defense Checklist

Use these steps during your project defense to highlight every rubric item:

1. **Auth** – Register a team lead, log in, and show route guards/nav adapting to the role. Explain JWT handling stored in `localStorage`.
2. **Pickup & Company Creation** – On the Pickups page, either pick a company from the datalist or type a new one, fill contact/location/device counts, then schedule the pickup. Mention that the backend auto-creates the company and linked report.
3. **Dashboard Evidence** – Switch to Dashboard, click “Refresh Data,” and show that the quick stats, upcoming pickups, recent reports, and productivity chart immediately reflect the pickup you submitted.
4. **Reports Library Deep Dive** – Apply filters (month/province/company), showcase KPI tiles, province/city tables, charts, Top Users, and Company Detail. Click “Export CSV,” open the file, and point out that the values match the UI.
5. **Admin View (if manager)** – Show the Admin tab to prove role-based access, highlighting user/team/report counts.
6. **Fallback Story** – Mention that if `/api/reports/statistics` is disabled, the frontend rebuilds the same numbers via `/api/reports`, `/api/companies`, and `/api/users`, so the presentation stays consistent.

## Repo Hygiene / Untracked Items

- **Track in git**: everything in `backend`, `frontend`, `docs`, `deploy`, `scripts`, and the Dockerfiles/compose files.
- **Keep untracked**: `cloudflared.rpm` (binary installer). Leave it out of git or add it to your global ignore list; it’s only needed locally.

## Next Steps

1. Seed development/demo data and add optimistic UI updates for CRUD flows.
2. Harden auth (refresh tokens, throttling) and introduce Jest + PHPUnit suites.
3. Wire CI/CD to build Docker images, run tests, and deploy automatically.
