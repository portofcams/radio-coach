#!/bin/bash
set -e
SERVER="root@144.202.116.229"
APP="radio-coach"
PORT=8012

npm run build

docker build -t $APP .

echo "Saving and shipping image to Vultr..."
docker save $APP | gzip | ssh $SERVER "docker load"

echo "Starting container on Vultr..."
ssh $SERVER "
  docker stop $APP 2>/dev/null || true
  docker rm $APP 2>/dev/null || true
  docker run -d --name $APP --restart unless-stopped \
    -p $PORT:$PORT \
    -e ANTHROPIC_API_KEY='$(grep ^ANTHROPIC_API_KEY /Users/johnthomasair/code/radio-coach/.env | cut -d= -f2-)' \
    -e ELEVENLABS_API_KEY='$(grep ^ELEVENLABS_API_KEY /Users/johnthomasair/code/radio-coach/.env | cut -d= -f2-)' \
    -e ELEVENLABS_VOICE_ID='$(grep ^ELEVENLABS_VOICE_ID /Users/johnthomasair/code/radio-coach/.env | cut -d= -f2-)' \
    $APP
  docker ps | grep $APP
"
echo "Done — radiocoach.binnacleai.com should be live after Nginx proxy is set."
