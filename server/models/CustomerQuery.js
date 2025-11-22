const mongoose = require('mongoose');

/**
 * Customer Query Schema
 * Stores customer care queries with categorization
 */
const customerQuerySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Billing', 'Servicing', 'Features', 'Test Drive', 'Other']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    query: {
        type: String,
        required: [true, 'Query is required'],
        maxlength: [2000, 'Query cannot exceed 2000 characters']
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    response: {
        type: String,
        maxlength: [5000, 'Response cannot exceed 5000 characters']
    },
    respondedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
customerQuerySchema.index({ userId: 1, createdAt: -1 });
customerQuerySchema.index({ status: 1, priority: -1 });
customerQuerySchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('CustomerQuery', customerQuerySchema);
