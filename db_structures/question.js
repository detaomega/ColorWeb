// db_structures/question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // 動漫名稱或標題（正確答案）
  animeTitle: {
    type: String,
    required: true
  },
  // 可接受的替代答案（縮寫、替代標題等）
  alternativeTitles: [{
    type: String
  }],
  // 逐步顯示的圖片
  images: [{
    url: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
  }],
  // 難度級別
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  // 創建時間戳
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 檢查答案是否正確的方法
questionSchema.methods.isCorrectAnswer = function(answer) {
  if (!answer) return false;
  
  // 轉為小寫進行不區分大小寫的比較
  const normalizedAnswer = answer.toLowerCase().trim();
  const normalizedTitle = this.animeTitle.toLowerCase().trim();
  
  // 檢查是否匹配主標題
  if (normalizedAnswer === normalizedTitle) return true;
  
  // 檢查是否匹配任何替代標題
  return this.alternativeTitles.some(title => 
    normalizedAnswer === title.toLowerCase().trim()
  );
};

module.exports = mongoose.model('Question', questionSchema);