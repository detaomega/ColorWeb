// server.js - Final Version
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const gameRoutes = require('./routes/gameRoute');
const playerRoutes = require('./routes/playerRoute');
const questionRoutes = require('./routes/questionRoute');

const app = express();

// Middleware
app.use(bodyParser.json());

// Serve static files (for images)
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => res.send('Anime Guessing Game API is running'));

// Register routes
app.use('/api/games', gameRoutes);
app.use('/api', playerRoutes);
app.use('/api', questionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});