// controllers/questionController.js - Updated for Anime Quiz
const Question = require('../db_structures/question');
const GameQuestion = require('../db_structures/gameQuestion');
const Player = require('../db_structures/player');
const Game = require('../db_structures/game');
const mongoose = require('mongoose');

// Create a new anime question
exports.createQuestion = async (req, res) => {
  try {
    const { 
      animeTitle, 
      alternativeTitles, 
      images, 
      difficulty, 
      category,
      releaseYear 
    } = req.body;
    
    // Validate required fields
    if (!animeTitle || !images || images.length < 3) {
      return res.status(400).json({
        success: false,
        message: '動漫標題和至少3張圖片是必需的'
      });
    }
    
    // Make sure images have order property
    const orderedImages = images.map((img, index) => ({
      ...img,
      order: img.order || index + 1
    }));
    
    const question = new Question({
      animeTitle,
      alternativeTitles: alternativeTitles || [],
      images: orderedImages,
      difficulty,
      category,
      releaseYear
    });
    
    await question.save();
    
    res.status(201).json({
      success: true,
      message: '動漫問題創建成功',
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '創建問題失敗',
      error: error.message
    });
  }
};

// Get all anime questions (with optional filtering)
exports.getQuestions = async (req, res) => {
  try {
    const { difficulty, category, year } = req.query;
    const filter = {};
    
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (year) filter.releaseYear = year;
    
    const questions = await Question.find(filter);
    
    res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取問題失敗',
      error: error.message
    });
  }
};

// Add questions to a game
exports.addQuestionsToGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { questionIds, randomize } = req.body;
    
    // Check if game exists and is in waiting status
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
        message: '只能在遊戲開始前添加問題'
      });
    }
    
    let selectedQuestions = [];
    
    // If specific question IDs are provided
    if (questionIds && questionIds.length > 0) {
      selectedQuestions = await Question.find({
        _id: { $in: questionIds }
      });
    } 
    // Otherwise select random questions
    else {
      const filter = {};
      
      if (game.settings.categories && game.settings.categories.length > 0) {
        filter.category = { $in: game.settings.categories };
      }
      
      if (game.settings.difficulty && game.settings.difficulty !== 'mixed') {
        filter.difficulty = game.settings.difficulty;
      }
      
      // Get random questions based on game settings
      const questionCount = game.settings.rounds || 10;
      selectedQuestions = await Question.aggregate([
        { $match: filter },
        { $sample: { size: questionCount } }
      ]);
    }
    
    if (selectedQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '沒有找到符合條件的問題'
      });
    }
    
    // Randomize order if requested
    if (randomize) {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
    }
    
    // Check if there are existing questions and get the max order
    const existingQuestions = await GameQuestion.find({ gameId }).sort({ order: -1 }).limit(1);
    let startOrder = 1;
    
    if (existingQuestions.length > 0) {
      startOrder = existingQuestions[0].order + 1;
    }
    
    // Prepare the game questions
    const gameQuestions = selectedQuestions.map((question, index) => ({
      gameId: game.gameId,
      questionId: question._id,
      order: startOrder + index,
      timeLimit: game.settings.answerTime + (question.images.length * game.settings.revealInterval)
    }));
    
    // Insert the game questions, skip duplicates
    const insertedQuestions = await GameQuestion.insertMany(
      gameQuestions, 
      { ordered: false }
    ).catch(err => {
      // Some questions might be duplicates, we can continue with the ones that were inserted
      return err.insertedDocs || [];
    });
    
    res.status(200).json({
      success: true,
      message: `成功添加 ${insertedQuestions.length} 個問題到遊戲`,
      gameQuestions: insertedQuestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加問題到遊戲失敗',
      error: error.message
    });
  }
};

