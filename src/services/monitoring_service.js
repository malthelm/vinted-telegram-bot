import crud from '../crud.js';
import Logger from '../utils/logger.js';
import ConfigurationManager from '../utils/config_manager.js';
import { fetchCatalogItems } from '../api/fetchCatalogItems.js';
import { fetchItem } from '../api/fetchItem.js';
import metricsManager from '../utils/metrics_manager.js';

const algorithmSettings = ConfigurationManager.getAlgorithmSetting;

/**
 * Service for monitoring Vinted listings.
 */
class MonitoringService {
    constructor(bot) {
        this.bot = bot;
        this.cookie = null;
        this.isRunning = false;
        this.pollingInterval = algorithmSettings.polling_interval;
        this.concurrentRequests = algorithmSettings.concurrent_requests;
        this.filterZeroStarsProfiles = algorithmSettings.filter_zero_stars_profiles;
    }

    /**
     * Set the cookie for API requests.
     * @param {string} cookie - The cookie string.
     */
    setCookie(cookie) {
        this.cookie = cookie;
        Logger.info('Cookie set in monitoring service');
    }

    /**
     * Start the monitoring service.
     */
    start() {
        if (this.isRunning) {
            Logger.warn('Monitoring service is already running');
            return;
        }

        if (!this.cookie) {
            Logger.error('Cannot start monitoring service without a cookie');
            return;
        }

        this.isRunning = true;
        Logger.info('Starting monitoring service');
        
        // Start the polling interval
        this.pollingIntervalId = setInterval(() => {
            this.checkAllMonitors();
        }, this.pollingInterval);
        
        // Initial check
        this.checkAllMonitors();
    }

    /**
     * Stop the monitoring service.
     */
    stop() {
        if (!this.isRunning) {
            Logger.warn('Monitoring service is not running');
            return;
        }

        clearInterval(this.pollingIntervalId);
        this.isRunning = false;
        Logger.info('Monitoring service stopped');
    }

