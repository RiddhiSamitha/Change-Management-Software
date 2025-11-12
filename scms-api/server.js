require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:3003' })); // Allow requests from your React app
app.use(express.json()); // To parse JSON bodies

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Basic Route for Testing ---
app.get('/', (req, res) => {
  res.send('SCMS API is running!');
});

const PORT = process.env.PORT || 5000;
app.use('/', require('./routes/auth'));
app.use('/api/change-requests', require('./routes/changeRequests'));
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));