#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

echo "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$KEY" > "$ENV_FILE"
