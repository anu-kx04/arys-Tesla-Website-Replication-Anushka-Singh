const express = require('express');
const router = express.Router();
const db = require('../database'); // JSON database

/**
 * Create Order
 * POST /api/orders
 */
router.post('/', async (req, res) => {
    try {
        // Check authentication
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to place an order'
            });
        }

        const orderData = {
            ...req.body,
            userId: req.session.userId
        };

        // Create order
        const order = db.createOrder(orderData);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
});

/**
 * Get User's Orders
 * GET /api/orders
 */
router.get('/', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const orders = db.findOrdersByUserId(req.session.userId);

        res.json({
            success: true,
            orders,
            count: orders.length
        });
    } catch (error) {
        console.error('Fetch orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

module.exports = router;
