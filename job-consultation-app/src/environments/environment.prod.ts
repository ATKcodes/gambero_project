export const environment = {
  production: true,
  
  // CHOOSE THE APPROPRIATE API URL BASED ON YOUR SETUP
  // Uncomment one of these options and comment out the others
  
  // 1. Host machine IP address (BEST OPTION FOR REAL DEVICE TESTING)
  apiUrl: 'http://172.27.98.140:3000/api',
  
  // 2. Android emulator special address (for emulator only)
  // apiUrl: 'http://10.0.2.2:3000/api',
  
  // 3. Localhost (for web testing only)
  // apiUrl: '/api',
  
  // Debug settings - can be enabled even in production for troubleshooting
  logRequests: true, 
  logResponses: true
}; 