// db_structures/game.js
const mongoose = require('mongoose');

// 內嵌的玩家 Schema
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
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// 遊戲 Schema
const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  gameTitle: {
    type: String,
    default: "Anime Guessing Game"
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  // 當前問題編號 (1-based)
  currentQuestionNumber: {
    type: Number,
    default: 0
  },
  // 遊戲設定
  settings: {
    // 每次圖片顯示的時間間隔（秒）
    revealInterval: {
      type: Number,
      default: 5
    },
    // 所有圖片顯示後的答題時間（秒）
    answerTime: {
      type: Number,
      default: 20
    },
    // 每題最高分數
    maxPointsPerQuestion: {
      type: Number,
      default: 100
    },
    // 回合數（問題數）
    rounds: {
      type: Number,
      default: 10
    },
    // 包含的類別
    categories: [{
      type: String
    }],
    // 難度
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed'
    }
  },
  // 內嵌玩家列表
  players: [playerSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  finishedAt: {
    type: Date
  },
  // 主持人信息
  hostId: {
    type: String
  }
});

// 添加排序玩家的方法
gameSchema.methods.getRankedPlayers = function() {
  return this.players.sort((a, b) => b.score - a.score);
};

// 查找玩家的方法
gameSchema.methods.findPlayerByUsername = function(username) {
  return this.players.find(player => player.username === username);
};

module.exports = mongoose.model('Game', gameSchema);