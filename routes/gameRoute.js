// routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// 創建新遊戲
router.post('/', gameController.createGame);

// 獲取特定遊戲信息
router.get('/:gameId', gameController.getGame);

// 更新遊戲狀態
router.patch('/:gameId/status', gameController.updateGameStatus);

module.exports = router;