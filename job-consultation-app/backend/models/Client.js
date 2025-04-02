const mongoose = require('mongoose');
const User = require('./User');

const MessageSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    default: ''
  },
  isAnswered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CreditCardSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true
  },
  cardHolder: {
    type: String,
    required: true
  },
  expiryDate: {
    type: String,
    required: true
  },
  // Store only last 4 digits for security
  lastFourDigits: {
    type: String,
    required: true
  }
});

const ClientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creditCards: [CreditCardSchema],
  messages: [MessageSchema],
  unansweredQuestions: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller'
    },
    question: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Client', ClientSchema);
