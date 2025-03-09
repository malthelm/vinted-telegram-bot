import crud from '../../crud.js';
import Logger from '../../utils/logger.js';
import { ObjectId } from 'mongoose';

/**
 * Register the stop command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    bot.command('stop', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Get the monitor ID from the command arguments
            const args = ctx.message.text.split(' ').slice(1);
            const monitorId = args[0];
            
            if (!monitorId) {
                await ctx.reply(
                    '⚠️ Please provide a monitor ID.\n\n' +
                    'Example: /stop 60f1a2b3c4d5e6f7g8h9i0j1\n\n' +
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
                await ctx.reply('⚠️ You do not have permission to stop this monitor.');
                return;
            }
            
            // Get the monitor
            const monitor = await crud.getMonitorById(monitorId);
            if (!monitor) {
                await ctx.reply('⚠️ Monitor not found.');
                return;
            }
            
            // Delete the monitor
            const success = await crud.deleteMonitor(monitorId);
            
            if (success) {
                await ctx.reply(
                    `✅ Monitor "${monitor.name}" has been stopped and deleted.`
                );
                Logger.info(`User ${telegramId} deleted monitor ${monitorId}`);
            } else {
                await ctx.reply('❌ Failed to stop the monitor. Please try again later.');
                Logger.error(`Failed to delete monitor ${monitorId} for user ${telegramId}`);
            }
        } catch (error) {
            Logger.error(`Error in stop command: ${error.message}`);
            await ctx.reply('An error occurred while stopping the monitor. Please try again later.');
        }
    });
} 