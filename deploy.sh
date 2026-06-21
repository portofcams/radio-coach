#!/bin/bash
set -e
SERVER="root@144.202.116.229"
APP="radio-coach"
PORT=8012

echo "Building locally..."
npm run build

echo "Syncing build output to Vultr..."
ssh $SERVER "mkdir -p /root/radio-coach/.next"
rsync -az --delete \
  .next/standalone root@144.202.116.229:/root/radio-coach/.next/
rsync -az --delete \
  .next/static root@144.202.116.229:/root/radio-coach/.next/
rsync -az --delete \
  public/ root@144.202.116.229:/root/radio-coach/public/
rsync -az Dockerfile root@144.202.116.229:/root/radio-coach/

echo "Building and restarting container on Vultr..."
# The prod env (wilco Postgres on shared-db_default, Stripe live keys) lives in
# /root/wilco.env on the server — NOT in local .env. Refresh it from the running
# container so a redeploy never silently drops a key; fall back to the existing
# file if the container isn't up. The app talks to Postgres by the docker DNS
# name `shared-pg`, so it MUST run on the shared-db_default network with the
# port published — never --network host.
ssh $SERVER "
  set -e
  cd /root/radio-coach
  if docker inspect $APP >/dev/null 2>&1; then
    docker inspect $APP --format '{{range .Config.Env}}{{println .}}{{end}}' \
      | grep -E '^(ANTHROPIC_API_KEY|ELEVENLABS_API_KEY|ELEVENLABS_VOICE_ID|DATABASE_URL|JWT_SECRET|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_PRICE_SOLO_PILOT|STRIPE_PRICE_CFI_PRO|STRIPE_PRICE_FLIGHT_SCHOOL|CRON_SECRET|RESEND_API_KEY|WEEKLY_FROM|APP_URL|PORT|HOSTNAME)=' \
      > /root/wilco.env.new && mv /root/wilco.env.new /root/wilco.env
  fi
  test -s /root/wilco.env || { echo 'ERROR: /root/wilco.env missing and no running container to capture from'; exit 1; }
  docker build -t $APP .
  docker stop $APP 2>/dev/null || true
  docker rm $APP 2>/dev/null || true
  docker run -d --name $APP --restart unless-stopped \
    --network shared-db_default -p $PORT:$PORT \
    --env-file /root/wilco.env \
    $APP
  docker ps | grep $APP
"
echo "Done — https://wilco.binnacleai.com"
