const express = require('express');
const router = express.Router();
const CustomerQuery = require('../models/CustomerQuery');
const InterestedLead = require('../models/InterestedLead');
const Joi = require('joi');

/**
 * Validation Schemas
 */
const querySchema = Joi.object({
    category: Joi.string().valid('Billing', 'Servicing', 'Features', 'Test Drive', 'Other').required(),
    subject: Joi.string().max(200).required(),
    query: Joi.string().max(2000).required()
});

const leadSchema = Joi.object({
    email: Joi.string().email().required(),
    preferredModel: Joi.string().required(),
    interestedIn: Joi.array().items(Joi.string().valid('Purchase', 'Test Drive', 'Learn More', 'Pricing', 'Financing')),
    source: Joi.string().valid('Homepage', 'Model Page', 'Configurator', 'Other')
});

/**
 * Submit Customer Query
 * POST /api/customer-care/query
 */
router.post('/query', async (req, res) => {
    try {
        // Check authentication
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to submit a query'
            });
        }

        // Validate request data
        const { error, value } = querySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        // Create customer query
        const query = await CustomerQuery.create({
            userId: req.session.userId,
            ...value
        });

        res.status(201).json({
            success: true,
            message: 'Your query has been submitted successfully. Our team will respond soon!',
            data: query
        });
    } catch (error) {
        console.error('Query submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit query',
            error: error.message
        });
    }
});

/**
 * Get User's Queries
 * GET /api/customer-care/my-queries
 */
router.get('/my-queries', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const queries = await CustomerQuery.find({ userId: req.session.userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: queries,
            count: queries.length
        });
    } catch (error) {
        console.error('Fetch queries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch queries',
            error: error.message
        });
    }
});

/**
 * Get Query by ID
 * GET /api/customer-care/query/:id
 */
router.get('/query/:id', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const query = await CustomerQuery.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Query not found'
            });
        }

        res.json({
            success: true,
            data: query
        });
    } catch (error) {
        console.error('Fetch query error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch query',
            error: error.message
        });
    }
});

/**
 * Submit Interested Lead
 * POST /api/customer-care/interested
 */
router.post('/interested', async (req, res) => {
    try {
        // Validate request data
        const { error, value } = leadSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        // Create interested lead
        const lead = await InterestedLead.create({
            userId: req.session?.userId || null,
            ...value
        });

        res.status(201).json({
            success: true,
            message: 'Thank you for your interest! Our team will contact you soon.',
            data: lead
        });
    } catch (error) {
        console.error('Lead submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit interest',
            error: error.message
        });
    }
});

/**
 * Get All Queries (Admin)
 * GET /api/customer-care/all-queries
 */
router.get('/all-queries', async (req, res) => {
    try {
        // TODO: Add admin authentication middleware
        const { status, category, limit = 50, skip = 0 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;

        const queries = await CustomerQuery.find(query)
            .sort({ priority: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('userId', 'name email')
            .lean();

        const total = await CustomerQuery.countDocuments(query);

        res.json({
            success: true,
            data: queries,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('Fetch all queries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch queries',
            error: error.message
        });
    }
});

/**
 * Update Query Status/Response (Admin)
 * PATCH /api/customer-care/query/:id
 */
router.patch('/query/:id', async (req, res) => {
    try {
        const { status, response } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (response) {
            updateData.response = response;
            updateData.respondedAt = new Date();
        }

        const query = await CustomerQuery.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Query not found'
            });
        }

        res.json({
            success: true,
            message: 'Query updated successfully',
            data: query
        });
    } catch (error) {
        console.error('Update query error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update query',
            error: error.message
        });
    }
});

module.exports = router;
