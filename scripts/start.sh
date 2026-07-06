#!/bin/bash
# Start script — runs OpenClaw Gateway + Next.js server together

set -e

echo "========================================="
echo "  ADYAWEAR 24-7 AI — STARTING"
echo "========================================="

# Create OpenClaw config directory
mkdir -p ~/.openclaw

# Write OpenClaw config from env vars
if [ -n "$XIAOMI_API_KEY" ]; then
  echo "[1/4] Configuring OpenClaw with MiMo..."
  cat > ~/.openclaw/openclaw.json << EOF
{
  "env": {
    "XIAOMI_API_KEY": "${XIAOMI_API_KEY}"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "xiaomi/mimo-v2-flash"
      }
    }
  },
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["${WHATSAPP_SENDER_PHONE:-}"]
    }
  },
  "gateway": {
    "port": ${OPENCLAW_PORT:-3001},
    "mode": "local",
    "bind": "all",
    "auth": {
      "mode": "token",
      "token": "${OPENCLAW_GATEWAY_TOKEN:-adyawear-openclaw-token}"
    }
  }
}
EOF
  echo "  Config written to ~/.openclaw/openclaw.json"
else
  echo "[1/4] XIAOMI_API_KEY not set — OpenClaw will run without AI"
fi

# Start OpenClaw gateway in background
echo "[2/4] Starting OpenClaw Gateway on port ${OPENCLAW_PORT:-3001}..."
if command -v openclaw &> /dev/null; then
  openclaw gateway run &
  OPENCLAW_PID=$!
  echo "  OpenClaw started (PID: $OPENCLAW_PID)"
else
  echo "  WARNING: openclaw not found in PATH — gateway will not start"
  echo "  Bridge service will run standalone (no WhatsApp AI chat)"
fi

# Wait for OpenClaw to start
sleep 3

# Start Next.js server
echo "[3/4] Starting Next.js server on port ${PORT:-3000}..."
echo "[4/4] All services started!"
echo "========================================="
echo "  Bridge: http://localhost:${PORT:-3000}"
echo "  OpenClaw: http://localhost:${OPENCLAW_PORT:-3001}"
echo "========================================="

exec npm start
