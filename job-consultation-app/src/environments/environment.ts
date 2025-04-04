export const environment = {
  production: false,
  
  // CHOOSE THE APPROPRIATE API URL BASED ON YOUR SETUP
  // For Android device using ADB reverse
  apiUrl: 'http://localhost:3000/api',
  
  // Alternative URLs
  // apiUrl: 'http://172.27.98.140:3000/api',  // Host IP address
  // apiUrl: 'http://10.0.2.2:3000/api',      // Android emulator special address
  
  // Debug settings
  logRequests: true,
  logResponses: true
}; 