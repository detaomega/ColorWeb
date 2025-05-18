// controllers/questioncontroller.js
const Question = require('../db_structures/question');
const GameQuestion = require('../db_structures/gamequestion');
const Game = require('../db_structures/game');
const mongoose = require('mongoose');

// 創建新動漫問題
exports.createQuestion = async (req, res) => {
  try {
    const { 
      animeTitle, 
      alternativeTitles, 
      imageSets, 
      difficulty, 
      category,
      releaseYear 
    } = req.body;
    
    // 驗證必要欄位
    if (!animeTitle || !imageSets || imageSets.length < 1) {
      return res.status(400).json({
        success: false,
        message: '動漫標題和至少1組圖片集是必需的'
      });
    }
    
    // 驗證每組圖片至少有3張圖片
    const invalidSets = imageSets.filter(set => !set.images || set.images.length < 3);
    if (invalidSets.length > 0) {
      return res.status(400).json({
        success: false,
        message: '每組圖片至少需要3張圖片'
      });
    }
    
    // 確保每組圖片都有名稱和排序
    const processedImageSets = imageSets.map(set => ({
      setName: set.setName,
      images: set.images.map((img, index) => ({
        ...img,
        order: img.order || index + 1
      }))
    }));
    
    const question = new Question({
      animeTitle,
      alternativeTitles: alternativeTitles || [],
      imageSets: processedImageSets,
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

// 獲取所有動漫問題（可選篩選）
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

// 向遊戲添加問題
exports.addQuestionsToGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { questionIds, randomize } = req.body;
    
    // 檢查遊戲是否存在且處於等待狀態
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
    
    // 如果提供了特定問題ID
    if (questionIds && questionIds.length > 0) {
      selectedQuestions = await Question.find({
        _id: { $in: questionIds }
      });
    } 
    // 否則選擇隨機問題
    else {
      const filter = {};
      
      if (game.settings.categories && game.settings.categories.length > 0) {
        filter.category = { $in: game.settings.categories };
      }
      
      if (game.settings.difficulty && game.settings.difficulty !== 'mixed') {
        filter.difficulty = game.settings.difficulty;
      }
      
      // 根據遊戲設定獲取隨機問題
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
    
    // 隨機化順序（如果請求）
    if (randomize) {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
    }
    
    // 檢查是否有現有問題並獲取最大順序
    const existingQuestions = await GameQuestion.find({ gameId }).sort({ order: -1 }).limit(1);
    let startOrder = 1;
    
    if (existingQuestions.length > 0) {
      startOrder = existingQuestions[0].order + 1;
    }
    
    // 準備遊戲問題 - 為每個問題隨機選擇一個圖片集
    const gameQuestions = [];
    
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      
      // 如果問題沒有任何圖片集，跳過該問題
      if (!question.imageSets || question.imageSets.length === 0) {
        continue;
      }
      
      // 為此問題隨機選擇一個圖片集
      const randomSetIndex = Math.floor(Math.random() * question.imageSets.length);
      const selectedSet = question.imageSets[randomSetIndex];
      
      // 確保選擇的集合有名稱
      if (!selectedSet || !selectedSet.setName) {
        continue;
      }
      
      // 計算題目的時間限制
      const imageCount = selectedSet.images ? selectedSet.images.length : 0;
      const timeLimit = game.settings.answerTime + (imageCount * game.settings.revealInterval);
      
      gameQuestions.push({
        gameId: game.gameId,
        questionId: question._id,
        imageSetName: selectedSet.setName,
        order: startOrder + i,
        timeLimit: timeLimit
      });
    }
    
    if (gameQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '沒有有效的問題可添加'
      });
    }
    
    // 插入遊戲問題，跳過重複項
    const insertedQuestions = await GameQuestion.insertMany(
      gameQuestions, 
      { ordered: false }
    ).catch(err => {
      // 有些問題可能是重複的，我們可以繼續處理已插入的問題
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

// 獲取當前問題及適當的圖片
exports.getCurrentQuestion = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // 查找遊戲
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
    
    // 獲取當前問題
    const currentQuestionNumber = game.currentQuestionNumber;
    
    // 查找當前遊戲問題
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
    
    // 獲取選擇的圖片集
    const questionData = gameQuestion.questionId;
    const imageSetName = gameQuestion.imageSetName;
    const currentImageIndex = gameQuestion.currentImageIndex;
    
    // 在問題中查找指定的圖片集
    const imageSet = questionData.imageSets.find(set => set.setName === imageSetName);
    
    if (!imageSet) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的圖片集'
      });
    }
    
    // 按順序排序圖片
    const sortedImages = [...imageSet.images].sort((a, b) => a.order - b.order);
    
    // 僅獲取已顯示的圖片
    const revealedImages = currentImageIndex >= 0 
      ? sortedImages.slice(0, currentImageIndex + 1).map(img => ({
          url: img.url,
          order: img.order,
          hint: img.hint
        }))
      : [];
    
    // 計算剩餘時間
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
        imageSetName: imageSetName,
        currentImageIndex: currentImageIndex,
        totalImages: sortedImages.length,
        status: gameQuestion.status,
        remainingTime: remainingTime,
        category: questionData.category,
        difficulty: questionData.difficulty,
        // 不包含答案（animeTitle）！
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

// 揭示下一張圖片
exports.revealNextImage = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // 查找遊戲
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
    
    // 獲取當前問題
    const currentQuestionNumber = game.currentQuestionNumber;
    
    // 查找當前遊戲問題
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
    
    // 獲取選擇的圖片集
    const questionData = gameQuestion.questionId;
    const imageSetName = gameQuestion.imageSetName;
    
    // 在問題中查找指定的圖片集
    const imageSet = questionData.imageSets.find(set => set.setName === imageSetName);
    
    if (!imageSet) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的圖片集'
      });
    }
    
    // 按順序排序圖片
    const sortedImages = [...imageSet.images].sort((a, b) => a.order - b.order);
    const totalImages = sortedImages.length;
    
    // 檢查是否可以顯示另一張圖片
    if (gameQuestion.currentImageIndex >= totalImages - 1) {
      return res.status(400).json({
        success: false,
        message: '所有圖片已經揭示'
      });
    }
    
    // 增加當前圖片索引
    gameQuestion.currentImageIndex += 1;
    
    // 如果這是第一張圖片，設置激活時間
    if (gameQuestion.currentImageIndex === 0) {
      gameQuestion.activatedAt = new Date();
      gameQuestion.status = 'active';
    }
    
    await gameQuestion.save();
    
    // 獲取揭示的圖片
    const revealedImages = sortedImages.slice(0, gameQuestion.currentImageIndex + 1).map(img => ({
      url: img.url,
      order: img.order,
      hint: img.hint
    }));
    
    // 計算剩餘時間
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

