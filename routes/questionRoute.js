// routes/questionroute.js
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questioncontroller');

// 問題管理路由
router.post('/questions', questionController.createQuestion);
router.get('/questions', questionController.getQuestions);

// 遊戲特定問題路由
router.post('/games/:gameId/questions', questionController.addQuestionsToGame);
router.get('/games/:gameId/question', questionController.getCurrentQuestion);
router.post('/games/:gameId/question/next-image', questionController.revealNextImage);
router.post('/games/:gameId/question/next', questionController.startNextQuestion);
router.post('/games/:gameId/question/answer', questionController.submitAnswer);
router.get('/games/:gameId/question/:questionOrder/results', questionController.getQuestionResults);

module.exports = router;