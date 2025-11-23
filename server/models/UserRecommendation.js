const mongoose = require('mongoose');

const userRecommendationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    preferences: {
        priceRange: {
            min: { type: Number, required: true },
            max: { type: Number, required: true }
        },
        dailyDistance: {
            type: Number,
            required: true
        },
        passengers: {
            type: Number,
            min: 1,
            max: 7,
            required: true
        },
        style: {
            type: String,
            enum: ['Sedan', 'SUV', 'Pickup', 'Any'],
            required: true
        },
        cityHighwayRatio: {
            type: Number,
            min: 0,
            max: 100,
            required: true
        },
        colorPreference: {
            type: String,
            default: 'Any'
        }
    },
    recommendations: [{
        vehicleId: {
            type: String,
            required: true
        },
        vehicleName: String,
        score: {
            type: Number,
            required: true
        },
        reasons: [String],
        estimatedPrice: Number,
        estimatedRange: String,
        chargingPlan: String,
        deliveryEstimate: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserRecommendation', userRecommendationSchema);
