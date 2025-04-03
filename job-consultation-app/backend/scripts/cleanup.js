const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Seller = require('../models/Seller');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanupUsers() {
  try {
    // Connect to MongoDB
    console.log('MongoDB URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/job-consultation');
    console.log('Connected to MongoDB');

    // List all users with fortytwoId
    const users = await User.find({ fortytwoId: { $exists: true, $ne: null } });
    console.log(`Found ${users.length} users with 42 authentication:`);
    
    for (const user of users) {
      console.log(`- ${user.username} (${user.email}, ID: ${user._id}, 42ID: ${user.fortytwoId})`);
    }
    
    // Ask for confirmation
    console.log('\nWould you like to delete these users? (yes/no)');
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toLowerCase();
      
      if (answer === 'yes' || answer === 'y') {
        // Delete associated client/seller profiles
        for (const user of users) {
          await Client.deleteMany({ user: user._id });
          await Seller.deleteMany({ user: user._id });
        }
        
        // Delete the users
        const result = await User.deleteMany({ fortytwoId: { $exists: true, $ne: null } });
        console.log(`Deleted ${result.deletedCount} users`);
      } else {
        console.log('Operation cancelled');
      }
      
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupUsers(); 