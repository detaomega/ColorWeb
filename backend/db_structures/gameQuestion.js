// db_structures/gamequestion.js
const mongoose = require('mongoose');

const gameQuestionSchema = new mongoose.Schema({
  // 引用 Game 模型
  gameId: {
    type: String,
    ref: 'Game',
    required: true
  },
  // 引用 Question 模型
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  // 使用的圖片集ID
  imageSetId: {
    type: String,
    required: true
  },
  // 當前顯示的圖片索引 (0 = 第一張圖片, 1 = 第二張圖片, 等等)
  currentImageIndex: {
    type: Number,
    default: -1  // -1 表示還沒開始顯示圖片
  },
  // 問題在遊戲中的狀態
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
  },
  // 此問題的時間限制（秒）
  timeLimit: {
    type: Number,
    default: 60
  },
  // 問題在遊戲中的順序（從1開始）
  order: {
    type: Number,
    required: true
  }
});

// 創建唯一索引以確保一個問題在一個遊戲中只使用一次
gameQuestionSchema.index({ gameId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('GameQuestion', gameQuestionSchema);