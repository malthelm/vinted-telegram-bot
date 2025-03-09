import { executeWithDetailedHandling, NotFoundError } from '../helpers/execute_helper.js';
import RequestBuilder from '../utils/request_builder.js';
import ConfigurationManager from '../utils/config_manager.js';
import cacheManager from '../utils/cache_manager.js';
import Logger from '../utils/logger.js';

const extension = ConfigurationManager.getAlgorithmSetting.vinted_api_domain_extension;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache for items

/**
 * Fetch a specific item from Vinted.
 * @param {Object} params - Parameters for fetching the item.
 * @param {string} params.cookie - Cookie for authentication.
 * @param {string} params.itemId - The ID of the item to fetch.
 * @param {boolean} [params.useCache=true] - Whether to use cache.
 * @returns {Promise<Object>} - Promise resolving to the fetched item.
 */
export async function fetchItem({ cookie, itemId, useCache = true }) {
    return await executeWithDetailedHandling(async () => {
        // Generate cache key
        const cacheKey = `item:${itemId}`;
        
        // Check cache if enabled
        if (useCache) {
            const cachedItem = cacheManager.get(cacheKey);
            if (cachedItem) {
                Logger.debug(`Using cached item for ${itemId}`);
                return cachedItem;
            }
        }
        
        const url = `https://www.vinted.${extension}/api/v2/items/${itemId}`;

        const response = await RequestBuilder.get(url)
            .setNextProxy()
            .setCookie(cookie)
            .send();

        if (!response.success) {
            throw new NotFoundError(`Error fetching item ${itemId}`);
        }

        const item = response.data.item;
        
        // Format the item data
        const formattedItem = {
            itemId: item.id.toString(),
            title: item.title,
            description: item.description,
            price: parseFloat(item.price),
            currency: item.currency,
            size: item.size || '',
            brand: item.brand_title || '',
            url: item.url,
            imageUrl: item.photos && item.photos.length > 0 ? item.photos[0].url : '',
            seller: {
                id: item.user.id.toString(),
                username: item.user.login,
                rating: item.user.feedback_reputation
            }
        };
        
        // Cache the result if caching is enabled
        if (useCache) {
            cacheManager.set(cacheKey, formattedItem, CACHE_TTL);
        }
        
        return formattedItem;
    }, 'item_details');
} 