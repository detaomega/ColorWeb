// controllers/gamecontroller.js
const Game = require('../db_structures/game');
const GameQuestion = require('../db_structures/gameQuestion');
const Question = require('../db_structures/question');
const { v4: uuidv4 } = require('uuid');

// 創建新動漫問題 - 超簡化版
exports.createQuestion = async (req, res) => {
  try {
    const { 
      animeTitle, 
      alternativeTitles, 
      imageSets 
    } = req.body;
    
    // 驗證必要欄位
    if (!animeTitle || !imageSets || imageSets.length < 1) {
      return res.status(400).json({
        success: false,
        message: '動漫標題和至少1組圖片集是必需的'
      });
    }
    
    // 確保每組圖片至少有3張
    const invalidSets = imageSets.filter(set => !set.images || set.images.length < 3);
    if (invalidSets.length > 0) {
      return res.status(400).json({
        success: false,
        message: '每組圖片至少需要3張圖片'
      });
    }
    
    // 確保每組圖片都有ID
    const processedImageSets = imageSets.map(set => ({
      setId: set.setId || uuidv4(),
      setName: set.setName,
      images: set.images  // 直接存儲URL陣列
    }));
    
    const question = new Question({
      animeTitle,
      alternativeTitles: alternativeTitles || [],
      imageSets: processedImageSets
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

// 向遊戲添加問題 - 超簡化版
exports.addQuestionsToGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { count = 10 } = req.body;
    
    // 檢查遊戲
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ success: false, message: '只能在遊戲開始前添加問題' });
    }
    
    // 隨機選擇問題
    const selectedQuestions = await Question.aggregate([
      { $sample: { size: parseInt(count) } }
    ]);
    
    if (selectedQuestions.length === 0) {
      return res.status(404).json({ success: false, message: '數據庫中沒有可用問題' });
    }
    
    // 獲取當前最大順序
    const existingQuestions = await GameQuestion.find({ gameId }).sort({ order: -1 }).limit(1);
    let startOrder = 1;
    
    if (existingQuestions.length > 0) {
      startOrder = existingQuestions[0].order + 1;
    }
    
    // 為每個問題隨機選擇一個圖片集
    const gameQuestions = [];
    
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      
      if (!question.imageSets || question.imageSets.length === 0) continue;
      
      // 隨機選一個圖片集
      const randomSetIndex = Math.floor(Math.random() * question.imageSets.length);
      const selectedSet = question.imageSets[randomSetIndex];
      
      if (!selectedSet || !selectedSet.setId) continue;
      
      gameQuestions.push({
        gameId: game.gameId,
        questionId: question._id,
        imageSetId: selectedSet.setId,
        order: startOrder + i
      });
    }
    
    if (gameQuestions.length === 0) {
      return res.status(400).json({ success: false, message: '沒有有效的問題可添加' });
    }
    
    // 插入問題
    const insertedQuestions = await GameQuestion.insertMany(
      gameQuestions, 
      { ordered: false }
    ).catch(err => {
      return err.insertedDocs || [];
    });
    
    res.status(200).json({
      success: true,
      message: `成功添加 ${insertedQuestions.length} 個問題到遊戲`,
      count: insertedQuestions.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '添加問題到遊戲失敗',
      error: error.message 
    });
  }
};

// 獲取當前問題 - 最終版
exports.getCurrentQuestion = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // 查找遊戲
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({ success: false, message: '遊戲不在活動狀態' });
    }
    
    // 獲取當前問題編號
    const currentQuestionNumber = game.currentQuestionNumber;
    
    // 查找當前遊戲問題
    const gameQuestion = await GameQuestion.findOne({
      gameId: game.gameId,
      order: currentQuestionNumber
    }).populate('questionId');
    
    if (!gameQuestion) {
      return res.status(404).json({ success: false, message: '找不到當前問題' });
    }
    
    // 獲取問題數據
    const questionData = gameQuestion.questionId;
    const imageSetId = gameQuestion.imageSetId;
    
    // 查找指定的圖片集
    const imageSet = questionData.imageSets.find(set => set.setId === imageSetId);
    
    if (!imageSet) {
      return res.status(404).json({ success: false, message: '找不到指定的圖片集' });
    }
    
    // 返回所有必要的信息
    res.status(200).json({
      success: true,
      questionId: gameQuestion._id,
      questionOrder: gameQuestion.order,
      images: imageSet.images,
      animeTitle: questionData.animeTitle,
      alternativeTitles: questionData.alternativeTitles
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '獲取當前問題失敗',
      error: error.message 
    });
  }
};

// 提交答案 - 最終極簡版，只更新累積分數
exports.submitAnswer = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { username, score } = req.body;
    
    if (!username || score === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '玩家名稱和分數都是必需的' 
      });
    }
    
    // 查找遊戲
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({ success: false, message: '遊戲不在活動狀態' });
    }
    
    // 查找玩家
    const player = game.players.find(p => p.username === username);
    
    if (!player) {
      return res.status(404).json({ success: false, message: '找不到玩家' });
    }
    
    // 確保分數是非負數
    const finalScore = Math.max(0, score);
    
    // 直接增加玩家總分
    player.score += finalScore;
    
    await game.save();
    
    res.status(200).json({
      success: true,
      message: '分數更新成功',
      score: finalScore,
      totalScore: player.score
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '更新分數失敗',
      error: error.message 
    });
  }
};

// 開始下一個問題 - 超簡化版
exports.startNextQuestion = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // 查找遊戲
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({ success: false, message: '遊戲不在活動狀態' });
    }
    
    // 獲取當前問題並標記為已完成
    if (game.currentQuestionNumber > 0) {
      await GameQuestion.updateOne(
        { gameId: game.gameId, order: game.currentQuestionNumber },
        { status: 'completed' }
      );
    }
    
    // 增加問題編號
    game.currentQuestionNumber += 1;
    
    // 檢查是否還有問題
    const totalQuestions = await GameQuestion.countDocuments({ gameId: game.gameId });
    
    if (game.currentQuestionNumber > totalQuestions) {
      // 結束遊戲
      game.status = 'finished';
      game.finishedAt = new Date();
      await game.save();
      
      return res.status(200).json({
        success: true,
        message: '遊戲已結束',
        gameComplete: true
      });
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

// 獲取玩家排名
exports.getPlayerRankings = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, message: '找不到遊戲' });
    }
    
    // 按分數排序玩家，只返回名稱和總分
    const rankings = game.players
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        rank: index + 1,
        username: player.username,
        score: player.score
      }));
    
    res.status(200).json({
      success: true,
      rankings: rankings
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '獲取玩家排名失敗', 
      error: error.message 
    });
  }
};