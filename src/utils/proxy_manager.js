import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ConfigurationManager from './config_manager.js';
import Logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const proxyConfig = ConfigurationManager.getProxyConfig;

/**
 * Manages proxies for API requests.
 */
class ProxyManager {
    static proxies = [];
    static currentProxyIndex = 0;

    /**
     * Initialize the proxy manager.
     * @returns {Promise<void>}
     */
    static async init() {
        if (proxyConfig.use_webshare) {
            await this.fetchWebshareProxies();
        } else {
            await this.loadProxiesFromFile();
        }

        if (this.proxies.length === 0) {
            throw new Error('No proxies available');
        }

        Logger.info(`Loaded ${this.proxies.length} proxies`);
    }

    /**
     * Fetch proxies from Webshare.io.
     * @returns {Promise<void>}
     */
    static async fetchWebshareProxies() {
        try {
            const response = await axios.get('https://proxy.webshare.io/api/v2/proxy/list/', {
                headers: {
                    'Authorization': `Token ${proxyConfig.webshare_api_key}`
                }
            });

            if (response.data && response.data.results) {
                this.proxies = response.data.results.map(proxy => ({
                    ip: proxy.proxy_address,
                    port: proxy.port,
                    username: proxy.username,
                    password: proxy.password
                }));
            }
        } catch (error) {
            Logger.error(`Failed to fetch proxies from Webshare: ${error.message}`);
            throw error;
        }
    }

    /**
     * Load proxies from a file.
     * @returns {Promise<void>}
     */
    static async loadProxiesFromFile() {
        try {
            const filePath = path.resolve(process.cwd(), 'proxies.txt');
            if (!fs.existsSync(filePath)) {
                Logger.error('proxies.txt file not found');
                return;
            }

            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim() !== '');

            this.proxies = lines.map(line => {
                const [ip, port, username, password] = line.split(':');
                return { ip, port, username, password };
            });
        } catch (error) {
            Logger.error(`Failed to load proxies from file: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get the next proxy in the rotation.
     * @returns {Object|null} The next proxy or null if no proxies are available.
     */
    static getNextProxy() {
        if (this.proxies.length === 0) {
            return null;
        }

        const proxy = this.proxies[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
        return proxy;
    }
}

export default ProxyManager; 