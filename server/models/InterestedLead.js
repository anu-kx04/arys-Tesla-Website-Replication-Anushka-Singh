const mongoose = require('mongoose');

/**
 * Interested Lead Schema
 * Captures "Interested in Tesla?" popup responses
 */
const interestedLeadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    preferredModel: {
        type: String,
        required: true
    },
    interestedIn: {
        type: [String],
        enum: ['Purchase', 'Test Drive', 'Learn More', 'Pricing', 'Financing'],
        default: ['Learn More']
    },
    source: {
        type: String,
        enum: ['Homepage', 'Model Page', 'Configurator', 'Other'],
        default: 'Model Page'
    },
    contacted: {
        type: Boolean,
        default: false
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
interestedLeadSchema.index({ email: 1 });
interestedLeadSchema.index({ preferredModel: 1, createdAt: -1 });
interestedLeadSchema.index({ contacted: 1 });

module.exports = mongoose.model('InterestedLead', interestedLeadSchema);
