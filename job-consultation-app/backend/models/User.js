const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: 'assets/icons/tempura.png'
  },
  userType: {
    type: String,
    enum: ['client', 'seller', 'pending'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  fortytwoId: {
    type: String,
    sparse: true,
    unique: true
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  isNewUser: {
    type: Boolean,
    default: true
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema); 