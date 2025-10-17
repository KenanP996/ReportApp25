# ReportApp25 Backend

This folder contains the FlightPHP REST API that will power the ReportApp25 single-page application. Milestone 1 focuses on laying out the project structure and providing a working entry point.

## Layout

- `public/index.php` – Boots Flight, registers routes, and will expose REST endpoints.
- `routes/` – Route definitions grouped by feature (auth, reports, teams, etc.).
- `services/` – Business logic layers that coordinate DAOs and other helpers.
- `dao/` – DAO classes that wrap PDO queries for MySQL.
- `config/` – Bootstrap configuration, environment loading, and shared settings.
- `src/` – PHP classes namespaced under `ReportApp25\\`.
- `tests/` – PHP Unit tests to be added in later milestones.

## Next Steps

1. Run `composer install` from this directory to pull in FlightPHP and related dependencies.
2. Copy `.env.example` to `.env` and fill in database credentials.
3. Implement database migrations and DAO classes once the schema is finalized.
