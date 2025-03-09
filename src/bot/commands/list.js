import crud from '../../crud.js';
import Logger from '../../utils/logger.js';

/**
 * Register the list command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    bot.command('list', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Get the user
            const user = await crud.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.reply('⚠️ You need to start the bot first. Use /start command.');
                return;
            }
            
            // Get all monitors for the user
            const monitors = await crud.getMonitorsByUserId(user._id);
            
            if (monitors.length === 0) {
                await ctx.reply(
                    '📋 You have no active monitors.\n\n' +
                    'Use /monitor command to create a new monitor.'
                );
                return;
            }
            
            // Format the monitors list
            let message = '📋 *Your Active Monitors*\n\n';
            
            monitors.forEach((monitor, index) => {
                message += `*${index + 1}. ${monitor.name}*\n`;
                message += `ID: \`${monitor._id}\`\n`;
                message += `URL: ${monitor.url.substring(0, 50)}${monitor.url.length > 50 ? '...' : ''}\n`;
                message += `Active: ${monitor.active ? '✅' : '❌'}\n`;
                
                if (monitor.bannedKeywords && monitor.bannedKeywords.length > 0) {
                    message += `Banned Keywords: ${monitor.bannedKeywords.join(', ')}\n`;
                }
                
                message += `Created: ${monitor.createdAt.toLocaleDateString()}\n\n`;
            });
            
            message += 'To stop a monitor, use `/stop <monitor_id>`\n';
            message += 'To add keyword filters, use `/filter <monitor_id> <keywords>`';
            
            await ctx.reply(message, { parse_mode: 'Markdown' });
            Logger.info(`User ${telegramId} listed ${monitors.length} monitors`);
        } catch (error) {
            Logger.error(`Error in list command: ${error.message}`);
            await ctx.reply('An error occurred while listing monitors. Please try again later.');
        }
    });
} 