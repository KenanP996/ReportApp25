# ReportApp25

ReportApp25 is a single-page operations dashboard that will help regional managers coordinate electronics donation pickups across Canada. The backend will be powered by FlightPHP and MySQL, while the frontend uses vanilla JavaScript, Bootstrap 5, and Chart.js.

This repository currently reflects Milestone 2 of the project plan: the static SPA from Milestone 1 plus a MySQL schema, PDO-backed DAO layer, and CRUD REST endpoints for the five core entities.

## Repository Layout

```
ReportApp25/
├─ backend/
│  ├─ public/index.php        # FlightPHP entry point
│  ├─ routes/                 # REST route definitions
│  ├─ services/               # Business logic layer (placeholder)
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
│  └─ schema.sql              # MySQL DDL used for Milestone 2
└─ scripts/                   # Reserved for tooling helpers
```

## Frontend Prototype (Milestone 1)

- Implements SPA navigation that fetches view fragments without full reloads.
- Provides static pages for Dashboard, Reports, Teams, Pickups, Applications, Profile, Login, Register, Recover, Privacy, and Terms.
- Demonstrates responsive design with Bootstrap 5 and a custom theme.
- Visualizes placeholder metrics using Chart.js.
- Includes mock data that reflects the planned entities and roles (Manager, Team Lead).

## Backend Progress (Milestone 2)

- Loads environment variables with `vlucas/phpdotenv` and provisions a shared PDO instance via FlightPHP.
- Implements DAO classes (`UserDao`, `TeamDao`, `CompanyDao`, `ReportDao`, `PickupDao`) with reusable CRUD helpers.
- Exposes REST endpoints under `/api/*` for the five entities, each supporting `GET`, `POST`, `PUT/PATCH`, and `DELETE`.
- Adds `docs/schema.sql`, which creates the MySQL schema for Users, Teams, Companies, Reports, Pickups, and Team Applications.

## What’s Next

1. Seed development data and connect the frontend to the new API via AJAX.
2. Layer basic validation/authentication, then expand into JWT-based auth per the project brief.
3. Implement services/tests to cover business rules and DAO interactions.
