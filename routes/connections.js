// Connection management and search routes
const express = require('express');
const router = express.Router();
const { simpleAuth } = require('./auth');
const ConnectionService = require('../server/services/connectionService');

// Initialize the connection service
const connectionService = new ConnectionService();

// Search for connections
router.post('/search', simpleAuth, async (req, res) => {
  try {
    const { targetName, targetCompany } = req.body;
    
    if (!targetName) {
      return res.status(400).json({ error: 'Target name is required' });
    }

    // Use the AI-powered connection service for real analysis
    const results = await connectionService.searchConnections(
      req.user.id,
      targetName,
      targetCompany
    );

    res.json(results);
  } catch (error) {
    console.error('Connection search error:', error);
    res.status(500).json({ error: error.message || 'Failed to search connections' });
  }
});

// Get connection suggestions
router.get('/suggestions', simpleAuth, async (req, res) => {
  try {
    // Use AI-powered connection suggestions
    const suggestions = await connectionService.generateConnectionSuggestions(req.user.id);
    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch suggestions' });
  }
});

// Save a connection
router.post('/save', simpleAuth, async (req, res) => {
  try {
    const { name, company, title, email, notes } = req.body;
    
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and company are required' });
    }

    // In a real implementation, this would save to your database
    const savedConnection = {
      id: `conn-${Date.now()}`,
      userId: req.user.id,
      name,
      company,
      title,
      email,
      notes,
      createdAt: new Date().toISOString()
    };

    res.json(savedConnection);
  } catch (error) {
    console.error('Save connection error:', error);
    res.status(500).json({ error: 'Failed to save connection' });
  }
});

// Get saved connections
router.get('/saved', simpleAuth, async (req, res) => {
  try {
    // This would typically fetch from your database
    const savedConnections = [
      {
        id: 'conn-1',
        name: 'Alice Wang',
        company: 'Stripe',
        title: 'Senior Engineer',
        email: 'alice@stripe.com',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        id: 'conn-2',
        name: 'David Kim',
        company: 'Airbnb',
        title: 'Design Lead',
        email: 'david@airbnb.com',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
      }
    ];

    res.json(savedConnections);
  } catch (error) {
    console.error('Fetch saved connections error:', error);
    res.status(500).json({ error: 'Failed to fetch saved connections' });
  }
});

module.exports = router;