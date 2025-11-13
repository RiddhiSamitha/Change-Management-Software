const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Import your Express app

let mongoServer;

// --- Jest Hooks for Setup/Teardown ---

// Start in-memory MongoDB before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect mongoose to the in-memory DB
    await mongoose.connect(uri);
    console.log(`\n\n--- Connected to Mock MongoDB: ${uri} ---\n`);
});

// Clear all collections after each test to ensure isolation
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

// Stop in-memory MongoDB after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('\n\n--- Mock MongoDB Disconnected ---');
});

// Expose the Express app if needed for Supertest, though Supertest often takes the app directly
global.app = app;