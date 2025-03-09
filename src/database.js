import mongoose from 'mongoose';
const { Schema, model } = mongoose;

import ConfigurationManager from './utils/config_manager.js';
import Logger from './utils/logger.js';

const mongoConfig = ConfigurationManager.getMongoDBConfig;

// Connect to MongoDB
mongoose.connect(mongoConfig.uri, {
    // Add connection options for better performance
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000
})
    .then(() => Logger.info('Connected to MongoDB.'))
    .catch((err) => Logger.error(err));

// User Schema
const UserSchema = new Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    preferences: {
        language: { type: String, default: 'en' },
        notifications: { type: Boolean, default: true }
    },
    monitors: [{ type: Schema.Types.ObjectId, ref: 'Monitor' }],
    maxMonitors: { type: Number, default: 5 },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
}, {
    timestamps: true,
    // Add optimistic concurrency control
    optimisticConcurrency: true
});

// Add indexes for better query performance
UserSchema.index({ telegramId: 1 });
UserSchema.index({ isAdmin: 1 });
UserSchema.index({ lastActive: 1 });

// Monitor Schema
const MonitorSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    name: { type: String },
    active: { type: Boolean, default: true },
    bannedKeywords: [{ type: String }],
    lastChecked: { type: Date },
    lastItem: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Add indexes for better query performance
MonitorSchema.index({ user: 1 });
MonitorSchema.index({ active: 1 });
MonitorSchema.index({ lastChecked: 1 });
MonitorSchema.index({ user: 1, active: 1 });

// Item Schema
const ItemSchema = new Schema({
    itemId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number },
    currency: { type: String },
    size: { type: String },
    brand: { type: String },
    url: { type: String, required: true },
    imageUrl: { type: String },
    seller: {
        id: { type: String },
        username: { type: String },
        rating: { type: Number }
    },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Add indexes for better query performance
ItemSchema.index({ itemId: 1 });
ItemSchema.index({ createdAt: 1 });
ItemSchema.index({ 'seller.id': 1 });

// Create models
const User = model('User', UserSchema);
const Monitor = model('Monitor', MonitorSchema);
const Item = model('Item', ItemSchema);

export { User, Monitor, Item }; 