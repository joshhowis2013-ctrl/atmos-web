#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required."
  echo "On Ubuntu/Debian, install them with:"
  echo "  sudo apt update && sudo apt install nodejs npm"
  exit 1
fi

echo "Installing Atmos Web dependencies..."
npm install

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example."
else
  echo "Keeping existing .env."
fi

echo
echo "Setup complete. Start Atmos Web with:"
echo "  npm start"
echo
echo "Then open http://localhost:3000"
