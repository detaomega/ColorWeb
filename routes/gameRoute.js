// routes/gameroute.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gamecontroller');

// 創建新遊戲
router.post('/', gameController.createGame);

// 獲取特定遊戲資訊（包含遊戲中的排名）
router.get('/:gameId', gameController.getGame);

// 更新遊戲設定
router.patch('/:gameId/settings', gameController.updateGameSettings);

// 添加玩家到遊戲
router.post('/:gameId/players', gameController.addPlayer);

// 獲取遊戲玩家
router.get('/:gameId/players', gameController.getPlayers);

// 開始遊戲
router.post('/:gameId/start', gameController.startGame);

// 結束遊戲
router.post('/:gameId/end', gameController.endGame);

// 獲取遊戲結果
router.get('/:gameId/results', gameController.getGameResults);

module.exports = router;