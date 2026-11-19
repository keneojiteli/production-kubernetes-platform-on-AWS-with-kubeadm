
#!/usr/bin/env bash
set -Eeuo pipefail

# Resolve the repository root regardless of where the script is called.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Location of the production Compose file in the repository.
COMPOSE_FILE="$REPO_ROOT/deploy/compose/docker-compose.prod.yml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

# Create an isolated directory for CI validation.
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

# Copy the Compose file, leaving the original unchanged.
cp "$COMPOSE_FILE" "$TEMP_DIR/docker-compose.prod.yml"

# Supply empty, non-secret environment files.
touch "$TEMP_DIR/backend.env"
touch "$TEMP_DIR/monitoring.env"

# placeholder image tags to satisfy compose variable interpolation.
export BACKEND_IMAGE_TAG="ci-validation"
export FRONT_IMAGE_TAG="ci-validation"
export RECEIVERS_IMAGE_TAG="ci-validation"

echo "Validating production Docker Compose configuration..."

docker compose \
  -f "$TEMP_DIR/docker-compose.prod.yml" \
  config --quiet

echo "Docker Compose validation passed."
