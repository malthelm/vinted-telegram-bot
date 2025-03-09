# Vinted Telegram Bot Deployment Guide

This guide provides instructions for deploying the Vinted Telegram Bot to a production environment.

## Prerequisites

- A server with Docker and Docker Compose installed
- A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- (Optional) Webshare.io API key for proxy support

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vinted-telegram-bot.git
cd vinted-telegram-bot
```

### 2. Configure Environment Variables

Create a production environment file:

```bash
cp .env.prod.example .env.prod
```

Edit the `.env.prod` file and set the following variables:

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `MONGO_USERNAME`: Username for MongoDB (choose a secure username)
- `MONGO_PASSWORD`: Password for MongoDB (choose a secure password)
- `MONGO_EXPRESS_USERNAME`: Username for MongoDB Express admin interface
- `MONGO_EXPRESS_PASSWORD`: Password for MongoDB Express admin interface
- `ADMIN_USER_IDS`: Your Telegram user ID (to access admin commands)
- Other settings as needed

### 3. Build and Start the Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will:
- Build the Docker image for the bot
- Start the MongoDB database
- Start the MongoDB Express admin interface
- Start the bot

### 4. Verify Deployment

Check if all services are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Check the logs:

```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

### 5. Access MongoDB Express

You can access the MongoDB Express admin interface at:

```
http://your-server-ip:8081
```

Use the credentials you set in the `.env.prod` file.

## Maintenance

### Updating the Bot

To update the bot to the latest version:

```bash
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Backing Up the Database

To back up the MongoDB database:

```bash
docker-compose -f docker-compose.prod.yml exec mongo mongodump --username $MONGO_USERNAME --password $MONGO_PASSWORD --authenticationDatabase admin --db vinted-telegram-bot --out /data/db/backup
```

Then copy the backup files from the container:

```bash
docker cp $(docker-compose -f docker-compose.prod.yml ps -q mongo):/data/db/backup ./backup
```

### Restoring the Database

To restore the MongoDB database from a backup:

```bash
docker cp ./backup $(docker-compose -f docker-compose.prod.yml ps -q mongo):/data/db/
docker-compose -f docker-compose.prod.yml exec mongo mongorestore --username $MONGO_USERNAME --password $MONGO_PASSWORD --authenticationDatabase admin --db vinted-telegram-bot /data/db/backup/vinted-telegram-bot
```

## Troubleshooting

### Bot Not Responding

Check the logs:

```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

Restart the bot:

```bash
docker-compose -f docker-compose.prod.yml restart app
```

### MongoDB Connection Issues

Check if MongoDB is running:

```bash
docker-compose -f docker-compose.prod.yml ps mongo
```

Check MongoDB logs:

```bash
docker-compose -f docker-compose.prod.yml logs -f mongo
```

### Proxy Issues

If you're using Webshare.io and experiencing proxy issues:

1. Check if your API key is valid
2. Check if you have available proxies in your account
3. Try setting `USE_WEBSHARE=0` and providing your own proxies in a `proxies.txt` file

## Security Considerations

- Keep your `.env.prod` file secure and never commit it to version control
- Use strong passwords for MongoDB and MongoDB Express
- Consider using a reverse proxy (like Nginx) with HTTPS for MongoDB Express
- Regularly update the bot and all dependencies
- Monitor the server for suspicious activities 