# ReportApp25

ReportApp25 is a single-page operations dashboard that will help regional managers coordinate electronics donation pickups across Canada. The backend will be powered by FlightPHP and MySQL, while the frontend uses vanilla JavaScript, Bootstrap 5, and Chart.js.

This repository currently reflects Milestone 3 of the project plan: the static SPA from Milestone 1, a MySQL schema and DAO layer from Milestone 2, plus service-layer validation, presentation routes, and OpenAPI documentation.

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
│  ├─ js/app.js               # Lightweight router + mock data renderers
│  ├─ views/                  # HTML fragments for each feature/page
│  └─ assets/logo.svg
├─ docs/
│  ├─ ERD.md                  # Draft entity relationship diagram (Mermaid)
│  ├─ schema.sql              # MySQL DDL used for Milestone 2
│  └─ openapi.yaml            # OpenAPI 3 spec (Milestone 3)
└─ scripts/                   # Reserved for tooling helpers
```

## Frontend Prototype (Milestone 1)

- Implements SPA navigation that fetches view fragments without full reloads.
- Provides static pages for Dashboard, Reports, Teams, Pickups, Applications, Profile, Login, Register, Recover, Privacy, and Terms.
- Demonstrates responsive design with Bootstrap 5 and a custom theme.
- Visualizes placeholder metrics using Chart.js.
- Includes mock data that reflects the planned entities and roles (Manager, Team Lead).

## Backend Progress (Milestone 3)

- Environment + PDO bootstrap via FlightPHP and `vlucas/phpdotenv`.
- DAO classes for Users, Teams, Companies, Reports, Pickups, and Team Applications, plus service-layer validation.
- CRUD endpoints under `/api/*` for all entities, driven by the services.
- Presentation layer routes at `/` (endpoint summary) and `/docs` (Swagger UI reading `docs/openapi.yaml`).
- Documentation artifacts: ERD, schema SQL, and OpenAPI 3 spec.

## What’s Next

1. Seed development data and connect the SPA to the live API with AJAX.
2. Add authentication/authorization (JWT) and tighter request validation.
3. Grow test coverage around services and routes.
