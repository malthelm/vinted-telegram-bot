import MonitoringService from '../../src/services/monitoring_service.js';
import { connect, closeDatabase, clearDatabase } from '../utils/db-handler.js';
import crud from '../../src/crud.js';
import { mockUser, mockMonitor, mockCatalogItemsResponse, mockItemResponse } from '../utils/mock-data.js';

// Mock the API services
jest.mock('../../src/api/fetchCatalogItems.js', () => ({
    fetchCatalogItems: jest.fn().mockResolvedValue({ items: [] })
}));

jest.mock('../../src/api/fetchItem.js', () => ({
    fetchItem: jest.fn().mockResolvedValue({})
}));

// Import the mocked API services
import { fetchCatalogItems } from '../../src/api/fetchCatalogItems.js';
import { fetchItem } from '../../src/api/fetchItem.js';

describe('MonitoringService', () => {
    let mongod;
    let monitoringService;
    let mockBot;
    let testUser;
    let testMonitor;
    
    beforeAll(async () => {
        mongod = await connect();
    });
    
    afterAll(async () => {
        await closeDatabase(mongod);
    });
    
    beforeEach(async () => {
        await clearDatabase();
        
        // Create mock bot
        mockBot = {
            telegram: {
                sendMessage: jest.fn().mockResolvedValue(true)
            }
        };
        
        // Create monitoring service
        monitoringService = new MonitoringService(mockBot);
        monitoringService.setCookie('test-cookie');
        
        // Create test user and monitor
        testUser = await crud.createUser(mockUser);
        testMonitor = await crud.createMonitor({
            userId: testUser._id,
            url: mockMonitor.url,
            name: mockMonitor.name,
            bannedKeywords: mockMonitor.bannedKeywords
        });
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    test('setCookie sets the cookie', () => {
        monitoringService.setCookie('new-cookie');
        expect(monitoringService.cookie).toBe('new-cookie');
    });
    
    test('start starts the monitoring service', () => {
        // Mock the checkAllMonitors method
        monitoringService.checkAllMonitors = jest.fn();
        
        // Start the service
        monitoringService.start();
        
        expect(monitoringService.isRunning).toBe(true);
        expect(monitoringService.checkAllMonitors).toHaveBeenCalled();
    });
    
    test('stop stops the monitoring service', () => {
        // Start the service
        monitoringService.start();
        
        // Mock clearInterval
        const originalClearInterval = global.clearInterval;
        global.clearInterval = jest.fn();
        
        // Stop the service
        monitoringService.stop();
        
        expect(monitoringService.isRunning).toBe(false);
        expect(global.clearInterval).toHaveBeenCalled();
        
        // Restore clearInterval
        global.clearInterval = originalClearInterval;
    });
    
    test('checkAllMonitors checks all active monitors', async () => {
        // Mock the checkMonitor method
        monitoringService.checkMonitor = jest.fn();
        
        // Call checkAllMonitors
        await monitoringService.checkAllMonitors();
        
        expect(monitoringService.checkMonitor).toHaveBeenCalledWith(expect.objectContaining({
            _id: testMonitor._id,
            url: testMonitor.url,
            name: testMonitor.name
        }));
    });
    
    test('checkMonitor fetches and processes items', async () => {
        // Mock fetchCatalogItems to return mock items
        fetchCatalogItems.mockResolvedValueOnce(mockCatalogItemsResponse);
        
        // Mock processItem method
        monitoringService.processItem = jest.fn();
        
        // Call checkMonitor
        await monitoringService.checkMonitor(testMonitor);
        
        expect(fetchCatalogItems).toHaveBeenCalledWith({
            cookie: monitoringService.cookie,
            url: testMonitor.url
        });
        
        expect(monitoringService.processItem).toHaveBeenCalledTimes(mockCatalogItemsResponse.items.length);
        expect(monitoringService.processItem).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ _id: testMonitor._id }),
            expect.objectContaining({ _id: testUser._id })
        );
    });
    
    test('processItem filters items by banned keywords', async () => {
        // Create a monitor with banned keywords
        const monitorWithKeywords = await crud.createMonitor({
            userId: testUser._id,
            url: mockMonitor.url,
            name: 'Monitor with Keywords',
            bannedKeywords: ['test']
        });
        
        // Create a mock item that contains a banned keyword
        const itemWithBannedKeyword = {
            id: 123456,
            title: 'Test Item with banned keyword',
            description: 'This item should be filtered out'
        };
        
        // Mock sendNotification method
        monitoringService.sendNotification = jest.fn();
        
        // Call processItem
        await monitoringService.processItem(itemWithBannedKeyword, monitorWithKeywords, testUser);
        
        // Expect sendNotification not to be called because the item was filtered
        expect(monitoringService.sendNotification).not.toHaveBeenCalled();
    });
    
    test('processItem sends notification for new items', async () => {
        // Mock fetchItem to return mock item
        fetchItem.mockResolvedValueOnce(mockItemResponse.item);
        
        // Mock sendNotification method
        monitoringService.sendNotification = jest.fn();
        
        // Mock itemExists to return false (new item)
        jest.spyOn(crud, 'itemExists').mockResolvedValueOnce(false);
        
        // Call processItem
        await monitoringService.processItem(mockCatalogItemsResponse.items[0], testMonitor, testUser);
        
        expect(monitoringService.sendNotification).toHaveBeenCalled();
    });
    
    test('sendNotification sends a message to the user', async () => {
        // Call sendNotification
        await monitoringService.sendNotification(mockItemResponse.item, testMonitor, testUser);
        
        expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
            testUser.telegramId,
            expect.any(String),
            expect.objectContaining({
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            })
        );
    });
    
    test('formatItemMessage formats the item message correctly', () => {
        const message = monitoringService.formatItemMessage(mockItemResponse.item, testMonitor);
        
        expect(message).toContain(mockItemResponse.item.title);
        expect(message).toContain(mockItemResponse.item.price);
        expect(message).toContain(mockItemResponse.item.currency);
        expect(message).toContain(testMonitor.name);
        expect(message).toContain(mockItemResponse.item.url);
    });
}); 