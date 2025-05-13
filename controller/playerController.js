// controllers/playerController.js
const Player = require('../models/Player');
const Game = require('../models/Game');

// 創建玩家（加入遊戲）
exports.createPlayer = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: '需要提供用戶名'
      });
    }
    
    // 檢查遊戲是否存在
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    // 檢查遊戲是否仍在等待狀態
    if (game.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: '遊戲已經開始或已結束，無法加入新玩家'
      });
    }
    
    // 檢查玩家名稱在該遊戲中是否已存在
    const existingPlayer = await Player.findOne({ gameId, username });
    
    if (existingPlayer) {
      return res.status(409).json({
        success: false,
        message: '此遊戲中已有使用相同名稱的玩家'
      });
    }
    
    // 創建新玩家
    const player = new Player({
      username,
      gameId
    });
    
    await player.save();
    
    res.status(201).json({
      success: true,
      message: '成功加入遊戲',
      player: player
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '創建玩家失敗',
      error: error.message
    });
  }
};

// 獲取特定遊戲中的所有玩家
exports.getGamePlayers = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // 檢查遊戲是否存在
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    const players = await Player.find({ gameId }).sort({ score: -1 });
    
    res.status(200).json({
      success: true,
      players: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取玩家列表失敗',
      error: error.message
    });
  }
};

// 更新玩家分數
exports.updatePlayerScore = async (req, res) => {
  try {
    const { gameId, username } = req.params;
    const { score } = req.body;
    
    if (score === undefined) {
      return res.status(400).json({
        success: false,
        message: '需要提供分數'
      });
    }
    
    // 檢查遊戲是否存在且處於活動狀態
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
        message: '遊戲不在活動狀態，無法更新分數'
      });
    }
    
    // 查找並更新玩家
    const player = await Player.findOne({ gameId, username });
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: '找不到玩家'
      });
    }
    
    player.score = score;
    await player.save();
    
    res.status(200).json({
      success: true,
      message: '玩家分數更新成功',
      player: player
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新玩家分數失敗',
      error: error.message
    });
  }
};