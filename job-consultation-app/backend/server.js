const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const os = require('os');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Get local IP addresses for debugging
const getLocalIps = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
      const address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(`${k}: ${address.address}`);
      }
    }
  }
  return addresses;
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.log('MongoDB connection error:', err);
    console.log('Starting server without MongoDB connection. Some features may not work.');
  });

// Middleware
app.use(express.json());

// Enhanced CORS configuration - ALLOW ALL ORIGINS FOR TESTING
app.use(cors({
  origin: '*',  // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()} - Origin: ${req.headers.origin || 'Unknown'}`);
  next();
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend server is running correctly',
    time: new Date().toISOString(),
    headers: req.headers,
    clientIp: req.ip,
    serverIps: getLocalIps()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/messages', require('./routes/messages'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).send({ error: 'Server Error', message: err.message });
});

// Define PORT
const PORT = process.env.PORT || 3000;

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== SERVER STARTED ===`);
  console.log(`Server running on port ${PORT} and listening on all network interfaces`);
  console.log(`Local IP addresses: ${getLocalIps().join(', ')}`);
  console.log(`Test the API at: http://localhost:${PORT}/api/test`);
  console.log(`Test the API from mobile: http://<your-computer-ip>:${PORT}/api/test`);
  console.log(`=== SERVER READY ===\n`);
}); 