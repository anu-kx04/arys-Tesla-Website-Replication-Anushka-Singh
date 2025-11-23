const mongoose = require('mongoose');

const recommendationAnalyticsSchema = new mongoose.Schema({
    filterType: {
        type: String,
        required: true,
        enum: ['priceRange', 'dailyDistance', 'passengers', 'style', 'cityHighwayRatio', 'colorPreference']
    },
    filterValue: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        default: 1
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for efficient queries
recommendationAnalyticsSchema.index({ filterType: 1, filterValue: 1, date: -1 });

module.exports = mongoose.model('RecommendationAnalytics', recommendationAnalyticsSchema);
