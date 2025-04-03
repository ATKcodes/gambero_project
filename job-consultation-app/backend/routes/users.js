const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Client = require('../models/Client');
const Seller = require('../models/Seller');

// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/profile
// @desc    Create or update user profile
// @access  Private
router.post('/profile', auth, async (req, res) => {
  const {
    name,
    bio,
    profileImage,
    expertise,
    certificates,
    experiences,
    paymentMethods,
    minimumPrice
  } = req.body;
  
  // Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if (name) profileFields.name = name;
  if (bio) profileFields.bio = bio;
  if (profileImage) profileFields.profileImage = profileImage;
  if (expertise) profileFields.expertise = expertise;
  if (minimumPrice) profileFields.minimumPrice = minimumPrice;
  if (certificates) profileFields.certificates = certificates;
  if (experiences) profileFields.experiences = experiences;
  if (paymentMethods) profileFields.paymentMethods = paymentMethods;
  
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      
      return res.json(profile);
    }
    
    // Create
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/profile/:user_id
// @desc    Get profile by user ID
// @access  Private
router.get('/profile/:user_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id });
    
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/sellers
// @desc    Get all sellers' profiles
// @access  Private
router.get('/sellers', auth, async (req, res) => {
  try {
    // Find all users who are sellers
    const sellerIds = await User.find({ userType: 'seller' }).select('_id');
    
    // Find all profiles where user is in sellerIds
    const profiles = await Profile.find({
      user: { $in: sellerIds.map(seller => seller._id) }
    });
    
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID with client/seller info
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get the user
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    let userData = user.toObject();
    
    // If user is client, add client data
    if (user.userType === 'client') {
      const client = await Client.findOne({ user: userId });
      if (client) {
        userData.client = client;
      }
    }
    
    // If user is seller, add seller data
    if (user.userType === 'seller') {
      const seller = await Seller.findOne({ user: userId });
      if (seller) {
        userData.seller = seller;
      }
    }
    
    res.json(userData);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const {
    username,
    fullName,
    password,
    profileImage,
    creditCards,
    areasOfExpertise
  } = req.body;
  
  try {
    // Update user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update basic user info
    if (username) user.username = username;
    if (fullName) user.fullName = fullName;
    if (profileImage) user.profileImage = profileImage;
    if (password) {
      // Password will be hashed by pre-save hook
      user.password = password;
    }
    
    await user.save();
    
    // Update client/seller specific info
    if (user.userType === 'client' && creditCards) {
      let client = await Client.findOne({ user: req.user.id });
      
      if (client) {
        client.creditCards = creditCards;
        await client.save();
      }
    }
    
    if (user.userType === 'seller' && areasOfExpertise) {
      let seller = await Seller.findOne({ user: req.user.id });
      
      if (seller) {
        seller.areasOfExpertise = areasOfExpertise;
        await seller.save();
      }
    }
    
    // Return updated user
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 