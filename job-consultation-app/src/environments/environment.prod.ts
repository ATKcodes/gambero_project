export const environment = {
  production: true,
  
  // For emulator testing
  apiUrl: 'http://10.0.2.2:3000/api',
  
  // For real device testing (replace with your actual server IP)
  // apiUrl: 'http://192.168.1.X:3000/api',
  
  // For production web deployment
  // apiUrl: '/api',
  
  // Debug settings - turn off in production
  logRequests: false,
  logResponses: false
}; 