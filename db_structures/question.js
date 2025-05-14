// models/Question.js - Updated for Anime Quiz
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // Anime name or title (the correct answer)
  animeTitle: {
    type: String,
    required: true
  },
  // Alternative acceptable answers (abbreviations, alternative titles, etc.)
  alternativeTitles: [{
    type: String
  }],
  // Progressive images that reveal more about the anime
  images: [{
    url: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    // Optional hint text for each image
    hint: {
      type: String
    }
  }],
  // Difficulty level
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  // Optional category (e.g., "shounen", "mecha", "slice of life")
  category: {
    type: String
  },
  // Year the anime was released
  releaseYear: {
    type: Number
  },
  // Creation timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if an answer is correct
questionSchema.methods.isCorrectAnswer = function(answer) {
  if (!answer) return false;
  
  // Convert to lowercase for case-insensitive comparison
  const normalizedAnswer = answer.toLowerCase().trim();
  const normalizedTitle = this.animeTitle.toLowerCase().trim();
  
  // Check if it matches the main title
  if (normalizedAnswer === normalizedTitle) return true;
  
  // Check if it matches any alternative titles
  return this.alternativeTitles.some(title => 
    normalizedAnswer === title.toLowerCase().trim()
  );
};

module.exports = mongoose.model('Question', questionSchema);