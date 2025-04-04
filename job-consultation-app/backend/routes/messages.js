const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
  const { receiver, content } = req.body;
  
  if (!content) {
    return res.status(400).json({ msg: 'Message content is required' });
  }
  
  try {
    // Verify receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ msg: 'Receiver not found' });
    }
    
    const newMessage = new Message({
      sender: req.user.id,
      receiver,
      content,
      read: false
    });
    
    const message = await newMessage.save();
    
    // Populate sender and receiver details
    await message.populate('sender', 'username');
    await message.populate('receiver', 'username');
    
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/messages
// @desc    Get all messages for a user (conversations)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Find all unique conversation partners for this user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(req.user.id) },
            { receiver: mongoose.Types.ObjectId(req.user.id) }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', mongoose.Types.ObjectId(req.user.id)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            username: 1,
            email: 1
          },
          lastMessage: 1,
          unreadCount: {
            $cond: [
              { 
                $and: [
                  { $eq: ['$lastMessage.receiver', mongoose.Types.ObjectId(req.user.id)] },
                  { $eq: ['$lastMessage.read', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    ]);
    
    // For each conversation, get the total unread count
    for (let conversation of conversations) {
      const unreadCount = await Message.countDocuments({
        sender: conversation._id,
        receiver: req.user.id,
        read: false
      });
      
      conversation.unreadCount = unreadCount;
    }
    
    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/messages/:userId
// @desc    Get messages between current user and another user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
      .sort({ timestamp: 1 })
      .populate('sender', 'username')
      .populate('receiver', 'username');
    
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/messages/read/:userId
// @desc    Mark messages from a user as read
// @access  Private
router.put('/read/:userId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user.id, read: false },
      { $set: { read: true } }
    );
    
    res.json({ msg: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/messages/unread/count
// @desc    Get count of unread messages
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      read: false
    });
    
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/messages/job
// @desc    Send a message related to a job
// @access  Private
router.post('/job', auth, async (req, res) => {
  const { jobId, receiver, content } = req.body;
  
  if (!content) {
    return res.status(400).json({ msg: 'Message content is required' });
  }

  if (!jobId) {
    return res.status(400).json({ msg: 'Job ID is required' });
  }
  
  try {
    // Verify receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ msg: 'Receiver not found' });
    }
    
    const newMessage = new Message({
      sender: req.user.id,
      receiver,
      content,
      jobId,
      read: false
    });
    
    const message = await newMessage.save();
    
    // Populate sender and receiver details
    await message.populate('sender', 'username');
    await message.populate('receiver', 'username');
    
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/messages/job/:jobId
// @desc    Get all messages for a specific job
// @access  Private
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      jobId: req.params.jobId
    })
      .sort({ timestamp: 1 })
      .populate('sender', 'username profileImage')
      .populate('receiver', 'username profileImage');
    
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 