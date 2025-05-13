// routes/playerRoutes.js
const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// 創建玩家（加入遊戲）
router.post('/games/:gameId/players', playerController.createPlayer);

// 獲取特定遊戲中的所有玩家
router.get('/games/:gameId/players', playerController.getGamePlayers);

// 更新玩家分數
router.patch('/games/:gameId/players/:username/score', playerController.updatePlayerScore);

module.exports = router;