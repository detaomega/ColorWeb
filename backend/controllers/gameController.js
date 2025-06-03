// controllers/gameController.js
const Game = require('../db_structures/game');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');

// 在 gameController.js 最頂部加入這個
console.log('=== 啟動時路徑檢查 ===');
console.log('__dirname:', __dirname);
const testPath = path.join(__dirname, '../anime_path.json');
console.log('測試路徑:', testPath);
console.log('檔案存在:', fs.existsSync(testPath));

if (fs.existsSync(testPath)) {
  try {
    const testData = JSON.parse(fs.readFileSync(testPath, 'utf8'));
    console.log('✅ 檔案讀取成功，動漫數量:', Object.keys(testData).length);
  } catch (e) {
    console.log('❌ 檔案讀取失敗:', e.message);
  }
} else {
  console.log('❌ 檔案不存在，檢查這些位置:');
  [
    path.join(__dirname, '../anime_path.json'),
    path.join(__dirname, '../../anime_path.json'),
    path.join(__dirname, '../../../anime_path.json')
  ].forEach(p => {
    console.log(`  ${p}: ${fs.existsSync(p) ? '存在' : '不存在'}`);
  });
}

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

// 隨機選擇遊戲問題（增強版 - 包含答案讀取）
function selectRandomQuestions(animeData, count = 10) {
  const animeList = Object.keys(animeData);
  
  if (animeList.length < count) {
    throw new Error(`資料庫中只有 ${animeList.length} 部動漫，無法選擇 ${count} 題`);
  }
  
  // 隨機打亂動漫列表
  const shuffledAnime = animeList.sort(() => Math.random() - 0.5);
  
  // 選擇前 count 部動漫（確保不重複）
  const selectedAnime = shuffledAnime.slice(0, count);
  
  // 為每部動漫隨機選擇一個圖片集並讀取答案
  const questions = selectedAnime.map((animeTitle, index) => {
    const imagePaths = animeData[animeTitle].images;
    const randomImagePath = imagePaths[Math.floor(Math.random() * imagePaths.length)];
    
    // 讀取答案檔案
    const answer = readAnswerFile(randomImagePath);
    
    return {
      animeTitle: animeTitle,
      imagePath: randomImagePath,
      answer: answer, // 新增答案欄位
      order: index + 1,
      status: 'pending'
    };
  });
  
  return questions;
}

// 讀取答案檔案的函數
function readAnswerFile(imagePath) {
  try {
    // 將相對路徑轉換為絕對路徑
    const absoluteImagePath = path.resolve(imagePath);
    
    // 取得圖片資料夾的父目錄（動漫資料夾）
    const animeDirectory = path.dirname(absoluteImagePath);
    
    // 構建 answer.txt 的路徑
    const answerFilePath = path.join(animeDirectory, 'answer.txt');
    
    console.log('🔍 尋找答案檔案:', answerFilePath);
    
    // 檢查檔案是否存在
    if (!fs.existsSync(answerFilePath)) {
      console.warn('⚠️ 答案檔案不存在:', answerFilePath);
      return null; // 或返回預設值
    }
    
    // 讀取並處理答案檔案
    const answerContent = fs.readFileSync(answerFilePath, 'utf8').trim();
    
    console.log('✅ 成功讀取答案:', answerContent);
    
    // 如果答案檔案包含多行，可以用分號或換行分割
    const answers = answerContent.split(/[;\n]/).map(ans => ans.trim()).filter(ans => ans.length > 0);
    
    return {
      primary: answers[0] || answerContent, // 主要答案
      alternatives: answers.slice(1) || []   // 替代答案
    };
    
  } catch (error) {
    console.error('❌ 讀取答案檔案失敗:', error.message);
    console.error('❌ 圖片路徑:', imagePath);
    return null;
  }
}

// 創建新遊戲
exports.createGame = async (req, res) => {
  try {
    const { 
      gameTitle,
      settings,
      hostId
    } = req.body;
    const gameId = nanoid(8); // 生成唯一遊戲ID
    
    // 創建遊戲，可選設定
    const game = new Game({
      gameId: gameId,
      gameTitle: gameTitle || "Anime Guessing Game",
      settings: settings || {},
      players: [], // 初始化空的玩家列表
      questions: [] // 初始化空的問題列表
    });
    
    await game.save();
    
    res.status(201).json({
      success: true,
      message: '遊戲創建成功',
      game: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '遊戲創建失敗',
      error: error.message
    });
  }
};

