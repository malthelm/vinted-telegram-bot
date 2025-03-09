import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import randomUseragent from 'random-useragent';
import ProxyManager from './proxy_manager.js';
import Logger from './logger.js';

/**
 * Builder for creating and sending HTTP requests with proxy support.
 */
class RequestBuilder {
    /**
     * Create a new GET request.
     * @param {string} url - The URL to request.
     * @returns {RequestBuilder} A new RequestBuilder instance.
     */
    static get(url) {
        return new RequestBuilder('GET', url);
    }

    /**
     * Create a new POST request.
     * @param {string} url - The URL to request.
     * @returns {RequestBuilder} A new RequestBuilder instance.
     */
    static post(url) {
        return new RequestBuilder('POST', url);
    }

    /**
     * Constructor for RequestBuilder.
     * @param {string} method - The HTTP method.
     * @param {string} url - The URL to request.
     */
    constructor(method, url) {
        this.method = method;
        this.url = url;
        this.headers = {
            'User-Agent': randomUseragent.getRandom(),
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
        };
        this.data = null;
        this.proxy = null;
        this.timeout = 10000;
    }

    /**
     * Set the next proxy from the proxy manager.
     * @returns {RequestBuilder} The RequestBuilder instance.
     */
    setNextProxy() {
        this.proxy = ProxyManager.getNextProxy();
        return this;
    }

    /**
     * Set a specific proxy.
     * @param {Object} proxy - The proxy to use.
     * @returns {RequestBuilder} The RequestBuilder instance.
     */
    setProxy(proxy) {
        this.proxy = proxy;
        return this;
    }

    /**
     * Set a cookie for the request.
     * @param {string} cookie - The cookie string.
     * @returns {RequestBuilder} The RequestBuilder instance.
     */
    setCookie(cookie) {
        this.headers['Cookie'] = cookie;
        return this;
    }

    /**
     * Set the request data for POST requests.
     * @param {Object} data - The data to send.
     * @returns {RequestBuilder} The RequestBuilder instance.
     */
    setData(data) {
        this.data = data;
        return this;
    }

    /**
     * Set a custom header.
     * @param {string} name - The header name.
     * @param {string} value - The header value.
     * @returns {RequestBuilder} The RequestBuilder instance.
     */
    setHeader(name, value) {
        this.headers[name] = value;
        return this;
    }

    /**
     * Set the request timeout.
     * @param {number} timeout - The timeout in milliseconds.
     * @returns {RequestBuilder} The RequestBuilder instance.
     */
    setTimeout(timeout) {
        this.timeout = timeout;
        return this;
    }

    /**
     * Send the request.
     * @returns {Promise<Object>} The response data.
     */
    async send() {
        try {
            const config = {
                method: this.method,
                url: this.url,
                headers: this.headers,
                timeout: this.timeout
            };

            if (this.data) {
                config.data = this.data;
            }

            if (this.proxy) {
                const proxyUrl = `http://${this.proxy.username}:${this.proxy.password}@${this.proxy.ip}:${this.proxy.port}`;
                config.httpsAgent = new HttpsProxyAgent(proxyUrl);
            }

            const response = await axios(config);
            return { success: true, data: response.data };
        } catch (error) {
            Logger.error(`Request failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

export default RequestBuilder; 