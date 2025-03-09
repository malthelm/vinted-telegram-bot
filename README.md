# Vinted Telegram Bot

A Telegram bot for monitoring Vinted listings and sending notifications when new items matching your search criteria are found.

![Vinted Telegram Bot](https://img.shields.io/badge/Vinted-Telegram%20Bot-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)
![License](https://img.shields.io/badge/License-ISC-blue)

## Features

- 🔍 Monitor Vinted listings based on search URLs
- 🔔 Receive notifications when new items are found
- 🚫 Filter items by keywords
- 👥 Support for multiple users and searches
- 🌐 Proxy support to avoid rate limiting
- 📊 Admin dashboard for monitoring system performance
- ⚡ Optimized with caching and database indexing

## Screenshots

*Add your screenshots here*

## Prerequisites

- Node.js 18 or higher
- MongoDB
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## Installation

### Standard Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vinted-telegram-bot.git
   cd vinted-telegram-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your configuration:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   MONGODB_URI=mongodb://localhost:27017/vinted-telegram-bot
   VINTED_API_DOMAIN_EXTENSION=fr
   ADMIN_USER_IDS=your_telegram_user_id
   ```

4. Start the bot:
   ```bash
   npm start
   ```

### Docker Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vinted-telegram-bot.git
   cd vinted-telegram-bot
   ```

2. Create a `.env` file in the root directory and add your configuration.

3. Build and start the Docker containers:
   ```bash
   docker-compose up -d
   ```

## Usage

1. Start a chat with your bot on Telegram.
2. Use the `/start` command to get started.
3. Use the `/help` command to see all available commands.
4. Use the `/monitor` command followed by a Vinted search URL to start monitoring.

## Available Commands

- `/start` - Start the bot
- `/help` - Show help message
- `/monitor <url>` - Start monitoring a Vinted search URL
- `/stop <id>` - Stop monitoring a specific search
- `/list` - List all your active monitors
- `/filter <id> <keywords>` - Add keyword filters to a monitor
- `/settings` - Change your preferences
- `/dashboard` - (Admin only) View system metrics and performance

## Admin Dashboard

Administrators can access the dashboard to monitor system performance:

- `/dashboard` - View system overview
- `/dashboard:api` - View API metrics
- `/dashboard:errors` - View error metrics
- `/dashboard:system` - View system metrics
- `/dashboard:cache` - Clear cache

## Performance Optimizations

The bot includes several performance optimizations:

- **Caching**: Reduces API calls by caching responses
- **Database Indexes**: Improves query performance
- **Connection Pooling**: Optimizes database connections
- **Concurrency Control**: Limits concurrent API requests to avoid rate limiting

## Proxy Support

The bot supports proxies to avoid rate limiting. You can use Webshare.io for proxy management or provide your own proxies in a `proxies.txt` file.

## Deployment

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Telegraf](https://github.com/telegraf/telegraf) - Modern Telegram Bot Framework for Node.js
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
- [Axios](https://axios-http.com/) - Promise based HTTP client for the browser and Node.js 