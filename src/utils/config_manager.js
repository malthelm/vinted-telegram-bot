import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Check if .env.local exists and load environment variables from it, overriding the default .env values
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
}

/**
 * Static class to manage application configurations.
 */
class ConfigurationManager {
    /**
     * Retrieves the Telegram configuration section from environment variables.
     * @returns {Object} Telegram configuration object.
     */
    static getTelegramConfig = {
        token: process.env.TELEGRAM_BOT_TOKEN,
        admin_user_ids: process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(',') : []
    }
    
    /**
     * Retrieves the MongoDB configuration section from environment variables.
     * @returns {Object} MongoDB configuration object.
     */
    static getMongoDBConfig = {
        uri: process.env.MONGODB_URI
    }
    
    /**
     * Retrieves the user configuration from environment variables.
     * @returns {Object} User configuration object.
     */
    static getUserConfig = {
        max_private_chats_default: parseInt(process.env.USER_MAX_PRIVATE_CHATS_DEFAULT || '5')
    }

    /**
     * Retrieves the algorithm settings from environment variables.
     * @returns {Object} Algorithm settings object.
     */
    static getAlgorithmSetting = {
        filter_zero_stars_profiles: process.env.ALGORITHM_FILTER_ZERO_STARS_PROFILES === '1',
        concurrent_requests: parseInt(process.env.ALGORITHM_CONCURRENT_REQUESTS || '5'),
        vinted_api_domain_extension: process.env.VINTED_API_DOMAIN_EXTENSION || 'fr',
        polling_interval: parseInt(process.env.POLLING_INTERVAL || '60') * 1000
    }

    /**
     * Retrieves the proxy configuration from environment variables.
     * @returns {Object} Proxy configuration object.
     */
    static getProxyConfig = {
        use_webshare: process.env.USE_WEBSHARE === '1',
        webshare_api_key: process.env.WEBSHARE_API_KEY
    }

    /**
     * Retrieves the blacklisted countries configuration from environment variables.
     * @returns {Object} Blacklisted countries configuration object.
     */
    static getBlacklistedCountriesConfig = {
        country_codes: process.env.BLACKLISTED_COUNTRIES_CODES ? process.env.BLACKLISTED_COUNTRIES_CODES.split(',') : []
    }
}

export default ConfigurationManager; 