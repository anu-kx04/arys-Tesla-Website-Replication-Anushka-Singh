const mongoose = require('mongoose');

/**
 * Order Schema
 * Stores vehicle orders and configurations
 */
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicleId: {
        type: String,
        required: true
    },
    vehicleName: {
        type: String,
        required: true
    },
    config: {
        battery: String,
        paint: String,
        wheels: String,
        interior: String,
        autopilot: String
    },
    selectedOptions: {
        battery: mongoose.Schema.Types.Mixed,
        paint: mongoose.Schema.Types.Mixed,
        wheels: mongoose.Schema.Types.Mixed,
        interior: mongoose.Schema.Types.Mixed,
        autopilot: mongoose.Schema.Types.Mixed
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDetails: {
        last4: String,
        brand: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Processing', 'In Production', 'Ready for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    orderNumber: {
        type: String,
        unique: true
    },
    estimatedDelivery: Date,
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.orderNumber = `TSL-${timestamp}-${random}`;
    }
    next();
});

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
