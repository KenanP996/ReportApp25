# ReportApp25 Frontend

This directory hosts the static single-page application for Milestone 1. The UI is powered by vanilla JavaScript, Bootstrap 5, and Chart.js. Navigating between sections fetches HTML fragments from `views/` and injects them into `index.html` without reloading the page.

## Structure

- `index.html` – Loads global CSS/JS once and hosts the layout shell (navbar, footer, content region).
- `css/styles.css` – Custom theming layered on top of Bootstrap utilities.
- `js/app.js` – Simple router that loads view fragments, binds UI events, and renders mock data.
- `views/*.html` – Feature-specific templates (Dashboard, Reports, Teams, Pickups, Applications, Profile, Auth, Legal).
- `assets/` – Static assets such as the logo.

## Local Preview

Because everything is static, you can open `index.html` directly in a browser or serve it through a development server (e.g., `php -S localhost:5173 -t frontend`).
