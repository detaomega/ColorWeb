// controllers/gamecontroller.js
const Game = require('../db_structures/game');
const GameQuestion = require('../db_structures/gamequestion');
const Question = require('../db_structures/question');
const { v4: uuidv4 } = require('uuid');

// 創建新遊戲
exports.createGame = async (req, res) => {
  try {
    const { 
      gameTitle,
      settings 
    } = req.body;
    
    const gameId = uuidv4(); // 生成唯一遊戲ID
    
    // 創建遊戲，可選設定
    const game = new Game({
      gameId: gameId,
      gameTitle: gameTitle || "Anime Guessing Game",
      settings: settings || {},
      players: [] // 初始化空的玩家列表
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
    const questionCount = await GameQuestion.countDocuments({ gameId });
    
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
      score: 0,
      answers: []
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
    
    // 檢查是否有問題
    const questionCount = await GameQuestion.countDocuments({ gameId });
    
    if (questionCount === 0) {
      return res.status(400).json({
        success: false,
        message: '遊戲需要至少一個問題才能開始'
      });
    }
    
    // 更新遊戲狀態
    game.status = 'active';
    game.startedAt = new Date();
    game.currentQuestionNumber = 1; // 從第一個問題開始
    
    await game.save();
    
    // 初始化第一個問題
    const firstQuestion = await GameQuestion.findOne({
      gameId: game.gameId,
      order: 1
    });
    
    if (firstQuestion) {
      firstQuestion.status = 'pending';
      firstQuestion.currentImageIndex = -1; // 開始前沒有圖片顯示
      await firstQuestion.save();
    }
    
    res.status(200).json({
      success: true,
      message: '遊戲已開始',
      game: game,
      totalQuestions: questionCount
    });
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
    
    // 獲取問題和答案
    const gameQuestions = await GameQuestion.find({ gameId })
      .sort({ order: 1 })
      .populate('questionId');
    
    // 計算統計資料
    const totalAnswers = game.players.reduce((sum, player) => sum + player.answers.length, 0);
    const correctAnswers = game.players.reduce((sum, player) => 
      sum + player.answers.filter(a => a.isCorrect).length, 0);
    
    // 遊戲統計資料
    const gameStats = {
      totalQuestions: gameQuestions.length,
      totalAnswers: totalAnswers,
      correctAnswers: correctAnswers,
      correctPercentage: totalAnswers > 0 
        ? Math.round((correctAnswers / totalAnswers) * 100) 
        : 0,
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
      players: rankedPlayers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取玩家列表失敗',
      error: error.message
    });
  }
};

module.exports = exports;