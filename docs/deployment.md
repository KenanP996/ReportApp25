# Deployment Guide (project.noxfleet.org)

## Prerequisites

- Docker and Docker Compose installed on the VM (10.10.10.18).
- Cloudflare DNS access for `noxfleet.org`.
- Clone of this repository on the VM.

## Environment Setup

1) Backend environment:
   ```bash
   cd backend
   cp .env.docker.example .env
   # edit .env: set DB creds, JWT_SECRET (long random), and JWT_ISSUER if desired
   ```

2) Frontend API base:
   - This repo is set to `API_BASE = "https://project.noxfleet.org"` in `frontend/services/api.js`. Change if you host under a different domain.

## Running with Docker Compose

```bash
docker-compose up --build -d
# services:
# - db (MySQL)       -> 3307 on host
# - backend (PHP)    -> internal (via proxy)
# - frontend (Nginx) -> internal (via proxy)
# - proxy (Nginx)    -> 80 on host
```

Load the schema into MySQL:
```bash
docker exec -i reportapp25-db-1 mysql -ureportapp_user -pYOUR_DB_PASS reportapp25 < docs/schema.sql
```

Seed a manager (for admin access):
```bash
# inside backend container or host with PHP CLI and env vars loaded
php scripts/seed-manager.php admin@noxfleet.org 'ChangeMe123!' "Admin User"
```

## Reverse Proxy with Nginx (example)

Point Cloudflare DNS A/AAAA for `project.noxfleet.org` to 77.239.7.26. The compose proxy already listens on port 80 and routes to frontend/backend. If you prefer host-level Nginx, use the example below instead of the proxy service.

```
server {
    listen 80;
    server_name project.noxfleet.org;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8080/docs;
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://127.0.0.1:8080/health;
        proxy_set_header Host $host;
    }
}
```

Reload Nginx, then set Cloudflare SSL mode to “Full” (if you add TLS) and enable proxying if desired.

If you terminate TLS locally, issue a cert (e.g., Certbot) and enable the HTTPS server block or the redirect in the example above. With Cloudflare proxy (orange cloud), keep origin HTTPS working (Full/Strict) to avoid downgrade.

## Using the helper script

`./scripts/deploy.sh up`    # build and start (uses docker-compose + docker-compose.prod.yml if present)  
`./scripts/deploy.sh down`  # stop stack  
`./scripts/deploy.sh logs`  # tail logs

## Verification Checklist

- http://project.noxfleet.org/ serves the SPA (proxy to frontend:5173).
- http://project.noxfleet.org/api/health returns JSON ok (proxy to backend:8080).
- Swagger at http://project.noxfleet.org/docs loads.
- Registration/login works; manager role can reach Admin tab.

## Notes

- Keep JWT_SECRET and DB passwords out of git; use `.env` files or secrets manager.
- For production, add HTTPS termination (Let’s Encrypt/Certbot or Cloudflare SSL), rate limiting, and backups for the MySQL volume.
