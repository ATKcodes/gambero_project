const mongoose = require('mongoose');
const User = require('./User');

const SellerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  credit: {
    type: Number,
    default: 0
  },
  minimumPrice: {
    type: Number,
    default: 2 // Default minimum price is 2€
  },
  areasOfExpertise: [{
    type: String,
    enum: ['Pastry', 'Meat and fishes', 'Vegetarian', 'Wines'],
    required: true
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  messages: [{
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
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
  }]
});

module.exports = mongoose.model('Seller', SellerSchema);
