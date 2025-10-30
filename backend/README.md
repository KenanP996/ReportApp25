# ReportApp25 Backend

This folder contains the FlightPHP REST API that powers the ReportApp25 single-page application. Milestone 2 introduces the MySQL-backed DAO layer and CRUD endpoints for the five core entities.

## Layout

- `public/index.php` – Boots Flight, registers routes, and will expose REST endpoints.
- `routes/` – Route definitions grouped by feature (auth, reports, teams, etc.).
- `services/` – Business logic layers that coordinate DAOs and other helpers.
- `dao/` – DAO classes that wrap PDO queries for MySQL.
- `config/` – Bootstrap configuration, environment loading, and shared settings.
- `src/` – PHP classes namespaced under `ReportApp25\\`.
- `tests/` – PHP Unit tests to be added in later milestones.

## Setup

1. Install dependencies:

   ```bash
   composer install
   ```

2. Copy `.env.example` to `.env` and update the connection details to point at your MySQL instance.

3. Provision the schema by running the statements in `../docs/schema.sql`.

4. Launch a PHP development server (or wire this entry point into Apache/Nginx):

   ```bash
   php -S localhost:8080 -t public
   ```

## Available Endpoints

The `/api` namespace now exposes CRUD operations for five entities. Each resource supports `GET`, `POST`, `PUT/PATCH`, and `DELETE`.

- `GET /api/users`
- `GET /api/teams`
- `GET /api/companies`
- `GET /api/reports`
- `GET /api/pickups`

The POST/PUT/PATCH payload shapes align with the columns defined in `docs/schema.sql`. JSON request bodies are required; validation errors and missing resources return structured JSON messages.
