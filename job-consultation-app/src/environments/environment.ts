export const environment = {
  production: false,
  
  // DEVELOPMENT CONFIGURATION
  // ------------------------
  // Choose the appropriate API URL based on your setup:
  
  // Option 1: Local development on same machine (default and most common)
  apiUrl: 'http://localhost:3000/api',
  
  // Option 2: Using a specific IP address (uncomment to use)
  // apiUrl: 'http://172.27.98.140:3000/api',  // Replace with your actual server IP
  
  // Option 3: For Android Emulator (uncomment to use)
  // apiUrl: 'http://10.0.2.2:3000/api',      // Android emulator special address for localhost
  
  // Option 4: For physical device on same network (uncomment to use)
  // apiUrl: 'http://<your-machine-ip>:3000/api',  // Use your computer's actual IP address
  
  // Debug settings
  logRequests: true,
  logResponses: true
}; 