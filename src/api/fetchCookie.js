import RequestBuilder from '../utils/request_builder.js';
import ConfigurationManager from '../utils/config_manager.js';
import { executeWithDetailedHandling, NotFoundError } from '../helpers/execute_helper.js';
import Logger from '../utils/logger.js';

const extension = ConfigurationManager.getAlgorithmSetting.vinted_api_domain_extension;

/**
 * Fetch a cookie from Vinted for authentication.
 * @returns {Promise<Object>} - Promise resolving to the cookie.
 */
export async function fetchCookie() {
    return await executeWithDetailedHandling(async () => {
        const url = `https://www.vinted.${extension}`;

        const response = await RequestBuilder.get(url)
            .setNextProxy()
            .send();

        if (!response.success) {
            throw new NotFoundError('Error fetching cookie');
        }

        // Extract the cookie from the response headers
        const setCookieHeader = response.headers && response.headers['set-cookie'];
        if (!setCookieHeader || setCookieHeader.length === 0) {
            throw new NotFoundError('No cookie found in response');
        }

        // Parse the cookie string
        const cookieString = setCookieHeader.join('; ');
        Logger.info('Successfully fetched cookie from Vinted');

        return { cookie: cookieString };
    }, 'fetch_cookie');
} 