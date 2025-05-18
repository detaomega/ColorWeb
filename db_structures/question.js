// db_structures/question.js - 最終簡化版
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// 定義單一圖片組的模式
const imageSetSchema = new mongoose.Schema({
  // 唯一ID
  setId: {
    type: String,
    required: true,
    default: () => uuidv4() // 自動生成唯一ID
  },
  // 圖片集名稱
  setName: {
    type: String,
    required: true
  },
  // 圖片URL列表 - 超簡化，只存URL陣列
  images: [{
    type: String,
    required: true
  }]
});

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
  // 多組圖片集合
  imageSets: [imageSetSchema],
  // 創建時間戳
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);