const mongoose = require('mongoose');

/**
 * Analytics Schema
 * Tracks user interactions, clicks, and behavior for popularity analytics
 */
const analyticsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for anonymous users
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    eventType: {
        type: String,
        required: true,
        enum: ['model_view', 'paint_click', 'wheel_click', 'interior_click', 'shop_click', 'configurator_open', 'page_view']
    },
    modelId: {
        type: String,
        index: true
    },
    paintColor: String,
    wheelType: String,
    interiorType: String,
    duration: {
        type: Number, // in seconds
        default: 0
    },
    location: {
        country: String,
        city: String,
        region: String,
        ip: String
    },
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Indexes for fast queries
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ modelId: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
