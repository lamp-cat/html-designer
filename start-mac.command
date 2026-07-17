#!/bin/bash

cd "$(dirname "$0")" || exit 1

export PORT="${PORT:-4175}"
URL="http://localhost:${PORT}/"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "[HTML Designer] Node.js was not found."
  echo "Please install Node.js 18 or later, then double-click this file again."
  echo "Download: https://nodejs.org/"
  echo ""
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi

echo ""
echo "[HTML Designer] Starting local server..."
echo "[HTML Designer] URL: ${URL}"
echo "[HTML Designer] Close this window to stop the server."
echo ""

(sleep 2 && open "${URL}") &
node server.js

echo ""
echo "[HTML Designer] Server stopped."
read -n 1 -s -r -p "Press any key to close..."
