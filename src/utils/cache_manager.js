/**
 * Simple in-memory cache with TTL (Time To Live) support.
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();
        
        // Run cleanup every minute to remove expired items
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    
    /**
     * Set a value in the cache with an optional TTL.
     * @param {string} key - The cache key.
     * @param {any} value - The value to cache.
     * @param {number} [ttl=3600000] - Time to live in milliseconds (default: 1 hour).
     */
    set(key, value, ttl = 3600000) {
        this.cache.set(key, value);
        this.ttls.set(key, Date.now() + ttl);
    }
    
    /**
     * Get a value from the cache.
     * @param {string} key - The cache key.
     * @returns {any|null} The cached value or null if not found or expired.
     */
    get(key) {
        // Check if the key exists and is not expired
        if (this.cache.has(key) && this.ttls.get(key) > Date.now()) {
            return this.cache.get(key);
        }
        
        // Remove expired item if it exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
            this.ttls.delete(key);
        }
        
        return null;
    }
    
    /**
     * Check if a key exists in the cache and is not expired.
     * @param {string} key - The cache key.
     * @returns {boolean} True if the key exists and is not expired, false otherwise.
     */
    has(key) {
        return this.cache.has(key) && this.ttls.get(key) > Date.now();
    }
    
    /**
     * Delete a key from the cache.
     * @param {string} key - The cache key.
     */
    delete(key) {
        this.cache.delete(key);
        this.ttls.delete(key);
    }
    
    /**
     * Clear the entire cache.
     */
    clear() {
        this.cache.clear();
        this.ttls.clear();
    }
    
    /**
     * Remove expired items from the cache.
     */
    cleanup() {
        const now = Date.now();
        for (const [key, expiry] of this.ttls.entries()) {
            if (expiry <= now) {
                this.cache.delete(key);
                this.ttls.delete(key);
            }
        }
    }
    
    /**
     * Stop the cleanup interval.
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Create a singleton instance
const cacheManager = new CacheManager();

export default cacheManager; 