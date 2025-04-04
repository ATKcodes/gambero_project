const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Seller = require('../models/Seller');
const Job = require('../models/Job');
const Message = require('../models/Message');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
async function connectDB() {
  console.log('MongoDB URI:', process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/job-consultation');
  console.log('Connected to MongoDB');
}

// Prompt for confirmation
function confirmAction(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// Clean users
async function cleanupUsers() {
  try {
    await connectDB();

    // List all users with fortytwoId
    const users = await User.find({ fortytwoId: { $exists: true, $ne: null } });
    console.log(`Found ${users.length} users with 42 authentication:`);
    
    for (const user of users) {
      console.log(`- ${user.username} (${user.email}, ID: ${user._id}, 42ID: ${user.fortytwoId})`);
    }
    
    // Ask for confirmation
    const confirmed = await confirmAction('Would you like to delete these users?');
    
    if (confirmed) {
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
  } catch (error) {
    console.error('Error:', error);
  }
}

// Clean all users (including non-42 users)
async function cleanupAllUsers() {
  try {
    await connectDB();

    // List all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database:`);
    
    for (const user of users) {
      console.log(`- ${user.username} (${user.email}, ID: ${user._id})`);
    }
    
    // Ask for confirmation
    const confirmed = await confirmAction('Would you like to delete ALL users? This is irreversible!');
    
    if (confirmed) {
      // Delete associated client/seller profiles
      await Client.deleteMany({});
      await Seller.deleteMany({});
      
      // Delete the users
      const result = await User.deleteMany({});
      console.log(`Deleted ${result.deletedCount} users`);
    } else {
      console.log('Operation cancelled');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Clean job requests
async function cleanupJobs() {
  try {
    await connectDB();

    // List job statistics
    const openJobs = await Job.countDocuments({ status: 'open' });
    const assignedJobs = await Job.countDocuments({ status: 'assigned' });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    const cancelledJobs = await Job.countDocuments({ status: 'cancelled' });
    const totalJobs = await Job.countDocuments();
    
    console.log('Job statistics:');
    console.log(`- Open jobs: ${openJobs}`);
    console.log(`- Assigned jobs: ${assignedJobs}`);
    console.log(`- Completed jobs: ${completedJobs}`);
    console.log(`- Cancelled jobs: ${cancelledJobs}`);
    console.log(`- Total jobs: ${totalJobs}`);
    
    // Options for deletion
    console.log('\nSelect which jobs to delete:');
    console.log('1. Delete all jobs');
    console.log('2. Delete only completed and cancelled jobs');
    console.log('3. Delete only open jobs');
    console.log('4. Cancel operation');
    
    const answer = await new Promise((resolve) => {
      rl.question('Enter your choice (1-4): ', (choice) => {
        resolve(choice.trim());
      });
    });
    
    let result;
    switch (answer) {
      case '1':
        // Delete all jobs
        const confirmed = await confirmAction('Are you sure you want to delete ALL jobs?');
        if (confirmed) {
          result = await Job.deleteMany({});
          console.log(`Deleted ${result.deletedCount} jobs`);
        } else {
          console.log('Operation cancelled');
        }
        break;
      case '2':
        // Delete completed and cancelled jobs
        result = await Job.deleteMany({ status: { $in: ['completed', 'cancelled'] } });
        console.log(`Deleted ${result.deletedCount} completed and cancelled jobs`);
        break;
      case '3':
        // Delete open jobs
        result = await Job.deleteMany({ status: 'open' });
        console.log(`Deleted ${result.deletedCount} open jobs`);
        break;
      case '4':
      default:
        console.log('Operation cancelled');
        break;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Clean messages
async function cleanupMessages() {
  try {
    await connectDB();

    // Count messages
    const totalMessages = await Message.countDocuments();
    console.log(`Found ${totalMessages} messages in the database.`);
    
    // Ask for confirmation
    const confirmed = await confirmAction('Would you like to delete all messages?');
    
    if (confirmed) {
      const result = await Message.deleteMany({});
      console.log(`Deleted ${result.deletedCount} messages`);
    } else {
      console.log('Operation cancelled');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Standardize expertise areas
async function standardizeExpertiseAreas() {
  try {
    await connectDB();
    
    // The standardized areas
    const standardAreas = ['Pastry', 'Vegetarian', 'Italian', 'Meats and fishes', 'Wines'];
    console.log('Standardizing expertise areas to:', standardAreas.join(', '));

    // Find sellers with non-standard expertise areas
    const sellers = await Seller.find({});
    
    let updated = 0;
    for (const seller of sellers) {
      if (!seller.areasOfExpertise) continue;
      
      const updatedAreas = [];
      let hasChanged = false;
      
      // Check each expertise area
      for (const area of seller.areasOfExpertise) {
        // Fix common typos/variants 
        if (area === 'Meat and fishes' && !standardAreas.includes(area)) {
          updatedAreas.push('Meats and fishes');
          hasChanged = true;
        }
        // Only keep standard areas
        else if (standardAreas.includes(area)) {
          updatedAreas.push(area);
        }
        else {
          hasChanged = true;
          // Default to a random expertise if the area is not standard
          const randomIndex = Math.floor(Math.random() * standardAreas.length);
          updatedAreas.push(standardAreas[randomIndex]);
        }
      }
      
      if (hasChanged) {
        console.log(`Updating seller ${seller.user}: ${seller.areasOfExpertise} -> ${updatedAreas}`);
        seller.areasOfExpertise = updatedAreas;
        await seller.save();
        updated++;
      }
    }
    
    // Update job expertise 
    const jobs = await Job.find({});
    let updatedJobs = 0;
    
    for (const job of jobs) {
      if (!job.expertise) continue;
      
      let newExpertise = job.expertise;
      let hasChanged = false;
      
      // Fix common typos/variants
      if (job.expertise === 'Meat and fishes' && !standardAreas.includes(job.expertise)) {
        newExpertise = 'Meats and fishes';
        hasChanged = true;
      }
      // If expertise is not in the standard list
      else if (!standardAreas.includes(job.expertise)) {
        const randomIndex = Math.floor(Math.random() * standardAreas.length);
        newExpertise = standardAreas[randomIndex];
        hasChanged = true;
      }
      
      if (hasChanged) {
        console.log(`Updating job ${job._id}: ${job.expertise} -> ${newExpertise}`);
        job.expertise = newExpertise;
        await job.save();
        updatedJobs++;
      }
    }
    
    console.log(`Updated ${updated} sellers and ${updatedJobs} jobs with standardized expertise areas`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Main menu
async function showMenu() {
  console.log('\n===== Database Cleanup Tools =====');
  console.log('1. Cleanup 42 authenticated users');
  console.log('2. Cleanup ALL users (danger!)');
  console.log('3. Cleanup job requests');
  console.log('4. Cleanup messages');
  console.log('5. Standardize expertise areas');
  console.log('6. Exit');
  
  const answer = await new Promise((resolve) => {
    rl.question('Enter your choice (1-6): ', (choice) => {
      resolve(choice.trim());
    });
  });
  
  switch (answer) {
    case '1':
      await cleanupUsers();
      break;
    case '2':
      await cleanupAllUsers();
      break;
    case '3':
      await cleanupJobs();
      break;
    case '4':
      await cleanupMessages();
      break;
    case '5':
      await standardizeExpertiseAreas();
      break;
    case '6':
      console.log('Exiting...');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
      return;
    default:
      console.log('Invalid choice. Please try again.');
  }
  
  // Return to menu
  await showMenu();
}

// Start the program
showMenu(); 