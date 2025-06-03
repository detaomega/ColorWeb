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

// 遊戲中的問題 Schema（取代原本的 GameQuestion）
const gameQuestionSchema = new mongoose.Schema({
  // 動漫名稱
  animeTitle: {
    type: String,
    required: true
  },
  // 使用的圖片資料夾路徑
  imagePath: {
    type: String,
    required: true
  },
  // 問題在遊戲中的順序（從1開始）
  order: {
    type: Number,
    required: true
  },
  // 問題狀態
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  // 問題變為活動狀態的時間戳
  activatedAt: {
    type: Date
  },
  // 問題完成的時間戳
  completedAt: {
    type: Date
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
    }
  },
  // 內嵌玩家列表
  players: [playerSchema],
  // 遊戲中的問題列表
  questions: [gameQuestionSchema],
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

// 獲取當前問題的方法
gameSchema.methods.getCurrentQuestion = function() {
  return this.questions.find(q => q.order === this.currentQuestionNumber);
};

// 獲取指定順序問題的方法
gameSchema.methods.getQuestionByOrder = function(order) {
  return this.questions.find(q => q.order === order);
};

module.exports = mongoose.model('Game', gameSchema);