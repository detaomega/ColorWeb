// models/Player.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    default: 0
  },
  gameId: {
    type: String,
    required: true,
    ref: 'Game'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// 複合索引確保每個遊戲中的玩家名稱是唯一的
playerSchema.index({ gameId: 1, username: 1 }, { unique: true });

module.exports = mongoose.model('Player', playerSchema);