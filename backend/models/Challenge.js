const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expected: {
    type: String,
    required: true
  }
});

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  constraints: {
    type: String,
    default: ''
  },
  visibleTestCases: [testCaseSchema],
  hiddenTestCases: [testCaseSchema],
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  exampleInput: {
    type: String,
    default: ''
  },
  exampleOutput: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Challenge', challengeSchema);