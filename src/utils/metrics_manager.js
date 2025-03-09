import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const METRICS_FILE = path.resolve(process.cwd(), 'logs', 'metrics.json');

/**
 * Manages application metrics and performance monitoring.
 */
class MetricsManager {
    constructor() {
        this.metrics = {
            startTime: Date.now(),
            apiCalls: {
                total: 0,
                success: 0,
                failed: 0,
                byEndpoint: {}
            },
            monitors: {
                total: 0,
                active: 0,
                checks: 0,
                itemsFound: 0,
                notificationsSent: 0
            },
            errors: {
                total: 0,
                byType: {}
            },
            performance: {
                averageResponseTime: 0,
                totalResponseTime: 0,
                responseTimes: []
            },
            users: {
                total: 0,
                active: 0
            },
            system: {
                memoryUsage: {},
                uptime: 0
            }
        };
        
        // Create logs directory if it doesn't exist
        const logsDir = path.resolve(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Save metrics periodically
        this.saveInterval = setInterval(() => {
            this.saveMetrics();
        }, 5 * 60 * 1000); // Every 5 minutes
        
        // Update system metrics periodically
        this.updateInterval = setInterval(() => {
            this.updateSystemMetrics();
        }, 60 * 1000); // Every minute
    }
    
    /**
     * Record an API call.
     * @param {string} endpoint - The API endpoint.
     * @param {boolean} success - Whether the call was successful.
     * @param {number} responseTime - The response time in milliseconds.
     */
    recordApiCall(endpoint, success, responseTime) {
        this.metrics.apiCalls.total++;
        
        if (success) {
            this.metrics.apiCalls.success++;
        } else {
            this.metrics.apiCalls.failed++;
        }
        
        // Record by endpoint
        if (!this.metrics.apiCalls.byEndpoint[endpoint]) {
            this.metrics.apiCalls.byEndpoint[endpoint] = {
                total: 0,
                success: 0,
                failed: 0,
                averageResponseTime: 0,
                totalResponseTime: 0
            };
        }
        
        const endpointMetrics = this.metrics.apiCalls.byEndpoint[endpoint];
        endpointMetrics.total++;
        
        if (success) {
            endpointMetrics.success++;
        } else {
            endpointMetrics.failed++;
        }
        
        // Update response time metrics
        if (responseTime) {
            // Global response time
            this.metrics.performance.responseTimes.push(responseTime);
            this.metrics.performance.totalResponseTime += responseTime;
            this.metrics.performance.averageResponseTime = 
                this.metrics.performance.totalResponseTime / this.metrics.performance.responseTimes.length;
            
            // Keep only the last 100 response times to avoid memory issues
            if (this.metrics.performance.responseTimes.length > 100) {
                const removedTime = this.metrics.performance.responseTimes.shift();
                this.metrics.performance.totalResponseTime -= removedTime;
                this.metrics.performance.averageResponseTime = 
                    this.metrics.performance.totalResponseTime / this.metrics.performance.responseTimes.length;
            }
            
            // Endpoint response time
            endpointMetrics.totalResponseTime += responseTime;
            endpointMetrics.averageResponseTime = endpointMetrics.totalResponseTime / endpointMetrics.total;
        }
    }
    
    /**
     * Record a monitor check.
     * @param {number} itemsFound - The number of items found.
     */
    recordMonitorCheck(itemsFound = 0) {
        this.metrics.monitors.checks++;
        this.metrics.monitors.itemsFound += itemsFound;
    }
    
    /**
     * Record a notification sent.
     */
    recordNotificationSent() {
        this.metrics.monitors.notificationsSent++;
    }
    
    /**
     * Record an error.
     * @param {string} type - The error type.
     * @param {string} message - The error message.
     */
    recordError(type, message) {
        this.metrics.errors.total++;
        
        if (!this.metrics.errors.byType[type]) {
            this.metrics.errors.byType[type] = {
                count: 0,
                lastMessage: '',
                lastTime: null
            };
        }
        
        this.metrics.errors.byType[type].count++;
        this.metrics.errors.byType[type].lastMessage = message;
        this.metrics.errors.byType[type].lastTime = new Date();
    }
    
    /**
     * Update monitor counts.
     * @param {number} total - The total number of monitors.
     * @param {number} active - The number of active monitors.
     */
    updateMonitorCounts(total, active) {
        this.metrics.monitors.total = total;
        this.metrics.monitors.active = active;
    }
    
    /**
     * Update user counts.
     * @param {number} total - The total number of users.
     * @param {number} active - The number of active users.
     */
    updateUserCounts(total, active) {
        this.metrics.users.total = total;
        this.metrics.users.active = active;
    }
    
    /**
     * Update system metrics.
     */
    updateSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        
        this.metrics.system.memoryUsage = {
            rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100, // RSS in MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100, // Heap total in MB
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100, // Heap used in MB
            external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100 // External in MB
        };
        
        this.metrics.system.uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000); // Uptime in seconds
    }
    
    /**
     * Get the current metrics.
     * @returns {Object} The current metrics.
     */
    getMetrics() {
        // Update system metrics before returning
        this.updateSystemMetrics();
        return this.metrics;
    }
    
    /**
     * Save metrics to a file.
     */
    saveMetrics() {
        try {
            // Update system metrics before saving
            this.updateSystemMetrics();
            
            // Write metrics to file
            fs.writeFileSync(
                METRICS_FILE,
                JSON.stringify(this.metrics, null, 2),
                'utf8'
            );
            
            Logger.debug('Metrics saved to file');
        } catch (error) {
            Logger.error(`Failed to save metrics: ${error.message}`);
        }
    }
    
    /**
     * Stop the metrics manager.
     */
    stop() {
        // Save metrics one last time
        this.saveMetrics();
        
        // Clear intervals
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Create a singleton instance
const metricsManager = new MetricsManager();

export default metricsManager; 