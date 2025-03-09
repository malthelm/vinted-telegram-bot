import { executeWithDetailedHandling, NotFoundError } from '../helpers/execute_helper.js';
import RequestBuilder from '../utils/request_builder.js';
import ConfigurationManager from '../utils/config_manager.js';
import cacheManager from '../utils/cache_manager.js';
import Logger from '../utils/logger.js';

const extension = ConfigurationManager.getAlgorithmSetting.vinted_api_domain_extension;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Fetch catalog items from Vinted.
 * @param {Object} params - Parameters for fetching catalog items.
 * @param {string} params.cookie - Cookie for authentication.
 * @param {string} params.url - The URL to fetch items from.
 * @param {number} [params.per_page=96] - Number of items per page.
 * @param {string} [params.order='newest_first'] - Order of items.
 * @param {boolean} [params.useCache=true] - Whether to use cache.
 * @returns {Promise<Object>} - Promise resolving to the fetched catalog items.
 */
export async function fetchCatalogItems({ cookie, url, per_page = 96, order = 'newest_first', useCache = true }) {
    return await executeWithDetailedHandling(async () => {
        // Parse the URL to extract search parameters
        const parsedUrl = new URL(url);
        const searchParams = parsedUrl.searchParams;
        
        // Build the API URL
        const apiUrl = `https://www.vinted.${extension}/api/v2/catalog/items?${searchParams.toString()}&per_page=${per_page}&order=${order}`;
        
        // Generate cache key
        const cacheKey = `catalog:${apiUrl}`;
        
        // Check cache if enabled
        if (useCache) {
            const cachedResult = cacheManager.get(cacheKey);
            if (cachedResult) {
                Logger.debug(`Using cached catalog items for ${url}`);
                return cachedResult;
            }
        }
        
        // Fetch from API if not in cache or cache disabled
        const response = await RequestBuilder.get(apiUrl)
            .setNextProxy()
            .setCookie(cookie)
            .send();

        if (!response.success) {
            throw new NotFoundError('Error fetching catalog items');
        }
        
        const result = { items: response.data.items };
        
        // Cache the result if caching is enabled
        if (useCache) {
            cacheManager.set(cacheKey, result, CACHE_TTL);
        }
        
        return result;
    }, 'catalog_items');
} 