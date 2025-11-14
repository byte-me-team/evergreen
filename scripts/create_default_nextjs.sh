#!/bin/bash
set -e  # stop on error

PROJECT_NAME="hackathon_template"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="$SCRIPT_DIR/../$PROJECT_NAME"

# Create temp dir
mkdir -p "$TEMP_DIR"

# Create Next.js app
npx create-next-app@latest "$TEMP_DIR" --ts --tailwind --src-dir --app

# Copy all files to parent dir
cp -r "$TEMP_DIR"/. "$SCRIPT_DIR/../"

# Clean up
rm -rf "$TEMP_DIR"