// 獲取特定遊戲
exports.getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    // 獲取問題數量
    const questionCount = game.questions.length;
    
    // 排序玩家
    const rankedPlayers = game.getRankedPlayers();
    
    res.status(200).json({
      success: true,
      game: {
        ...game.toObject(),
        players: rankedPlayers,
        questionCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取遊戲信息失敗',
      error: error.message
    });
  }
};

// 更新遊戲設定
exports.updateGameSettings = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { settings } = req.body;
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: '只能在遊戲開始前更新設定'
      });
    }
    
    // 更新設定
    if (settings) {
      game.settings = {
        ...game.settings,
        ...settings
      };
    }
    
    await game.save();
    
    res.status(200).json({
      success: true,
      message: '遊戲設定更新成功',
      game: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新遊戲設定失敗',
      error: error.message
    });
  }
};

// 新增玩家到遊戲
exports.addPlayer = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: '需要提供用戶名'
      });
    }
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: '遊戲已經開始或已結束，無法加入新玩家'
      });
    }
    
    // 檢查玩家名稱是否已存在
    const existingPlayer = game.findPlayerByUsername(username);
    
    if (existingPlayer) {
      return res.status(409).json({
        success: false,
        message: '該用戶名已被使用'
      });
    }
    
    // 新增玩家
    game.players.push({
      username,
      score: 0
    });
    
    await game.save();
    
    const addedPlayer = game.findPlayerByUsername(username);
    
    res.status(201).json({
      success: true,
      message: '成功加入遊戲',
      player: addedPlayer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '加入遊戲失敗',
      error: error.message
    });
  }
};

// 開始遊戲
exports.startGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: '遊戲已經開始或已結束'
      });
    }
    
    // 檢查是否有玩家
    if (game.players.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要一個玩家才能開始遊戲'
      });
    }
    
    try {
      // 讀取動漫資料並選擇問題
      const animeData = loadAnimeData();
      const selectedQuestions = selectRandomQuestions(animeData, game.settings.rounds);
      
      // 將問題加入遊戲
      game.questions = selectedQuestions;
      
      // 更新遊戲狀態
      game.status = 'active';
      game.startedAt = new Date();
      game.currentQuestionNumber = 1; // 從第一個問題開始
      
      // 設置第一個問題為待命狀態
      if (game.questions.length > 0) {
        game.questions[0].status = 'pending';
      }
      
      await game.save();
      
      res.status(200).json({
        success: true,
        message: '遊戲已開始',
        game: game,
        totalQuestions: game.questions.length
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '開始遊戲失敗',
      error: error.message
    });
  }
};

// 結束遊戲
exports.endGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '遊戲不在活動狀態'
      });
    }
    
    // 更新遊戲狀態
    game.status = 'finished';
    game.finishedAt = new Date();
    
    await game.save();
    
    // 獲取玩家排名
    const rankedPlayers = game.getRankedPlayers();
    
    res.status(200).json({
      success: true,
      message: '遊戲已結束',
      game: game,
      players: rankedPlayers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '結束遊戲失敗',
      error: error.message
    });
  }
};

// 獲取遊戲結果和統計資料
exports.getGameResults = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    // 只允許查看已結束遊戲的完整結果
    if (game.status !== 'finished') {
      return res.status(400).json({
        success: false,
        message: '遊戲尚未結束，無法查看完整結果'
      });
    }
    
    // 獲取玩家排名
    const rankedPlayers = game.getRankedPlayers();
    
    // 遊戲統計資料
    const gameStats = {
      totalQuestions: game.questions.length,
      averageScore: rankedPlayers.length > 0
        ? Math.round(rankedPlayers.reduce((sum, p) => sum + p.score, 0) / rankedPlayers.length)
        : 0,
      gameDuration: game.finishedAt && game.startedAt
        ? Math.round((game.finishedAt - game.startedAt) / 1000) // 持續時間（秒）
        : null
    };
    
    res.status(200).json({
      success: true,
      game: game,
      players: rankedPlayers,
      gameStats: gameStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取遊戲結果失敗',
      error: error.message
    });
  }
};

// 獲取玩家列表
exports.getPlayers = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    // 獲取玩家排名
    const rankedPlayers = game.getRankedPlayers();
    res.status(200).json({
      success: true,
      players: rankedPlayers,
      hostId: game.hostId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取玩家列表失敗',
      error: error.message
    });
  }
};

// 得到所有的 Game



module.exports = exports;