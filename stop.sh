#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Vinted Telegram Bot...${NC}"

# Find the process ID of the bot
PID=$(ps aux | grep "[n]ode --max-old-space-size=4096 main.js" | awk '{print $2}')

if [ -z "$PID" ]; then
    echo -e "${RED}Bot is not running!${NC}"
    exit 0
fi

# Kill the process
echo -e "${YELLOW}Killing process $PID...${NC}"
kill -9 $PID

# Check if the process was killed
if ps -p $PID > /dev/null; then
    echo -e "${RED}Failed to stop the bot!${NC}"
    exit 1
else
    echo -e "${GREEN}Bot stopped successfully!${NC}"
    exit 0
fi 