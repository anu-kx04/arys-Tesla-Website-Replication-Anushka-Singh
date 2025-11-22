const express = require('express');
const router = express.Router();
const db = require('../database');

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
router.get('/', requireAuth, (req, res) => {
    try {
        const userId = req.session.user.id;
        const orders = db.findOrdersByUserId(userId);

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
});

// POST /api/orders - Create a new order
router.post('/', requireAuth, (req, res) => {
    try {
        const userId = req.session.user.id;
        const { vehicleId, vehicleName, config, selectedOptions, totalPrice, paymentDetails } = req.body;

        // Validate required fields
        if (!vehicleId || !vehicleName || !totalPrice) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create Order
        const newOrder = db.createOrder({
            userId,
            vehicleId,
            vehicleName,
            config,
            selectedOptions,
            totalPrice,
            paymentDetails
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
});

module.exports = router;
