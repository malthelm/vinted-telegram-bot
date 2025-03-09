import crud from '../../crud.js';
import Logger from '../../utils/logger.js';

/**
 * Register the start command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    bot.start(async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            const username = ctx.from.username || '';
            const firstName = ctx.from.first_name || '';
            const lastName = ctx.from.last_name || '';
            
            // Check if user exists
            let user = await crud.getUserByTelegramId(telegramId);
            
            if (!user) {
                // Create new user
                user = await crud.createUser({
                    telegramId,
                    username,
                    firstName,
                    lastName
                });
                Logger.info(`New user registered: ${username} (${telegramId})`);
            } else {
                // Update user's last active timestamp
                await crud.updateUser(telegramId, { lastActive: new Date() });
                Logger.info(`Existing user started bot: ${username} (${telegramId})`);
            }
            
            // Send welcome message
            await ctx.reply(
                `👋 Welcome to Vinted Monitor Bot, ${firstName}!\n\n` +
                `This bot helps you monitor Vinted listings and notifies you when new items matching your search criteria are found.\n\n` +
                `Use /help to see all available commands.`
            );
        } catch (error) {
            Logger.error(`Error in start command: ${error.message}`);
            await ctx.reply('An error occurred while starting the bot. Please try again later.');
        }
    });
} 