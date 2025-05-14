// routes/questionRoutes.js - Updated for Anime Quiz
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// Question management routes
router.post('/questions', questionController.createQuestion);
router.get('/questions', questionController.getQuestions);

// Game-specific question routes
router.post('/games/:gameId/questions', questionController.addQuestionsToGame);
router.get('/games/:gameId/question', questionController.getCurrentQuestion);
router.post('/games/:gameId/question/next-image', questionController.revealNextImage);
router.post('/games/:gameId/question/next', questionController.startNextQuestion);
router.post('/games/:gameId/question/answer', questionController.submitAnswer);
router.get('/games/:gameId/question/:questionOrder/results', questionController.getQuestionResults);

module.exports = router;