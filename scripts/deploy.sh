#!/usr/bin/env bash
set -euo pipefail

# Basic deployment helper for local/prod compose
# Usage:
#   ./scripts/deploy.sh up      # build and start
#   ./scripts/deploy.sh down    # stop and remove
#   ./scripts/deploy.sh logs    # tail logs

CMD="${1:-up}"
COMPOSE_FILES="-f docker-compose.yml"

if [ -f "docker-compose.prod.yml" ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.prod.yml"
fi

case "$CMD" in
  up)
    docker compose $COMPOSE_FILES up --build -d
    ;;
  down)
    docker compose $COMPOSE_FILES down
    ;;
  logs)
    docker compose $COMPOSE_FILES logs -f
    ;;
  *)
    echo "Unknown command: $CMD"
    echo "Usage: $0 [up|down|logs]"
    exit 1
    ;;
esac
