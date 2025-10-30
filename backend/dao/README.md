# Data Access Objects (DAO)

The DAO layer encapsulates all database access using PDO prepared statements. Each class maps to a concrete entity and extends `BaseDao`, which provides shared CRUD helpers (`all`, `find`, `create`, `update`, `delete`) plus hooks to transform payloads before saving or after fetching.

## Available DAO Classes

- `UserDao` – Manages `users` (email, password hash, role, team membership).
- `TeamDao` – Manages `teams` (name, region, manager assignment).
- `CompanyDao` – Manages `companies` (contact details, onboarding date).
- `ReportDao` – Manages `reports` and converts the JSON `item_breakdown` column to/from native arrays.
- `PickupDao` – Manages `pickups` (schedule window, status, linked reports).

Additional DAOs (e.g., `TeamApplicationDao`) can be added by extending `BaseDao` and declaring the `$table` plus any fillable columns.
