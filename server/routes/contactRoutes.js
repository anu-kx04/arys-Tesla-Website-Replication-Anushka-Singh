const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const Joi = require('joi');

/**
 * Validation Schema
 */
const contactSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null),
    model: Joi.string().allow('', null),
    message: Joi.string().max(2000).required()
});

/**
 * Submit Contact Message
 * POST /api/contact/submit
 */
router.post('/submit', async (req, res) => {
    try {
        // Validate request data
        const { error, value } = contactSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        // Create contact message
        const contactMessage = await ContactMessage.create({
            userId: req.session?.userId || null,
            ...value
        });

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!',
            data: contactMessage
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit contact message',
            error: error.message
        });
    }
});

/**
 * Get User's Contact Messages (requires authentication)
 * GET /api/contact/my-messages
 */
router.get('/my-messages', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const messages = await ContactMessage.find({ userId: req.session.userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: messages,
            count: messages.length
        });
    } catch (error) {
        console.error('Fetch contact messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
});

/**
 * Get All Contact Messages (Admin)
 * GET /api/contact/all
 */
router.get('/all', async (req, res) => {
    try {
        // TODO: Add admin authentication middleware
        const { status, limit = 50, skip = 0 } = req.query;

        const query = status ? { status } : {};

        const messages = await ContactMessage.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('userId', 'name email')
            .lean();

        const total = await ContactMessage.countDocuments(query);

        res.json({
            success: true,
            data: messages,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('Fetch all messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
});

/**
 * Update Contact Message Status (Admin)
 * PATCH /api/contact/:id/status
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['New', 'In Review', 'Responded', 'Closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: message
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
});

module.exports = router;
