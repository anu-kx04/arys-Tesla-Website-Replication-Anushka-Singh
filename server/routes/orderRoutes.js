const express = require('express');
const router = express.Router();
const db = require('../database'); // JSON database

/**
 * Create Order
 * POST /api/orders
 */
router.post('/', async (req, res) => {
    try {
        // Enhanced authentication check with detailed logging
        console.log('📝 Order creation attempt - Session data:', {
            hasSession: !!req.session,
            userId: req.session?.userId,
            userEmail: req.session?.userEmail
        });

        if (!req.session?.userId) {
            console.error('❌ Order creation failed: No active session or userId');
            return res.status(401).json({
                success: false,
                message: 'Please login to place an order. Your session may have expired.'
            });
        }

        // Validate required order data
        const { vehicleName, totalPrice } = req.body;
        if (!vehicleName || !totalPrice) {
            console.error('❌ Order creation failed: Missing required fields', req.body);
            return res.status(400).json({
                success: false,
                message: 'Missing required order information (vehicle name or price)'
            });
        }

        const orderData = {
            ...req.body,
            userId: req.session.userId
        };

        console.log('✅ Creating order:', orderData);

        // Create order
        const order = db.createOrder(orderData);

        console.log('✅ Order created successfully:', order.id);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });
    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order: ' + error.message,
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
