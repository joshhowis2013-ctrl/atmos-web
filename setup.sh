#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  BLUE=$'\033[38;5;117m'
  CYAN=$'\033[36m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  RED=$'\033[31m'
  MUTED=$'\033[38;5;245m'
  BOLD=$'\033[1m'
  RESET=$'\033[0m'
else
  BLUE=""
  CYAN=""
  GREEN=""
  YELLOW=""
  RED=""
  MUTED=""
  BOLD=""
  RESET=""
fi

print_step() {
  printf "%s[ atmos ]%s %s\n" "$BLUE" "$RESET" "$1"
}

print_success() {
  printf "%s[  ok   ]%s %s\n" "$GREEN" "$RESET" "$1"
}

printf "\n"
printf "%s      +------+%s\n" "$BLUE" "$RESET"
printf "%s      |  +   |%s  %satmos%s %sWEB%s\n" "$BLUE" "$RESET" "$BOLD" "$RESET" "$CYAN" "$RESET"
printf "%s      +------+%s  %sWeather for the web.%s\n" "$BLUE" "$RESET" "$MUTED" "$RESET"
printf "\n"
printf "%s%sAtmos Web setup%s\n" "$BOLD" "$CYAN" "$RESET"
printf "%s--------------------------------%s\n\n" "$MUTED" "$RESET"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  printf "%s[ error ]%s Node.js and npm are required.\n" "$RED" "$RESET"
  printf "%sInstall them on Ubuntu/Debian with:%s\n" "$MUTED" "$RESET"
  printf "  sudo apt update && sudo apt install nodejs npm\n"
  exit 1
fi

print_step "Installing npm dependencies..."
npm install
print_success "Dependencies are ready."

if [[ ! -f .env ]]; then
  cp .env.example .env
  print_success "Created .env from .env.example."
else
  printf "%s[  keep  ]%s Existing .env preserved.\n" "$YELLOW" "$RESET"
fi

printf "\n%s%sSetup complete!%s\n" "$BOLD" "$GREEN" "$RESET"
printf "%sStart Atmos Web with:%s\n" "$MUTED" "$RESET"
printf "  %snpm start%s\n\n" "$CYAN" "$RESET"
printf "%sOpen:%s %shttp://localhost:3000%s\n\n" "$MUTED" "$RESET" "$CYAN" "$RESET"
