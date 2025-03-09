import nock from 'nock';
import { fetchCookie } from '../../src/api/fetchCookie.js';
import { fetchCatalogItems } from '../../src/api/fetchCatalogItems.js';
import { fetchItem } from '../../src/api/fetchItem.js';
import { mockCatalogItemsResponse, mockItemResponse } from '../utils/mock-data.js';
import ConfigurationManager from '../../src/utils/config_manager.js';

// Mock the RequestBuilder
jest.mock('../../src/utils/request_builder.js', () => {
    return {
        __esModule: true,
        default: {
            get: jest.fn().mockImplementation(() => ({
                setNextProxy: jest.fn().mockReturnThis(),
                setCookie: jest.fn().mockReturnThis(),
                send: jest.fn().mockImplementation(async () => {
                    // This will be overridden in individual tests
                    return { success: true, data: {} };
                })
            }))
        }
    };
});

// Import the mocked RequestBuilder
import RequestBuilder from '../../src/utils/request_builder.js';

describe('API Services', () => {
    const extension = ConfigurationManager.getAlgorithmSetting.vinted_api_domain_extension;
    const mockCookie = 'session=abc123; path=/; domain=.vinted.fr; secure; httponly';
    
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    describe('fetchCookie', () => {
        test('successfully fetches a cookie', async () => {
            // Mock the RequestBuilder.send response
            RequestBuilder.get().send.mockResolvedValueOnce({
                success: true,
                headers: {
                    'set-cookie': [mockCookie]
                }
            });
            
            const result = await fetchCookie();
            
            expect(result).toBeDefined();
            expect(result.cookie).toBe(mockCookie);
            expect(RequestBuilder.get).toHaveBeenCalledWith(`https://www.vinted.${extension}`);
        });
        
        test('throws an error when no cookie is found', async () => {
            // Mock the RequestBuilder.send response with no cookie
            RequestBuilder.get().send.mockResolvedValueOnce({
                success: true,
                headers: {}
            });
            
            await expect(fetchCookie()).rejects.toThrow('No cookie found in response');
        });
        
        test('throws an error when the request fails', async () => {
            // Mock the RequestBuilder.send response with failure
            RequestBuilder.get().send.mockResolvedValueOnce({
                success: false
            });
            
            await expect(fetchCookie()).rejects.toThrow('Error fetching cookie');
        });
    });
    
    describe('fetchCatalogItems', () => {
        const mockUrl = 'https://www.vinted.fr/catalog?brand_ids[]=53';
        
        test('successfully fetches catalog items', async () => {
            // Mock the RequestBuilder.send response
            RequestBuilder.get().send.mockResolvedValueOnce({
                success: true,
                data: mockCatalogItemsResponse
            });
            
            const result = await fetchCatalogItems({
                cookie: mockCookie,
                url: mockUrl
            });
            
            expect(result).toBeDefined();
            expect(result.items).toEqual(mockCatalogItemsResponse.items);
            expect(RequestBuilder.get).toHaveBeenCalled();
            expect(RequestBuilder.get.mock.calls[0][0]).toContain(`https://www.vinted.${extension}/api/v2/catalog/items`);
        });
        
        test('throws an error when the request fails', async () => {
            // Mock the RequestBuilder.send response with failure
            RequestBuilder.get().send.mockResolvedValueOnce({
                success: false
            });
            
            await expect(fetchCatalogItems({
                cookie: mockCookie,
                url: mockUrl
            })).rejects.toThrow('Error fetching catalog items');
        });
    });
    
    describe('fetchItem', () => {
        const mockItemId = '123456';
        
        test('successfully fetches an item', async () => {
            // Mock the RequestBuilder.send response
            RequestBuilder.get().send.mockResolvedValueOnce({
                success: true,
                data: mockItemResponse
            });
            
            const result = await fetchItem({
                cookie: mockCookie,
                itemId: mockItemId
            });
            
            expect(result).toBeDefined();
            expect(result.itemId).toBe(mockItemId);
            expect(result.title).toBe(mockItemResponse.item.title);
            expect(RequestBuilder.get).toHaveBeenCalledWith(`https://www.vinted.${extension}/api/v2/items/${mockItemId}`);
        });
        
        test('throws an error when the request fails', async () => {
            // Mock the RequestBuilder.send response with failure
            RequestBuilder.get().send.mockResolvedValueOnce({
                success: false
            });
            
            await expect(fetchItem({
                cookie: mockCookie,
                itemId: mockItemId
            })).rejects.toThrow(`Error fetching item ${mockItemId}`);
        });
    });
}); 