#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Vinted Telegram Bot...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file with the required environment variables.${NC}"
    exit 1
fi

# Check if TELEGRAM_BOT_TOKEN is set in .env
if ! grep -q "TELEGRAM_BOT_TOKEN=" .env || grep -q "TELEGRAM_BOT_TOKEN=\"YOUR_TELEGRAM_BOT_TOKEN\"" .env; then
    echo -e "${RED}Error: TELEGRAM_BOT_TOKEN not set in .env file!${NC}"
    echo -e "${YELLOW}Please set your Telegram bot token in the .env file.${NC}"
    exit 1
fi

# Check if MongoDB is running
echo -e "${YELLOW}Checking MongoDB connection...${NC}"
if ! nc -z localhost 27017; then
    echo -e "${RED}Error: MongoDB is not running!${NC}"
    echo -e "${YELLOW}Please start MongoDB before running the bot.${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Start the bot
echo -e "${GREEN}Starting bot...${NC}"
npm start 