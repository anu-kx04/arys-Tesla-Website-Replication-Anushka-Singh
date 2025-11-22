const mongoose = require('mongoose');

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
        type: mongoose.Schema.Types.Mixed
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Processing', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentDetails: {
        last4: String,
        brand: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
