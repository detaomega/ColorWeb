// models/GameQuestion.js - Updated for Anime Quiz
const mongoose = require('mongoose');

const gameQuestionSchema = new mongoose.Schema({
  // Reference to the Game model
  gameId: {
    type: String,
    ref: 'Game',
    required: true
  },
  // Reference to the Question model (anime question)
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  // Current image index being shown (0 = first image, 1 = second image, etc.)
  currentImageIndex: {
    type: Number,
    default: 0
  },
  // Status of this question in the game
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  // Timestamp when this question became active
  activatedAt: {
    type: Date
  },
  // Timestamp when this question was completed
  completedAt: {
    type: Date
  },
  // Time limit for this question in seconds
  timeLimit: {
    type: Number,
    default: 60
  },
  // Player answers
  playerAnswers: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    playerName: {
      type: String
    },
    answer: {
      type: String
    },
    isCorrect: {
      type: Boolean
    },
    timeRemaining: {
      type: Number  // Seconds remaining when answered
    },
    score: {
      type: Number  // Points awarded for this answer
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Question order in the game (1-based)
  order: {
    type: Number,
    required: true
  }
});

// Create a unique index to ensure a question is only used once per game
gameQuestionSchema.index({ gameId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('GameQuestion', gameQuestionSchema);