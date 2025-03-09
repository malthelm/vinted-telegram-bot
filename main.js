import ProxyManager from './src/utils/proxy_manager.js';
import { initBot, startBot } from './src/bot/telegram_client.js';
import Logger from './src/utils/logger.js';
import ConfigurationManager from './src/utils/config_manager.js';
import { fetchCookie } from './src/api/fetchCookie.js';
import MonitoringService from './src/services/monitoring_service.js';
import metricsManager from './src/utils/metrics_manager.js';
import cacheManager from './src/utils/cache_manager.js';
import mongoose from 'mongoose';

// Global variables
let cookie = null;
let monitoringService = null;
let bot = null;
const algorithmSettings = ConfigurationManager.getAlgorithmSetting;

/**
 * Initialize the application.
 */
async function init() {
    try {
        Logger.info('Starting Vinted Telegram Bot...');
        
        // Initialize proxies
        try {
            await ProxyManager.init();
        } catch (error) {
            Logger.error(`Failed to initialize proxies: ${error.message}`);
            Logger.info('Continuing without proxies...');
        }
        
        // Initialize and start the bot
        bot = initBot();
        await startBot(bot);
        
        // Initialize monitoring service
        monitoringService = new MonitoringService(bot);
        
        // Get initial cookie
        try {
            const cookieResult = await fetchCookie();
            cookie = cookieResult.cookie;
            Logger.info('Fetched initial cookie from Vinted');
            
            // Set cookie in monitoring service
            monitoringService.setCookie(cookie);
            
            // Start monitoring service
            monitoringService.start();
        } catch (error) {
            Logger.error(`Failed to fetch initial cookie: ${error.message}`);
            Logger.info('Will retry cookie fetch during monitoring...');
        }
        
        // Set up periodic cookie refresh
        const cookieRefreshInterval = setInterval(async () => {
            try {
                const cookieResult = await fetchCookie();
                cookie = cookieResult.cookie;
                Logger.info('Refreshed cookie from Vinted');
                
                // Update cookie in monitoring service
                if (monitoringService) {
                    monitoringService.setCookie(cookie);
                }
            } catch (error) {
                Logger.error(`Failed to refresh cookie: ${error.message}`);
                metricsManager.recordError('CookieRefresh', error.message);
            }
        }, 30 * 60 * 1000); // Refresh every 30 minutes
        
        // Set up periodic metrics update
        const metricsUpdateInterval = setInterval(async () => {
            try {
                // Update user and monitor counts
                const userCount = (await crud.getAllUsers()).length;
                const monitors = await crud.getAllActiveMonitors();
                const activeMonitors = monitors.filter(m => m.active).length;
                
                metricsManager.updateUserCounts(userCount, userCount);
                metricsManager.updateMonitorCounts(monitors.length, activeMonitors);
            } catch (error) {
                Logger.error(`Failed to update metrics: ${error.message}`);
            }
        }, 5 * 60 * 1000); // Update every 5 minutes
        
        Logger.success('Vinted Telegram Bot is running');
        
        // Handle graceful shutdown
        process.on('SIGINT', () => shutdown(cookieRefreshInterval, metricsUpdateInterval));
        process.on('SIGTERM', () => shutdown(cookieRefreshInterval, metricsUpdateInterval));
    } catch (error) {
        Logger.error(`Initialization error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Gracefully shut down the application.
 * @param {NodeJS.Timeout} cookieRefreshInterval - The cookie refresh interval.
 * @param {NodeJS.Timeout} metricsUpdateInterval - The metrics update interval.
 */
function shutdown(cookieRefreshInterval, metricsUpdateInterval) {
    Logger.info('Shutting down...');
    
    // Clear intervals
    if (cookieRefreshInterval) {
        clearInterval(cookieRefreshInterval);
    }
    
    if (metricsUpdateInterval) {
        clearInterval(metricsUpdateInterval);
    }
    
    // Stop monitoring service
    if (monitoringService) {
        monitoringService.stop();
    }
    
    // Stop metrics manager
    metricsManager.stop();
    
    // Stop cache manager
    cacheManager.stop();
    
    // Close database connection
    mongoose.connection.close()
        .then(() => Logger.info('Closed MongoDB connection'))
        .catch(err => Logger.error(`Error closing MongoDB connection: ${err.message}`));
    
    // Stop the bot
    if (bot) {
        bot.stop('SIGTERM');
    }
    
    Logger.info('Shutdown complete');
    process.exit(0);
}

// Start the application
init(); 