// 開始下一個問題
exports.startNextQuestion = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // 查找遊戲
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
    
    // 獲取當前問題並標記為已完成（如果存在）
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
    
    // 增加問題編號
    game.currentQuestionNumber += 1;
    
    // 檢查這是否是最後一個問題
    const totalQuestions = await GameQuestion.countDocuments({ gameId: game.gameId });
    
    if (game.currentQuestionNumber > totalQuestions) {
      // 這是最後一個問題，結束遊戲
      game.status = 'finished';
      game.finishedAt = new Date();
      await game.save();
      
      return res.status(200).json({
        success: true,
        message: '遊戲已結束',
        gameComplete: true
      });
    }
    
    // 查找下一個問題並初始化
    const nextGameQuestion = await GameQuestion.findOne({
      gameId: game.gameId,
      order: game.currentQuestionNumber
    });
    
    if (nextGameQuestion) {
      nextGameQuestion.currentImageIndex = -1; // 開始時沒有圖片顯示
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

// 提交當前問題的答案
exports.submitAnswer = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, username, answer } = req.body;
    
    if (!username || !answer) {
      return res.status(400).json({
        success: false,
        message: '玩家名稱和答案都是必需的'
      });
    }
    
    // 查找遊戲
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
    
    // 查找玩家
    const player = game.players.find(p => p.username === username);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: '找不到玩家'
      });
    }
    
    // 獲取當前問題
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
    
    // 檢查玩家是否已回答
    const questionId = gameQuestion.questionId._id;
    const alreadyAnswered = player.answers.some(
      a => a.questionId && a.questionId.toString() === questionId.toString()
    );
    
    if (alreadyAnswered) {
      return res.status(400).json({
        success: false,
        message: '你已經回答過這個問題'
      });
    }
    
    // 檢查答案是否正確
    const questionData = gameQuestion.questionId;
    const isCorrect = questionData.isCorrectAnswer(answer);
    
    // 計算剩餘時間和分數
    let timeRemaining = 0;
    let score = 0;
    
    if (gameQuestion.activatedAt) {
      const elapsedMs = Date.now() - gameQuestion.activatedAt.getTime();
      const totalTimeMs = gameQuestion.timeLimit * 1000;
      timeRemaining = Math.max(0, (totalTimeMs - elapsedMs) / 1000);
      
      // 根據剩餘時間計算分數（只有正確時）
      if (isCorrect) {
        const timeRatio = timeRemaining / gameQuestion.timeLimit;
        score = Math.round(game.settings.maxPointsPerQuestion * timeRatio);
      }
    }
    
    // 添加玩家的答案
    const answerObj = {
      questionId: questionId,
      answer: answer,
      isCorrect: isCorrect,
      timeRemaining: timeRemaining,
      score: score,
      answeredAt: new Date()
    };
    
    // 更新玩家模型
    player.answers.push(answerObj);
    
    // 如果答案正確，增加玩家總分
    if (isCorrect) {
      player.score += score;
    }
    
    await game.save();
    
    res.status(200).json({
      success: true,
      message: '答案提交成功',
      isCorrect: isCorrect,
      timeRemaining: timeRemaining,
      score: score,
      correctAnswer: isCorrect ? null : questionData.animeTitle // 只有錯誤才揭示答案
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交答案失敗',
      error: error.message
    });
  }
};

