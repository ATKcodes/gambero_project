const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  issuer: {
    type: String,
    required: true
  },
  year: {
    type: Number
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const ExperienceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  from: {
    type: Date,
    required: true
  },
  to: {
    type: Date
  },
  current: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
});

const PaymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal']
  },
  details: {
    type: String,
    required: true
  },
  cardType: {
    type: String
  },
  lastFourDigits: {
    type: String
  }
});

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  role: {
    type: String,
    enum: ['buyer', 'seller'],
    default: 'buyer'
  },
  bio: {
    type: String
  },
  profileImage: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  expertise: {
    type: [String]
  },
  minimumPrice: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number
  },
  certificates: [CertificateSchema],
  experiences: [ExperienceSchema],
  paymentMethods: [PaymentMethodSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Profile', ProfileSchema); 