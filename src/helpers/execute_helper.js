import Logger from '../utils/logger.js';
import metricsManager from '../utils/metrics_manager.js';

/**
 * Custom error for when a resource is not found.
 */
export class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

/**
 * Custom error for rate limiting.
 */
export class RateLimitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RateLimitError';
    }
}

/**
 * Execute a function with detailed error handling.
 * @param {Function} fn - The function to execute.
 * @param {string} [endpoint='unknown'] - The API endpoint being called.
 * @returns {Promise<any>} - The result of the function.
 * @throws {Error} - If the function throws an error.
 */
export async function executeWithDetailedHandling(fn, endpoint = 'unknown') {
    const startTime = Date.now();
    let success = false;
    
    try {
        const result = await fn();
        success = true;
        
        // Record successful API call
        const responseTime = Date.now() - startTime;
        metricsManager.recordApiCall(endpoint, true, responseTime);
        
        return result;
    } catch (error) {
        // Record failed API call
        const responseTime = Date.now() - startTime;
        metricsManager.recordApiCall(endpoint, false, responseTime);
        
        if (error instanceof NotFoundError) {
            Logger.warn(`Not found: ${error.message}`);
            metricsManager.recordError('NotFound', error.message);
            throw error;
        } else if (error instanceof RateLimitError) {
            Logger.warn(`Rate limited: ${error.message}`);
            metricsManager.recordError('RateLimit', error.message);
            throw error;
        } else if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 404) {
                const notFoundError = new NotFoundError('Resource not found');
                metricsManager.recordError('NotFound', 'Resource not found');
                throw notFoundError;
            } else if (status === 429) {
                const rateLimitError = new RateLimitError('Rate limit exceeded');
                metricsManager.recordError('RateLimit', 'Rate limit exceeded');
                throw rateLimitError;
            } else {
                Logger.error(`API error: ${status} - ${JSON.stringify(data)}`);
                metricsManager.recordError('APIError', `Status ${status}`);
                throw new Error(`API error: ${status}`);
            }
        } else if (error.request) {
            // The request was made but no response was received
            Logger.error('No response received from API');
            metricsManager.recordError('NoResponse', 'No response received from API');
            throw new Error('No response received from API');
        } else {
            // Something happened in setting up the request that triggered an Error
            Logger.error(`Error setting up request: ${error.message}`);
            metricsManager.recordError('RequestSetup', error.message);
            throw error;
        }
    }
} 