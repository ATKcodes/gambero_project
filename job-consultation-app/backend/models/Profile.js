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
    type: Number,
    required: true
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  description: {
    type: String
  }
});

const PaymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit_card', 'paypal'],
    required: true
  },
  lastFourDigits: {
    type: String
  },
  cardType: {
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
    type: String
  },
  bio: {
    type: String
  },
  profileImage: {
    type: String
  },
  expertise: [String],
  certificates: [{
    name: String,
    issuer: String,
    date: Date
  }],
  experiences: [{
    title: String,
    company: String,
    description: String,
    from: Date,
    to: Date,
    current: Boolean
  }],
  paymentMethods: [{
    type: {
      type: String,
      enum: ['paypal', 'creditcard', 'banktransfer']
    },
    details: {
      type: String
    }
  }],
  minimumPrice: {
    type: Number,
    default: 0
  },
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