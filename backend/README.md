# ReportApp25 Backend

This folder contains the FlightPHP REST API that powers the ReportApp25 single-page application. Milestone 4 adds authentication, JWT middleware, and role-aware guards on top of the CRUD endpoints.

## Layout

- `public/index.php` – Boots Flight, registers routes, and will expose REST endpoints.
- `routes/` – Route definitions grouped by feature.
- `services/` – Business logic layers that coordinate DAOs and perform validation.
- `dao/` – DAO classes that wrap PDO queries for MySQL.
- `config/` – Bootstrap configuration, environment loading, and shared settings.
- `views/` – Presentation templates served by Flight (home + Swagger UI).
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

## Features (Milestone 4)

- Services with validation for Users, Teams, Companies, Reports, Pickups, and Team Applications.
- JWT authentication with `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, and middleware helpers (`requireAuth`, `requireRole`).
- Role-based CRUD: managers can create/update/delete; authenticated users can read.
- Presentation layer at `/` (endpoint summary) and `/docs` (Swagger UI fed by `docs/openapi.yaml`).
- OpenAPI 3.0 spec located at `../docs/openapi.yaml`; also served at `/docs/openapi.yaml`.

JSON request bodies are required for write operations. Validation errors and missing resources return structured JSON messages; unauthorized/forbidden access yields 401/403 responses.
