#!/bin/bash
set -e
SERVER="root@144.202.116.229"
APP="radio-coach"
PORT=8012

# Read env values
ANTHROPIC_KEY=$(grep ^ANTHROPIC_API_KEY .env | cut -d= -f2-)
ELEVENLABS_KEY=$(grep ^ELEVENLABS_API_KEY .env | cut -d= -f2-)
ELEVENLABS_VOICE=$(grep ^ELEVENLABS_VOICE_ID .env | cut -d= -f2-)
JWT_SECRET=$(grep ^JWT_SECRET .env | cut -d= -f2-)

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

echo "Updating server env file..."
ssh $SERVER "cat > /root/radio-coach.env << EOF
ANTHROPIC_API_KEY=$ANTHROPIC_KEY
ELEVENLABS_API_KEY=$ELEVENLABS_KEY
ELEVENLABS_VOICE_ID=$ELEVENLABS_VOICE
DATABASE_URL=postgresql://radiocoach:RadioCoach2026!@127.0.0.1:5433/radiocoach
JWT_SECRET=$JWT_SECRET
PORT=$PORT
HOSTNAME=0.0.0.0
EOF"

echo "Building and restarting container on Vultr..."
ssh $SERVER "
  cd /root/radio-coach
  docker build -t $APP .
  docker stop $APP 2>/dev/null || true
  docker rm $APP 2>/dev/null || true
  docker run -d --name $APP --restart unless-stopped \
    --network host \
    --env-file /root/radio-coach.env \
    $APP
  docker ps | grep $APP
"
echo "Done — https://radiocoach.binnacleai.com"
