#!/bin/bash

# CYRUS.PRO - n8n Automation Starter
# This script handles Docker initialization and public HTTPS tunneling 
# for environments without a dedicated domain name.

echo "🚀 Initializing CYRUS n8n Production-Lite Stack..."

# 1. Start Docker Stack (n8n + Postgres)
docker-compose -f infrastructure/docker-compose-n8n.yml up -d

echo "✅ Docker Services are running in the background."
echo "🔗 Creating a secure HTTPS tunnel via Cloudflare..."

# 2. Start Cloudflare Quick Tunnel
# We use 'npx' to run cloudflared without requiring global install
npx -y @cloudflare/cloudflared tunnel --url http://localhost:5678 
