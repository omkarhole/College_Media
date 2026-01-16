const jwt = require('jsonwebtoken');
const createLoaders = require('./loaders');

const JWT_SECRET = process.env.JWT_SECRET || 'college_media_secret_key';

const context = ({ req }) => {
    // 1. Authenticate User
    const token = req.headers.authorization?.split(' ')[1] || '';
    let user = null;
    if (token) {
        try {
            user = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            // Invalid token
        }
    }

    // 2. Initialize DataLoaders (Fresh per request)
    const loaders = createLoaders();

    return { user, loaders };
};

module.exports = context;
