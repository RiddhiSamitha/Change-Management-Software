// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ✅ CORS setup
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3003', 'http://127.0.0.1:3000', 'http://127.0.0.1:3003'], // allow both local React origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ✅ Use CORS for all requests
app.use(cors(corsOptions));

// ✅ Handle preflight OPTIONS requests for all routes (Express v5-safe)
app.options(/.*/, cors(corsOptions));

// ✅ JSON parser
app.use(express.json());

// --- Test route ---
app.get('/', (req, res) => {
  res.send('✅ SCMS API is running and reachable!');
});

// --- Connect to MongoDB ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/change-requests', require('./routes/changeRequests'));
app.use('/api/admin', require('./routes/admin'));

// --- Start Server ---
const PORT = process.env.PORT || 5001;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;