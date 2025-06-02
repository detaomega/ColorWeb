// routes/questionroute.js - 極簡化版

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// 問題管理路由
router.post('/questions', questionController.createQuestion);

// 遊戲特定問題路由
router.post('/games/:gameId/questions', questionController.addQuestionsToGame);
router.get('/games/:gameId/question', questionController.getCurrentQuestion);
router.post('/games/:gameId/question/next', questionController.startNextQuestion);
router.post('/games/:gameId/question/answer', questionController.submitAnswer);
router.get('/games/:gameId/rankings', questionController.getPlayerRankings);

module.exports = router;