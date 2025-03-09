import crud from '../../crud.js';
import Logger from '../../utils/logger.js';
import ConfigurationManager from '../../utils/config_manager.js';
import metricsManager from '../../utils/metrics_manager.js';
import cacheManager from '../../utils/cache_manager.js';

const telegramConfig = ConfigurationManager.getTelegramConfig;

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
 * Register the dashboard command with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export default function(bot) {
    bot.command('dashboard', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Check if user is an admin
            if (!telegramConfig.admin_user_ids.includes(telegramId)) {
                await ctx.reply('⚠️ You do not have permission to use admin commands.');
                Logger.warn(`Non-admin user ${telegramId} attempted to use dashboard command`);
                return;
            }
            
            // Get the user
            const user = await crud.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.reply('⚠️ You need to start the bot first. Use /start command.');
                return;
            }
            
            // Get metrics
            const metrics = metricsManager.getMetrics();
            
            // Get counts from database
            const userCount = (await crud.getAllUsers()).length;
            const activeMonitors = (await crud.getAllActiveMonitors()).length;
            
            // Update metrics with latest counts
            metricsManager.updateUserCounts(userCount, userCount);
            metricsManager.updateMonitorCounts(activeMonitors, activeMonitors);
            
            // Format the dashboard message
            const message = formatDashboardMessage(metrics);
            
            // Send the dashboard
            await ctx.reply(message, { parse_mode: 'Markdown' });
            
            Logger.info(`Dashboard viewed by admin ${telegramId}`);
        } catch (error) {
            Logger.error(`Error in dashboard command: ${error.message}`);
            await ctx.reply('An error occurred while generating the dashboard. Please try again later.');
        }
    });
    
    // Add subcommands for specific metrics
    bot.command('dashboard:api', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Check if user is an admin
            if (!telegramConfig.admin_user_ids.includes(telegramId)) {
                await ctx.reply('⚠️ You do not have permission to use admin commands.');
                return;
            }
            
            // Get metrics
            const metrics = metricsManager.getMetrics();
            
            // Format API metrics
            const message = formatApiMetrics(metrics);
            
            // Send the metrics
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            Logger.error(`Error in dashboard:api command: ${error.message}`);
            await ctx.reply('An error occurred while generating API metrics. Please try again later.');
        }
    });
    
    bot.command('dashboard:errors', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Check if user is an admin
            if (!telegramConfig.admin_user_ids.includes(telegramId)) {
                await ctx.reply('⚠️ You do not have permission to use admin commands.');
                return;
            }
            
            // Get metrics
            const metrics = metricsManager.getMetrics();
            
            // Format error metrics
            const message = formatErrorMetrics(metrics);
            
            // Send the metrics
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            Logger.error(`Error in dashboard:errors command: ${error.message}`);
            await ctx.reply('An error occurred while generating error metrics. Please try again later.');
        }
    });
    
    bot.command('dashboard:system', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Check if user is an admin
            if (!telegramConfig.admin_user_ids.includes(telegramId)) {
                await ctx.reply('⚠️ You do not have permission to use admin commands.');
                return;
            }
            
            // Get metrics
            const metrics = metricsManager.getMetrics();
            
            // Format system metrics
            const message = formatSystemMetrics(metrics);
            
            // Send the metrics
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            Logger.error(`Error in dashboard:system command: ${error.message}`);
            await ctx.reply('An error occurred while generating system metrics. Please try again later.');
        }
    });
    
    bot.command('dashboard:cache', async (ctx) => {
        try {
            const telegramId = ctx.from.id.toString();
            
            // Check if user is an admin
            if (!telegramConfig.admin_user_ids.includes(telegramId)) {
                await ctx.reply('⚠️ You do not have permission to use admin commands.');
                return;
            }
            
            // Clear cache
            cacheManager.clear();
            
            await ctx.reply('✅ Cache cleared successfully.');
            Logger.info(`Cache cleared by admin ${telegramId}`);
        } catch (error) {
            Logger.error(`Error in dashboard:cache command: ${error.message}`);
            await ctx.reply('An error occurred while clearing the cache. Please try again later.');
        }
    });
}

/**
 * Format the dashboard message.
 * @param {Object} metrics - The metrics object.
 * @returns {string} The formatted message.
 */
