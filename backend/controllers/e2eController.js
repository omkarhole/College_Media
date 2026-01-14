const KeyBundle = require('../models/KeyBundle');
const User = require('../models/User');
const logger = require('../utils/logger');

class E2EController {
    /**
     * Upload or update device keys
     */
    static async uploadKeys(req, res) {
        try {
            const { identityKey, signedPreKey, oneTimePreKeys, deviceId } = req.body;
            const userId = req.userId;

            if (!identityKey || !signedPreKey) {
                return res.status(400).json({ success: false, message: 'Missing required keys' });
            }

            // Upsert the key bundle
            await KeyBundle.findOneAndUpdate(
                { userId, deviceId: deviceId || 1 },
                {
                    userId,
                    deviceId: deviceId || 1,
                    identityKey,
                    signedPreKey,
                    $addToSet: { oneTimePreKeys: { $each: oneTimePreKeys || [] } },
                    lastUpdated: Date.now()
                },
                { upsert: true, new: true }
            );

            res.json({ success: true, message: 'Keys uploaded successfully' });
        } catch (error) {
            logger.error('Error uploading E2EE keys:', error);
            res.status(500).json({ success: false, message: 'Failed to upload keys' });
        }
    }

    /**
     * Fetch keys for a specific user to start chat
     * Returns: Identity Key, Signed PreKey, and ONE One-Time Key (if available)
     */
    static async fetchKeys(req, res) {
        try {
            const targetUserId = req.params.userId;
            const deviceId = req.query.deviceId || 1;

            const bundle = await KeyBundle.findOne({ userId: targetUserId, deviceId });

            if (!bundle) {
                return res.status(404).json({ success: false, message: 'Keys not found for user' });
            }

            // Consume one one-time key
            let oneTimeKey = null;
            if (bundle.oneTimePreKeys && bundle.oneTimePreKeys.length > 0) {
                oneTimeKey = bundle.oneTimePreKeys[0];

                // Atomically remove the consumed key
                await KeyBundle.updateOne(
                    { _id: bundle._id },
                    { $pull: { oneTimePreKeys: { keyId: oneTimeKey.keyId } } }
                );
            }

            res.json({
                success: true,
                keys: {
                    identityKey: bundle.identityKey,
                    signedPreKey: bundle.signedPreKey,
                    oneTimeKey: oneTimeKey,
                    deviceId: bundle.deviceId
                }
            });
        } catch (error) {
            logger.error('Error fetching E2EE keys:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch keys' });
        }
    }

    /**
     * Replenish One-Time Keys check (Client calls this to see if they need to upload more)
     */
    static async checkKeyCount(req, res) {
        try {
            const deviceId = req.query.deviceId || 1;
            const bundle = await KeyBundle.findOne({ userId: req.userId, deviceId });
            const count = bundle ? bundle.oneTimePreKeys.length : 0;
            res.json({ success: true, count });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Check failed' });
        }
    }
}

module.exports = E2EController;
