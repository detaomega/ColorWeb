// models/Game.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  finishedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Game', gameSchema);