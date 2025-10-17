# ReportApp25

ReportApp25 is a single-page operations dashboard that will help regional managers coordinate electronics donation pickups across Canada. The backend will be powered by FlightPHP and MySQL, while the frontend uses vanilla JavaScript, Bootstrap 5, and Chart.js.

This repository tracks Milestone 1 of the project plan: establishing the structure, producing a static SPA prototype, and outlining the relational model.

## Repository Layout

```
ReportApp25/
├─ backend/
│  ├─ public/index.php        # FlightPHP entry point
│  ├─ routes/                 # REST route definitions
│  ├─ services/               # Business logic layer (placeholder)
│  ├─ dao/                    # PDO-based data access classes (placeholder)
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
│  └─ ERD.md                  # Draft entity relationship diagram (Mermaid)
└─ scripts/                   # Reserved for tooling helpers
```

## Frontend Prototype (Milestone 1)

- Implements SPA navigation that fetches view fragments without full reloads.
- Provides static pages for Dashboard, Reports, Teams, Pickups, Applications, Profile, Login, Register, Recover, Privacy, and Terms.
- Demonstrates responsive design with Bootstrap 5 and a custom theme.
- Visualizes placeholder metrics using Chart.js.
- Includes mock data that reflects the planned entities and roles (Manager, Team Lead).

## Backend Scaffold (Milestone 1)

- Bootstraps FlightPHP with a `/health` endpoint and configuration container.
- Defines the directory structure for upcoming services, DAOs, and tests.
- Supplies `.env.example` to guide environment setup (MySQL + JWT secret).
- Declares composer dependencies (`mikecao/flight`, `firebase/php-jwt`, `vlucas/phpdotenv`, `phpunit/phpunit`).

## Database Planning

The application will manage at least five entities: Users, Teams, Companies, Reports, Pickups, and Team Applications. Relationships and attributes are documented in `docs/ERD.md` via a Mermaid ER diagram.

## Next Steps

1. Run `composer install` inside `backend/` once PHP tooling is available.
2. Provision a MySQL database matching the ERD and create PDO-powered DAO classes.
3. Replace frontend mock data with live AJAX calls to the FlightPHP REST API.
4. Implement JWT-based authentication with role-specific authorization guards.
