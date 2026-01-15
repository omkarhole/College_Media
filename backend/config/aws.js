const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const logger = require('../utils/logger');
// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});
const s3 = new AWS.S3();
// Check if S3 is configured
const isS3Configured = () => {
    return !!(process.env.AWS_ACCESS_KEY_ID &&
              process.env.AWS_SECRET_ACCESS_KEY &&
              process.env.AWS_S3_BUCKET);
};
// S3 storage configuration for different file types
const s3Storage = (folder = 'uploads') => {
    return multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            const filename = `${folder}/${file.fieldname}-${uniqueSuffix}${extension}`;
            cb(null, filename);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read', // Make files publicly accessible
        serverSideEncryption: 'AES256'
    });
};
// Direct upload function for processed files
const uploadToS3 = async (buffer, key, contentType = 'image/jpeg') => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
        ServerSideEncryption: 'AES256'
    };

    try {
        const result = await s3.upload(params).promise();
        logger.info('File uploaded to S3 successfully', { key: result.Key, location: result.Location });
        return result;
    } catch (error) {
        logger.error('S3 upload failed', { error: error.message, key });
        throw error;
    }
};
// Get S3 URL
const getS3Url = (key) => {
    if (!key) return null;
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};
module.exports = {
    s3,
    isS3Configured,
    s3Storage,
    uploadToS3,
    getS3Url
};
