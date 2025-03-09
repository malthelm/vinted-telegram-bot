import ConfigurationManager from '../../src/utils/config_manager.js';

describe('ConfigurationManager', () => {
    // Save original environment variables
    const originalEnv = process.env;

    beforeEach(() => {
        // Mock environment variables
        jest.resetModules();
        process.env = { 
            ...originalEnv,
            TELEGRAM_BOT_TOKEN: 'test-token',
            ADMIN_USER_IDS: '123,456',
            MONGODB_URI: 'mongodb://localhost:27017/test',
            USER_MAX_PRIVATE_CHATS_DEFAULT: '5',
            ALGORITHM_FILTER_ZERO_STARS_PROFILES: '1',
            ALGORITHM_CONCURRENT_REQUESTS: '3',
            VINTED_API_DOMAIN_EXTENSION: 'fr',
            POLLING_INTERVAL: '60',
            USE_WEBSHARE: '1',
            WEBSHARE_API_KEY: 'test-api-key',
            BLACKLISTED_COUNTRIES_CODES: 'uk,us'
        };
    });

    afterEach(() => {
        // Restore original environment variables
        process.env = originalEnv;
    });

    test('getTelegramConfig returns correct values', () => {
        expect(ConfigurationManager.getTelegramConfig.token).toBe('test-token');
        expect(ConfigurationManager.getTelegramConfig.admin_user_ids).toEqual(['123', '456']);
    });

    test('getMongoDBConfig returns correct values', () => {
        expect(ConfigurationManager.getMongoDBConfig.uri).toBe('mongodb://localhost:27017/test');
    });

    test('getUserConfig returns correct values', () => {
        expect(ConfigurationManager.getUserConfig.max_private_chats_default).toBe(5);
    });

    test('getAlgorithmSetting returns correct values', () => {
        expect(ConfigurationManager.getAlgorithmSetting.filter_zero_stars_profiles).toBe(true);
        expect(ConfigurationManager.getAlgorithmSetting.concurrent_requests).toBe(3);
        expect(ConfigurationManager.getAlgorithmSetting.vinted_api_domain_extension).toBe('fr');
        expect(ConfigurationManager.getAlgorithmSetting.polling_interval).toBe(60000);
    });

    test('getProxyConfig returns correct values', () => {
        expect(ConfigurationManager.getProxyConfig.use_webshare).toBe(true);
        expect(ConfigurationManager.getProxyConfig.webshare_api_key).toBe('test-api-key');
    });

    test('getBlacklistedCountriesConfig returns correct values', () => {
        expect(ConfigurationManager.getBlacklistedCountriesConfig.country_codes).toEqual(['uk', 'us']);
    });
}); 