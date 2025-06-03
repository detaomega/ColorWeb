// routes/questionRoute.js - 修改版

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// 遊戲特定問題路由
router.get('/games/:gameId/question', questionController.getCurrentQuestion);
router.post('/games/:gameId/question/next', questionController.startNextQuestion);
router.post('/games/:gameId/question/answer', questionController.submitAnswer);
router.get('/games/:gameId/rankings', questionController.getPlayerRankings);

// 管理路由 - 獲取可用的動漫列表
router.get('/anime', questionController.getAvailableAnime);

module.exports = router;