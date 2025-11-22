const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const Joi = require('joi');

/**
 * Validation Schema
 */
const serviceRequestSchema = Joi.object({
    serviceDate: Joi.date().min('now').required(),
    vehicleModel: Joi.string().required(),
    vin: Joi.string().allow('', null).uppercase(),
    issueDescription: Joi.string().max(1000).required(),
    currentKm: Joi.number().min(0).allow(null),
    serviceType: Joi.string().valid('Regular Maintenance', 'Repair', 'Battery Service', 'Software Update', 'Inspection', 'Other'),
    notes: Joi.string().allow('', null)
});

/**
 * Create Service Request
 * POST /api/servicing/request
 */
router.post('/request', async (req, res) => {
    try {
        // Check authentication
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to book a service'
            });
        }

        // Validate request data
        const { error, value } = serviceRequestSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        // Create service request
        const serviceRequest = await ServiceRequest.create({
            userId: req.session.userId,
            ...value
        });

        res.status(201).json({
            success: true,
            message: 'Service request created successfully',
            data: serviceRequest
        });
    } catch (error) {
        console.error('Service request creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create service request',
            error: error.message
        });
    }
});

/**
 * Get User's Service Requests
 * GET /api/servicing/my-requests
 */
router.get('/my-requests', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const requests = await ServiceRequest.find({ userId: req.session.userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: requests,
            count: requests.length
        });
    } catch (error) {
        console.error('Fetch service requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service requests',
            error: error.message
        });
    }
});

/**
 * Get Service Request by ID
 * GET /api/servicing/request/:id
 */
router.get('/request/:id', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Fetch service request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service request',
            error: error.message
        });
    }
});

/**
 * Update Service Request
 * PUT /api/servicing/request/:id
 */
router.put('/request/:id', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const request = await ServiceRequest.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        res.json({
            success: true,
            message: 'Service request updated successfully',
            data: request
        });
    } catch (error) {
        console.error('Update service request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update service request',
            error: error.message
        });
    }
});

/**
 * Cancel Service Request
 * DELETE /api/servicing/request/:id
 */
router.delete('/request/:id', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const request = await ServiceRequest.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { status: 'Cancelled' },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        res.json({
            success: true,
            message: 'Service request cancelled successfully',
            data: request
        });
    } catch (error) {
        console.error('Cancel service request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel service request',
            error: error.message
        });
    }
});

module.exports = router;
