import { Telegraf, session } from 'telegraf';
import ConfigurationManager from '../utils/config_manager.js';
import Logger from '../utils/logger.js';
import { registerCommands } from './commands_handler.js';

const telegramConfig = ConfigurationManager.getTelegramConfig;

/**
 * Initialize and configure the Telegram bot.
 * @returns {Telegraf} The configured Telegraf instance.
 */
export function initBot() {
    // Create a new bot instance
    const bot = new Telegraf(telegramConfig.token);

    // Use session middleware
    bot.use(session());

    // Log all updates
    bot.use(async (ctx, next) => {
        const start = new Date();
        await next();
        const ms = new Date() - start;
        
        const username = ctx.from?.username || 'unknown';
        const chatType = ctx.chat?.type || 'unknown';
        const chatId = ctx.chat?.id || 'unknown';
        
        Logger.debug(`[${username}] ${chatType}:${chatId} - ${ms}ms`);
    });

    // Register commands
    registerCommands(bot);

    // Handle errors
    bot.catch((err, ctx) => {
        Logger.error(`Error for ${ctx.updateType}: ${err}`);
    });

    return bot;
}

/**
 * Start the Telegram bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export async function startBot(bot) {
    try {
        await bot.launch();
        Logger.info('Bot started successfully');
        
        // Enable graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
    } catch (error) {
        Logger.error(`Failed to start bot: ${error.message}`);
        throw error;
    }
} 