const mongoose = require('mongoose');

/**
 * Service Request Schema
 * Stores vehicle servicing appointments and maintenance requests
 */
const serviceRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceDate: {
        type: Date,
        required: [true, 'Service date is required']
    },
    vehicleModel: {
        type: String,
        required: [true, 'Vehicle model is required']
    },
    vin: {
        type: String,
        trim: true,
        uppercase: true
    },
    issueDescription: {
        type: String,
        required: [true, 'Issue description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    currentKm: {
        type: Number,
        min: [0, 'Kilometers cannot be negative']
    },
    serviceType: {
        type: String,
        enum: ['Regular Maintenance', 'Repair', 'Battery Service', 'Software Update', 'Inspection', 'Other'],
        default: 'Regular Maintenance'
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for user queries
serviceRequestSchema.index({ userId: 1, createdAt: -1 });
serviceRequestSchema.index({ status: 1, serviceDate: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
