const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required']
    },
    region: {
        type: String,
        default: 'US'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Method to return user data without sensitive info
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.passwordHash;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', userSchema);
