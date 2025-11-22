const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const geoip = require('geoip-lite');
const { v4: uuidv4 } = require('crypto');

/**
 * Track Analytics Event
 * POST /api/analytics/track
 */
router.post('/track', async (req, res) => {
    try {
        const { eventType, modelId, paintColor, wheelType, interiorType, duration, sessionId } = req.body;

        // Get user IP and location
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || req.ip;
        const geo = geoip.lookup(ip);

        const analyticsData = {
            userId: req.session?.userId || null,
            sessionId: sessionId || req.sessionID || uuidv4(),
            eventType,
            modelId,
            paintColor,
            wheelType,
            interiorType,
            duration: duration || 0,
            location: geo ? {
                country: geo.country,
                city: geo.city,
                region: geo.region,
                ip: ip
            } : { ip },
            userAgent: req.headers['user-agent']
        };

        const analytics = await Analytics.create(analyticsData);

        res.status(201).json({
            success: true,
            message: 'Analytics tracked successfully',
            data: analytics
        });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track analytics',
            error: error.message
        });
    }
});

/**
 * Get Global Analytics Stats
 * GET /api/analytics/global-stats
 */
router.get('/global-stats', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Most viewed models
        const modelViews = await Analytics.aggregate([
            { $match: { eventType: 'model_view', timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$modelId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Most selected paint colors
        const paintClicks = await Analytics.aggregate([
            { $match: { eventType: 'paint_click', paintColor: { $ne: null }, timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$paintColor', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Most selected wheels
        const wheelClicks = await Analytics.aggregate([
            { $match: { eventType: 'wheel_click', wheelType: { $ne: null }, timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$wheelType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Most active regions
        const regionActivity = await Analytics.aggregate([
            { $match: { 'location.country': { $ne: null }, timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { country: '$location.country', city: '$location.city' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Total events
        const totalEvents = await Analytics.countDocuments({ timestamp: { $gte: thirtyDaysAgo } });

        res.json({
            success: true,
            data: {
                mostViewedModels: modelViews,
                mostSelectedPaints: paintClicks,
                mostSelectedWheels: wheelClicks,
                mostActiveRegions: regionActivity,
                totalEvents,
                period: '30 days'
            }
        });
    } catch (error) {
        console.error('Global stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});

/**
 * Get Trending Models
 * GET /api/analytics/trending-models
 */
router.get('/trending-models', async (req, res) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const trending = await Analytics.aggregate([
            {
                $match: {
                    eventType: { $in: ['model_view', 'configurator_open'] },
                    modelId: { $ne: null },
                    timestamp: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: '$modelId',
                    views: { $sum: 1 },
                    avgDuration: { $avg: '$duration' }
                }
            },
            { $sort: { views: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            success: true,
            data: trending,
            message: 'Trending models for last 7 days'
        });
    } catch (error) {
        console.error('Trending models error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending models',
            error: error.message
        });
    }
});

/**
 * Get User Analytics (requires authentication)
 * GET /api/analytics/user-stats
 */
router.get('/user-stats', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.session.userId;

        // User's most viewed model
        const mostViewed = await Analytics.aggregate([
            { $match: { userId, eventType: 'model_view' } },
            { $group: { _id: '$modelId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        // User's color preferences
        const colorPreference = await Analytics.aggregate([
            { $match: { userId, eventType: 'paint_click', paintColor: { $ne: null } } },
            { $group: { _id: '$paintColor', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        // User's wheel preferences
        const wheelPreference = await Analytics.aggregate([
            { $match: { userId, eventType: 'wheel_click', wheelType: { $ne: null } } },
            { $group: { _id: '$wheelType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        res.json({
            success: true,
            data: {
                mostViewedModel: mostViewed[0]?._id || null,
                favoriteColor: colorPreference[0]?._id || null,
                favoriteWheels: wheelPreference[0]?._id || null
            }
        });
    } catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user analytics',
            error: error.message
        });
    }
});

module.exports = router;
