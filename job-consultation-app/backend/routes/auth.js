const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Client = require('../models/Client');
const Seller = require('../models/Seller');
const ftOAuthService = require('../services/ftOAuthService');

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
        // Return token and basic user info (exclude password)
        res.json({ 
          token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            userType: user.userType,
            profileCompleted: user.profileCompleted || true,
            createdAt: user.createdAt
          } 
        });
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

// @route   GET api/auth/ft/login
// @desc    Redirect to 42 OAuth page
// @access  Public
router.get('/ft/login', (req, res) => {
  const authUrl = ftOAuthService.getAuthorizationUrl();
  res.json({ url: authUrl });
});

// @route   GET api/auth/ft/callback
// @desc    Handle callback from 42 OAuth
// @access  Public
router.get('/ft/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ msg: 'Authorization code is missing' });
    }
    
    console.log('Received 42 callback with code');
    
    // Exchange code for access token
    const accessToken = await ftOAuthService.getAccessToken(code);
    
    // Get user info from 42 API
    const userData = await ftOAuthService.getUserInfo(accessToken);
    console.log('42 user info received:', userData.login);
    
    // Find or create user
    const { user, isNewUser } = await ftOAuthService.findOrCreateUser(userData);
    console.log(`User ${isNewUser ? 'created' : 'found'}, username: ${user.username}, userType: ${user.userType}`);
    
    // Create JWT token
    const payload = {
      user: {
        id: user._id,
        userType: user.userType,
        profileCompleted: user.profileCompleted
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mytemporarysecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        console.log(`JWT token created, isNewUser: ${isNewUser}, profileCompleted: ${user.profileCompleted}`);
        
        // If this is a new user, redirect to complete profile
        if (isNewUser || !user.profileCompleted) {
          const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/complete-profile?token=${token}`;
          console.log('Redirecting to:', redirectUrl);
          return res.redirect(redirectUrl);
        }
        
        // Otherwise redirect to the main app
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/market?token=${token}`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
      }
    );
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4200'}/login?error=auth_failed`);
  }
});

// @route   POST api/auth/ft/token
// @desc    Exchange 42 OAuth code for token (alternative for client-side flow)
// @access  Public
router.post('/ft/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ msg: 'Authorization code is missing' });
    }
    
    console.log('Received code in ft/token route:', code.substring(0, 10) + '...');
    
    // Exchange code for access token
    let accessToken;
    try {
      accessToken = await ftOAuthService.getAccessToken(code);
      console.log('Successfully obtained access token from 42 API');
    } catch (tokenError) {
      console.error('Error getting access token:', tokenError);
      return res.status(400).json({ msg: 'Failed to exchange authorization code for token: ' + tokenError.message });
    }
    
    // Get user info from 42 API
    let userData;
    try {
      userData = await ftOAuthService.getUserInfo(accessToken);
      console.log('Successfully obtained user info from 42 API for:', userData.login);
    } catch (userInfoError) {
      console.error('Error getting user info:', userInfoError);
      return res.status(400).json({ msg: 'Failed to get user info: ' + userInfoError.message });
    }
    
    // Find or create user
    let userResult;
    try {
      userResult = await ftOAuthService.findOrCreateUser(userData);
      console.log('User processed:', userResult.user.username, 'isNewUser:', userResult.isNewUser);
    } catch (userError) {
      console.error('Error processing user:', userError);
      return res.status(500).json({ msg: 'Failed to process user data: ' + userError.message });
    }
    
    const { user, isNewUser } = userResult;
    
    // Create JWT token
    const payload = {
      user: {
        id: user._id,
        userType: user.userType,
        profileCompleted: user.profileCompleted
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mytemporarysecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) {
          console.error('Error signing JWT:', err);
          return res.status(500).json({ msg: 'Error creating authentication token' });
        }
        
        console.log('JWT token created successfully');
        res.json({ 
          token,
          isNewUser: isNewUser || !user.profileCompleted,
          userData: {
            _id: user._id,
            username: user.username,
            email: user.email,
            userType: user.userType,
            profileCompleted: user.profileCompleted
          }
        });
      }
    );
  } catch (err) {
    console.error('OAuth token exchange error:', err);
    res.status(500).json({ msg: 'Server error during authentication: ' + err.message });
  }
});

// @route   POST api/auth/complete-profile
// @desc    Complete user profile after OAuth login
// @access  Private
router.post('/complete-profile', auth, async (req, res) => {
  try {
    const { username, userType } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update user information
    if (username) user.username = username;
    if (userType) user.userType = userType;
    
    // Mark profile as completed
    user.profileCompleted = true;
    user.isNewUser = false;
    
    await user.save();
    
    // Create client or seller profile
    if (userType === 'client') {
      // Check if client profile already exists
      let client = await Client.findOne({ user: user._id });
      
      if (!client) {
        client = new Client({
          user: user._id,
          creditCards: [],
          messages: [],
          unansweredQuestions: []
        });
        
        await client.save();
      }
    } else if (userType === 'seller') {
      // Check if seller profile already exists
      let seller = await Seller.findOne({ user: user._id });
      
      if (!seller) {
        seller = new Seller({
          user: user._id,
          credit: 0,
          areasOfExpertise: [],
          messages: []
        });
        
        await seller.save();
      }
    }
    
    res.json({
      msg: 'Profile completed successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (err) {
    console.error('Error completing profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 