    /**
     * Check all active monitors for new items.
     */
    async checkAllMonitors() {
        try {
            Logger.info('Checking all monitors for new items');
            
            // Get all active monitors
            const monitors = await crud.getAllActiveMonitors();
            
            if (monitors.length === 0) {
                Logger.info('No active monitors to check');
                return;
            }
            
            // Update monitor counts in metrics
            metricsManager.updateMonitorCounts(
                monitors.length,
                monitors.filter(m => m.active).length
            );
            
            Logger.info(`Found ${monitors.length} active monitors to check`);
            
            // Process monitors in batches to control concurrency
            const batchSize = this.concurrentRequests;
            for (let i = 0; i < monitors.length; i += batchSize) {
                const batch = monitors.slice(i, i + batchSize);
                
                // Process each monitor in the batch concurrently
                await Promise.all(batch.map(monitor => this.checkMonitor(monitor)));
                
                // Small delay between batches to avoid rate limiting
                if (i + batchSize < monitors.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            Logger.info('Finished checking all monitors');
        } catch (error) {
            Logger.error(`Error checking monitors: ${error.message}`);
            metricsManager.recordError('MonitorCheck', error.message);
        }
    }

    /**
     * Check a single monitor for new items.
     * @param {Object} monitor - The monitor to check.
     */
    async checkMonitor(monitor) {
        try {
            Logger.info(`Checking monitor ${monitor._id} (${monitor.name})`);
            
            // Fetch items from Vinted
            const result = await fetchCatalogItems({
                cookie: this.cookie,
                url: monitor.url
            });
            
            if (!result || !result.items || result.items.length === 0) {
                Logger.info(`No items found for monitor ${monitor._id}`);
                metricsManager.recordMonitorCheck(0);
                return;
            }
            
            Logger.info(`Found ${result.items.length} items for monitor ${monitor._id}`);
            metricsManager.recordMonitorCheck(result.items.length);
            
            // Get the user who owns this monitor
            const user = await crud.getUserByTelegramId(monitor.user);
            if (!user) {
                Logger.warn(`User not found for monitor ${monitor._id}`);
                return;
            }
            
            // Check if user has notifications enabled
            if (user.preferences && user.preferences.notifications === false) {
                Logger.info(`Notifications disabled for user ${user.telegramId}`);
                return;
            }
            
            // Process each item
            for (const item of result.items) {
                await this.processItem(item, monitor, user);
            }
            
            // Update the monitor's last checked timestamp
            await crud.updateMonitor(monitor._id, {
                lastChecked: new Date()
            });
        } catch (error) {
            Logger.error(`Error checking monitor ${monitor._id}: ${error.message}`);
            metricsManager.recordError('MonitorCheck', `Error checking monitor ${monitor._id}: ${error.message}`);
        }
    }

    /**
     * Process a single item.
     * @param {Object} item - The item to process.
     * @param {Object} monitor - The monitor that found the item.
     * @param {Object} user - The user who owns the monitor.
     */
    async processItem(item, monitor, user) {
        try {
            const itemId = item.id.toString();
            
            // Check if we've already seen this item
            if (monitor.lastItem === itemId) {
                return;
            }
            
            // Check if the item exists in our database
            const exists = await crud.itemExists(itemId);
            if (exists) {
                return;
            }
            
            // Filter by banned keywords
            if (monitor.bannedKeywords && monitor.bannedKeywords.length > 0) {
                const itemTitle = item.title.toLowerCase();
                const itemDescription = item.description ? item.description.toLowerCase() : '';
                
                for (const keyword of monitor.bannedKeywords) {
                    if (itemTitle.includes(keyword.toLowerCase()) || 
                        itemDescription.includes(keyword.toLowerCase())) {
                        Logger.info(`Item ${itemId} filtered out by keyword "${keyword}"`);
                        return;
                    }
                }
            }
            
            // Filter zero stars profiles if enabled
            if (this.filterZeroStarsProfiles && 
                item.user && 
                item.user.feedback_reputation === 0) {
                Logger.info(`Item ${itemId} filtered out due to zero stars profile`);
                return;
            }
            
            // Fetch detailed item information
            const itemDetails = await fetchItem({
                cookie: this.cookie,
                itemId
            });
            
            // Store the item in the database
            await crud.createItem(itemDetails);
            
            // Update the monitor's last item
            await crud.updateMonitor(monitor._id, {
                lastItem: itemId
            });
            
            // Send notification to the user
            await this.sendNotification(itemDetails, monitor, user);
        } catch (error) {
            Logger.error(`Error processing item: ${error.message}`);
            metricsManager.recordError('ItemProcessing', error.message);
        }
    }

    /**
     * Send a notification to the user about a new item.
     * @param {Object} item - The item details.
     * @param {Object} monitor - The monitor that found the item.
     * @param {Object} user - The user to notify.
     */
    async sendNotification(item, monitor, user) {
        try {
            Logger.info(`Sending notification to user ${user.telegramId} for item ${item.itemId}`);
            
            // Format the message
            const message = this.formatItemMessage(item, monitor);
            
            // Send the message
            await this.bot.telegram.sendMessage(user.telegramId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            });
            
            // Record notification sent
            metricsManager.recordNotificationSent();
            
            Logger.info(`Notification sent to user ${user.telegramId} for item ${item.itemId}`);
        } catch (error) {
            Logger.error(`Error sending notification: ${error.message}`);
            metricsManager.recordError('Notification', error.message);
        }
    }

    /**
     * Format an item message for notification.
     * @param {Object} item - The item details.
     * @param {Object} monitor - The monitor that found the item.
     * @returns {string} The formatted message.
     */
    formatItemMessage(item, monitor) {
        return `🔔 *New Item Found!*\n\n` +
            `*${item.title}*\n\n` +
            `💰 Price: ${item.price} ${item.currency}\n` +
            `👕 Size: ${item.size || 'N/A'}\n` +
            `🏷️ Brand: ${item.brand || 'N/A'}\n` +
            `👤 Seller: ${item.seller.username} (⭐ ${item.seller.rating || 0})\n\n` +
            `📝 Description: ${item.description ? item.description.substring(0, 100) + '...' : 'N/A'}\n\n` +
            `🔍 Monitor: ${monitor.name}\n\n` +
            `[View on Vinted](${item.url})`;
    }
}

export default MonitoringService; 