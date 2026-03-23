#!/usr/bin/env bash
set -euo pipefail

# Deploy static build and optional proxy to DreamHost via rsync/ssh.
# Environment variables required (examples):
#   DREAMHOST_USER="spweather"
#   DREAMHOST_HOST="shorepound.net"
#   DREAMHOST_STATIC_PATH="/home/spweather/weather.shorepound.net"
#   DREAMHOST_PROXY_PATH (optional remote path for proxy app)

if [ -z "${DREAMHOST_USER-}" ] || [ -z "${DREAMHOST_HOST-}" ] || [ -z "${DREAMHOST_STATIC_PATH-}" ]; then
  echo "Please set DREAMHOST_USER, DREAMHOST_HOST, and DREAMHOST_STATIC_PATH"
  echo "Optional: DREAMHOST_PROXY_PATH to deploy proxy app"
  exit 1
fi

echo "Building frontend..."
npm install
npm run build

LOCAL_DIST="dist/spweather-app/"

echo "Uploading static site to ${DREAMHOST_USER}@${DREAMHOST_HOST}:${DREAMHOST_STATIC_PATH}"
rsync -avz --delete "$LOCAL_DIST" "${DREAMHOST_USER}@${DREAMHOST_HOST}:${DREAMHOST_STATIC_PATH}"

if [ -n "${DREAMHOST_PROXY_PATH-}" ]; then
  echo "Uploading proxy to ${DREAMHOST_USER}@${DREAMHOST_HOST}:${DREAMHOST_PROXY_PATH}"
  rsync -avz --delete proxy/ "${DREAMHOST_USER}@${DREAMHOST_HOST}:${DREAMHOST_PROXY_PATH}"
  echo "Installing proxy dependencies on remote..."
  ssh "${DREAMHOST_USER}@${DREAMHOST_HOST}" "cd ${DREAMHOST_PROXY_PATH} && npm install --production"
  echo "Proxy uploaded. Restart Passenger from DreamHost panel or touch tmp/restart.txt if configured."
fi

echo "Deployment complete. Visit your site to verify: https://${DREAMHOST_HOST}/"
