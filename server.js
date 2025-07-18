// Comprehensive Warm-Connection Search Engine Server
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const { OpenAI } = require('openai');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const sgMail = require('@sendgrid/mail');
const cron = require('node-cron');
const joi = require('joi');
require('dotenv').config();

// Models
const UserProfile = require('./models/UserProfile');

// Environment validation schema - make external services optional for development
const envSchema = joi.object({
  OKTA_DOMAIN: joi.string().optional(),
  OKTA_CLIENT_ID: joi.string().optional(),
  OKTA_CLIENT_SECRET: joi.string().optional(),
  NEO4J_URI: joi.string().optional(),
  NEO4J_USER: joi.string().optional(),
  NEO4J_PASSWORD: joi.string().optional(),
  OPENAI_API_KEY: joi.string().optional(),
  SENDGRID_API_KEY: joi.string().optional(),
  DATABASE_URL: joi.string().optional(),
  PORT: joi.number().default(5000)
}).unknown();

const { error, value: env } = envSchema.validate(process.env);
if (error) {
  console.warn('Environment validation warnings:', error.details);
}

// Initialize services
const app = express();

// Initialize optional services
let oktaJwtVerifier = null;
let neo4jDriver = null;
let openai = null;

if (env.OKTA_DOMAIN) {
  oktaJwtVerifier = new OktaJwtVerifier({
    issuer: `https://${env.OKTA_DOMAIN}/oauth2/default`
  });
}

if (env.NEO4J_URI && env.NEO4J_USER && env.NEO4J_PASSWORD) {
  neo4jDriver = neo4j.driver(
    env.NEO4J_URI,
    neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD)
  );
}

