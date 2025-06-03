// controllers/questionController.js
const Game = require('../db_structures/game');
const fs = require('fs');
const path = require('path');

// 讀取動漫資料
function loadAnimeData() {
  try {
    const dataPath = path.join(__dirname, '../anime_path.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('讀取動漫資料失敗:', error);
    return {};
  }
}

// 獲取圖片資料夾中的所有圖片檔案
function getImagesFromPath(imagePath) {
  try {
    // 將相對路徑轉換為絕對路徑
    const absolutePath = path.resolve(imagePath);
    
    if (!fs.existsSync(absolutePath)) {
      console.error('圖片資料夾不存在:', absolutePath);
      return [];
    }
    
    // 讀取資料夾中的所有檔案
    const files = fs.readdirSync(absolutePath);
    
    // 篩選圖片檔案（jpg, jpeg, png, gif）
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
    
    // 返回完整的檔案路徑
    return imageFiles.map(file => path.join(absolutePath, file));
  } catch (error) {
    console.error('讀取圖片資料夾失敗:', error);
    return [];
  }
}

// 獲取當前問題
exports.getCurrentQuestion = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // 查找遊戲
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({ success: false, message: '遊戲不在活動狀態' });
    }
    
    // 獲取當前問題
    const currentQuestion = game.getCurrentQuestion();
    
    if (!currentQuestion) {
      return res.status(404).json({ success: false, message: '找不到當前問題' });
    }
    
    // 獲取圖片列表
    const images = getImagesFromPath(currentQuestion.imagePath);
    
    if (images.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到問題的圖片檔案',
        imagePath: currentQuestion.imagePath
      });
    }
    
    // 返回問題資訊
    res.status(200).json({
      success: true,
      questionOrder: currentQuestion.order,
      animeTitle: currentQuestion.animeTitle,
      imagePath: currentQuestion.imagePath,
      images: images,
      totalQuestions: game.questions.length,
      status: currentQuestion.status
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '獲取當前問題失敗',
      error: error.message 
    });
  }
};

// 提交答案
exports.submitAnswer = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { username, score } = req.body;
    
    if (!username || score === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '玩家名稱和分數都是必需的' 
      });
    }
    
    // 查找遊戲
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({ success: false, message: '遊戲不在活動狀態' });
    }
    
    // 查找玩家
    const player = game.players.find(p => p.username === username);
    
    if (!player) {
      return res.status(404).json({ success: false, message: '找不到玩家' });
    }
    
    // 確保分數是非負數
    const finalScore = Math.max(0, score);
    
    // 直接增加玩家總分
    player.score += finalScore;
    
    await game.save();
    
    res.status(200).json({
      success: true,
      message: '分數更新成功',
      score: finalScore,
      totalScore: player.score
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '更新分數失敗',
      error: error.message 
    });
  }
};

// 開始下一個問題
exports.startNextQuestion = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // 查找遊戲
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({ success: false, message: '遊戲不在活動狀態' });
    }
    
    // 獲取當前問題並標記為已完成
    if (game.currentQuestionNumber > 0) {
      const currentQuestion = game.getCurrentQuestion();
      if (currentQuestion) {
        currentQuestion.status = 'completed';
        currentQuestion.completedAt = new Date();
      }
    }
    
    // 增加問題編號
    game.currentQuestionNumber += 1;
    
    // 檢查是否還有問題
    if (game.currentQuestionNumber > game.questions.length) {
      // 結束遊戲
      game.status = 'finished';
      game.finishedAt = new Date();
      await game.save();
      
      return res.status(200).json({
        success: true,
        message: '遊戲已結束',
        gameComplete: true,
        finalRankings: game.getRankedPlayers()
      });
    }
    
    // 設置新的當前問題為活動狀態
    const nextQuestion = game.getCurrentQuestion();
    if (nextQuestion) {
      nextQuestion.status = 'active';
      nextQuestion.activatedAt = new Date();
    }
    
    await game.save();
    
    res.status(200).json({
      success: true,
      message: '開始下一個問題',
      questionNumber: game.currentQuestionNumber,
      totalQuestions: game.questions.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '開始下一個問題失敗', 
      error: error.message 
    });
  }
};

// 獲取玩家排名
exports.getPlayerRankings = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    // 按分數排序玩家，只返回名稱和總分
    const rankings = game.getRankedPlayers()
      .map((player, index) => ({
        rank: index + 1,
        username: player.username,
        score: player.score
      }));
    
    res.status(200).json({
      success: true,
      rankings: rankings
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '獲取玩家排名失敗', 
      error: error.message 
    });
  }
};

// 獲取可用的動漫列表（用於管理）
exports.getAvailableAnime = async (req, res) => {
  try {
    const animeData = loadAnimeData();
    
    const animeList = Object.keys(animeData).map(animeTitle => ({
      title: animeTitle,
      imageSetCount: animeData[animeTitle].images.length,
      imagePaths: animeData[animeTitle].images
    }));
    
    res.status(200).json({
      success: true,
      totalAnime: animeList.length,
      animeList: animeList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取動漫列表失敗',
      error: error.message
    });
  }
};

module.exports = exports;