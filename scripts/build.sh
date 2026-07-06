#!/bin/bash
set -e

echo "=== ADYAWEAR AI — Build ==="

# Create data directory
mkdir -p data

# Install dependencies
npm install

# Build Next.js
npm run build

echo "=== Build complete ==="
