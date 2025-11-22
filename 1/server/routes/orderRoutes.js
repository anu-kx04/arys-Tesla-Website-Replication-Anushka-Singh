const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'You must be logged in to access this resource'
        });
    }
    next();
};

// GET /api/orders - Get all orders for the authenticated user
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user._id || req.session.user.id;

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })  // Most recent first
            .lean();

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

// POST /api/orders - Create a new order
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user._id || req.session.user.id;
        const { vehicleId, vehicleName, config, selectedOptions, totalPrice } = req.body;

        // Validate required fields
        if (!vehicleId || !vehicleName || !totalPrice) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: vehicleId, vehicleName, or totalPrice'
            });
        }

        // Create new order
        const newOrder = new Order({
            userId,
            vehicleId,
            vehicleName,
            config,
            selectedOptions,
            totalPrice,
            status: 'Paid'
        });

        await newOrder.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
});

module.exports = router;
