const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';

let mongoServer;

beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;

    // Connect mongoose directly
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Create express app with routes
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Add routes
    app.use('/api/auth', require('../routes/auth'));
    app.use('/api/change-requests', require('../routes/changeRequests'));
    app.use('/api/admin', require('../routes/admin'));
    
    global.app = app;
}, 90000);

afterEach(async () => {
    // Don't clear after each test - let data persist within a test suite
    // This allows beforeAll setup to create users that stay for the whole suite
});

afterAll(async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.dropDatabase();
            await mongoose.disconnect();
        }
    } catch (e) {
        // Ignore errors
    }

    if (mongoServer) {
        await mongoServer.stop();
    }
}, 30000);