// Get current question with appropriate image
exports.getCurrentQuestion = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Find the game
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
    
    // Get the current question
    const currentQuestionNumber = game.currentQuestionNumber;
    
    // Find the current game question
    const gameQuestion = await GameQuestion.findOne({
      gameId: game.gameId,
      order: currentQuestionNumber
    }).populate('questionId');
    
    if (!gameQuestion) {
      return res.status(404).json({
        success: false,
        message: '找不到當前問題'
      });
    }
    
    // Get only the images up to the current index
    const questionData = gameQuestion.questionId;
    const currentImageIndex = gameQuestion.currentImageIndex;
    
    // Sort images by order
    const sortedImages = [...questionData.images].sort((a, b) => a.order - b.order);
    
    // Get only images up to the current reveal index
    const revealedImages = sortedImages.slice(0, currentImageIndex + 1).map(img => ({
      url: img.url,
      order: img.order,
      hint: img.hint
    }));
    
    // Calculate remaining time
    let remainingTime = null;
    if (gameQuestion.activatedAt) {
      const elapsedMs = Date.now() - gameQuestion.activatedAt.getTime();
      const totalTimeMs = gameQuestion.timeLimit * 1000;
      remainingTime = Math.max(0, Math.floor((totalTimeMs - elapsedMs) / 1000));
    }
    
    res.status(200).json({
      success: true,
      question: {
        id: gameQuestion._id,
        order: gameQuestion.order,
        images: revealedImages,
        currentImageIndex: currentImageIndex,
        totalImages: sortedImages.length,
        status: gameQuestion.status,
        remainingTime: remainingTime,
        category: questionData.category,
        difficulty: questionData.difficulty,
        // Do NOT include the answer (animeTitle) here!
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取當前問題失敗',
      error: error.message
    });
  }
};

// Reveal next image for current question
exports.revealNextImage = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Find the game
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
    
    // Get the current question
    const currentQuestionNumber = game.currentQuestionNumber;
    
    // Find the current game question
    const gameQuestion = await GameQuestion.findOne({
      gameId: game.gameId,
      order: currentQuestionNumber
    }).populate('questionId');
    
    if (!gameQuestion) {
      return res.status(404).json({
        success: false,
        message: '找不到當前問題'
      });
    }
    
    // Get the total number of images
    const questionData = gameQuestion.questionId;
    const sortedImages = [...questionData.images].sort((a, b) => a.order - b.order);
    const totalImages = sortedImages.length;
    
    // Check if we can reveal another image
    if (gameQuestion.currentImageIndex >= totalImages - 1) {
      return res.status(400).json({
        success: false,
        message: '所有圖片已經揭示'
      });
    }
    
    // Increment the current image index
    gameQuestion.currentImageIndex += 1;
    
    // If this is the first image, set the activated time
    if (gameQuestion.currentImageIndex === 0) {
      gameQuestion.activatedAt = new Date();
      gameQuestion.status = 'active';
    }
    
    await gameQuestion.save();
    
    // Get the revealed images
    const revealedImages = sortedImages.slice(0, gameQuestion.currentImageIndex + 1).map(img => ({
      url: img.url,
      order: img.order,
      hint: img.hint
    }));
    
    // Calculate remaining time
    const elapsedMs = Date.now() - gameQuestion.activatedAt.getTime();
    const totalTimeMs = gameQuestion.timeLimit * 1000;
    const remainingTime = Math.max(0, Math.floor((totalTimeMs - elapsedMs) / 1000));
    
    res.status(200).json({
      success: true,
      message: '下一張圖片已揭示',
      question: {
        id: gameQuestion._id,
        images: revealedImages,
        currentImageIndex: gameQuestion.currentImageIndex,
        totalImages: totalImages,
        remainingTime: remainingTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '揭示下一張圖片失敗',
      error: error.message
    });
  }
};

// Start next question
exports.startNextQuestion = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Find the game
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
    
    // Get current question and mark as completed if it exists
    if (game.currentQuestionNumber > 0) {
      const currentGameQuestion = await GameQuestion.findOne({
        gameId: game.gameId,
        order: game.currentQuestionNumber
      });
      
      if (currentGameQuestion) {
        currentGameQuestion.status = 'completed';
        currentGameQuestion.completedAt = new Date();
        await currentGameQuestion.save();
      }
    }
    
    // Increment the question number
    game.currentQuestionNumber += 1;
    
    // Check if this was the last question
    const totalQuestions = await GameQuestion.countDocuments({ gameId: game.gameId });
    
    if (game.currentQuestionNumber > totalQuestions) {
      // This was the last question, end the game
      game.status = 'finished';
      game.finishedAt = new Date();
      await game.save();
      
      return res.status(200).json({
        success: true,
        message: '遊戲已結束',
        gameComplete: true
      });
    }
    
    // Find the next question and initialize it
    const nextGameQuestion = await GameQuestion.findOne({
      gameId: game.gameId,
      order: game.currentQuestionNumber
    });
    
    if (nextGameQuestion) {
      nextGameQuestion.currentImageIndex = -1; // Start with no images revealed
      nextGameQuestion.status = 'pending';
      await nextGameQuestion.save();
    }
    
    await game.save();
    
    res.status(200).json({
      success: true,
      message: '開始下一個問題',
      questionNumber: game.currentQuestionNumber,
      totalQuestions: totalQuestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '開始下一個問題失敗',
      error: error.message
    });
  }
};

