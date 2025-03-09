/**
 * Mock data for testing.
 */

/**
 * Mock user data.
 */
export const mockUser = {
    telegramId: '123456789',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    preferences: {
        language: 'en',
        notifications: true
    },
    monitors: [],
    maxMonitors: 5,
    isAdmin: false
};

/**
 * Mock admin user data.
 */
export const mockAdminUser = {
    telegramId: '987654321',
    username: 'adminuser',
    firstName: 'Admin',
    lastName: 'User',
    preferences: {
        language: 'en',
        notifications: true
    },
    monitors: [],
    maxMonitors: 10,
    isAdmin: true
};

/**
 * Mock monitor data.
 */
export const mockMonitor = {
    url: 'https://www.vinted.fr/catalog?brand_ids[]=53',
    name: 'Test Monitor',
    active: true,
    bannedKeywords: ['keyword1', 'keyword2'],
    lastChecked: new Date(),
    lastItem: null
};

/**
 * Mock item data.
 */
export const mockItem = {
    itemId: '123456',
    title: 'Test Item',
    description: 'This is a test item',
    price: 10.99,
    currency: 'EUR',
    size: 'M',
    brand: 'Test Brand',
    url: 'https://www.vinted.fr/items/123456',
    imageUrl: 'https://www.vinted.fr/images/123456.jpg',
    seller: {
        id: '654321',
        username: 'seller',
        rating: 4.5
    }
};

/**
 * Mock Vinted API response for catalog items.
 */
export const mockCatalogItemsResponse = {
    items: [
        {
            id: 123456,
            title: 'Test Item 1',
            description: 'This is test item 1',
            price: '10.99',
            currency: 'EUR',
            size: 'M',
            brand_title: 'Test Brand',
            url: 'https://www.vinted.fr/items/123456',
            photos: [{ url: 'https://www.vinted.fr/images/123456.jpg' }],
            user: {
                id: 654321,
                login: 'seller1',
                feedback_reputation: 4.5
            }
        },
        {
            id: 789012,
            title: 'Test Item 2',
            description: 'This is test item 2',
            price: '15.99',
            currency: 'EUR',
            size: 'L',
            brand_title: 'Another Brand',
            url: 'https://www.vinted.fr/items/789012',
            photos: [{ url: 'https://www.vinted.fr/images/789012.jpg' }],
            user: {
                id: 654321,
                login: 'seller2',
                feedback_reputation: 3.8
            }
        }
    ]
};

/**
 * Mock Vinted API response for a single item.
 */
export const mockItemResponse = {
    item: {
        id: 123456,
        title: 'Test Item',
        description: 'This is a test item',
        price: '10.99',
        currency: 'EUR',
        size: 'M',
        brand_title: 'Test Brand',
        url: 'https://www.vinted.fr/items/123456',
        photos: [{ url: 'https://www.vinted.fr/images/123456.jpg' }],
        user: {
            id: 654321,
            login: 'seller',
            feedback_reputation: 4.5
        }
    }
};

/**
 * Mock Telegram context.
 */
export const mockTelegramContext = {
    from: {
        id: 123456789,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
    },
    chat: {
        id: 123456789,
        type: 'private'
    },
    message: {
        text: '/command arg1 arg2'
    },
    reply: jest.fn().mockResolvedValue(true),
    editMessageText: jest.fn().mockResolvedValue(true),
    answerCbQuery: jest.fn().mockResolvedValue(true)
}; 