#!/usr/bin/env bash
# Build locally and ship the standalone bundle to the server.
# Usage (from the project root, Git Bash / Linux / macOS):
#   SSH_KEY=../bekpro.pem SSH_HOST=ubuntu@ec2-34-224-101-109.compute-1.amazonaws.com ./deploy/deploy.sh
#
# Requires .env.local with real values (NEXT_PUBLIC_* are baked in at build time)
# and a server-side /opt/aqilbek/.env with the server secrets (see README).
set -euo pipefail

: "${SSH_KEY:?Set SSH_KEY to the .pem path}"
: "${SSH_HOST:?Set SSH_HOST, e.g. ubuntu@1.2.3.4}"
APP_DIR=/opt/aqilbek
PORT=3100
SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new"

echo "▶ Building…"
npm run build

echo "▶ Packing standalone bundle…"
rm -rf .deploy && mkdir -p .deploy/app
cp -r .next/standalone/. .deploy/app/
mkdir -p .deploy/app/.next
cp -r .next/static .deploy/app/.next/static
cp -r public .deploy/app/public
rm -f .deploy/app/.env* # secrets live only in $APP_DIR/.env on the server
tar -czf .deploy/aqilbek.tgz -C .deploy/app .

echo "▶ Uploading…"
scp -i "$SSH_KEY" .deploy/aqilbek.tgz "$SSH_HOST:/tmp/aqilbek.tgz"

echo "▶ Releasing…"
$SSH "$SSH_HOST" bash -s <<EOF
set -euo pipefail
sudo mkdir -p $APP_DIR/releases
REL=$APP_DIR/releases/\$(date +%Y%m%d%H%M%S)
sudo mkdir -p \$REL
sudo tar -xzf /tmp/aqilbek.tgz -C \$REL
sudo ln -sfn \$REL $APP_DIR/current
sudo docker rm -f aqilbek >/dev/null 2>&1 || true
sudo docker run -d --name aqilbek --restart unless-stopped \
  --memory 450m \
  -p 127.0.0.1:$PORT:3000 \
  --env-file $APP_DIR/.env \
  -e NODE_ENV=production -e PORT=3000 -e HOSTNAME=0.0.0.0 \
  -v \$REL:/app:ro -w /app \
  node:22-alpine node server.js
# keep the 3 newest releases
ls -1dt $APP_DIR/releases/* | tail -n +4 | xargs -r sudo rm -rf
sleep 4
curl -fsS -o /dev/null -w "health: %{http_code}\n" http://127.0.0.1:$PORT/ || (sudo docker logs --tail 50 aqilbek; exit 1)
EOF

echo "✅ Deployed."