// Submit an answer for the current question
exports.submitAnswer = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, playerName, answer } = req.body;
    
    if (!playerId || !answer) {
      return res.status(400).json({
        success: false,
        message: '玩家ID和答案都是必需的'
      });
    }
    
    // Find the game
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
    
    // Get the current question
    const gameQuestion = await GameQuestion.findOne({
      gameId: game.gameId,
      order: game.currentQuestionNumber
    }).populate('questionId');
    
    if (!gameQuestion) {
      return res.status(404).json({
        success: false,
        message: '找不到當前問題'
      });
    }
    
    // Check if player already answered
    const alreadyAnswered = gameQuestion.playerAnswers.some(
      pa => pa.playerId.toString() === playerId.toString()
    );
    
    if (alreadyAnswered) {
      return res.status(400).json({
        success: false,
        message: '你已經回答過這個問題'
      });
    }
    
    // Check if the answer is correct
    const questionData = gameQuestion.questionId;
    const isCorrect = questionData.isCorrectAnswer(answer);
    
    // Calculate remaining time and score
    let timeRemaining = 0;
    let score = 0;
    
    if (gameQuestion.activatedAt) {
      const elapsedMs = Date.now() - gameQuestion.activatedAt.getTime();
      const totalTimeMs = gameQuestion.timeLimit * 1000;
      timeRemaining = Math.max(0, (totalTimeMs - elapsedMs) / 1000);
      
      // Calculate score based on time remaining (only if correct)
      if (isCorrect) {
        const timeRatio = timeRemaining / gameQuestion.timeLimit;
        score = Math.round(game.settings.maxPointsPerQuestion * timeRatio);
      }
    }
    
    // Add the player's answer
    gameQuestion.playerAnswers.push({
      playerId: mongoose.Types.ObjectId(playerId),
      playerName: playerName,
      answer: answer,
      isCorrect: isCorrect,
      timeRemaining: timeRemaining,
      score: score,
      answeredAt: new Date()
    });
    
    await gameQuestion.save();
    
    // Update player's score
    if (isCorrect) {
      await Player.updateOne(
        { gameId: gameId, _id: playerId },
        { $inc: { score: score } }
      );
    }
    
    res.status(200).json({
      success: true,
      message: '答案提交成功',
      isCorrect: isCorrect,
      timeRemaining: timeRemaining,
      score: score,
      correctAnswer: isCorrect ? null : questionData.animeTitle  // Only reveal if wrong
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交答案失敗',
      error: error.message
    });
  }
};

// Get question results (after a question is completed)
exports.getQuestionResults = async (req, res) => {
  try {
    const { gameId, questionOrder } = req.params;
    
    // Find the game
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    // Get the specified question
    const gameQuestion = await GameQuestion.findOne({
      gameId: game.gameId,
      order: questionOrder
    }).populate('questionId');
    
    if (!gameQuestion) {
      return res.status(404).json({
        success: false,
        message: '找不到問題'
      });
    }
    
    // Get player answers sorted by score (highest first)
    const sortedAnswers = [...gameQuestion.playerAnswers].sort((a, b) => b.score - a.score);
    
    // Calculate stats
    const correctAnswers = sortedAnswers.filter(a => a.isCorrect);
    const correctPercentage = sortedAnswers.length > 0 
      ? Math.round((correctAnswers.length / sortedAnswers.length) * 100) 
      : 0;
    
    res.status(200).json({
      success: true,
      question: {
        animeTitle: gameQuestion.questionId.animeTitle,
        alternativeTitles: gameQuestion.questionId.alternativeTitles,
        category: gameQuestion.questionId.category,
        releaseYear: gameQuestion.questionId.releaseYear,
        difficulty: gameQuestion.questionId.difficulty,
        images: gameQuestion.questionId.images
      },
      playerAnswers: sortedAnswers,
      stats: {
        totalAnswers: sortedAnswers.length,
        correctAnswers: correctAnswers.length,
        correctPercentage: correctPercentage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取問題結果失敗',
      error: error.message
    });
  }
};

module.exports = exports;