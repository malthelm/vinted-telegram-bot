import crud from '../../crud.js';
import Logger from '../../utils/logger.js';
import { ObjectId } from 'mongoose';

/**
 * Register the filter command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    bot.command('filter', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Get the command arguments
            const args = ctx.message.text.split(' ').slice(1);
            const monitorId = args[0];
            const keywords = args.slice(1).join(' ');
            
            if (!monitorId || !keywords) {
                await ctx.reply(
                    '⚠️ Please provide a monitor ID and keywords.\n\n' +
                    'Example: /filter 60f1a2b3c4d5e6f7g8h9i0j1 keyword1, keyword2, keyword3\n\n' +
                    'Use /list to see all your active monitors and their IDs.'
                );
                return;
            }
            
            // Validate the monitor ID format
            if (!ObjectId.isValid(monitorId)) {
                await ctx.reply('⚠️ Invalid monitor ID format.');
                return;
            }
            
            // Get the user
            const user = await crud.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.reply('⚠️ You need to start the bot first. Use /start command.');
                return;
            }
            
            // Check if the monitor belongs to the user
            if (!user.monitors.some(id => id.toString() === monitorId) && !user.isAdmin) {
                await ctx.reply('⚠️ You do not have permission to modify this monitor.');
                return;
            }
            
            // Get the monitor
            const monitor = await crud.getMonitorById(monitorId);
            if (!monitor) {
                await ctx.reply('⚠️ Monitor not found.');
                return;
            }
            
            // Parse the keywords
            const keywordArray = keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword !== '');
            
            if (keywordArray.length === 0) {
                await ctx.reply('⚠️ Please provide at least one valid keyword.');
                return;
            }
            
            // Update the monitor with the new banned keywords
            const updatedMonitor = await crud.updateMonitor(monitorId, {
                bannedKeywords: keywordArray
            });
            
            if (updatedMonitor) {
                await ctx.reply(
                    `✅ Keywords added to monitor "${updatedMonitor.name}".\n\n` +
                    `Banned Keywords: ${updatedMonitor.bannedKeywords.join(', ')}\n\n` +
                    `Items containing these keywords will be filtered out from the search results.`
                );
                Logger.info(`User ${telegramId} added keywords to monitor ${monitorId}: ${keywordArray.join(', ')}`);
            } else {
                await ctx.reply('❌ Failed to add keywords to the monitor. Please try again later.');
                Logger.error(`Failed to add keywords to monitor ${monitorId} for user ${telegramId}`);
            }
        } catch (error) {
            Logger.error(`Error in filter command: ${error.message}`);
            await ctx.reply('An error occurred while adding keywords. Please try again later.');
        }
    });
} 