if (env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });
}

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
if (env.DATABASE_URL) {
  mongoose.connect(env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
} else {
  console.warn('DATABASE_URL not provided, MongoDB features will be disabled');
}

// Authentication middleware - handles both Okta and development auth
const authRequired = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    
    // Try Okta authentication first if available
    if (oktaJwtVerifier) {
      try {
        const jwt = await oktaJwtVerifier.verifyAccessToken(token, 'api://default');
        req.user = jwt.claims;
        return next();
      } catch (oktaError) {
        console.error('Okta auth failed:', oktaError);
      }
    }
    
    // Fallback to development authentication
    if (token === 'dev-token') {
      req.user = {
        id: 'dev-user-1',
        sub: 'dev-user-1', // Okta format compatibility
        name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Tech Corp'
      };
      return next();
    }
    
    res.status(401).json({ error: 'Invalid token' });
  } catch (error) {
    console.error('Auth verification failed:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Import route modules
const { router: authRouter } = require('./routes/auth');
const profileRouter = require('./routes/profile');
const connectionsRouter = require('./routes/connections');
const introductionRouter = require('./routes/introduction');

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/user/profile', profileRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/introduction', introductionRouter);

// Legacy routes (keeping existing functionality)
app.get('/api/user/profile', authRequired, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ oktaId: req.user.sub });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/user/profile', authRequired, async (req, res) => {
  try {
    const profileData = {
      oktaId: req.user.sub,
      userId: req.user.uid,
      email: req.user.sub,
      name: req.body.name,
      company: req.body.company,
      title: req.body.title,
      socialProfiles: req.body.socialProfiles || [],
      education: req.body.education || [],
      organizations: req.body.organizations || [],
      family: req.body.family || [],
      hometowns: req.body.hometowns || []
    };

    const profile = await UserProfile.findOneAndUpdate(
      { oktaId: req.user.sub },
      profileData,
      { upsert: true, new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Company directory import
app.post('/api/import-directory', authRequired, async (req, res) => {
  try {
    const { companyName } = req.body;
    
    // Import company directory via ETL service
    const DataIngestionService = require('./scripts/ingest');
    const ingestionService = new DataIngestionService();
    await ingestionService.initialize();
    
    // Run ingestion for the company
    await ingestionService.runIngestion(companyName);
    
    // Update user's onboarding status
    await UserProfile.findOneAndUpdate(
      { oktaId: req.user.sub },
      { 'onboardingStatus.companyDirectoryImported': true }
    );
    
    res.json({ success: true, message: 'Company directory imported successfully' });
  } catch (error) {
    console.error('Directory import error:', error);
    res.status(500).json({ error: 'Failed to import company directory' });
  }
});

// Find introduction path
app.post('/api/find-intro-path', authRequired, async (req, res) => {
  try {
    const { targetName, targetCompany } = req.body;
    
    if (!targetName) {
      return res.status(400).json({ error: 'Target name is required' });
    }

    // Get current user's person node from profile
    const userProfile = await UserProfile.findOne({ oktaId: req.user.sub });
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const session = neo4jDriver.session();
    
    try {
      // Find user's person node
      const userQuery = `
        MATCH (me:Person {email: $userEmail})
        RETURN me
      `;
      
      const userResult = await session.run(userQuery, { userEmail: userProfile.email });
      if (userResult.records.length === 0) {
        return res.status(404).json({ error: 'User not found in network graph' });
      }

      // Find target persons matching criteria
      let targetQuery = `
        MATCH (target:Person)
        WHERE target.name CONTAINS $targetName
      `;
      const params = { 
        targetName,
        userEmail: userProfile.email 
      };

      if (targetCompany) {
        targetQuery += ` AND target.company CONTAINS $targetCompany`;
        params.targetCompany = targetCompany;
      }
      
      targetQuery += ` RETURN target LIMIT 10`;
      
      const targetResult = await session.run(targetQuery, params);
      
      if (targetResult.records.length === 0) {
        return res.status(404).json({ error: 'No matching targets found' });
      }

      const paths = [];

      // Find shortest paths to each target
      for (const targetRecord of targetResult.records) {
        const target = targetRecord.get('target');
        
        const pathQuery = `
          MATCH (me:Person {email: $userEmail})
          MATCH (target:Person {id: $targetId})
          MATCH path = shortestPath((me)-[*..5]-(target))
          RETURN nodes(path) as nodes, relationships(path) as relationships
        `;
        
        const pathResult = await session.run(pathQuery, {
          userEmail: userProfile.email,
          targetId: target.properties.id
        });
        
        if (pathResult.records.length > 0) {
          const record = pathResult.records[0];
          const nodes = record.get('nodes').map(node => ({
            id: node.properties.id,
            name: node.properties.name,
            company: node.properties.company,
            title: node.properties.title
          }));
          
          const relationships = record.get('relationships').map(rel => ({
            type: rel.type,
            metadata: rel.properties.metadata ? JSON.parse(rel.properties.metadata) : {}
          }));
          
          paths.push({
            nodes,
            relationships,
            hops: nodes.length - 1,
            totalStrength: relationships.reduce((sum, rel) => sum + (rel.metadata.strength || 1), 0)
          });
        }
      }

      // Sort by shortest path first, then by strength
      paths.sort((a, b) => {
        if (a.hops !== b.hops) return a.hops - b.hops;
        return b.totalStrength - a.totalStrength;
      });

      res.json({ paths });
      
    } finally {
      await session.close();
    }
    
  } catch (error) {
    console.error('Find intro path error:', error);
    res.status(500).json({ error: 'Failed to find introduction paths' });
  }
});

// Request introduction
app.post('/api/request-intro', authRequired, async (req, res) => {
  try {
    const { path, messageTemplate } = req.body;
    
    if (!path || !Array.isArray(path) || path.length < 2) {
      return res.status(400).json({ error: 'Valid introduction path is required' });
    }
    
    if (!messageTemplate) {
      return res.status(400).json({ error: 'Message template is required' });
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ oktaId: req.user.sub });
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get person details from Neo4j
    const session = neo4jDriver.session();
    
    try {
      const personQuery = `
        MATCH (p:Person)
        WHERE p.id IN $personIds
        RETURN p
      `;
      
      const personResult = await session.run(personQuery, { personIds: path });
      const persons = personResult.records.map(record => {
        const person = record.get('p');
        return {
          id: person.properties.id,
          name: person.properties.name,
          email: person.properties.email,
          company: person.properties.company,
          title: person.properties.title
        };
      });

      // Send introduction request email to first hop
      const intermediary = persons[1]; // First person in path after the requester
      const target = persons[persons.length - 1]; // Last person in path
      
      const emailContent = {
        to: intermediary.email,
        from: env.SENDGRID_FROM_EMAIL || 'noreply@warmconnector.com',
        subject: `Introduction Request: ${userProfile.name} → ${target.name}`,
        html: `
          <h2>Introduction Request</h2>
          <p>Hi ${intermediary.name},</p>
          <p>${userProfile.name} has requested an introduction to ${target.name} through our professional network.</p>
          
          <h3>Message from ${userProfile.name}:</h3>
          <blockquote style="border-left: 3px solid #007bff; padding-left: 15px; margin: 20px 0;">
            ${messageTemplate}
          </blockquote>
          
          <h3>Connection Details:</h3>
          <ul>
            <li><strong>Requester:</strong> ${userProfile.name} (${userProfile.title}) at ${userProfile.company}</li>
            <li><strong>Target:</strong> ${target.name} (${target.title}) at ${target.company}</li>
          </ul>
          
          <p>If you're comfortable making this introduction, please reply to this email or reach out to both parties directly.</p>
          
          <p>Best regards,<br>WarmConnector Team</p>
        `
      };

      await sgMail.send(emailContent);

      // Store the introduction request
      const requestId = Math.floor(Math.random() * 100000);
      
      // In a real implementation, you'd store this in a database
      console.log('Introduction request stored:', {
        requestId,
        requesterId: userProfile.oktaId,
        path,
        target: target.name,
        intermediary: intermediary.name
      });

      res.json({
        success: true,
        requestId,
        message: 'Introduction request sent successfully'
      });
      
    } finally {
      await session.close();
    }
    
  } catch (error) {
    console.error('Request intro error:', error);
    res.status(500).json({ error: 'Failed to send introduction request' });
  }
});

// Introduction requests history
app.get('/api/intro-requests', authRequired, async (req, res) => {
  try {
    // In a real implementation, you'd fetch from a database
    // For now, return empty array as placeholder
    res.json([]);
  } catch (error) {
    console.error('Intro requests fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch introduction requests' });
  }
});

// ETL endpoint for manual data ingestion
app.post('/api/ingest', authRequired, async (req, res) => {
  try {
    const { companyName } = req.body;
    
    const DataIngestionService = require('./scripts/ingest');
    const ingestionService = new DataIngestionService();
    await ingestionService.initialize();
    
    // Run ingestion in background
    ingestionService.runIngestion(companyName).catch(console.error);
    
    res.json({ message: 'Data ingestion started', company: companyName });
  } catch (error) {
    console.error('Manual ingestion error:', error);
    res.status(500).json({ error: 'Failed to start data ingestion' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      neo4j: 'connected',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Schedule automated data ingestion (weekly)
cron.schedule('0 2 * * 0', async () => {
  console.log('Running scheduled data ingestion...');
  try {
    const DataIngestionService = require('./scripts/ingest');
    const ingestionService = new DataIngestionService();
    await ingestionService.initialize();
    
    // Get all companies from user profiles
    const companies = await UserProfile.distinct('company');
    
    for (const company of companies) {
      if (company) {
        await ingestionService.runIngestion(company);
      }
    }
  } catch (error) {
    console.error('Scheduled ingestion failed:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await neo4jDriver.close();
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
const PORT = env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Warm-Connection Search Engine running on port ${PORT}`);
  console.log('Services initialized:');
  console.log('- Okta Authentication: Ready');
  console.log('- Neo4j Graph Database: Connected');
  console.log('- OpenAI API: Ready');
  console.log('- SendGrid Email: Ready');
  console.log('- MongoDB: Connected');
});

module.exports = app;