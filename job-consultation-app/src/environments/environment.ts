export const environment = {
  production: false,
  
  // IMPORTANT: Uncomment the appropriate API URL based on your needs
  
  // For emulator testing (points to host's localhost)
  apiUrl: 'http://10.0.2.2:3000/api', 
  
  // For real device testing (replace with your computer's actual IP address)
  // apiUrl: 'http://192.168.1.X:3000/api', 
  
  // For web development
  // apiUrl: '/api',
  
  // Debug settings
  logRequests: true,
  logResponses: true
}; 