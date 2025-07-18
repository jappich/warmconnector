// Authentication middleware and routes
const express = require('express');
const router = express.Router();

// Simple authentication middleware for development
// This will be replaced with Okta integration
const simpleAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.substring(7);
  
  // For development, create a mock user based on token
  // In production, this would validate against Okta
  if (token === 'dev-token') {
    req.user = {
      id: 'dev-user-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      company: 'Tech Corp'
    };
    next();
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login endpoint for development
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Development login - accepts any email/password
    if (email && password) {
      const user = {
        id: 'dev-user-1',
        name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        ),
        email: email,
        company: 'Tech Corp'
      };
      
      res.json({
        token: 'dev-token',
        user: user,
        message: 'Login successful'
      });
    } else {
      res.status(400).json({ error: 'Email and password required' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', simpleAuth, (req, res) => {
  res.json(req.user);
});

module.exports = { router, simpleAuth };