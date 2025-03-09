import { User, Monitor, Item } from './database.js';
import EventEmitter from './utils/event_emitter.js';
import ConfigurationManager from './utils/config_manager.js';
import Logger from './utils/logger.js';

const userConfig = ConfigurationManager.getUserConfig;
const telegramConfig = ConfigurationManager.getTelegramConfig;

const eventEmitter = new EventEmitter();

// CRUD Operations for User

/**
 * Create a new user.
 * @param {Object} userData - The user data.
 * @returns {Promise<Object>} - The created user.
 */
async function createUser({ telegramId, username, firstName, lastName }) {
    const isAdmin = telegramConfig.admin_user_ids.includes(telegramId);
    const user = new User({
        telegramId,
        username,
        firstName,
        lastName,
        maxMonitors: userConfig.max_private_chats_default,
        isAdmin
    });
    const result = await user.save();
    eventEmitter.emit('user:created', result);
    return result;
}

/**
 * Get a user by Telegram ID.
 * @param {string} telegramId - The Telegram ID.
 * @returns {Promise<Object|null>} - The user or null if not found.
 */
async function getUserByTelegramId(telegramId) {
    return await User.findOne({ telegramId });
}

/**
 * Update a user.
 * @param {string} telegramId - The Telegram ID.
 * @param {Object} updateData - The data to update.
 * @returns {Promise<Object|null>} - The updated user or null if not found.
 */
async function updateUser(telegramId, updateData) {
    const user = await User.findOneAndUpdate(
        { telegramId },
        { ...updateData, lastActive: new Date() },
        { new: true }
    );
    if (user) {
        eventEmitter.emit('user:updated', user);
    }
    return user;
}

/**
 * Delete a user.
 * @param {string} telegramId - The Telegram ID.
 * @returns {Promise<boolean>} - True if deleted, false otherwise.
 */
async function deleteUser(telegramId) {
    const result = await User.findOneAndDelete({ telegramId });
    if (result) {
        // Delete all monitors associated with this user
        await Monitor.deleteMany({ user: result._id });
        eventEmitter.emit('user:deleted', result);
        return true;
    }
    return false;
}

/**
 * Get all users.
 * @returns {Promise<Array>} - All users.
 */
async function getAllUsers() {
    return await User.find();
}

// CRUD Operations for Monitor

/**
 * Create a new monitor.
 * @param {Object} monitorData - The monitor data.
 * @returns {Promise<Object>} - The created monitor.
 */
async function createMonitor({ userId, url, name, bannedKeywords = [] }) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Check if user has reached their monitor limit
    if (user.monitors.length >= user.maxMonitors && !user.isAdmin) {
        throw new Error('Monitor limit reached');
    }

    const monitor = new Monitor({
        user: userId,
        url,
        name: name || `Monitor ${user.monitors.length + 1}`,
        bannedKeywords
    });

    const result = await monitor.save();
    
    // Add monitor to user's monitors array
    user.monitors.push(result._id);
    await user.save();
    
    eventEmitter.emit('monitor:created', result);
    return result;
}

/**
 * Get a monitor by ID.
 * @param {string} monitorId - The monitor ID.
 * @returns {Promise<Object|null>} - The monitor or null if not found.
 */
async function getMonitorById(monitorId) {
    return await Monitor.findById(monitorId);
}

/**
 * Get all monitors for a user.
 * @param {string} userId - The user ID.
 * @returns {Promise<Array>} - The user's monitors.
 */
async function getMonitorsByUserId(userId) {
    return await Monitor.find({ user: userId });
}

/**
 * Update a monitor.
 * @param {string} monitorId - The monitor ID.
 * @param {Object} updateData - The data to update.
 * @returns {Promise<Object|null>} - The updated monitor or null if not found.
 */
async function updateMonitor(monitorId, updateData) {
    const monitor = await Monitor.findByIdAndUpdate(
        monitorId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
    );
    if (monitor) {
        eventEmitter.emit('monitor:updated', monitor);
    }
    return monitor;
}

/**
 * Delete a monitor.
 * @param {string} monitorId - The monitor ID.
 * @returns {Promise<boolean>} - True if deleted, false otherwise.
 */
async function deleteMonitor(monitorId) {
    const monitor = await Monitor.findById(monitorId);
    if (!monitor) {
        return false;
    }

    // Remove monitor from user's monitors array
    const user = await User.findById(monitor.user);
    if (user) {
        user.monitors = user.monitors.filter(id => id.toString() !== monitorId);
        await user.save();
    }

    const result = await Monitor.findByIdAndDelete(monitorId);
    if (result) {
        eventEmitter.emit('monitor:deleted', result);
        return true;
    }
    return false;
}

/**
 * Get all active monitors.
 * @returns {Promise<Array>} - All active monitors.
 */
async function getAllActiveMonitors() {
    return await Monitor.find({ active: true });
}

// CRUD Operations for Item

/**
 * Create a new item.
 * @param {Object} itemData - The item data.
 * @returns {Promise<Object>} - The created item.
 */
async function createItem(itemData) {
    const item = new Item(itemData);
    const result = await item.save();
    eventEmitter.emit('item:created', result);
    return result;
}

/**
 * Get an item by Vinted item ID.
 * @param {string} itemId - The Vinted item ID.
 * @returns {Promise<Object|null>} - The item or null if not found.
 */
async function getItemByVintedId(itemId) {
    return await Item.findOne({ itemId });
}

/**
 * Check if an item exists by Vinted item ID.
 * @param {string} itemId - The Vinted item ID.
 * @returns {Promise<boolean>} - True if exists, false otherwise.
 */
async function itemExists(itemId) {
    const count = await Item.countDocuments({ itemId });
    return count > 0;
}

export default {
    // User operations
    createUser,
    getUserByTelegramId,
    updateUser,
    deleteUser,
    getAllUsers,
    
    // Monitor operations
    createMonitor,
    getMonitorById,
    getMonitorsByUserId,
    updateMonitor,
    deleteMonitor,
    getAllActiveMonitors,
    
    // Item operations
    createItem,
    getItemByVintedId,
    itemExists,
    
    // Event emitter
    eventEmitter
}; 