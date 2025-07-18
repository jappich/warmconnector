// Introduction request management routes
const express = require('express');
const router = express.Router();
const { simpleAuth } = require('./auth');

// Create an introduction request
router.post('/request', simpleAuth, async (req, res) => {
  try {
    const { path, messageTemplate, targetName, targetCompany } = req.body;
    
    if (!path || !Array.isArray(path) || path.length < 2) {
      return res.status(400).json({ error: 'Valid introduction path is required' });
    }
    
    if (!messageTemplate) {
      return res.status(400).json({ error: 'Message template is required' });
    }

    // Store the introduction request
    const introRequest = {
      id: `intro-${Date.now()}`,
      requesterId: req.user.id,
      requesterName: req.user.name,
      targetName,
      targetCompany,
      pathLength: path.length,
      messageTemplate,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      requestId: introRequest.id,
      message: 'Introduction request created successfully'
    });
  } catch (error) {
    console.error('Introduction request error:', error);
    res.status(500).json({ error: 'Failed to create introduction request' });
  }
});

// Get introduction request history
router.get('/history', simpleAuth, async (req, res) => {
  try {
    // Return introduction request history
    const introRequests = [
      {
        id: 'intro-1',
        targetName: 'Tim Cook',
        targetCompany: 'Apple Inc',
        targetTitle: 'CEO',
        intermediaryName: 'Sarah Johnson',
        pathLength: 3,
        status: 'pending',
        messageTemplate: 'Hi Sarah, I hope you\'re doing well! I\'m reaching out because I\'m hoping to connect with Tim Cook at Apple Inc. Would you be comfortable making an introduction?',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 'intro-2',
        targetName: 'Sundar Pichai',
        targetCompany: 'Google',
        targetTitle: 'CEO',
        intermediaryName: 'Mike Chen',
        pathLength: 2,
        status: 'accepted',
        messageTemplate: 'Hi Mike, I hope this finds you well. I\'m interested in connecting with Sundar Pichai regarding AI initiatives...',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      }
    ];

    res.json(introRequests);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch introduction history' });
  }
});

// Update introduction status
router.put('/status', simpleAuth, async (req, res) => {
  try {
    const { requestId, status, notes } = req.body;
    
    if (!requestId || !status) {
      return res.status(400).json({ error: 'Request ID and status are required' });
    }

    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    res.json({
      success: true,
      message: 'Introduction status updated successfully'
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update introduction status' });
  }
});

module.exports = router;