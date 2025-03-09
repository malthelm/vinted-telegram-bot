import crud from '../../crud.js';
import Logger from '../../utils/logger.js';
import { Markup } from 'telegraf';

/**
 * Register the settings command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    // Main settings command
    bot.command('settings', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Get the user
            const user = await crud.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.reply('⚠️ You need to start the bot first. Use /start command.');
                return;
            }
            
            // Show settings menu
            await showSettingsMenu(ctx, user);
        } catch (error) {
            Logger.error(`Error in settings command: ${error.message}`);
            await ctx.reply('An error occurred while accessing settings. Please try again later.');
        }
    });
    
    // Handle settings menu actions
    bot.action(/settings:(.+)/, async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            const action = ctx.match[1];
            
            // Get the user
            const user = await crud.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.answerCbQuery('User not found. Please use /start command first.');
                return;
            }
            
            // Handle different settings actions
            switch (action) {
                case 'toggle_notifications':
                    await toggleNotifications(ctx, user);
                    break;
                case 'change_language':
                    await showLanguageOptions(ctx, user);
                    break;
                case 'back_to_menu':
                    await showSettingsMenu(ctx, user);
                    break;
                default:
                    await ctx.answerCbQuery('Unknown action');
            }
        } catch (error) {
            Logger.error(`Error in settings action: ${error.message}`);
            await ctx.answerCbQuery('An error occurred. Please try again later.');
        }
    });
    
    // Handle language selection
    bot.action(/language:(.+)/, async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            const language = ctx.match[1];
            
            // Get the user
            const user = await crud.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.answerCbQuery('User not found. Please use /start command first.');
                return;
            }
            
            // Update user's language preference
            const updatedUser = await crud.updateUser(telegramId, {
                'preferences.language': language
            });
            
            if (updatedUser) {
                await ctx.answerCbQuery(`Language changed to ${language}`);
                await showSettingsMenu(ctx, updatedUser);
                Logger.info(`User ${telegramId} changed language to ${language}`);
            } else {
                await ctx.answerCbQuery('Failed to update language. Please try again.');
                Logger.error(`Failed to update language for user ${telegramId}`);
            }
        } catch (error) {
            Logger.error(`Error in language action: ${error.message}`);
            await ctx.answerCbQuery('An error occurred. Please try again later.');
        }
    });
}

/**
 * Show the settings menu.
 * @param {Context} ctx - The Telegraf context.
 * @param {Object} user - The user object.
 */
async function showSettingsMenu(ctx, user) {
    const notificationStatus = user.preferences.notifications ? '✅ Enabled' : '❌ Disabled';
    const language = user.preferences.language || 'en';
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(`Notifications: ${notificationStatus}`, 'settings:toggle_notifications')],
        [Markup.button.callback(`Language: ${language.toUpperCase()}`, 'settings:change_language')]
    ]);
    
    await ctx.editMessageText ? 
        ctx.editMessageText('⚙️ *Settings*\n\nManage your bot preferences here.', { 
            parse_mode: 'Markdown',
            ...keyboard
        }) : 
        ctx.reply('⚙️ *Settings*\n\nManage your bot preferences here.', { 
            parse_mode: 'Markdown',
            ...keyboard
        });
}

/**
 * Toggle notifications setting.
 * @param {Context} ctx - The Telegraf context.
 * @param {Object} user - The user object.
 */
async function toggleNotifications(ctx, user) {
    const newNotificationStatus = !user.preferences.notifications;
    
    const updatedUser = await crud.updateUser(user.telegramId, {
        'preferences.notifications': newNotificationStatus
    });
    
    if (updatedUser) {
        await ctx.answerCbQuery(`Notifications ${newNotificationStatus ? 'enabled' : 'disabled'}`);
        await showSettingsMenu(ctx, updatedUser);
        Logger.info(`User ${user.telegramId} ${newNotificationStatus ? 'enabled' : 'disabled'} notifications`);
    } else {
        await ctx.answerCbQuery('Failed to update notification settings. Please try again.');
        Logger.error(`Failed to update notification settings for user ${user.telegramId}`);
    }
}

/**
 * Show language options.
 * @param {Context} ctx - The Telegraf context.
 * @param {Object} user - The user object.
 */
async function showLanguageOptions(ctx, user) {
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('English', 'language:en'),
            Markup.button.callback('Français', 'language:fr')
        ],
        [
            Markup.button.callback('Español', 'language:es'),
            Markup.button.callback('Deutsch', 'language:de')
        ],
        [Markup.button.callback('« Back', 'settings:back_to_menu')]
    ]);
    
    await ctx.editMessageText('🌐 *Select Language*\n\nChoose your preferred language.', {
        parse_mode: 'Markdown',
        ...keyboard
    });
} 