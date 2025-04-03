const axios = require('axios');
const User = require('../models/User');
const Client = require('../models/Client');

class FtOAuthService {
  constructor() {
    this.clientId = process.env.FORTYTWO_CLIENT_ID || '';
    this.clientSecret = process.env.FORTYTWO_CLIENT_SECRET || '';
    this.redirectUri = process.env.FORTYTWO_CALLBACK_URL || 'http://localhost:4200/oauth-callback';
    this.tokenUrl = 'https://api.intra.42.fr/oauth/token';
    this.userInfoUrl = 'https://api.intra.42.fr/v2/me';
    
    console.log('FtOAuthService initialized');
  }

  /**
   * Get the authorization URL for 42 OAuth
   * @returns {string} The authorization URL
   */
  getAuthorizationUrl() {
    return `https://api.intra.42.fr/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=public`;
  }

  /**
   * Exchange authorization code for an access token
   * @param {string} code The authorization code
   * @returns {Promise<string>} The access token
   */
  async getAccessToken(code) {
    try {
      console.log('Exchanging code for access token...');
      console.log('Using redirect URI:', this.redirectUri);
      
      const requestData = {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri
      };
      
      console.log('Token request data:', {
        ...requestData,
        client_id: requestData.client_id.substring(0, 10) + '...',
        client_secret: '***redacted***'
      });
      
      const response = await axios.post(this.tokenUrl, requestData);

      console.log('Token received successfully');
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:');
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
        throw new Error(`Failed to get access token: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Failed to get access token: No response from server');
      } else {
        console.error('Error message:', error.message);
        throw new Error(`Failed to get access token: ${error.message}`);
      }
    }
  }

  /**
   * Get user information from 42 API
   * @param {string} accessToken The access token
   * @returns {Promise<Object>} The user information
   */
  async getUserInfo(accessToken) {
    try {
      console.log('Fetching user info from 42 API...');
      const response = await axios.get(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      console.log('User info received successfully');
      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error.response?.data || error.message);
      throw new Error('Failed to get user info');
    }
  }

  /**
   * Find or create a user based on 42 user data
   * @param {Object} userData The user data from 42 API
   * @returns {Promise<Object>} The user and token
   */
  async findOrCreateUser(userData) {
    try {
      console.log('Finding or creating user for 42 ID:', userData.id);
      // Look for existing user with the 42 ID
      let user = await User.findOne({ fortytwoId: userData.id.toString() });
      let isNewUser = false;

      if (!user) {
        console.log('Creating new user from 42 data');
        // Create a new user
        user = new User({
          username: userData.login,
          fullName: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
          userType: 'pending', // Set as pending to force profile completion
          fortytwoId: userData.id.toString(),
          profileImage: userData.image_url,
          profileCompleted: false,
          isNewUser: true
        });
        
        await user.save();
        
        // Mark as new user for the response
        isNewUser = true;
      } else {
        console.log('User found with 42 ID:', userData.id);
      }
      
      return {
        user,
        isNewUser
      };
    } catch (error) {
      console.error('Error finding or creating user:', error);
      throw new Error('Failed to process user data');
    }
  }
}

module.exports = new FtOAuthService(); 