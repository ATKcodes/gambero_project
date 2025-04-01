const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, userType } = req.body;
  
  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      username,
      email,
      password,
      userType
    });
    
    // Save user to database
    await user.save();
    
    // Create and return JWT token
    const payload = {
      user: {
        id: user.id,
        userType: user.userType
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
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
  const { email, password } = req.body;
  
  try {
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
    
    // Create and return JWT token
    const payload = {
      user: {
        id: user.id,
        userType: user.userType
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
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
  const { token } = req.body; // In a real app, this would be validated with 42's API
  
  try {
    // In a real app, we would validate the token and get user info from 42 API
    // For this mock, we'll create a user if they don't exist or log them in
    
    // Create a mock 42 ID from the token
    const fortytwoId = `42_${token.substring(0, 8)}`;
    
    // Check if user already exists
    let user = await User.findOne({ fortytwoId });
    
    if (!user) {
      // Create a new user with random email and username based on the token
      const randomStr = Math.random().toString(36).substring(2, 8);
      user = new User({
        username: `42user_${randomStr}`,
        email: `42user_${randomStr}@example.com`,
        password: Math.random().toString(36), // Random password (will be hashed)
        userType: 'buyer', // Default to buyer
        fortytwoId
      });
      
      await user.save();
    }
    
    // Create and return JWT token
    const payload = {
      user: {
        id: user.id,
        userType: user.userType
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
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