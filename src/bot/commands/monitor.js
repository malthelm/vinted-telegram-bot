import crud from '../../crud.js';
import Logger from '../../utils/logger.js';

/**
 * Validate that the URL is a Vinted catalog URL with at least one query parameter.
 * @param {string} url - The URL to validate.
 * @returns {string|true} - Error message or true if valid.
 */
function validateUrl(url) {
    try {
        // Check if the URL is valid
        const urlObj = new URL(url);
        
        // Check if the URL is a Vinted catalog URL
        const route = urlObj.pathname.split('/').pop();
        if (route !== 'catalog') {
            return 'The URL must be a Vinted catalog URL (e.g., https://www.vinted.fr/catalog?...)';
        }
        
        // Check if the URL has at least one query parameter
        const searchParams = urlObj.searchParams;
        if (searchParams.toString().length === 0) {
            return 'The URL must have at least one search parameter';
        }
        
        // Check if there is at least a brand_ids[] or video_game_platform_ids[] query parameter
        if (!searchParams.has('brand_ids[]') && !searchParams.has('video_game_platform_ids[]')) {
            return 'The URL must have at least a brand_ids[] or video_game_platform_ids[] parameter';
        }
        
        return true;
    } catch (error) {
        return 'Invalid URL format';
    }
}

/**
 * Register the monitor command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    bot.command('monitor', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Get the URL from the command arguments
            const args = ctx.message.text.split(' ').slice(1);
            const url = args.join(' ');
            
            if (!url) {
                await ctx.reply(
                    '⚠️ Please provide a Vinted search URL.\n\n' +
                    'Example: /monitor https://www.vinted.fr/catalog?brand_ids[]=53&catalog[]=1904'
                );
                return;
            }
            
            // Validate the URL
            const urlValidation = validateUrl(url);
            if (urlValidation !== true) {
                await ctx.reply(`⚠️ ${urlValidation}`);
                return;
            }
            
            // Get the user
            const user = await crud.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.reply('⚠️ You need to start the bot first. Use /start command.');
                return;
            }
            
            // Check if the user has reached their monitor limit
            if (user.monitors.length >= user.maxMonitors && !user.isAdmin) {
                await ctx.reply(
                    `⚠️ You have reached your monitor limit (${user.maxMonitors}).\n` +
                    'Please delete an existing monitor before adding a new one.'
                );
                return;
            }
            
            // Create the monitor
            const monitor = await crud.createMonitor({
                userId: user._id,
                url,
                name: `Monitor ${user.monitors.length + 1}`
            });
            
            await ctx.reply(
                `✅ Monitor created successfully!\n\n` +
                `ID: ${monitor._id}\n` +
                `Name: ${monitor.name}\n` +
                `URL: ${monitor.url}\n\n` +
                `You will be notified when new items matching your search are found.`
            );
            
            Logger.info(`User ${telegramId} created monitor ${monitor._id}`);
        } catch (error) {
            Logger.error(`Error in monitor command: ${error.message}`);
            await ctx.reply('An error occurred while creating the monitor. Please try again later.');
        }
    });
} 