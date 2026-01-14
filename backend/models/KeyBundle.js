const mongoose = require('mongoose');

const keyBundleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deviceId: {
        type: Number,
        required: true,
        default: 1
    },
    identityKey: {
        type: String, // Base64 encoded public key
        required: true
    },
    signedPreKey: {
        key: { type: String, required: true },
        signature: { type: String, required: true },
        keyId: { type: Number, required: true }
    },
    oneTimePreKeys: [{
        key: String,
        keyId: Number
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Ensure one bundle per device per user
keyBundleSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('KeyBundle', keyBundleSchema);
