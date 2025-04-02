const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Client = require('../models/Client');
const Seller = require('../models/Seller');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, fullName, email, password, userType, areasOfExpertise } = req.body;
    
    // Check if user exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Create user
    const user = new User({
      username,
      fullName,
      email,
      password,
      userType
    });
    
    await user.save();
    
    // Create client or seller based on userType
    if (userType === 'client') {
      const client = new Client({
        user: user._id,
        creditCards: [],
        messages: [],
        unansweredQuestions: []
      });
      
      await client.save();
    } else if (userType === 'seller') {
      const seller = new Seller({
        user: user._id,
        credit: 0,
        areasOfExpertise: areasOfExpertise || [],
        messages: []
      });
      
      await seller.save();
    }
    
    // Create and return JWT
    const payload = {
      user: {
        id: user._id,
        userType: user.userType
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mytemporarysecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Create and return JWT
    const payload = {
      user: {
        id: user._id,
        userType: user.userType
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mytemporarysecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get authenticated user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/42
// @desc    Authenticate with 42 OAuth (mock endpoint)
// @access  Public
router.post('/42', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Here you would verify the 42 token and get user info
    // This is a simplified example
    
    // For this example, we'll just create a mock user
    let user = await User.findOne({ email: '42user@example.com' });
    
    if (!user) {
      user = new User({
        username: '42user',
        fullName: '42 User',
        email: '42user@example.com',
        password: Math.random().toString(36).slice(-8),
        userType: 'client'
      });
      
      await user.save();
      
      const client = new Client({
        user: user._id,
        creditCards: [],
        messages: [],
        unansweredQuestions: []
      });
      
      await client.save();
    }
    
    const payload = {
      user: {
        id: user._id,
        userType: user.userType
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mytemporarysecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 