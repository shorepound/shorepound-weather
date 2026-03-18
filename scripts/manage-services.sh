#!/usr/bin/env bash
set -euo pipefail

# Manage local development services for this project.
# Usage: ./scripts/manage-services.sh {start|stop|restart|status}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS_FILE="$ROOT/.service_pids"

stop_services() {
  echo "Stopping dev services..."

  # Kill any process listening on the default dev port (4200) owned by this user
  PORT_PIDS=$(lsof -ti tcp:4200 -sTCP:LISTEN -u "$USER" || true)
  if [ -n "$PORT_PIDS" ]; then
    echo "Killing processes on port 4200: $PORT_PIDS"
    kill $PORT_PIDS || true
  fi

  # Kill ng serve processes for this user
  NG_PIDS=$(pgrep -u "$USER" -f "ng serve" || true)
  if [ -n "$NG_PIDS" ]; then
    echo "Killing 'ng serve' pids: $NG_PIDS"
    kill $NG_PIDS || true
  fi

  # Kill any recorded background PIDs
  if [ -f "$PIDS_FILE" ]; then
    echo "Stopping recorded PIDs from $PIDS_FILE"
    while read -r pid; do
      if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo "Killing $pid"
        kill "$pid" || true
      fi
    done < "$PIDS_FILE" || true
    rm -f "$PIDS_FILE"
  fi

  echo "Stopped."
}

start_services() {
  echo "Starting dev services..."
  # Start the Angular dev server in background and record its PID
  (cd "$ROOT" && nohup npm start >/dev/null 2>&1 & echo $! > "$PIDS_FILE")
  sleep 1
  if [ -f "$PIDS_FILE" ]; then
    PID=$(cat "$PIDS_FILE")
    echo "Started npm start (PID $PID)."
  else
    echo "Failed to start npm start. Check logs." >&2
    exit 1
  fi
}

status_services() {
  echo "Service status:"
  if [ -f "$PIDS_FILE" ]; then
    while read -r pid; do
      if kill -0 "$pid" 2>/dev/null; then
        echo "PID $pid running"
      else
        echo "PID $pid not running"
      fi
    done < "$PIDS_FILE"
  else
    echo "No recorded PIDs ($PIDS_FILE)."
  fi

  PORT_PIDS=$(lsof -ti tcp:4200 -sTCP:LISTEN -u "$USER" || true)
  if [ -n "$PORT_PIDS" ]; then
    echo "Port 4200 listening by: $PORT_PIDS"
  fi
}

case "${1-}" in
  stop) stop_services ;;
  start) start_services ;;
  restart) stop_services; start_services ;;
  status) status_services ;;
  *) echo "Usage: $0 {start|stop|restart|status}"; exit 1 ;;
esac
