const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// Mock external services to avoid API calls and dependencies
jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: {
                send: jest.fn().mockResolvedValue({
                    id: 'mock-email-id',
                    data: { id: 'mock-email-id' },
                    error: null
                })
            }
        }))
    };
});

// Mock Redis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
        ttl: jest.fn(),
        keys: jest.fn(),
        on: jest.fn(),
        quit: jest.fn()
    }));
});

// Mock Cloudinary
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({
                public_id: 'mock-public-id',
                secure_url: 'https://mock.cloudinary.com/image.jpg'
            }),
            destroy: jest.fn().mockResolvedValue({ result: 'ok' })
        }
    }
}));

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
    S3: jest.fn().mockImplementation(() => ({
        upload: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                Location: 'https://mock-s3.amazonaws.com/test-file.jpg',
                Key: 'test-file.jpg'
            })
        }),
        deleteObject: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({})
        }),
        getSignedUrl: jest.fn().mockReturnValue('https://mock-s3.amazonaws.com/signed-url')
    })),
    config: {
        update: jest.fn()
    }
}));

// Mock Stripe
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        customers: {
            create: jest.fn().mockResolvedValue({ id: 'cus_mock' }),
            retrieve: jest.fn().mockResolvedValue({ id: 'cus_mock' })
        },
        paymentIntents: {
            create: jest.fn().mockResolvedValue({ id: 'pi_mock', client_secret: 'secret_mock' })
        },
        webhooks: {
            constructEvent: jest.fn().mockReturnValue({ type: 'payment_intent.succeeded' })
        }
    }));
});

// Mock OpenAI
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: 'Mock AI response' } }]
                })
            }
        }
    }));
});

// Mock logger to avoid JobRunner issues
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    critical: jest.fn(),
    logRequest: jest.fn(),
    logResponse: jest.fn(),
}));

// Mock metrics
jest.mock('../utils/metrics', () => ({
    client: {
        increment: jest.fn(),
        timing: jest.fn(),
        gauge: jest.fn(),
    }
}));

// Mock live stream service
jest.mock('../services/liveStreamService', () => ({
    init: jest.fn(),
    shutdown: jest.fn(),
}));

// Require app AFTER mocking
const app = require('../server');

let mongoServer;

// Connect to the in-memory database before running tests
beforeAll(async () => {
    // Start mongo memory server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect mongoose to the memory server
    // Use app.set to mock dbConnection for routes usage if necessary, 
    // but mongoose.connect sets the default connection used by models
    await mongoose.connect(uri, {
        // Mongoose 6+ defaults are good
    });

    // Pass the connection to the app if it relies on app.get('dbConnection')
    app.set('dbConnection', {
        useMongoDB: true,
        mongoose: mongoose,
        healthCheck: async () => ({ healthy: true })
    });
});

// Clear all data after each test
afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany();
        }
    }
});

// Disconnect and stop server after all tests
afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});
