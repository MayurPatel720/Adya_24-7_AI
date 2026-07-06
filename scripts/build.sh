#!/bin/bash
# Build script for Render — installs OpenClaw + Next.js dependencies

set -e

echo "========================================="
echo "  ADYAWEAR 24-7 AI — BUILD"
echo "========================================="

# Install Node.js dependencies
echo "[1/3] Installing Node.js dependencies..."
npm install

# Build Next.js
echo "[2/3] Building Next.js..."
npx next build

# Install OpenClaw globally
echo "[3/3] Installing OpenClaw..."
npm install -g openclaw 2>/dev/null || curl -fsSL https://docs.openclaw.ai/install.sh | sh 2>/dev/null || echo "OpenClaw install via npm/curl — will use local fallback"

echo "========================================="
echo "  BUILD COMPLETE"
echo "========================================="
