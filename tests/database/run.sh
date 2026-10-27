#!/usr/bin/env bash
# Starts and removes only its own temporary container; never connects to a project DB.
set -euo pipefail
cd "$(dirname "$0")/../.."
test_container="ellison-policy-test-$$"
cleanup() { docker rm -f "$test_container" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker run -d --name "$test_container" -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine >/dev/null
for attempt in {1..30}; do
  if docker exec "$test_container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec -i "$test_container" psql -U postgres -v ON_ERROR_STOP=1 < tests/database/bootstrap.sql
for migration in supabase/migrations/*.sql; do
  docker exec -i "$test_container" psql -U postgres -v ON_ERROR_STOP=1 < "$migration"
done
docker exec -i "$test_container" psql -U postgres -v ON_ERROR_STOP=1 < tests/database/permissions.sql

docker exec -i "$test_container" psql -U postgres -v ON_ERROR_STOP=1 < tests/database/foundation.sql

docker exec -i "$test_container" psql -U postgres -v ON_ERROR_STOP=1 < tests/database/audit.sql
