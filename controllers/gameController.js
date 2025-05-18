// controllers/gameController.js
const Game = require('../db_structures/game');
const { v4: uuidv4 } = require('uuid');

// 創建新遊戲
exports.createGame = async (req, res) => {
  try {
    const gameId = uuidv4(); // 生成唯一的遊戲ID
    
    const game = new Game({
      gameId: gameId
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
    
    res.status(200).json({
      success: true,
      game: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取遊戲信息失敗',
      error: error.message
    });
  }
};

// 更新遊戲狀態
exports.updateGameStatus = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { status } = req.body;
    
    if (!['waiting', 'active', 'finished'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '無效的遊戲狀態'
      });
    }
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    game.status = status;
    
    if (status === 'finished') {
      game.finishedAt = new Date();
    }
    
    await game.save();
    
    res.status(200).json({
      success: true,
      message: '遊戲狀態更新成功',
      game: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新遊戲狀態失敗',
      error: error.message
    });
  }
};