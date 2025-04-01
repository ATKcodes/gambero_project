const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const User = require('../models/User');

// @route   POST api/jobs
// @desc    Create a new job request
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, description, price, expertise } = req.body;
  
  try {
    // Create a new job
    const newJob = new Job({
      title,
      description,
      buyer: req.user.id,
      price,
      expertise,
      status: 'open'
    });
    
    const job = await newJob.save();
    res.json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/jobs
// @desc    Get all jobs relevant to the user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.userType === 'buyer') {
      // Buyers see their own jobs
      const jobs = await Job.find({ buyer: req.user.id })
        .sort({ createdAt: -1 })
        .populate('buyer', 'username email')
        .populate('seller', 'username email');
      
      return res.json(jobs);
    } else {
      // Sellers see jobs assigned to them or open jobs matching their expertise
      const jobs = await Job.find({
        $or: [
          { seller: req.user.id },
          { status: 'open' }
        ]
      })
        .sort({ createdAt: -1 })
        .populate('buyer', 'username email')
        .populate('seller', 'username email');
      
      return res.json(jobs);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/jobs/:id
// @desc    Get job by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('buyer', 'username email')
      .populate('seller', 'username email');
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    // Check if the user is authorized to view this job
    if (job.buyer.toString() !== req.user.id && 
        (job.seller && job.seller.toString() !== req.user.id) && 
        job.status !== 'open') {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/jobs/:id/assign
// @desc    Assign a job to a seller
// @access  Private
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    // Check if job is already assigned
    if (job.status !== 'open') {
      return res.status(400).json({ msg: 'Job is already assigned or completed' });
    }
    
    // Verify user is a seller
    const user = await User.findById(req.user.id);
    if (user.userType !== 'seller') {
      return res.status(401).json({ msg: 'Only sellers can accept jobs' });
    }
    
    // Update job
    job.seller = req.user.id;
    job.status = 'assigned';
    
    await job.save();
    
    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/jobs/:id/complete
// @desc    Mark a job as completed
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    // Check if the job is assigned
    if (job.status !== 'assigned') {
      return res.status(400).json({ msg: 'Job cannot be completed' });
    }
    
    // Check if the user is the buyer
    if (job.buyer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Update job
    job.status = 'completed';
    
    await job.save();
    
    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 