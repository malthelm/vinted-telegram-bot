import Logger from '../../utils/logger.js';

/**
 * Register the help command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    bot.help(async (ctx) => {
        try {
            await ctx.reply(
                `📚 *Vinted Monitor Bot Help*\n\n` +
                `Here are the available commands:\n\n` +
                `/start - Start the bot\n` +
                `/help - Show this help message\n` +
                `/monitor <url> - Start monitoring a Vinted search URL\n` +
                `/stop <id> - Stop monitoring a specific search\n` +
                `/list - List all your active monitors\n` +
                `/filter <id> <keywords> - Add keyword filters to a monitor\n` +
                `/settings - Change your settings\n\n` +
                `*How to use:*\n` +
                `1. Go to Vinted and create a search with your desired filters\n` +
                `2. Copy the URL from your browser\n` +
                `3. Use the /monitor command followed by the URL\n` +
                `4. The bot will notify you when new items matching your search are found\n\n` +
                `*Example:*\n` +
                `/monitor https://www.vinted.fr/catalog?brand_ids[]=53&catalog[]=1904`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            Logger.error(`Error in help command: ${error.message}`);
            await ctx.reply('An error occurred while showing help. Please try again later.');
        }
    });
} 