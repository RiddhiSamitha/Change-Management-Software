// scms-api/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:3003' })); 
app.use(express.json());

// --- Basic Route for Testing ---
app.get('/', (req, res) => {
  res.send('SCMS API is running!');
});

// --- Routes ---
app.use('/', require('./routes/auth'));
app.use('/api/change-requests', require('./routes/changeRequests'));

// Export the app, WITHOUT connecting to DB or listening
module.exports = app;

// This block only executes when 'node server.js' is run directly, NOT when imported for tests
if (require.main === module) {
    // --- Database Connection ---
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('MongoDB connected successfully.'))
        .catch(err => console.error('MongoDB connection error:', err));
    
    // --- Server Listen ---
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}