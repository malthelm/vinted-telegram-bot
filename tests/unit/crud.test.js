import mongoose from 'mongoose';
import { connect, closeDatabase, clearDatabase } from '../utils/db-handler.js';
import crud from '../../src/crud.js';
import { User, Monitor, Item } from '../../src/database.js';
import { mockUser, mockMonitor, mockItem } from '../utils/mock-data.js';

// Mock the EventEmitter
jest.mock('../../src/utils/event_emitter.js', () => {
    return class MockEventEmitter {
        constructor() {
            this.events = {};
        }
        on() { return this; }
        off() { return this; }
        emit() { return true; }
        once() { return this; }
    };
});

describe('CRUD Operations', () => {
    let mongod;
    let testUser;
    let testMonitor;
    let testItem;

    beforeAll(async () => {
        mongod = await connect();
    });

    afterAll(async () => {
        await closeDatabase(mongod);
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    describe('User Operations', () => {
        test('createUser creates a new user', async () => {
            const user = await crud.createUser(mockUser);
            expect(user).toBeDefined();
            expect(user.telegramId).toBe(mockUser.telegramId);
            expect(user.username).toBe(mockUser.username);
            expect(user.firstName).toBe(mockUser.firstName);
            expect(user.lastName).toBe(mockUser.lastName);
        });

        test('getUserByTelegramId returns a user by Telegram ID', async () => {
            testUser = await crud.createUser(mockUser);
            const user = await crud.getUserByTelegramId(mockUser.telegramId);
            expect(user).toBeDefined();
            expect(user.telegramId).toBe(mockUser.telegramId);
        });

        test('updateUser updates a user', async () => {
            testUser = await crud.createUser(mockUser);
            const updatedUser = await crud.updateUser(mockUser.telegramId, {
                firstName: 'Updated',
                'preferences.language': 'fr'
            });
            expect(updatedUser).toBeDefined();
            expect(updatedUser.firstName).toBe('Updated');
            expect(updatedUser.preferences.language).toBe('fr');
        });

        test('deleteUser deletes a user', async () => {
            testUser = await crud.createUser(mockUser);
            const result = await crud.deleteUser(mockUser.telegramId);
            expect(result).toBe(true);
            const user = await crud.getUserByTelegramId(mockUser.telegramId);
            expect(user).toBeNull();
        });

        test('getAllUsers returns all users', async () => {
            await crud.createUser(mockUser);
            await crud.createUser({
                ...mockUser,
                telegramId: '987654321',
                username: 'anotheruser'
            });
            const users = await crud.getAllUsers();
            expect(users).toBeDefined();
            expect(users.length).toBe(2);
        });
    });

    describe('Monitor Operations', () => {
        beforeEach(async () => {
            testUser = await crud.createUser(mockUser);
        });

        test('createMonitor creates a new monitor', async () => {
            const monitor = await crud.createMonitor({
                userId: testUser._id,
                url: mockMonitor.url,
                name: mockMonitor.name,
                bannedKeywords: mockMonitor.bannedKeywords
            });
            expect(monitor).toBeDefined();
            expect(monitor.url).toBe(mockMonitor.url);
            expect(monitor.name).toBe(mockMonitor.name);
            expect(monitor.bannedKeywords).toEqual(mockMonitor.bannedKeywords);

            // Check if the monitor was added to the user's monitors
            const updatedUser = await crud.getUserByTelegramId(mockUser.telegramId);
            expect(updatedUser.monitors).toContainEqual(monitor._id);
        });

        test('getMonitorById returns a monitor by ID', async () => {
            testMonitor = await crud.createMonitor({
                userId: testUser._id,
                url: mockMonitor.url,
                name: mockMonitor.name
            });
            const monitor = await crud.getMonitorById(testMonitor._id);
            expect(monitor).toBeDefined();
            expect(monitor.url).toBe(mockMonitor.url);
        });

        test('getMonitorsByUserId returns monitors for a user', async () => {
            await crud.createMonitor({
                userId: testUser._id,
                url: mockMonitor.url,
                name: 'Monitor 1'
            });
            await crud.createMonitor({
                userId: testUser._id,
                url: mockMonitor.url,
                name: 'Monitor 2'
            });
            const monitors = await crud.getMonitorsByUserId(testUser._id);
            expect(monitors).toBeDefined();
            expect(monitors.length).toBe(2);
        });

        test('updateMonitor updates a monitor', async () => {
            testMonitor = await crud.createMonitor({
                userId: testUser._id,
                url: mockMonitor.url,
                name: mockMonitor.name
            });
            const updatedMonitor = await crud.updateMonitor(testMonitor._id, {
                name: 'Updated Monitor',
                bannedKeywords: ['updated', 'keywords']
            });
            expect(updatedMonitor).toBeDefined();
            expect(updatedMonitor.name).toBe('Updated Monitor');
            expect(updatedMonitor.bannedKeywords).toEqual(['updated', 'keywords']);
        });

        test('deleteMonitor deletes a monitor', async () => {
            testMonitor = await crud.createMonitor({
                userId: testUser._id,
                url: mockMonitor.url,
                name: mockMonitor.name
            });
            const result = await crud.deleteMonitor(testMonitor._id);
            expect(result).toBe(true);
            const monitor = await crud.getMonitorById(testMonitor._id);
            expect(monitor).toBeNull();

            // Check if the monitor was removed from the user's monitors
            const updatedUser = await crud.getUserByTelegramId(mockUser.telegramId);
            expect(updatedUser.monitors).not.toContainEqual(testMonitor._id);
        });

        test('getAllActiveMonitors returns all active monitors', async () => {
            await crud.createMonitor({
                userId: testUser._id,
                url: mockMonitor.url,
                name: 'Active Monitor',
                active: true
            });
            await crud.createMonitor({
                userId: testUser._id,
                url: mockMonitor.url,
                name: 'Inactive Monitor',
                active: false
            });
            const monitors = await crud.getAllActiveMonitors();
            expect(monitors).toBeDefined();
            expect(monitors.length).toBe(1);
            expect(monitors[0].name).toBe('Active Monitor');
        });
    });

    describe('Item Operations', () => {
        test('createItem creates a new item', async () => {
            const item = await crud.createItem(mockItem);
            expect(item).toBeDefined();
            expect(item.itemId).toBe(mockItem.itemId);
            expect(item.title).toBe(mockItem.title);
            expect(item.price).toBe(mockItem.price);
        });

        test('getItemByVintedId returns an item by Vinted ID', async () => {
            testItem = await crud.createItem(mockItem);
            const item = await crud.getItemByVintedId(mockItem.itemId);
            expect(item).toBeDefined();
            expect(item.itemId).toBe(mockItem.itemId);
        });

        test('itemExists checks if an item exists', async () => {
            testItem = await crud.createItem(mockItem);
            const exists = await crud.itemExists(mockItem.itemId);
            expect(exists).toBe(true);
            const notExists = await crud.itemExists('nonexistent');
            expect(notExists).toBe(false);
        });
    });
}); 