function formatDashboardMessage(metrics) {
    return `📊 *System Dashboard*\n\n` +
        `*Uptime:* ${formatUptime(metrics.system.uptime)}\n\n` +
        
        `*Users:* ${metrics.users.total}\n` +
        `*Monitors:* ${metrics.monitors.total} (${metrics.monitors.active} active)\n\n` +
        
        `*API Calls:* ${metrics.apiCalls.total}\n` +
        `  ✅ Success: ${metrics.apiCalls.success}\n` +
        `  ❌ Failed: ${metrics.apiCalls.failed}\n\n` +
        
        `*Monitoring:*\n` +
        `  🔍 Checks: ${metrics.monitors.checks}\n` +
        `  🔔 Items Found: ${metrics.monitors.itemsFound}\n` +
        `  📨 Notifications: ${metrics.monitors.notificationsSent}\n\n` +
        
        `*Errors:* ${metrics.errors.total}\n\n` +
        
        `*Memory Usage:*\n` +
        `  Heap: ${metrics.system.memoryUsage.heapUsed} MB / ${metrics.system.memoryUsage.heapTotal} MB\n` +
        `  RSS: ${metrics.system.memoryUsage.rss} MB\n\n` +
        
        `*Performance:*\n` +
        `  Avg Response: ${Math.round(metrics.performance.averageResponseTime)} ms\n\n` +
        
        `*Detailed Metrics:*\n` +
        `/dashboard:api - API metrics\n` +
        `/dashboard:errors - Error details\n` +
        `/dashboard:system - System metrics\n` +
        `/dashboard:cache - Clear cache`;
}

/**
 * Format API metrics.
 * @param {Object} metrics - The metrics object.
 * @returns {string} The formatted message.
 */
function formatApiMetrics(metrics) {
    let message = `📊 *API Metrics*\n\n` +
        `*Total Calls:* ${metrics.apiCalls.total}\n` +
        `*Success Rate:* ${metrics.apiCalls.total > 0 ? 
            Math.round(metrics.apiCalls.success / metrics.apiCalls.total * 100) : 0}%\n` +
        `*Average Response Time:* ${Math.round(metrics.performance.averageResponseTime)} ms\n\n` +
        
        `*By Endpoint:*\n`;
    
    // Add endpoint metrics
    for (const [endpoint, data] of Object.entries(metrics.apiCalls.byEndpoint)) {
        message += `  *${endpoint}:* ${data.total} calls (${Math.round(data.averageResponseTime)} ms)\n`;
    }
    
    return message;
}

/**
 * Format error metrics.
 * @param {Object} metrics - The metrics object.
 * @returns {string} The formatted message.
 */
function formatErrorMetrics(metrics) {
    let message = `📊 *Error Metrics*\n\n` +
        `*Total Errors:* ${metrics.errors.total}\n\n` +
        
        `*By Type:*\n`;
    
    // Add error type metrics
    for (const [type, data] of Object.entries(metrics.errors.byType)) {
        const lastTime = data.lastTime ? new Date(data.lastTime).toLocaleString() : 'N/A';
        message += `  *${type}:* ${data.count} errors\n` +
            `    Last: ${lastTime}\n` +
            `    Message: ${data.lastMessage.substring(0, 50)}${data.lastMessage.length > 50 ? '...' : ''}\n\n`;
    }
    
    return message;
}

/**
 * Format system metrics.
 * @param {Object} metrics - The metrics object.
 * @returns {string} The formatted message.
 */
function formatSystemMetrics(metrics) {
    return `📊 *System Metrics*\n\n` +
        `*Uptime:* ${formatUptime(metrics.system.uptime)}\n\n` +
        
        `*Memory Usage:*\n` +
        `  Heap Used: ${metrics.system.memoryUsage.heapUsed} MB\n` +
        `  Heap Total: ${metrics.system.memoryUsage.heapTotal} MB\n` +
        `  RSS: ${metrics.system.memoryUsage.rss} MB\n` +
        `  External: ${metrics.system.memoryUsage.external} MB\n\n` +
        
        `*Node.js Version:* ${process.version}\n` +
        `*Platform:* ${process.platform}\n` +
        `*Architecture:* ${process.arch}\n\n` +
        
        `*Start Time:* ${new Date(metrics.startTime).toLocaleString()}`;
} 