// 獲取問題結果（問題完成後）
exports.getQuestionResults = async (req, res) => {
  try {
    const { gameId, questionOrder } = req.params;
    
    // 查找遊戲
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '找不到遊戲'
      });
    }
    
    // 獲取指定問題
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
    
    // 獲取問題數據和選擇的圖片集
    const questionData = gameQuestion.questionId;
    const imageSetName = gameQuestion.imageSetName;
    
    // 在問題中查找指定的圖片集
    const imageSet = questionData.imageSets.find(set => set.setName === imageSetName);
    
    if (!imageSet) {
      return res.status(404).json({
        success: false,
        message: '找不到指定的圖片集'
      });
    }
    
    // 從 Game 中獲取玩家在此問題的回答
    const playerAnswers = [];
    
    for (const player of game.players) {
      const answer = player.answers.find(a => 
        a.questionId && a.questionId.toString() === questionData._id.toString()
      );
      
      if (answer) {
        playerAnswers.push({
          playerId: player._id,
          playerName: player.username,
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          timeRemaining: answer.timeRemaining,
          score: answer.score,
          answeredAt: answer.answeredAt
        });
      }
    }
    
    // 按分數排序（最高分在前）
    const sortedAnswers = playerAnswers.sort((a, b) => b.score - a.score);
    
    // 計算統計數據
    const correctAnswers = sortedAnswers.filter(a => a.isCorrect);
    const correctPercentage = sortedAnswers.length > 0 
      ? Math.round((correctAnswers.length / sortedAnswers.length) * 100) 
      : 0;
    
    res.status(200).json({
      success: true,
      question: {
        animeTitle: questionData.animeTitle,
        alternativeTitles: questionData.alternativeTitles,
        category: questionData.category,
        releaseYear: questionData.releaseYear,
        difficulty: questionData.difficulty,
        imageSet: imageSet // 只返回使用的圖片集
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