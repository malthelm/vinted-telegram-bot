import crud from '../../crud.js';
import Logger from '../../utils/logger.js';
import { Markup } from 'telegraf';
import ConfigurationManager from '../../utils/config_manager.js';

const telegramConfig = ConfigurationManager.getTelegramConfig;

/**
 * Register the admin command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    // Main admin command
    bot.command('admin', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Check if user is an admin
            if (!telegramConfig.admin_user_ids.includes(telegramId)) {
                await ctx.reply('⚠️ You do not have permission to use admin commands.');
                Logger.warn(`Non-admin user ${telegramId} attempted to use admin command`);
                return;
            }
            
            // Get the user
            const user = await crud.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.reply('⚠️ You need to start the bot first. Use /start command.');
                return;
            }
            
            // Show admin menu
            await showAdminMenu(ctx);
        } catch (error) {
            Logger.error(`Error in admin command: ${error.message}`);
            await ctx.reply('An error occurred while accessing admin commands. Please try again later.');
        }
    });
    
    // Handle admin menu actions
    bot.action(/admin:(.+)/, async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            const action = ctx.match[1];
            
            // Check if user is an admin
            if (!telegramConfig.admin_user_ids.includes(telegramId)) {
                await ctx.answerCbQuery('You do not have permission to use admin commands.');
                return;
            }
            
            // Handle different admin actions
            switch (action) {
                case 'stats':
                    await showStats(ctx);
                    break;
                case 'users':
                    await showUsers(ctx);
                    break;
                case 'monitors':
                    await showAllMonitors(ctx);
                    break;
                case 'back_to_menu':
                    await showAdminMenu(ctx);
                    break;
                default:
                    await ctx.answerCbQuery('Unknown action');
            }
        } catch (error) {
            Logger.error(`Error in admin action: ${error.message}`);
            await ctx.answerCbQuery('An error occurred. Please try again later.');
        }
    });
}

/**
 * Show the admin menu.
 * @param {Context} ctx - The Telegraf context.
 */
async function showAdminMenu(ctx) {
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 System Stats', 'admin:stats')],
        [Markup.button.callback('👥 Manage Users', 'admin:users')],
        [Markup.button.callback('🔍 View All Monitors', 'admin:monitors')]
    ]);
    
    await ctx.editMessageText ? 
        ctx.editMessageText('🔐 *Admin Panel*\n\nSelect an option to manage the bot.', { 
            parse_mode: 'Markdown',
            ...keyboard
        }) : 
        ctx.reply('🔐 *Admin Panel*\n\nSelect an option to manage the bot.', { 
            parse_mode: 'Markdown',
            ...keyboard
        });
}

/**
 * Show system statistics.
 * @param {Context} ctx - The Telegraf context.
 */
async function showStats(ctx) {
    try {
        // Get counts from database
        const userCount = (await crud.getAllUsers()).length;
        const monitorCount = (await crud.getAllActiveMonitors()).length;
        
        // Get system info
        const uptime = formatUptime(process.uptime());
        const memoryUsage = formatMemoryUsage(process.memoryUsage());
        
        const message = 
            '📊 *System Statistics*\n\n' +
            `Users: ${userCount}\n` +
            `Active Monitors: ${monitorCount}\n` +
            `Uptime: ${uptime}\n` +
            `Memory Usage: ${memoryUsage}\n` +
            `Node.js Version: ${process.version}`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('« Back', 'admin:back_to_menu')]
        ]);
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        Logger.error(`Error showing stats: ${error.message}`);
        await ctx.answerCbQuery('Failed to load statistics');
    }
}

/**
 * Show all users.
 * @param {Context} ctx - The Telegraf context.
 */
async function showUsers(ctx) {
    try {
        const users = await crud.getAllUsers();
        
        if (users.length === 0) {
            await ctx.answerCbQuery('No users found');
            return;
        }
        
        let message = '👥 *User Management*\n\n';
        
        users.slice(0, 10).forEach((user, index) => {
            message += `*${index + 1}. ${user.firstName} ${user.lastName || ''}*\n`;
            message += `ID: ${user.telegramId}\n`;
            message += `Username: @${user.username || 'N/A'}\n`;
            message += `Monitors: ${user.monitors.length}\n`;
            message += `Admin: ${user.isAdmin ? '✅' : '❌'}\n`;
            message += `Last Active: ${user.lastActive.toLocaleDateString()}\n\n`;
        });
        
        if (users.length > 10) {
            message += `_...and ${users.length - 10} more users_\n\n`;
        }
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('« Back', 'admin:back_to_menu')]
        ]);
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        Logger.error(`Error showing users: ${error.message}`);
        await ctx.answerCbQuery('Failed to load users');
    }
}

/**
 * Show all monitors.
 * @param {Context} ctx - The Telegraf context.
 */
async function showAllMonitors(ctx) {
    try {
        const monitors = await crud.getAllActiveMonitors();
        
        if (monitors.length === 0) {
            await ctx.answerCbQuery('No active monitors found');
            return;
        }
        
        let message = '🔍 *All Active Monitors*\n\n';
        
        monitors.slice(0, 5).forEach((monitor, index) => {
            message += `*${index + 1}. ${monitor.name}*\n`;
            message += `ID: ${monitor._id}\n`;
            message += `URL: ${monitor.url.substring(0, 30)}...\n`;
            message += `Created: ${monitor.createdAt.toLocaleDateString()}\n\n`;
        });
        
        if (monitors.length > 5) {
            message += `_...and ${monitors.length - 5} more monitors_\n\n`;
        }
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('« Back', 'admin:back_to_menu')]
        ]);
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        Logger.error(`Error showing monitors: ${error.message}`);
        await ctx.answerCbQuery('Failed to load monitors');
    }
}

/**
 * Format uptime in a human-readable format.
 * @param {number} seconds - Uptime in seconds.
 * @returns {string} Formatted uptime.
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
}

/**
 * Format memory usage in a human-readable format.
 * @param {Object} memoryUsage - Memory usage object.
 * @returns {string} Formatted memory usage.
 */
function formatMemoryUsage(memoryUsage) {
    const mbUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    const mbTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;
    
    return `${mbUsed} MB / ${mbTotal} MB`;
} 