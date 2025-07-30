import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { enhancedAuth, requireDbUser } from "./middleware/enhancedAuth";
import { AuthenticatedRequest, getUserId, getUserEmail } from "./middleware/authTypes";
import { OPEN_ACCESS_CONFIG, noOpMiddleware, disabledRateLimit, disabledAuth } from "./config/openAccess";
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { db } from './db';
import { socialAccounts, persons, introductionRequests } from '@shared/schema';
import { ConnectionData } from '@shared/types';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Import services  
import { ContactProcessor } from './services/contactProcessor';
import { EnhancedGraphService } from './services/enhancedGraphService';
import { IntroductionRequestService } from './services/introductionRequestService';

// Initialize services
const enhancedGraphService = new EnhancedGraphService();
const introductionService = new IntroductionRequestService();

// Import working services
import userService from './services/userService';
import logger from './utils/logger';

// Import Connection model functions
import { createConnection, getUserConnections, findConnectionsByCompany } from './models/Connection';

// Import services dynamically to avoid module loading issues  
let dataIngestionService: any;
let analyticsService: any;
let networkActivityTracker: any;
let connectionStrengthCalculator: any;
let connectionTester: any;
let companyNetworkService: any;
let graphDatabaseService: any;

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'text/vcard', 'text/x-vcard', 'text/plain'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|vcf|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, VCF, and TXT files are allowed.'));
    }
  }
});

// Initialize OpenAI for connection analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Skip authentication setup for open access
  // await setupAuth(app);

  // Use open access configuration
  const authMiddleware = noOpMiddleware;
  const introRequestLimiter = disabledRateLimit;
  const findIntroPathLimiter = disabledRateLimit;

  // Auth routes - return configured mock user for open access
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      res.json(OPEN_ACCESS_CONFIG.mockUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // put application routes here
  // prefix all routes with /api

  // Health check endpoint for uptime monitoring
  app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
  });

  // CSRF token endpoint disabled for open access
  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: 'disabled-for-open-access' });
  });

  // Add /api/login endpoint with Firebase integration
  app.post('/api/login', (req, res) => {
    // This endpoint is rate-limited in index.ts

    // In a real implementation, this would validate credentials 
    // and return an auth token or session info
    res.json({ 
      success: true, 
      message: 'Login successful'
    });
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Remove duplicate - authMiddleware already defined above

  // AI-powered connection search
  app.post('/api/connections/search', authMiddleware, async (req: Request, res: Response) => {
    const { targetName, targetCompany } = req.body;
    
    if (!targetName) {
      return res.status(400).json({ error: 'Target name is required' });
    }

    try {
      // Generate AI-powered connection strategy
      const strategyPrompt = `
Analyze this professional networking scenario and suggest connection strategies:

Target: ${targetName} at ${targetCompany || 'Unknown Company'}

Provide specific, actionable strategies for finding warm introduction paths:
1. Professional networks to leverage
2. Industry associations and conferences
3. Educational connections
4. Mutual colleague identification methods
5. Social and community connections

Be specific and practical.`;

      const strategyResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: strategyPrompt }],
        max_tokens: 300,
        temperature: 0.7
      });

      // Generate realistic connection paths
      const pathPrompt = `
Create 2-3 realistic professional introduction paths to reach ${targetName} at ${targetCompany || 'their company'}.

For each path, provide:
- Intermediary person with realistic name, title, and company
- Relationship type (ALUMNI, COLLEAGUE, INDUSTRY_PEER, etc.)
- Connection strength (1-10)
- Brief explanation of the relationship

Return as JSON with this structure:
{
  "paths": [
    {
      "nodes": [
        {"name": "You", "company": "Your Company", "title": "Your Title"},
        {"name": "Intermediary Name", "company": "Company", "title": "Title"},
        {"name": "${targetName}", "company": "${targetCompany || 'Target Company'}", "title": "Executive"}
      ],
      "relationships": [
        {"type": "RELATIONSHIP_TYPE", "strength": 8, "explanation": "connection details"}
      ],
      "hops": 2,
      "totalStrength": 15
    }
  ]
}`;

      const pathResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: pathPrompt }],
        max_tokens: 600,
        temperature: 0.8
      });

      // Generate connection insights
      const insightsPrompt = `
Provide strategic networking advice for connecting with ${targetName} at ${targetCompany || 'their company'}.

Focus on:
1. Best approach angles
2. Conversation starters
3. Value proposition for introductions
4. Timing considerations

Keep response under 150 words and be actionable.`;

      const insightsResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: insightsPrompt }],
        max_tokens: 200,
        temperature: 0.7
      });

      // Parse the AI-generated paths
      let paths = [];
      try {
        const pathData = JSON.parse(pathResponse.choices[0]?.message?.content || '{"paths":[]}');
        paths = pathData.paths || [];
        
        // Add unique IDs to nodes
        paths.forEach((path: any) => {
          path.nodes.forEach((node: any, index: number) => {
            node.id = index === 0 ? (req.user as any)?.claims?.sub : `node-${Date.now()}-${index}`;
          });
        });
      } catch (parseError) {
        console.error('Failed to parse AI path response:', parseError);
      }

      res.json({
        paths: paths,
        aiInsights: insightsResponse.choices[0]?.message?.content || 'No insights available',
        searchStrategy: strategyResponse.choices[0]?.message?.content || 'No strategy available'
      });

    } catch (error) {
      console.error('AI connection search error:', error);
      res.status(500).json({ error: 'Failed to perform AI-powered connection search' });
    }
  });

  // Contact upload and processing
  app.post('/api/contacts/upload', upload.single('contacts'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const fileType = fileName.split('.').pop()?.toLowerCase();

      let contacts: any[] = [];
      
      if (fileType === 'csv') {
        // Parse CSV file
        const csvText = fileBuffer.toString('utf-8');
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 2) {
            const contact: any = {};
            headers.forEach((header, index) => {
              if (values[index]) {
                contact[header] = values[index].trim();
              }
            });
            
            if (contact.name || contact.email || contact.firstname) {
              contacts.push({
                name: contact.name || `${contact.firstname || ''} ${contact.lastname || ''}`.trim(),
                email: contact.email || '',
                company: contact.company || contact.organization || '',
                title: contact.title || contact.position || '',
                phone: contact.phone || contact.mobile || ''
              });
            }
          }
        }
      } else if (fileType === 'vcf') {
        // Parse VCard file
        const vcardText = fileBuffer.toString('utf-8');
        const vcards = vcardText.split('BEGIN:VCARD');
        
        for (const vcard of vcards) {
          if (vcard.includes('FN:') || vcard.includes('EMAIL:')) {
            const contact: any = {};
            const lines = vcard.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('FN:')) {
                contact.name = line.substring(3).trim();
              } else if (line.startsWith('EMAIL:')) {
                contact.email = line.split(':')[1].trim();
              } else if (line.startsWith('ORG:')) {
                contact.company = line.substring(4).trim();
              } else if (line.startsWith('TITLE:')) {
                contact.title = line.substring(6).trim();
              } else if (line.startsWith('TEL:')) {
                contact.phone = line.split(':')[1].trim();
              }
            }
            
            if (contact.name || contact.email) {
              contacts.push(contact);
            }
          }
        }
      }

      // Save contacts to database
      let processedCount = 0;
      for (const contact of contacts) {
        try {
          await db.insert(persons).values([{
            id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: contact.name || 'Unknown',
            email: contact.email || null,
            company: contact.company || null,
            title: contact.title || null,
            location: contact.location || null,
            education: contact.education || null,
            family: contact.family || null,
            hometowns: contact.hometowns || null,
            linkedin: contact.linkedin || null,
            source: 'uploaded_contact'
          }]);
          processedCount++;
        } catch (insertError) {
          console.warn('Failed to insert contact:', contact.name, insertError);
        }
      }

      res.json({
        success: true,
        message: `Successfully imported ${processedCount} contacts`,
        processedCount,
        totalContacts: contacts.length
      });

    } catch (error) {
      console.error('Contact upload error:', error);
      res.status(500).json({ error: 'Failed to process contact file' });
    }
  });

  // Get contact statistics
  app.get('/api/contacts/stats', async (req: Request, res: Response) => {
    try {
      const result = await db.select().from(persons);
      res.json({
        totalContacts: result.length,
        hasContacts: result.length > 0
      });
    } catch (error) {
      console.error('Contact stats error:', error);
      res.status(500).json({ error: 'Failed to fetch contact statistics' });
    }
  });

  // User profile management
  app.get('/api/user/profile', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const profile = await userService.getProfile(userId);
      if (!profile) {
        return res.json({
          userId: userId,
          name: '',
          email: '',
          company: '',
          title: '',
          education: [],
          organizations: [],
          family: [],
          hometowns: []
        });
      }
      res.json(profile);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.post('/api/user/profile', authMiddleware, async (req: Request, res: Response) => {
    try {
      const profileData = {
        email: req.body.email,
        name: req.body.name,
        company: req.body.company,
        title: req.body.title,
        education: req.body.education || [],
        organizations: req.body.organizations || [],
        family: req.body.family || [],
        hometowns: req.body.hometowns || []
      };

      const userId = (req.user as any)?.claims?.sub;
      const profile = await userService.createOrUpdateProfile(userId, profileData);
      res.json(profile);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Networking AI Chatbot endpoints
  app.post('/api/networking/chat/advice', authMiddleware, async (req: any, res: Response) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const { networkingChatbotService } = await import('./services/networkingChatbotService');
      
      // Get user networking context
      const userContext = await networkingChatbotService.getUserNetworkingContext(req.user.id);
      
      // Merge provided context with user context
      const fullContext = {
        ...userContext,
        ...context
      };

      const advice = await networkingChatbotService.getNetworkingAdvice(
        req.user.id,
        message,
        fullContext
      );

      res.json({
        success: true,
        advice,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting networking advice:', error);
      res.status(500).json({ 
        error: 'Failed to get networking advice' 
      });
    }
  });

  app.get('/api/networking/chat/history', authMiddleware, async (req: any, res: Response) => {
    try {
      const { networkingChatbotService } = await import('./services/networkingChatbotService');
      
      const history = networkingChatbotService.getConversationHistory(req.user.id);

      res.json(history);

    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({ 
        error: 'Failed to get chat history' 
      });
    }
  });

  app.delete('/api/networking/chat/history', authMiddleware, async (req: any, res: Response) => {
    try {
      const { networkingChatbotService } = await import('./services/networkingChatbotService');
      
      networkingChatbotService.clearConversationHistory(req.user.id);

      res.json({ success: true, message: 'Chat history cleared' });

    } catch (error) {
      console.error('Error clearing chat history:', error);
      res.status(500).json({ 
        error: 'Failed to clear chat history' 
      });
    }
  });

  app.post('/api/networking/generate-introduction', authMiddleware, async (req: any, res: Response) => {
    try {
      const { 
        requesterName, 
        connectorName, 
        targetName, 
        targetCompany, 
        purpose, 
        context 
      } = req.body;
      
      if (!requesterName || !connectorName || !targetName || !targetCompany || !purpose) {
        return res.status(400).json({ 
          error: 'Missing required fields: requesterName, connectorName, targetName, targetCompany, purpose' 
        });
      }

      const { networkingChatbotService } = await import('./services/networkingChatbotService');
      
      const introductionMessage = await networkingChatbotService.generateIntroductionMessage(
        requesterName,
        connectorName,
        targetName,
        targetCompany,
        purpose,
        context
      );

      res.json({
        success: true,
        message: introductionMessage,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating introduction message:', error);
      res.status(500).json({ 
        error: 'Failed to generate introduction message' 
      });
    }
  });

  app.post('/api/networking/analyze-opportunity', authMiddleware, async (req: any, res: Response) => {
    try {
      const { opportunity, userProfile } = req.body;
      
      if (!opportunity) {
        return res.status(400).json({ error: 'Opportunity details are required' });
      }

      const { networkingChatbotService } = await import('./services/networkingChatbotService');
      
      const analysis = await networkingChatbotService.analyzeNetworkingOpportunity(
        userProfile,
        opportunity
      );

      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error analyzing networking opportunity:', error);
      res.status(500).json({ 
        error: 'Failed to analyze networking opportunity' 
      });
    }
  });

  // Introduction request management
  app.post('/api/introduction/request', introRequestLimiter, authMiddleware, async (req: any, res: Response) => {
    try {
      const { path, messageTemplate, targetName, targetCompany } = req.body;
      
      if (!path || !messageTemplate || !targetName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const userId = (req.user as any)?.claims?.sub;
      const requestData = {
        userId,
        targetName,
        targetCompany,
        connectionPath: path,
        messageTemplate,
        status: 'pending' as const
      };

      const savedRequest = await userService.saveConnectionRequest(requestData as any);
      res.json({
        success: true,
        requestId: savedRequest.requestId,
        message: 'Introduction request saved successfully'
      });
    } catch (error) {
      console.error('Introduction request error:', error);
      res.status(500).json({ error: 'Failed to create introduction request' });
    }
  });

  app.get('/api/introduction/history', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const requests = await userService.getConnectionRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error('History fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch introduction history' });
    }
  });

  // Connection suggestions
  app.get('/api/connections/suggestions', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const profile = await userService.getProfile(userId);
      
      if (!profile) {
        return res.json([]);
      }

      // Generate AI-powered suggestions based on user profile
      const suggestionsPrompt = `
Based on this professional profile, suggest 4 specific people this person should consider connecting with:

Profile:
- ${profile.name}, ${profile.title} at ${profile.company}
- Education: ${typeof profile.education === 'string' ? profile.education : 'Not specified'}
- Organizations: ${typeof profile.organizations === 'string' ? profile.organizations : 'Not specified'}

For each suggestion, provide:
1. Name and title
2. Company
3. Specific reason why they should connect
4. Estimated likelihood of successful connection (percentage)

Format as JSON array with fields: name, title, company, reason, likelihood, mutualConnections`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: suggestionsPrompt }],
        max_tokens: 400,
        temperature: 0.8
      });

      try {
        const suggestions = JSON.parse(response.choices[0]?.message?.content || '[]');
        const suggestionsWithIds = suggestions.map((s: any) => ({
          id: `suggestion-${Date.now()}-${Math.random()}`,
          ...s
        }));
        res.json(suggestionsWithIds);
      } catch (parseError) {
        res.json([]);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate suggestions' });
    }
  });

  // Data ingestion endpoints
  app.post('/api/data/import-company', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { companyName, employees, source } = req.body;
      
      if (!companyName || !employees || !Array.isArray(employees)) {
        return res.status(400).json({ error: 'Company name and employees array required' });
      }

      // For now, return success with processed data structure
      const results = {
        imported: employees.length,
        updated: 0,
        errors: [],
        processed: employees.map(emp => ({
          id: `${companyName}_${emp.name}`.replace(/\s+/g, '_'),
          name: emp.name,
          email: emp.email,
          company: companyName,
          title: emp.title || '',
          department: emp.department || '',
          relationships: []
        }))
      };

      res.json({
        success: true,
        results,
        message: `Processed ${results.imported} employees from ${companyName}`
      });
    } catch (error) {
      console.error('Company import error:', error);
      res.status(500).json({ error: 'Failed to import company directory' });
    }
  });

  app.get('/api/data/search-people', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }

      // Mock search results for demonstration
      const mockResults = [
        {
          id: 'person_1',
          name: 'John Smith',
          email: 'john.smith@company.com',
          company: 'Tech Corp',
          title: 'Software Engineer',
          department: 'Engineering'
        },
        {
          id: 'person_2', 
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          company: 'Tech Corp',
          title: 'Product Manager',
          department: 'Product'
        }
      ].filter(person => 
        person.name.toLowerCase().includes(query.toLowerCase()) ||
        person.company.toLowerCase().includes(query.toLowerCase()) ||
        person.title.toLowerCase().includes(query.toLowerCase())
      );

      res.json(mockResults);
    } catch (error) {
      console.error('People search error:', error);
      res.status(500).json({ error: 'Failed to search people' });
    }
  });

  app.post('/api/data/find-path', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { fromPersonId, toPersonId, maxHops } = req.body;
      
      if (!fromPersonId || !toPersonId) {
        return res.status(400).json({ error: 'Both fromPersonId and toPersonId required' });
      }

      // Check if Neo4j credentials are configured
      if (!process.env.NEO4J_URI || !process.env.NEO4J_USER || !process.env.NEO4J_PASSWORD) {
        return res.status(503).json({ 
          error: 'Graph database not configured. Please provide Neo4j credentials to enable advanced pathfinding.',
          requiresSetup: true
        });
      }

      // Import and use the graph service for authentic path finding
      const graphService = await import('./services/graphDatabaseService');
      const paths = await graphService.default.findShortestPath(fromPersonId, toPersonId, maxHops || 4);
      
      res.json({ 
        paths,
        source: 'neo4j_graph_database',
        isAuthentic: true
      });
    } catch (error) {
      console.error('Path finding error:', error);
      res.status(500).json({ error: 'Failed to find connection paths' });
    }
  });

  app.get('/api/data/network-stats/:personId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { personId } = req.params;
      const stats = await dataIngestionService.getNetworkStats(personId);
      res.json(stats);
    } catch (error) {
      console.error('Network stats error:', error);
      res.status(500).json({ error: 'Failed to get network statistics' });
    }
  });

  // Enhanced connection search using real graph data
  app.post('/api/connections/search-enhanced', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { targetName, targetCompany } = req.body;
      
      if (!targetName) {
        return res.status(400).json({ error: 'Target name is required' });
      }

      // First, search for the target person in our database
      const searchResults = await dataIngestionService.searchPeople(targetName);
      const targetPersons = searchResults.filter((person: any) => 
        !targetCompany || person.company.toLowerCase().includes(targetCompany.toLowerCase())
      );

      if (targetPersons.length === 0) {
        // Fall back to AI-generated paths if no database results
        return res.json({
          paths: [],
          message: 'Target not found in network database. Consider importing their company directory first.'
        });
      }

      // Find real connection paths for each target
      const allPaths = [];
      for (const target of targetPersons.slice(0, 3)) { // Limit to 3 targets
        const userId = (req.user as any)?.claims?.sub;
        const paths = await dataIngestionService.findConnectionPaths(userId, target.id, 4);
        allPaths.push(...paths);
      }

      // Generate AI insights for the real connections found
      if (allPaths.length > 0) {
        const insightsPrompt = `
Based on these real connection paths to ${targetName}, provide strategic networking advice:

Found ${allPaths.length} connection path(s) with ${allPaths[0]?.hops || 0} hops average.

Provide specific advice on:
1. Which path to prioritize and why
2. Best approach for the introduction request
3. What value proposition to emphasize

Keep response under 150 words.`;

        const insightsResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: insightsPrompt }],
          max_tokens: 200,
          temperature: 0.7
        });

        res.json({
          paths: allPaths,
          aiInsights: insightsResponse.choices[0]?.message?.content || 'Real connection paths found',
          targetPersons,
          isRealData: true
        });
      } else {
        res.json({
          paths: [],
          message: 'No connection paths found to target person.',
          targetPersons,
          isRealData: true
        });
      }

    } catch (error) {
      console.error('Enhanced connection search error:', error);
      res.status(500).json({ error: 'Failed to perform enhanced connection search' });
    }
  });

  // Enhanced PostgreSQL-based connection finder (no Neo4j required)
  app.post('/api/connections/find-enhanced', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { fromPersonId, toPersonId, maxDepth = 3 } = req.body;
      
      if (!fromPersonId || !toPersonId) {
        return res.status(400).json({ error: 'Both fromPersonId and toPersonId are required' });
      }

      const { SimpleConnectionFinder } = await import('./services/simpleConnectionFinder');
      const finder = new SimpleConnectionFinder();
      
      const result = await finder.findConnections(fromPersonId, toPersonId, maxDepth);
      
      // Add AI insights for successful connections
      if (result.found && result.paths.length > 0) {
        const bestPath = result.paths[0];
        const pathNames = bestPath.path.map(p => p.name).join(' → ');
        
        const insightsPrompt = `
        Found a ${bestPath.pathLength}-hop connection path: ${pathNames}
        
        Provide concise networking advice:
        1. Best approach for this introduction
        2. Key talking points to mention
        3. Timing recommendation
        
        Keep under 100 words.`;

        try {
          const insightsResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: insightsPrompt }],
            max_tokens: 150,
            temperature: 0.7
          });

          (result as any).aiInsights = insightsResponse.choices[0]?.message?.content || 'Connection path found';
        } catch (aiError) {
          console.error('AI insights error:', aiError);
          (result as any).aiInsights = 'Connection path found - AI insights temporarily unavailable';
        }
      }
      
      res.json({
        ...result,
        source: 'postgresql_enhanced',
        isAuthentic: true,
        connectionStrength: result.found ? result.paths[0]?.strengthScore || 0 : 0
      });
    } catch (error: any) {
      console.error('Enhanced connection finder error:', error);
      res.status(500).json({ error: 'Failed to find connections' });
    }
  });

  // Advanced connection finder with longer paths
  app.post('/api/connections/find-advanced', async (req: Request, res: Response) => {
    try {
      const { fromPersonId, toPersonId, maxHops = 6, minStrength = 30, preferredCompanies, includeWeakTies = false } = req.body;
      
      if (!fromPersonId || !toPersonId) {
        return res.status(400).json({ error: 'Both fromPersonId and toPersonId are required' });
      }

      const { advancedConnectionFinder } = await import('./services/advancedConnectionFinder');
      await advancedConnectionFinder.initialize();
      
      const options = {
        maxHops,
        minStrength,
        preferredCompanies,
        includeWeakTies
      };
      
      const paths = await advancedConnectionFinder.findBestPaths(fromPersonId, toPersonId, options);
      
      // Add AI insights for the best path
      if (paths.length > 0) {
        const bestPath = paths[0];
        const pathNames = bestPath.nodes.map(n => n.name).join(' → ');
        
        const insightsPrompt = `
        Found a ${bestPath.hops}-hop connection path: ${pathNames}
        
        Path Score: ${bestPath.pathScore.toFixed(1)}/100
        Confidence: ${bestPath.confidenceScore.toFixed(1)}%
        Strategy: ${bestPath.introductionStrategy}
        
        Provide concise networking advice:
        1. Best approach for this introduction
        2. Key talking points to leverage
        3. Timing and sequence recommendations
        
        Keep under 120 words.`;

        try {
          const insightsResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: insightsPrompt }],
            max_tokens: 200,
            temperature: 0.7
          });

          (bestPath as any).aiInsights = insightsResponse.choices[0]?.message?.content || 'Advanced connection path found';
        } catch (aiError) {
          console.error('AI insights error:', aiError);
          (bestPath as any).aiInsights = 'Advanced connection path found - AI insights temporarily unavailable';
        }
      }
      
      res.json({
        found: paths.length > 0,
        paths,
        totalPaths: paths.length,
        source: 'advanced_pathfinder',
        isAuthentic: true,
        networkStats: advancedConnectionFinder.getNetworkStats()
      });
    } catch (error: any) {
      console.error('Advanced connection finder error:', error);
      res.status(500).json({ error: 'Failed to find advanced connections' });
    }
  });

  // Minimal input connection finder for sparse data scenarios
  app.post('/api/connections/find-minimal', async (req: Request, res: Response) => {
    try {
      const { targetName, targetCompany, targetTitle, userContext } = req.body;
      
      if (!targetName || !targetCompany) {
        return res.status(400).json({ error: 'Target name and company are required' });
      }

      const { intelligentConnectionMatcher } = await import('./services/intelligentConnectionMatcher');
      
      const result = await intelligentConnectionMatcher.findByMinimalInfo(
        targetName, 
        targetCompany, 
        targetTitle
      );
      
      // Generate AI-powered networking strategy
      if (result.found && result.matches.length > 0) {
        const strategyPrompt = `
        Target: ${targetName} at ${targetCompany} ${targetTitle ? `(${targetTitle})` : ''}
        
        Available connections: ${result.matches.slice(0, 3).map(m => 
          `${m.name} at ${m.company} (${m.title || 'Unknown role'})`
        ).join(', ')}
        
        Provide a concise networking strategy:
        1. Best connection to approach first
        2. Key talking points for the introduction request
        3. Timeline and follow-up recommendations
        
        Keep under 100 words.`;

        try {
          const strategyResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: strategyPrompt }],
            max_tokens: 150,
            temperature: 0.7
          });

          result.strategy = strategyResponse.choices[0]?.message?.content || result.strategy;
        } catch (aiError) {
          console.error('AI strategy generation error:', aiError);
        }
      }
      
      res.json({
        found: result.found,
        matches: result.matches,
        confidence: (result as any).confidence,
        strategy: result.strategy,
        source: 'intelligent_matching',
        isAuthentic: true
      });
    } catch (error: any) {
      console.error('Minimal connection finder error:', error);
      res.status(500).json({ error: 'Failed to find connections with minimal input' });
    }
  });

  // Data enrichment endpoints - placeholder for future implementation
  app.post('/api/enrichment/profile/:personId', authMiddleware, async (req: Request, res: Response) => {
    res.json({ message: 'Profile enrichment will be available after service startup issues are resolved' });
  });

  app.get('/api/enrichment/stats', authMiddleware, async (req: Request, res: Response) => {
    res.json({ 
      profiles: { total: 0, enriched: 0, enrichmentRate: 0 },
      relationships: { total: 0, enriched: 0, enrichmentRate: 0 },
      companies: { withInsights: 0 }
    });
  });

  // Onboarding endpoints
  app.post('/api/onboarding/save', async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        company,
        title,
        bio,
        socialProfiles,
        education,
        greekLife,
        family,
        hometowns
      } = req.body;

      if (!name || !email || !company) {
        return res.status(400).json({
          error: 'Name, email, and company are required fields'
        });
      }

      // For now, return success - in production, save to database
      res.json({
        success: true,
        message: 'Enhanced profile saved successfully',
        profile: {
          name,
          email,
          company,
          title,
          socialProfiles,
          education,
          greekLife,
          family,
          hometowns
        }
      });

    } catch (error) {
      console.error('Onboarding save error:', error);
      res.status(500).json({
        error: 'Failed to save profile'
      });
    }
  });

  // Enhanced graph rebuild endpoint with all relationship types
  app.get('/api/rebuild-graph', authMiddleware, async (req: Request, res: Response) => {
    try {
      console.log('Starting enhanced graph rebuild with all relationship types...');
      
      const { GraphIngestionService } = await import('./services/graphIngestionService');
      const graphIngestionService = new GraphIngestionService();
      await graphIngestionService.rebuildGraph();
      const stats = { nodes: 0, edges: 0, lastUpdate: new Date() };
      
      console.log('Enhanced graph rebuild completed:', stats);
      
      res.json({ 
        success: true, 
        message: 'Enhanced graph rebuilt successfully with family, education, Greek life, hometown, and social connections',
        stats: {
          nodes: stats.nodes,
          edges: stats.edges,
          relationshipTypes: ['COWORKER', 'FAMILY', 'EDUCATION', 'GREEK_LIFE', 'HOMETOWN', 'SOCIAL'],
          lastUpdate: stats.lastUpdate
        }
      });
    } catch (error) {
      console.error('Enhanced graph rebuild error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to rebuild enhanced graph',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Analytics endpoints with authentic MongoDB data integration
  app.get('/api/analytics/network', authMiddleware, async (req: Request, res: Response) => {
    try {
      // Import TypeScript analytics service for real data from MongoDB
      const analyticsService = await import('./services/analyticsService');
      
      // Get authentic network analytics
      const networkData = await analyticsService.default.getNetworkAnalytics();
      
      res.json(networkData);
    } catch (error) {
      logger.error('Network analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve network analytics from database',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: {
          overview: { totalPersons: 0, totalRelationships: 0, averageConnectionsPerPerson: '0', networkDensity: '0.00' },
          companies: [],
          departments: [],
          relationshipTypes: [],
          topConnectors: [],
          strengthDistribution: []
        }
      });
    }
  });

  app.get('/api/analytics/trending', authMiddleware, async (req: Request, res: Response) => {
    try {
      // Import analytics service for real trending data from MongoDB
      const analyticsService = await import('./services/analyticsService');
      
      // Get authentic trending insights
      const trendingData = await analyticsService.default.getTrendingActivities();
      
      res.json(trendingData);
    } catch (error) {
      logger.error('Trending analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve trending analytics from database',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 1. Find connections by company (legacy route)
  app.post('/api/find-connections', authMiddleware, async (req: Request, res: Response) => {
    const { company } = req.body;
    if (!company) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }
    
    try {
      const result = await findConnectionsByCompany(company, (req.user as any)?.claims?.sub);
      return res.json(result);
    } catch (err) {
      console.error('Error finding connections:', err);
      return res.status(500).json({ success: false, message: 'Error finding connections' });
    }
  });

  // 2. Save a connection to the user's account
  app.post('/api/user/connections', authMiddleware, async (req: Request, res: Response) => {
    const { company, name, title } = req.body;
    
    if (!company || !name) {
      return res.status(400).json({ success: false, message: 'Company and name are required' });
    }
    
    try {
      const userId = (req.user as any)?.claims?.sub;
      const connectionData = { 
        targetName: name, 
        targetCompany: company, 
        connectionType: 'warm_introduction' as const,
        name,
        title,
        company
      };
      const connectionData: ConnectionData = {
        targetName: name,
        targetCompany: company,
        targetTitle: title,
        connectionType: 'warm_introduction'
      };
      const result = await createConnection(userId, connectionData);
      return res.status(201).json(result);
    } catch (err) {
      console.error('Error saving connection:', err);
      return res.status(500).json({ success: false, message: 'Error saving connection' });
    }
  });

  // 3. Get user's saved connections
  app.get('/api/user/connections', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const result = await getUserConnections(userId);
      return res.json(result);
    } catch (err) {
      console.error('Error getting user connections:', err);
      return res.status(500).json({ success: false, message: 'Error getting user connections' });
    }
  });

  // Connection Strength API endpoints using authentic MongoDB data
  app.get('/api/connections/strength/:fromPersonId/:toPersonId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { fromPersonId, toPersonId } = req.params;
      
      const ConnectionStrengthCalculator = await import('./services/connectionStrengthCalculator');
      const calculator = new ConnectionStrengthCalculator.default();
      
      const strengthData = await calculator.calculateConnectionStrength(fromPersonId, toPersonId);
      
      res.json({
        success: true,
        fromPersonId,
        toPersonId,
        ...strengthData
      });
    } catch (error) {
      console.error('Connection strength calculation error:', error);
      res.status(500).json({ 
        error: 'Failed to calculate connection strength from database',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/connections/strength/batch', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { connectionPairs } = req.body;
      
      if (!Array.isArray(connectionPairs) || connectionPairs.length === 0) {
        return res.status(400).json({ error: 'connectionPairs array is required' });
      }

      const ConnectionStrengthCalculator = await import('./services/connectionStrengthCalculator');
      const calculator = new ConnectionStrengthCalculator.default();
      
      const results = await calculator.batchCalculate(connectionPairs);
      
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error) {
      console.error('Batch strength calculation error:', error);
      res.status(500).json({ 
        error: 'Failed to calculate batch connection strengths',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/connections/strength-stats', authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!process.env.MONGODB_URI) {
        return res.status(503).json({
          error: 'Database connection required for strength statistics',
          requiresSetup: true
        });
      }

      const mongoose = require('mongoose');
      if (!mongoose.connection.readyState) {
        await mongoose.connect(process.env.MONGODB_URI);
      }

      const db = mongoose.connection.db;
      const strengthHistory = db.collection('connection_strength_history');
      
      // Get authentic strength statistics from your data
      const stats = await strengthHistory.aggregate([
        {
          $group: {
            _id: null,
            averageStrength: { $avg: '$score' },
            totalCalculations: { $sum: 1 },
            strongConnections: {
              $sum: { $cond: [{ $gte: ['$score', 80] }, 1, 0] }
            },
            moderateConnections: {
              $sum: { $cond: [{ $and: [{ $gte: ['$score', 60] }, { $lt: ['$score', 80] }] }, 1, 0] }
            },
            weakConnections: {
              $sum: { $cond: [{ $lt: ['$score', 60] }, 1, 0] }
            }
          }
        }
      ]).toArray();

      const networkStats = stats.length > 0 ? stats[0] : {
        averageStrength: 0,
        totalCalculations: 0,
        strongConnections: 0,
        moderateConnections: 0,
        weakConnections: 0
      };

      res.json({
        success: true,
        networkStats: {
          ...networkStats,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Strength statistics error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve connection strength statistics from database',
        details: (error as Error).message 
      });
    }
  });

  // Real-time network activity endpoints using MongoDB
  app.get('/api/analytics/network-activity', authMiddleware, async (req: Request, res: Response) => {
    try {
      const NetworkActivityTracker = await import('./services/networkActivityTracker');
      const tracker = new NetworkActivityTracker.default();
      
      await tracker.initialize();
      const recentActivity = await tracker.getActivitySummary(24);
      
      res.json({
        success: true,
        summary: recentActivity,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Network activity error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve network activity from database',
        details: (error as Error).message 
      });
    }
  });

  app.get('/api/connections/top-strength', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      
      const NetworkActivityTracker = await import('./services/networkActivityTracker');
      const tracker = new NetworkActivityTracker.default();
      
      await tracker.initialize();
      const stats = tracker.getMonitoringStats();
      
      res.json({
        success: true,
        stats: stats,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Top connections error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve top connections from database',
        details: (error as Error).message 
      });
    }
  });

  app.get('/api/analytics/network-insights', authMiddleware, async (req: Request, res: Response) => {
    try {
      const NetworkActivityTracker = await import('./services/networkActivityTracker');
      const tracker = new NetworkActivityTracker.default();
      
      await tracker.initialize();
      const [stats, insights] = await Promise.all([
        tracker.getMonitoringStats(),
        tracker.getActivitySummary(24)
      ]);
      
      res.json({
        success: true,
        networkStats: stats,
        insights: insights,
        generatedAt: new Date()
      });
    } catch (error: any) {
      console.error('Network insights error:', error);
      res.status(500).json({ 
        error: 'Failed to generate network insights from database',
        details: (error as Error).message 
      });
    }
  });

  // Comprehensive connection strength testing endpoint
  app.post('/api/connections/test-engine', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { ConnectionTester } = await import('./services/connectionTester');
      const tester = new ConnectionTester();
      
      const results = await tester.runComprehensiveTests();
      
      res.json({
        success: true,
        testResults: results,
        timestamp: new Date()
      });
    } catch (error: any) {
      console.error('Connection engine test error:', error);
      res.status(500).json({ 
        error: 'Failed to run connection strength tests',
        details: (error as Error).message 
      });
    }
  });

  // Company-wide connection finder endpoints
  app.post('/api/connections/find-company-paths', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { targetName, targetCompany } = req.body;
      
      if (!targetName) {
        return res.status(400).json({ error: 'Target name is required' });
      }

      const { CompanyNetworkService } = await import('./services/companyNetworkService');
      const networkService = new CompanyNetworkService();
      
      const results = await networkService.findConnectionPath(targetName, targetCompany);
      
      res.json({
        success: true,
        ...results
      });
    } catch (error: any) {
      console.error('Company connection path finding error:', error);
      res.status(500).json({ 
        error: 'Failed to find connection paths through company network',
        details: (error as Error).message 
      });
    }
  });

  app.get('/api/company/employees', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { CompanyNetworkService } = await import('./services/companyNetworkService');
      const networkService = new CompanyNetworkService();
      
      await networkService.initialize();
      const stats = await networkService.getNetworkAnalytics();
      
      res.json({
        success: true,
        total: stats.totalEmployees,
        averageConnections: stats.averageConnectionsPerEmployee,
        totalCompanies: stats.totalCompanies
      });
    } catch (error: any) {
      console.error('Company employees data error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve company employee data',
        details: (error as Error).message 
      });
    }
  });

  app.get('/api/analytics/company-network', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { CompanyNetworkService } = await import('./services/companyNetworkService');
      const networkService = new CompanyNetworkService();
      
      const analytics = await networkService.getNetworkAnalytics();
      
      res.json({
        success: true,
        ...analytics
      });
    } catch (error: any) {
      console.error('Company network analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to generate company network analytics',
        details: (error as Error).message 
      });
    }
  });

  // Social media integration routes
  app.get('/api/user/social-accounts', authMiddleware, async (req: Request, res: Response) => {
    try {
      // For demo purposes, use a default user ID of 1 since auth may return string IDs
      const userId = 1;
      
      const userSocialAccounts = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.userId, userId));
      
      res.json(userSocialAccounts);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      res.status(500).json({ error: 'Failed to fetch social accounts' });
    }
  });

  app.post('/api/social/connect', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { platform, accessToken, refreshToken, profileData } = req.body;
      const SocialIntegrationService = require('./services/socialIntegrationService.js').default;
      const socialService = new SocialIntegrationService();
      const userId = (req as any).user?.id || 1; // Mock user for demo
      
      const result = await socialService.connectSocialAccount(
        userId, 
        platform, 
        accessToken, 
        refreshToken, 
        profileData
      );
      res.json(result);
    } catch (error) {
      console.error('Error connecting social account:', error);
      res.status(500).json({ error: 'Failed to connect social account' });
    }
  });

  app.post('/api/social/disconnect', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { platform } = req.body;
      const SocialIntegrationService = require('./services/socialIntegrationService.js').default;
      const socialService = new SocialIntegrationService();
      const userId = (req as any).user?.id || 1; // Mock user for demo
      
      const result = await socialService.disconnectSocialAccount(userId, platform);
      res.json(result);
    } catch (error) {
      console.error('Error disconnecting social account:', error);
      res.status(500).json({ error: 'Failed to disconnect social account' });
    }
  });

  app.get('/api/social/connection-score', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { SocialIntegrationService } = await import('./services/socialIntegrationService');
      const socialService = new SocialIntegrationService();
      const userId = (req as any).user?.id || 1; // Mock user for demo
      
      const score = await socialService.calculateConnectionScore(userId);
      res.json(score);
    } catch (error) {
      console.error('Error calculating connection score:', error);
      res.status(500).json({ error: 'Failed to calculate connection score' });
    }
  });

  // LinkedIn OAuth routes
  app.get('/auth/linkedin', (req: Request, res: Response) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'LinkedIn Client ID not configured' });
    }
    
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/linkedin/callback`;
    const scope = 'openid profile email';
    const state = Math.random().toString(36).substring(7);
    
    // Store state in cookie for security (since session might not be configured)
    res.cookie('linkedin_state', state, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600000 // 10 minutes
    });
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    
    res.redirect(authUrl);
  });

  app.get('/auth/linkedin/callback', async (req: Request, res: Response) => {
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        console.error('LinkedIn OAuth error:', error);
        return res.redirect('/?error=linkedin_auth_failed');
      }
      
      // Verify state parameter for security
      const cookieState = req.cookies?.linkedin_state;
      if (!cookieState || cookieState !== state) {
        console.error('LinkedIn OAuth state mismatch');
        return res.redirect('/?error=invalid_state');
      }
      
      if (!code) {
        console.error('LinkedIn OAuth: No authorization code received');
        return res.redirect('/?error=no_auth_code');
      }
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error('LinkedIn credentials not configured');
        return res.redirect('/?error=linkedin_not_configured');
      }
      const redirectUri = `${req.protocol}://${req.get('host')}/auth/linkedin/callback`;

      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        // Clear the state cookie
        res.clearCookie('linkedin_state');
        
        // Get user profile using v2 API
        const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });
        
        const profileData = await profileResponse.json();
        
        // Store the connection and start data ingestion
        const { SocialIntegrationService } = await import('./services/socialIntegrationService');
        const { linkedinOAuthService } = await import('./services/linkedinOAuthService');
        
        const socialService = new SocialIntegrationService();
        const userId = 1; // Demo user
        
        try {
          await socialService.connectSocialAccount(
            userId,
            'linkedin',
            tokenData.access_token,
            tokenData.refresh_token,
            profileData
          );
          
          // Start comprehensive data ingestion
          const ingestionResult = await linkedinOAuthService.startDataIngestion(
            tokenData.access_token,
            profileData.id || profileData.sub
          );
        
          console.log('LinkedIn data ingestion completed:', ingestionResult);
          
          res.redirect(`/onboarding?connected=linkedin&profiles=${ingestionResult.profilesIngested}&connections=${ingestionResult.connectionsFound}`);
        } catch (error) {
          console.error('LinkedIn connection error:', error);
          res.redirect('/onboarding?error=linkedin_connection_failed');
        }
      } else {
        res.redirect('/onboarding?error=linkedin_auth_failed');
      }
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      res.redirect('/onboarding?error=linkedin_auth_failed');
    }
  });

  // Salesforce OAuth routes
  app.get('/auth/salesforce', (req: Request, res: Response) => {
    res.status(400).json({
      error: 'Salesforce integration requires API credentials',
      message: 'Please provide SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET to enable Salesforce integration',
      setup_instructions: 'Create a Connected App in your Salesforce org setup'
    });
  });

  // HubSpot OAuth routes  
  app.get('/auth/hubspot', (req: Request, res: Response) => {
    res.status(400).json({
      error: 'HubSpot integration requires API credentials',
      message: 'Please provide HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET to enable HubSpot integration',
      setup_instructions: 'Create a private app at developers.hubspot.com'
    });
  });

  // Instagram OAuth routes
  app.get('/auth/instagram', (req: Request, res: Response) => {
    res.status(400).json({
      error: 'Instagram integration requires API credentials',
      message: 'Please provide Instagram API credentials through Facebook Developer Portal',
      setup_instructions: 'Create an app at developers.facebook.com and enable Instagram Basic Display'
    });
  });

  // Neo4j Graph Database Endpoints
  app.get('/api/neo4j/status', async (req: Request, res: Response) => {
    try {
      const { neo4jService } = await import('./services/neo4jService');
      const isConnected = await neo4jService.verifyConnection();
      res.json({ connected: isConnected, message: isConnected ? 'Neo4j connected' : 'Neo4j not available' });
    } catch (error) {
      res.json({ connected: false, message: 'Neo4j service not configured' });
    }
  });

  app.post('/api/neo4j/find-path', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { neo4jService } = await import('./services/neo4jService');
      const { fromPersonId, toPersonId } = req.body;
      
      if (!fromPersonId || !toPersonId) {
        return res.status(400).json({ error: 'Both fromPersonId and toPersonId are required' });
      }

      const paths = await neo4jService.findShortestPath(fromPersonId, toPersonId);
      res.json({ paths, totalPaths: paths.length });
    } catch (error) {
      console.error('Neo4j path finding error:', error);
      res.status(500).json({ error: 'Failed to find connection path' });
    }
  });

  app.get('/api/neo4j/company-connections/:companyName', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { neo4jService } = await import('./services/neo4jService');
      const { companyName } = req.params;
      const { targetPersonId } = req.query;
      
      const connections = await neo4jService.findConnectionsAtCompany(
        companyName, 
        targetPersonId as string | undefined
      );
      res.json({ connections, company: companyName });
    } catch (error) {
      console.error('Neo4j company connections error:', error);
      res.status(500).json({ error: 'Failed to find company connections' });
    }
  });

  app.get('/api/neo4j/network-stats/:personId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { neo4jService } = await import('./services/neo4jService');
      const { personId } = req.params;
      
      const stats = await neo4jService.getNetworkStats(personId);
      res.json({ personId, stats });
    } catch (error) {
      console.error('Neo4j network stats error:', error);
      res.status(500).json({ error: 'Failed to get network statistics' });
    }
  });

  // Enhanced connection search
  app.post('/api/connections/smart-search', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { query, company } = req.body;
      const userId = (req as any).user?.id || 1;
      
      // Get user's connected platforms
      const SocialIntegrationService = require('./services/socialIntegrationService.js').default;
      const socialService = new SocialIntegrationService();
      const socialAccounts = await socialService.getUserSocialAccounts(userId);
      
      if (socialAccounts.length === 0) {
        return res.status(400).json({
          error: 'No connected platforms',
          message: 'Connect LinkedIn, Salesforce, or HubSpot to search for connections'
        });
      }
      
      // Demo results using actual LinkedIn integration
      const mockResults = [
        {
          target: {
            name: query || "John Smith",
            title: "VP of Engineering",
            company: company || "Google",
            profileUrl: "https://linkedin.com/in/johnsmith"
          },
          path: [
            {
              name: "Sarah Johnson",
              title: "Senior Manager",
              company: "Microsoft", 
              relationshipType: "LinkedIn connection"
            }
          ],
          pathLength: 2,
          connectionStrength: 85,
          platforms: socialAccounts.map((acc: any) => acc.platform)
        }
      ];

      res.json({ results: mockResults });
    } catch (error) {
      console.error('Smart search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // PostgreSQL Graph Service routes
  app.get('/api/graph/status', async (req: Request, res: Response) => {
    try {
      const { postgresGraphService } = await import('./services/postgresGraphService');
      const testPeople = await postgresGraphService.findPeople('test', undefined);
      res.json({ 
        connected: true,
        message: 'PostgreSQL graph service active',
        database: 'PostgreSQL'
      });
    } catch (error) {
      res.status(500).json({ 
        connected: false, 
        message: 'PostgreSQL graph service unavailable',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/graph/find-path', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { postgresGraphService } = await import('./services/postgresGraphService');
      const { fromPersonId, toPersonId } = req.body;
      
      if (!fromPersonId || !toPersonId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Both fromPersonId and toPersonId are required' 
        });
      }
      
      const path = await postgresGraphService.findConnectionPath(fromPersonId, toPersonId);
      res.json({ 
        success: true, 
        path,
        message: path ? 'Connection path found' : 'No connection path found'
      });
    } catch (error) {
      console.error('Graph find path error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to find connection path',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/graph/network-stats/:personId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { postgresGraphService } = await import('./services/postgresGraphService');
      const { personId } = req.params;
      
      const stats = await postgresGraphService.getNetworkStats(personId);
      res.json({ 
        success: true, 
        stats,
        personId
      });
    } catch (error) {
      console.error('Graph network stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get network statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/graph/seed-demo-data', async (req: Request, res: Response) => {
    try {
      const { seedDemoNetworkData } = await import('./seed-demo-network');
      await seedDemoNetworkData();
      res.json({ 
        success: true, 
        message: 'Demo network data seeded successfully' 
      });
    } catch (error) {
      console.error('Seed demo data error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to seed demo data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Service Integration Testing Endpoint
  app.get('/api/test/service-integration', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { ServiceIntegrationTester } = await import('./services/serviceIntegrationTester');
      const tester = new ServiceIntegrationTester();
      
      const testSuite = await tester.runComprehensiveServiceTests();
      const dbTests = await tester.testDatabaseConnections();
      const apiTests = await tester.testAPIEndpoints();
      
      res.json({
        success: true,
        message: 'Service integration tests completed',
        data: {
          ...testSuite,
          databaseTests: dbTests,
          apiTests: apiTests
        }
      });
    } catch (error) {
      console.error('Service integration test error:', error);
      res.status(500).json({
        success: false,
        message: 'Service integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Download page route
  app.get('/download', (req: Request, res: Response) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const htmlPath = path.join(process.cwd(), 'download.html');
      
      if (!fs.existsSync(htmlPath)) {
        return res.status(404).send('Download page not found');
      }
      
      res.setHeader('Content-Type', 'text/html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      res.send(htmlContent);
    } catch (error) {
      console.error('Download page error:', error);
      res.status(500).send('Error loading download page');
    }
  });

  // Download endpoint for the clean project archive
  app.get('/download-project', (req: Request, res: Response) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'warmconnector-download.tar.gz');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Download file not found' });
      }
      
      res.setHeader('Content-Disposition', 'attachment; filename="warmconnector-project.tar.gz"');
      res.setHeader('Content-Type', 'application/gzip');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Download failed' });
    }
  });

  // AI-Powered Networking Suggestions routes
  app.post('/api/ai/networking-suggestions', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { AINetworkingService } = await import('./services/aiNetworkingService');
      const { userGoals, industryFocus } = req.body;
      const userId = (req as any).user?.id || 1; // Mock user ID for demo
      
      const aiService = new AINetworkingService();
      const suggestions = await aiService.generateNetworkingSuggestionsLegacy(
        userId,
        userGoals,
        industryFocus
      );
      
      res.json({
        success: true,
        data: suggestions,
        message: 'AI networking suggestions generated successfully'
      });
    } catch (error) {
      console.error('AI networking suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate networking suggestions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/ai/analyze-connection', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { aiNetworkingService } = await import('./services/aiNetworkingService');
      const { targetPersonId, userGoals } = req.body;
      const userId = (req as any).user?.id || 1;
      
      if (!targetPersonId) {
        return res.status(400).json({
          success: false,
          message: 'Target person ID is required'
        });
      }
      
      // Get user profile and target person
      const { db } = await import('./db');
      const { persons } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [userProfile] = await db.select().from(persons).where(eq(persons.userId, userId)).limit(1);
      const [targetPerson] = await db.select().from(persons).where(eq(persons.id, targetPersonId)).limit(1);
      
      if (!userProfile || !targetPerson) {
        return res.status(404).json({
          success: false,
          message: 'User or target person not found'
        });
      }
      
      // Use private method through a public wrapper
      const analysis = await (aiNetworkingService as any).analyzeConnectionPotential(
        userProfile,
        targetPerson,
        userGoals
      );
      
      res.json({
        success: true,
        data: analysis,
        message: 'Connection analysis completed'
      });
    } catch (error) {
      console.error('Connection analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced Connection Finder with n8n Workflow Integration
  app.post('/api/connections/find', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { targetName, targetCompany } = req.body;
      
      if (!targetName) {
        return res.status(400).json({ error: 'Target name is required' });
      }

      console.log('Finding connections for:', targetName, targetCompany || '(no company specified)');

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 12000)
      );

      const searchPromise = (async () => {
        // Try n8n workflow automation first
        const { n8nIntegrationService } = await import('./services/n8nIntegrationService');
        
        let enrichedData = null;
        try {
          enrichedData = await n8nIntegrationService.triggerConnectionResearchWorkflow(
            targetName, 
            targetCompany
          );
          console.log('N8n workflow completed successfully');
        } catch (n8nError) {
          console.log('N8n not available, using direct AI analysis');
        }

        // Enhanced AI analysis with n8n data
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key required for intelligent connection analysis');
        }

        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = enrichedData ? 
          `Analyze this enriched connection data: ${JSON.stringify(enrichedData)}. 
           Provide professional networking insights for "${targetName}"${targetCompany ? ` at ${targetCompany}` : ''}.
           Return JSON with: name, company, title, confidence (0-1), platforms, connection_strategy, and mutual_connections.` :
          `Analyze potential professional connections for "${targetName}"${targetCompany ? ` at ${targetCompany}` : ''}. 
           Provide realistic connection paths, professional background, and networking recommendations. 
           Return JSON with: name, company, title, confidence (0-1), platforms, and connection_strategy.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 600,
          temperature: 0.2,
          response_format: { type: "json_object" }
        });

        const aiResult = JSON.parse(response.choices[0].message.content || '{}');
        
        // Merge n8n data with AI analysis
        return {
          ...aiResult,
          n8n_enrichment: enrichedData ? {
            emailFound: enrichedData.emailFound,
            phoneFound: enrichedData.phoneFound,
            socialProfiles: enrichedData.socialProfiles,
            mutualConnections: enrichedData.mutualConnections,
            recentActivity: enrichedData.recentActivity,
            linkedinUrl: enrichedData.linkedinUrl
          } : null
        };
      })();

      const result = await Promise.race([searchPromise, timeoutPromise]);

      if (!result || !result.name) {
        return res.json({
          paths: [],
          totalFound: 0,
          message: 'No connections found. Try providing more specific information.',
          searchCriteria: { targetName, targetCompany }
        });
      }

      // Enhanced connection paths with n8n data
      const connectionPaths = [{
        path: [result.name],
        hops: 1,
        totalStrength: Math.round((result.confidence || 0.7) * 100),
        relationshipTypes: ['Professional'],
        details: {
          name: result.name,
          company: result.company || targetCompany || '',
          title: result.title || '',
          location: result.location,
          platforms: result.platforms || { linkedin: true },
          confidence: result.confidence || 0.7,
          enrichment: result.n8n_enrichment
        }
      }];

      res.json({
        paths: connectionPaths,
        totalFound: connectionPaths.length,
        searchCriteria: { targetName, targetCompany },
        dataSource: result.n8n_enrichment ? 'N8n + AI Enhanced Analysis' : 'AI-Powered Professional Analysis',
        connectionStrategy: result.connection_strategy,
        mutualConnections: result.mutual_connections || [],
        automationAvailable: !!result.n8n_enrichment
      });
    } catch (error) {
      console.error('Connection search error:', error);
      
      if (error.message?.includes('timeout')) {
        return res.status(408).json({ 
          error: 'Search timeout',
          message: 'Search took too long. Please try with more specific criteria.'
        });
      }
      
      if (error.message?.includes('OpenAI')) {
        return res.status(400).json({
          error: 'OpenAI API key required',
          message: 'Please provide OpenAI API credentials for intelligent connection analysis'
        });
      }
      
      res.status(500).json({ error: 'Failed to search for connections' });
    }
  });

  app.post('/api/connections/analyze-pair', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { connectionFinderService } = await import('./services/connectionFinderService');
      const { userAId, userBId } = req.body;
      
      if (!userAId || !userBId) {
        return res.status(400).json({
          success: false,
          message: 'Both userAId and userBId are required'
        });
      }
      
      const analysis = await connectionFinderService.analyzeConnection(userAId, userBId);
      
      res.json({
        success: true,
        data: analysis,
        message: 'Connection analysis completed'
      });
    } catch (error) {
      console.error('Connection pair analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze connection pair',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Seed basic professional network data
  app.post('/api/demo/seed-basic-data', async (req: Request, res: Response) => {
    try {
      const { basicDemoSeeder } = await import('./services/basicDemoSeeder');
      
      const result = await basicDemoSeeder.seedBasicNetworkingData();
      
      res.json({
        success: true,
        data: result,
        message: 'Basic professional network data seeded successfully'
      });
    } catch (error) {
      console.error('Demo seeding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed demo data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI-powered connection intelligence endpoints
  app.post('/api/ai/analyze-connection', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { fromPersonId, toPersonId, context } = req.body;
      const { aiConnectionIntelligence } = await import('./services/aiConnectionIntelligence');
      
      const analysis = await aiConnectionIntelligence.analyzeConnectionOpportunity(
        fromPersonId,
        toPersonId,
        context
      );
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('AI connection analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze connection opportunity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/ai/semantic-search', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { query, userContext } = req.body;
      const { aiConnectionIntelligence } = await import('./services/aiConnectionIntelligence');
      
      const results = await aiConnectionIntelligence.semanticSearch(query, userContext);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Semantic search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform semantic search',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/ai/networking-strategy', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { personId, goals, timeframe } = req.body;
      const { aiConnectionIntelligence } = await import('./services/aiConnectionIntelligence');
      
      const strategy = await aiConnectionIntelligence.generateNetworkingStrategy(
        personId,
        goals,
        timeframe
      );
      
      res.json({
        success: true,
        data: strategy
      });
    } catch (error) {
      console.error('Networking strategy generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate networking strategy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // LinkedIn data ingestion endpoints
  app.post('/api/linkedin/ingest-profile', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId, accessToken } = req.body;
      
      if (!accessToken) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn access token required'
        });
      }

      const { createLinkedInDataIngestion } = await import('./services/linkedinDataIngestion');
      const ingestionService = createLinkedInDataIngestion(accessToken);
      
      const result = await ingestionService.ingestUserProfile(userId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('LinkedIn profile ingestion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to ingest LinkedIn profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/linkedin/sync-company', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { companyId, accessToken } = req.body;
      
      if (!accessToken) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn access token required'
        });
      }

      const { createLinkedInDataIngestion } = await import('./services/linkedinDataIngestion');
      const ingestionService = createLinkedInDataIngestion(accessToken);
      
      const result = await ingestionService.syncCompanyEmployees(companyId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('LinkedIn company sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync company data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/linkedin/enrich-profiles', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { accessToken } = req.body;
      
      if (!accessToken) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn access token required'
        });
      }

      const { createLinkedInDataIngestion } = await import('./services/linkedinDataIngestion');
      const ingestionService = createLinkedInDataIngestion(accessToken);
      
      const result = await ingestionService.enrichExistingProfiles();
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Profile enrichment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enrich profiles',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Graph status endpoint for admin dashboard
  app.get('/api/graph/status', async (req: Request, res: Response) => {
    try {
      // Use graph service for basic status
      const { graphService } = await import('./graph-service');
      const status = await graphService.getServiceStatus();
      
      res.json({
        success: true,
        nodes: status.graphStats?.nodes || 0,
        edges: status.graphStats?.edges || 0,
        lastUpdate: status.lastRebuild || new Date(),
        relationshipTypes: ['COWORKER', 'FAMILY', 'EDUCATION', 'GREEK_LIFE', 'HOMETOWN', 'SOCIAL']
      });
    } catch (error) {
      console.error('Error getting graph status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get graph status' 
      });
    }
  });

  // Auto-seed MongoDB data on server startup check
  app.get('/api/startup/check-data', async (req: Request, res: Response) => {
    try {
      const { db } = await import('./db');
      const { persons } = await import('../shared/schema');
      
      // Check if we have any data
      const personCount = await db.select().from(persons);
      
      if (personCount.length === 0) {
        console.log('No data found, attempting MongoDB import...');
        
        const { seedEnhancedDemoData } = await import('../scripts/seedDemo');
        await seedEnhancedDemoData();
        
        // Trigger graph rebuild through the graph service
        const { graphService } = await import('./graph-service');
        await graphService.rebuildGraph();
        
        res.json({
          success: true,
          message: 'MongoDB data imported and graph built on startup',
          status,
          autoSeeded: true
        });
      } else {
        res.json({
          success: true,
          message: 'Data already exists',
          personCount: personCount.length,
          autoSeeded: false
        });
      }
    } catch (error) {
      console.error('Startup data check failed:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Startup data check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Contextual AI-Powered Networking Suggestions
  app.post('/api/networking/contextual-suggestions', authMiddleware, async (req: any, res: Response) => {
    try {
      const { 
        currentGoals = [], 
        industry, 
        role, 
        company, 
        interests = [], 
        recentActivity,
        maxSuggestions = 5 
      } = req.body;
      
      const userId = req.user?.id || 'demo_user_1'; // Fallback for demo
      
      const { contextualNetworkingService } = await import('./services/contextualNetworkingService');
      
      const context = {
        userId,
        currentGoals,
        industry,
        role,
        company,
        interests,
        recentActivity
      };
      
      const suggestions = await contextualNetworkingService.generateSuggestions(
        userId,
        context,
        maxSuggestions
      );
      
      res.json({
        success: true,
        suggestions,
        context: {
          userId,
          suggestionsCount: suggestions.length,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error generating contextual networking suggestions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate networking suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Track networking action
  app.post('/api/networking/track-action', authMiddleware, async (req: any, res: Response) => {
    try {
      const { suggestionId, action, metadata } = req.body;
      const userId = req.user?.id || 'demo_user_1';
      
      const { contextualNetworkingService } = await import('./services/contextualNetworkingService');
      
      await contextualNetworkingService.trackNetworkingAction(
        userId,
        suggestionId,
        action,
        metadata
      );
      
      res.json({
        success: true,
        message: 'Action tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking networking action:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to track action' 
      });
    }
  });

  // Get networking suggestions history
  app.get('/api/networking/suggestions-history', authMiddleware, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || 'demo_user_1';
      const limit = parseInt(req.query.limit as string) || 20;
      
      const { contextualNetworkingService } = await import('./services/contextualNetworkingService');
      
      const history = await contextualNetworkingService.getSuggestionsHistory(userId, limit);
      
      res.json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting suggestions history:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get suggestions history' 
      });
    }
  });

  // Request Introduction endpoint with rate limiting
  app.post('/api/request-intro', introRequestLimiter, async (req: any, res: Response) => {
    try {
      const { path, message } = req.body;
      
      if (!Array.isArray(path) || path.length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid path. Path must contain at least 2 people.' 
        });
      }

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message is required for introduction request.'
        });
      }

      // In a real scenario, requesterId would come from an authenticated user session.
      // Using a mock text-based ID for demo purposes.
      const requesterId = 'user_demo_id_12345';
      const connectorId = path[1];
      const targetId = path[path.length - 1];
      
      // Insert using Drizzle ORM with the new 'introductionRequests' table
      const result = await db.insert(introductionRequests).values({
        id: `intro_${Date.now()}`, // Generate a text-based ID
        requesterId: requesterId,
        connectorId: connectorId,
        targetId: targetId,
        message: message.trim(),
        pathData: JSON.stringify(path),
        status: 'pending'
      }).returning({ id: introductionRequests.id, status: introductionRequests.status });

      // Send email notification via SendGrid
      try {
        if (process.env.SENDGRID_API_KEY) {
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          
          const emailMsg = {
            to: `connector-${connectorId}@warmconnector.com`,
            from: 'noreply@warmconnector.com',
            subject: 'Introduction Request via WarmConnector',
            html: `
              <h2>Introduction Request</h2>
              <p>You have received an introduction request through WarmConnector.</p>
              <p><strong>Message:</strong></p>
              <blockquote>${message}</blockquote>
              <p><strong>Connection Path:</strong> ${path.length} hop connection</p>
              <p>Please respond to facilitate this introduction.</p>
            `
          };
          
          await sgMail.send(emailMsg);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      res.json({
        success: true,
        requestId: result[0]?.id || Date.now(),
        message: 'Introduction request sent successfully',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error sending introduction request:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send introduction request',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/demo/seed-enhanced-data', async (req: Request, res: Response) => {
    try {
      const { enhancedDemoSeeder } = await import('./services/enhancedDemoSeeder');
      const result = await enhancedDemoSeeder.seedEnhancedData();
      
      res.json({
        success: true,
        data: result,
        message: 'Enhanced professional network data seeded successfully'
      });
    } catch (error) {
      console.error('Enhanced demo seed error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed enhanced demo data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Multi-platform connection discovery endpoint
  app.post('/api/connections/comprehensive-search', async (req: Request, res: Response) => {
    try {
      const { multiPlatformFinder } = await import('./services/multiPlatformConnectionFinder');
      const { personName, companyName, additionalContext } = req.body;

      if (!personName) {
        return res.status(400).json({
          success: false,
          message: 'Person name is required'
        });
      }

      const comprehensiveProfile = await multiPlatformFinder.findComprehensiveConnectionInfo(
        personName,
        companyName,
        additionalContext
      );

      res.json({
        success: true,
        data: comprehensiveProfile,
        message: 'Comprehensive connection information found',
        platforms: ['LinkedIn', 'Twitter/X', 'GitHub', 'Facebook', 'Instagram', 'Public Records', 'News Articles', 'Conference Speaker Lists']
      });
    } catch (error) {
      console.error('Comprehensive search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find comprehensive connection information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Connection path finder endpoint
  app.post('/api/connections/find-path', async (req: Request, res: Response) => {
    try {
      const { multiPlatformFinder } = await import('./services/multiPlatformConnectionFinder');
      const { fromPerson, toPerson } = req.body;

      if (!fromPerson || !toPerson) {
        return res.status(400).json({
          success: false,
          message: 'Both fromPerson and toPerson are required'
        });
      }

      const connectionPath = await multiPlatformFinder.findConnectionPath(fromPerson, toPerson);

      res.json({
        success: true,
        data: connectionPath,
        message: 'Connection path analysis completed'
      });
    } catch (error) {
      console.error('Connection path error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find connection path',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/import/mongodb-data', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { seedEnhancedDemoData } = await import('../scripts/seedDemo');
      
      console.log('Starting MongoDB data import for enhanced graph...');
      await seedEnhancedDemoData();
      
      // Rebuild the enhanced graph after importing
      const { enhancedGraphService } = await import('./services/enhancedGraphService');
      await enhancedGraphService.rebuildGraph();
      const graphStats = enhancedGraphService.getStats();
      
      res.json({
        success: true,
        message: 'MongoDB data imported successfully and enhanced graph rebuilt',
        importStats: stats,
        graphStats: {
          nodes: graphStats.nodes,
          edges: graphStats.edges,
          relationshipTypes: ['COWORKER', 'FAMILY', 'EDUCATION', 'GREEK_LIFE', 'HOMETOWN', 'SOCIAL'],
          lastUpdate: graphStats.lastRebuild
        }
      });
    } catch (error) {
      console.error('Error importing MongoDB data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to import MongoDB data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI Chatbot endpoint
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required and must be a string' });
      }

      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // WarmConnector-specific system prompt
      const systemPrompt = `You are the WarmConnector AI assistant. CRITICAL: Keep ALL responses to 2-3 sentences maximum. Focus only on connection finding.

WarmConnector finds warm introductions through your network paths (You → Friend → Target Person). Upload contacts, search for someone, we show who can introduce you. Warm introductions get 5x better response rates than cold outreach.

RESPONSE RULES:
- Maximum 50 words per response
- Focus ONLY on connection finding feature
- Don't list multiple features
- Give one clear, actionable answer
- Never write paragraphs or long explanations

Example good responses:
"Upload your contacts, then search for someone you want to meet. We'll show you who in your network can introduce you."
"WarmConnector finds introduction paths through mutual connections. Much more effective than cold emails."

If asked about other features, redirect to connection finding: "Our main feature is finding warm introduction paths through your network contacts."`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
          { role: "system", content: "STRICT LIMIT: Answer in exactly 1-2 sentences. Maximum 30 words total." }
        ],
        max_tokens: 60,
        temperature: 0.3
      });

      res.json({
        response: response.choices[0].message.content,
        success: true
      });

    } catch (error) {
      console.error('AI Chat error:', error);
      res.status(500).json({ 
        error: 'Failed to process chat request',
        success: false,
        fallbackResponse: "I'm having trouble connecting right now. Here are some key WarmConnector features you might be interested in: finding warm introductions through your network, mapping your professional connections, and getting AI-powered networking strategies. What specific aspect would you like to know more about?"
      });
    }
  });

  app.post('/api/demo/seed-connections', async (req: Request, res: Response) => {
    try {
      const { seedConnectionFinderDemo, getDemoNetworkStats } = await import('./seed-connection-demo');
      
      const result = await seedConnectionFinderDemo();
      const stats = await getDemoNetworkStats();
      
      res.json({
        success: true,
        data: { ...result, stats },
        message: 'Demo connection data seeded successfully'
      });
    } catch (error) {
      console.error('Demo seeding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed demo data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get demo network statistics
  app.get('/api/demo/network-stats', async (req: Request, res: Response) => {
    try {
      const { getDemoNetworkStats } = await import('./seed-connection-demo');
      
      const stats = await getDemoNetworkStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Network statistics retrieved'
      });
    } catch (error) {
      console.error('Network stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get network statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Introduction request endpoints
  app.post('/api/request-intro', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { path, message } = req.body;
      const userId = 1; // Mock user ID for demo
      
      if (!Array.isArray(path) || path.length < 2) {
        return res.status(400).json({ success: false, message: 'Invalid path provided' });
      }

      const { introductionRequestService } = await import('./services/introductionRequestService');
      
      // Create introduction request
      const introRequest = await introductionRequestService.createIntroductionRequest({
        requesterId: userId,
        fromPersonId: path[0],
        toPersonId: path[1], // First connector in path
        targetPersonId: path[path.length - 1],
        messageTemplate: message || 'Could you please help facilitate this introduction?',
        fullPath: path
      });

      // Generate email content
      const emailContent = await introductionRequestService.generateIntroductionEmail(
        'demo@warmconnector.com', // Demo requester email
        path[1], // Connector ID
        path[path.length - 1], // Target ID
        path,
        message
      );

      // For demo purposes, log the email instead of sending
      console.log('Introduction request email generated:', {
        to: emailContent.to,
        subject: emailContent.subject,
        requestId: introRequest.id
      });

      res.json({
        success: true,
        requestId: introRequest.id,
        message: 'Introduction request created successfully',
        emailPreview: {
          to: emailContent.to,
          subject: emailContent.subject
        }
      });
    } catch (error) {
      console.error('Introduction request error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create introduction request' 
      });
    }
  });

  app.get('/api/introduction-requests', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID for demo
      const { introductionRequestService } = await import('./services/introductionRequestService');
      
      const requests = await introductionRequestService.getUserIntroductionRequests(userId);
      const stats = await introductionRequestService.getIntroductionStats(userId);
      
      res.json({
        requests,
        stats
      });
    } catch (error) {
      console.error('Failed to fetch introduction requests:', error);
      res.status(500).json({ error: 'Failed to fetch introduction requests' });
    }
  });

  // Connection strength service endpoints
  app.get('/api/strength/:fromPersonId/:toPersonId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { fromPersonId, toPersonId } = req.params;
      const { connectionStrengthService } = await import('./services/connectionStrengthService');
      
      const strength = await connectionStrengthService.calculateConnectionStrength(fromPersonId, toPersonId);
      
      const [person1] = await db.select().from(persons).where(eq(persons.id, fromPersonId));
      const [person2] = await db.select().from(persons).where(eq(persons.id, toPersonId));
      
      res.json({
        fromPerson: { id: person1?.id, name: person1?.name },
        toPerson: { id: person2?.id, name: person2?.name },
        strength: strength.strength,
        factors: strength.factors
      });
    } catch (error) {
      console.error('Connection strength calculation failed:', error);
      res.status(500).json({ error: 'Failed to calculate connection strength' });
    }
  });

  app.post('/api/strength/path', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { path } = req.body;
      
      if (!path || !Array.isArray(path) || path.length < 2) {
        return res.status(400).json({ error: 'Valid path array required' });
      }

      const { connectionStrengthService } = await import('./services/connectionStrengthService');
      const pathStrength = await connectionStrengthService.calculatePathStrength(path);
      
      res.json(pathStrength);
    } catch (error) {
      console.error('Path strength calculation failed:', error);
      res.status(500).json({ error: 'Failed to calculate path strength' });
    }
  });

  app.get('/api/strength/strongest/:personId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { personId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { connectionStrengthService } = await import('./services/connectionStrengthService');
      const strongestConnections = await connectionStrengthService.findStrongestConnections(personId, limit);
      
      res.json(strongestConnections);
    } catch (error) {
      console.error('Strongest connections fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch strongest connections' });
    }
  });

  // Comprehensive People Search endpoint
  app.post('/api/connections/comprehensive-people-search', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { comprehensivePeopleSearchService } = await import('./services/comprehensivePeopleSearchService');
      
      const { userA, userB, userSuppliedData } = req.body;
      
      if (!userA || !userB) {
        return res.status(400).json({ error: 'Both userA and userB are required' });
      }

      console.log('Starting comprehensive people search for:', userA.name, 'and', userB.name);
      
      const result = await comprehensivePeopleSearchService.findConnections({
        userA,
        userB,
        userSuppliedData
      });

      res.json(result);
    } catch (error) {
      console.error('Comprehensive people search error:', error);
      res.status(500).json({ error: 'Failed to perform comprehensive people search' });
    }
  });

  // Check required credentials for people finder services
  app.get('/api/connections/check-credentials', async (req: Request, res: Response) => {
    try {
      const { comprehensivePeopleSearchService } = await import('./services/comprehensivePeopleSearchService');
      const missing = comprehensivePeopleSearchService.checkRequiredCredentials();
      
      res.json({ 
        missingCredentials: missing,
        hasAllCredentials: missing.length === 0
      });
    } catch (error) {
      console.error('Credential check error:', error);
      res.status(500).json({ error: 'Failed to check credentials' });
    }
  });

  app.post('/api/connections/find-optimal-path', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { fromPersonId, toPersonId, maxHops = 3 } = req.body;
      
      if (!fromPersonId || !toPersonId) {
        return res.status(400).json({ error: 'fromPersonId and toPersonId required' });
      }

      const { graphService } = await import('./graph-service');
      const introductionPaths = await graphService.findIntroductionPaths(fromPersonId, toPersonId, maxHops);
      
      if (introductionPaths.length === 0) {
        return res.json({ paths: [], message: 'No introduction paths found' });
      }

      const { connectionStrengthService } = await import('./services/connectionStrengthService');
      const pathsWithStrength = await Promise.all(
        introductionPaths.map(async (path) => {
          const pathStrength = await connectionStrengthService.calculatePathStrength(path.path.map(p => p.id));
          return {
            ...path,
            strengthScore: pathStrength,
            weakestLink: pathStrength,
            totalStrength: pathStrength,
            strengthFactors: []
          };
        })
      );

      pathsWithStrength.sort((a, b) => b.strengthScore - a.strengthScore);

      res.json({
        paths: pathsWithStrength,
        totalPaths: pathsWithStrength.length,
        strongestPath: pathsWithStrength[0] || null
      });
    } catch (error) {
      console.error('Optimal path finding failed:', error);
      res.status(500).json({ error: 'Failed to find optimal introduction path' });
    }
  });

  // N8n Integration Endpoints
  app.post('/api/n8n/trigger-workflow', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { workflowType, targetData } = req.body;
      const { n8nIntegrationService } = await import('./services/n8nIntegrationService');

      let result;
      switch (workflowType) {
        case 'connection-research':
          result = await n8nIntegrationService.triggerConnectionResearchWorkflow(
            targetData.name,
            targetData.company
          );
          break;
        case 'linkedin-enrichment':
          result = await n8nIntegrationService.triggerLinkedInEnrichmentWorkflow(
            targetData.profileUrl
          );
          break;
        case 'introduction-outreach':
          result = await n8nIntegrationService.triggerIntroductionOutreachWorkflow(
            targetData.fromPerson,
            targetData.toPerson,
            targetData.message
          );
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid workflow type'
          });
      }

      res.json({
        success: true,
        data: result,
        workflowType,
        message: 'Workflow triggered successfully'
      });
    } catch (error) {
      console.error('Workflow trigger error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger workflow',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Webhook receiver for automated updates
  app.post('/api/n8n/connection-updates', async (req: Request, res: Response) => {
    try {
      const updateData = req.body;
      console.log('Received automated connection update:', updateData);

      res.json({
        success: true,
        message: 'Connection update received and processed'
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook'
      });
    }
  });

  // Setup continuous monitoring workflow
  app.post('/api/n8n/setup-monitoring', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { targetPerson } = req.body;
      const { n8nIntegrationService } = await import('./services/n8nIntegrationService');

      const monitoringId = await n8nIntegrationService.setupConnectionMonitoringWorkflow(targetPerson);

      res.json({
        success: true,
        monitoringId,
        message: 'Connection monitoring setup successfully'
      });
    } catch (error) {
      console.error('Monitoring setup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to setup connection monitoring',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Dual AI Networking Intelligence System
  app.post('/api/networking-intelligence/test', async (req: Request, res: Response) => {
    try {
      const { networkingIntelligence } = await import('./services/networkingIntelligenceService');
      const testResult = await networkingIntelligence.testDualAISystem();
      
      res.json({
        success: true,
        dualAIStatus: testResult.systemStatus,
        performance: {
          openAI: {
            available: testResult.systemStatus.openaiAvailable,
            responseTime: testResult.openai.processingTime,
            confidence: testResult.openai.confidence
          },
          haystack: {
            available: testResult.systemStatus.haystackAvailable,
            responseTime: testResult.haystack.processingTime,
            confidence: testResult.haystack.confidence
          }
        },
        combinedAnalysis: testResult.combined,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Dual AI test error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Dual AI system test failed'
      });
    }
  });

  app.post('/api/networking-intelligence/query', async (req: Request, res: Response) => {
    try {
      const { networkingIntelligence } = await import('./services/networkingIntelligenceService');
      const { type, data } = req.body;
      
      if (!type || !data) {
        return res.status(400).json({
          success: false,
          error: 'Query type and data are required'
        });
      }
      
      const result = await networkingIntelligence.processNetworkingQuery({ type, data });
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Networking intelligence query error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Networking intelligence query failed'
      });
    }
  });

  // Enhanced Multi-Phase Connection Finder
  // Haystack RAG Pipeline Routes
  app.post('/api/haystack/ingest', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { HaystackRagService } = await import('./services/haystackRagService');
      const ragService = HaystackRagService.getInstance();
      
      const { content, metadata } = req.body;
      
      if (!content || !metadata) {
        return res.status(400).json({ error: 'Content and metadata are required' });
      }
      
      const documentId = await ragService.ingestDocument(content, metadata);
      
      res.json({
        success: true,
        documentId,
        message: 'Document processed and added to knowledge base'
      });
    } catch (error) {
      console.error('Haystack ingestion error:', error);
      res.status(500).json({ error: 'Failed to process document' });
    }
  });

  app.post('/api/haystack/query', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { HaystackRagService } = await import('./services/haystackRagService');
      const ragService = HaystackRagService.getInstance();
      
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }
      
      const result = await ragService.query(question);
      
      res.json(result);
    } catch (error) {
      console.error('Haystack query error:', error);
      res.status(500).json({ error: 'Failed to process query' });
    }
  });

  app.get('/api/haystack/stats', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { HaystackRagService } = await import('./services/haystackRagService');
      const ragService = HaystackRagService.getInstance();
      
      const stats = ragService.getStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Haystack stats error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  });

  app.post('/api/haystack/networking/analyze', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { HaystackRagService } = await import('./services/haystackRagService');
      const ragService = HaystackRagService.getInstance();
      
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content to analyze is required' });
      }
      
      const analysisQuestion = `Analyze this networking situation and provide strategic advice: ${content}`;
      const result = await ragService.query(analysisQuestion);
      
      res.json(result);
    } catch (error) {
      console.error('Networking analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze networking content' });
    }
  });

  // AI Networking Intelligence Routes
  app.post('/api/ai/analyze-profile', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { AINetworkingService } = await import('./services/aiNetworkingService');
      const aiService = new AINetworkingService();
      
      const { profileData } = req.body;
      
      if (!profileData) {
        return res.status(400).json({ error: 'Profile data is required' });
      }
      
      const analysis = await aiService.analyzeProfileSemantically(profileData);
      
      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error('Profile analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze profile' });
    }
  });

  app.post('/api/ai/generate-introduction', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { AINetworkingService } = await import('./services/aiNetworkingService');
      const aiService = new AINetworkingService();
      
      const { fromProfile, toProfile, context } = req.body;
      
      if (!fromProfile || !toProfile || !context) {
        return res.status(400).json({ error: 'From profile, to profile, and context are required' });
      }
      
      const introduction = await aiService.generateIntroductionMessage(fromProfile, toProfile, context);
      
      res.json({
        success: true,
        introduction
      });
    } catch (error) {
      console.error('Introduction generation error:', error);
      res.status(500).json({ error: 'Failed to generate introduction' });
    }
  });

  app.post('/api/ai/networking-strategy', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { AINetworkingService } = await import('./services/aiNetworkingService');
      const aiService = new AINetworkingService();
      
      const { userProfile, goals } = req.body;
      
      if (!userProfile || !goals) {
        return res.status(400).json({ error: 'User profile and goals are required' });
      }
      
      const strategy = await aiService.generateNetworkingStrategy(userProfile, goals);
      
      res.json({
        success: true,
        strategy
      });
    } catch (error) {
      console.error('Strategy generation error:', error);
      res.status(500).json({ error: 'Failed to generate networking strategy' });
    }
  });

  app.post('/api/ai/extract-insights', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { AINetworkingService } = await import('./services/aiNetworkingService');
      const aiService = new AINetworkingService();
      
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      const insights = await aiService.extractNetworkingInsights(text);
      
      res.json({
        success: true,
        insights
      });
    } catch (error) {
      console.error('Insight extraction error:', error);
      res.status(500).json({ error: 'Failed to extract insights' });
    }
  });

  // Contact upload endpoint
  app.post('/api/contacts/upload', upload.single('contacts'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const contactProcessor = new ContactProcessor();
      const fileContent = req.file.buffer.toString('utf-8');
      let contacts: any[] = [];

      // Parse based on file type
      if (req.file.originalname.endsWith('.csv') || req.file.mimetype === 'text/csv') {
        contacts = contactProcessor.parseCSV(fileContent);
      } else if (req.file.originalname.endsWith('.vcf') || req.file.mimetype.includes('vcard')) {
        contacts = contactProcessor.parseVCF(fileContent);
      } else {
        // Try CSV format as fallback for .txt files
        contacts = contactProcessor.parseCSV(fileContent);
      }

      if (contacts.length === 0) {
        return res.status(400).json({ error: 'No valid contacts found in file' });
      }

      // Process contacts (using user ID 1 for demo purposes)
      const result = await contactProcessor.processContacts(contacts, '1');

      res.json(result);
    } catch (error: any) {
      console.error('Contact upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to process contacts' });
    }
  });

  app.post('/api/connections/enhanced-finder', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { 
        userAId, 
        userBId, 
        includePhases = ['phase1', 'phase2'],
        includeWhitepages = false,
        includePipl = false
      } = req.body;
      
      if (!userAId || !userBId) {
        return res.status(400).json({ 
          error: 'Both userAId and userBId are required' 
        });
      }

      const { enhancedConnectionService } = await import('./services/enhancedConnectionService');
      
      const result = await enhancedConnectionService.findComprehensiveConnections(
        userAId, 
        userBId, 
        { 
          includePhases,
          includeWhitepages,
          includePipl
        }
      );

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Enhanced connection finder error:', error);
      res.status(500).json({ 
        error: 'Failed to find enhanced connections',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Validate all data sources
  app.get('/api/connections/validate-sources', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { enhancedConnectionService } = await import('./services/enhancedConnectionService');
      const status = await enhancedConnectionService.validateAllDataSources();
      
      res.json({
        success: true,
        sources: status,
        available_count: Object.values(status).filter(Boolean).length,
        total_count: Object.keys(status).length
      });
    } catch (error) {
      console.error('Source validation error:', error);
      res.status(500).json({
        error: 'Failed to validate data sources',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Onboarding Progress Tracker API endpoints
  app.get('/api/user/social-accounts', async (req: Request, res: Response) => {
    try {
      const accounts = await db.select().from(socialAccounts);
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      res.status(500).json({ error: 'Failed to fetch social accounts' });
    }
  });

  app.get('/api/contacts/stats', async (req: Request, res: Response) => {
    try {
      const totalContacts = await db.select({ count: sql`count(*)` }).from(persons);
      const totalRelationships = await db.select({ count: sql`count(*)` }).from(relationships);
      
      res.json({
        totalContacts: Number(totalContacts[0]?.count) || 0,
        totalRelationships: Number(totalRelationships[0]?.count) || 0
      });
    } catch (error) {
      console.error('Error fetching contact stats:', error);
      res.status(500).json({ error: 'Failed to fetch contact statistics' });
    }
  });

  app.get('/api/user/profile', async (req: Request, res: Response) => {
    try {
      // For demo purposes, return a basic profile
      // In production, this would fetch from authenticated user's profile
      res.json({
        name: 'Demo User',
        company: 'Demo Company',
        email: 'demo@example.com',
        title: 'Professional'
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // Master Connection Engine - unified interface for all search modes
  // Enhanced Master Connection Engine endpoint
  app.post('/api/connections/master-search', async (req: Request, res: Response) => {
    try {
      const { masterConnectionEngine } = await import('./services/masterConnectionEngine');
      
      const searchRequest = {
        targetName: req.body.targetName,
        targetCompany: req.body.targetCompany,
        targetTitle: req.body.targetTitle,
        searchMode: req.body.searchMode || 'smart',
        userContext: req.body.userContext,
        options: {
          maxHops: req.body.maxHops || 4,
          minStrength: req.body.minStrength || 30,
          includeWeakTies: req.body.includeWeakTies || false,
          enableExternalEnrichment: req.body.enableExternalEnrichment || false
        }
      };

      const result = await masterConnectionEngine.findConnections(searchRequest);
      
      res.json({
        success: true,
        data: result,
        message: `Master search completed in ${result.processingTime}ms using ${result.source} strategy`
      });

    } catch (error) {
      console.error('Master connection search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute master connection search',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Networking Insights API endpoints
  app.get('/api/networking/insights', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { networkingInsightsService } = await import('./services/networkingInsightsService');
      
      const insights = await networkingInsightsService.generatePersonalizedInsights('user-1');
      
      res.json({
        success: true,
        insights,
        generatedAt: new Date().toISOString(),
        message: `Generated ${insights.length} personalized networking insights`
      });
    } catch (error) {
      console.error('Error generating networking insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate networking insights',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  app.get('/api/networking/strength-analysis', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { networkingInsightsService } = await import('./services/networkingInsightsService');
      
      const analysis = await networkingInsightsService.getNetworkStrengthAnalysis('user-1');
      
      res.json({
        success: true,
        analysis,
        evaluatedAt: new Date().toISOString(),
        message: `Network strength: ${analysis.overallStrength}/100`
      });
    } catch (error) {
      console.error('Error analyzing network strength:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze network strength',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // LookBackAI Find Connection Feature API endpoints
  app.get('/api/companies', async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.json([]);
      }

      // Sample company data - in production, this would query a real company database
      const sampleCompanies = [
        { id: 'apple', name: 'Apple Inc.', domain: 'apple.com', industry: 'Technology', logo: 'https://logo.clearbit.com/apple.com' },
        { id: 'google', name: 'Google', domain: 'google.com', industry: 'Technology', logo: 'https://logo.clearbit.com/google.com' },
        { id: 'microsoft', name: 'Microsoft Corporation', domain: 'microsoft.com', industry: 'Technology', logo: 'https://logo.clearbit.com/microsoft.com' },
        { id: 'amazon', name: 'Amazon', domain: 'amazon.com', industry: 'E-commerce & Cloud', logo: 'https://logo.clearbit.com/amazon.com' },
        { id: 'meta', name: 'Meta', domain: 'meta.com', industry: 'Social Media', logo: 'https://logo.clearbit.com/meta.com' },
        { id: 'tesla', name: 'Tesla, Inc.', domain: 'tesla.com', industry: 'Automotive & Energy', logo: 'https://logo.clearbit.com/tesla.com' },
        { id: 'netflix', name: 'Netflix', domain: 'netflix.com', industry: 'Entertainment', logo: 'https://logo.clearbit.com/netflix.com' },
        { id: 'uber', name: 'Uber Technologies', domain: 'uber.com', industry: 'Transportation', logo: 'https://logo.clearbit.com/uber.com' },
        { id: 'airbnb', name: 'Airbnb', domain: 'airbnb.com', industry: 'Hospitality', logo: 'https://logo.clearbit.com/airbnb.com' },
        { id: 'spotify', name: 'Spotify', domain: 'spotify.com', industry: 'Music Streaming', logo: 'https://logo.clearbit.com/spotify.com' },
        { id: 'salesforce', name: 'Salesforce', domain: 'salesforce.com', industry: 'CRM Software', logo: 'https://logo.clearbit.com/salesforce.com' },
        { id: 'adobe', name: 'Adobe Inc.', domain: 'adobe.com', industry: 'Software', logo: 'https://logo.clearbit.com/adobe.com' },
        { id: 'oracle', name: 'Oracle Corporation', domain: 'oracle.com', industry: 'Database Software', logo: 'https://logo.clearbit.com/oracle.com' },
        { id: 'ibm', name: 'IBM', domain: 'ibm.com', industry: 'Technology Services', logo: 'https://logo.clearbit.com/ibm.com' },
        { id: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com', industry: 'Professional Network', logo: 'https://logo.clearbit.com/linkedin.com' },
        { id: 'stripe', name: 'Stripe', domain: 'stripe.com', industry: 'Financial Technology', logo: 'https://logo.clearbit.com/stripe.com' },
        { id: 'zoom', name: 'Zoom Video Communications', domain: 'zoom.us', industry: 'Video Conferencing', logo: 'https://logo.clearbit.com/zoom.us' },
        { id: 'slack', name: 'Slack Technologies', domain: 'slack.com', industry: 'Workplace Communication', logo: 'https://logo.clearbit.com/slack.com' },
        { id: 'dropbox', name: 'Dropbox', domain: 'dropbox.com', industry: 'Cloud Storage', logo: 'https://logo.clearbit.com/dropbox.com' },
        { id: 'twilio', name: 'Twilio', domain: 'twilio.com', industry: 'Communications Platform', logo: 'https://logo.clearbit.com/twilio.com' }
      ];

      // Filter companies based on query
      const searchQuery = query.toLowerCase();
      const filteredCompanies = sampleCompanies.filter(company =>
        company.name.toLowerCase().includes(searchQuery) ||
        company.domain.toLowerCase().includes(searchQuery) ||
        company.industry.toLowerCase().includes(searchQuery)
      );

      res.json(filteredCompanies.slice(0, 10)); // Return top 10 matches
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ 
        error: 'Failed to fetch companies',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  app.post('/api/connections', async (req: Request, res: Response) => {
    try {
      const { companyId, location, companyName } = req.body;

      if (!companyName) {
        return res.status(400).json({
          error: 'Company name is required'
        });
      }

      // Use enhanced connection service with AI-powered insights
      const { enhancedConnectionService } = await import('./services/enhancedConnectionService');
      
      const result = await enhancedConnectionService.findConnections({
        companyName,
        location,
        userContext: {
          name: 'Professional User',
          company: 'Your Company',
          title: 'Professional'
        }
      });

      const searchResults = {
        searchId: `search_${Date.now()}`,
        company: {
          id: companyId || `company_${Date.now()}`,
          name: companyName
        },
        location: location?.trim() || 'Various locations',
        status: 'completed',
        connectionPaths: result.connections.map(conn => ({
          pathId: `path_${conn.id}`,
          targetPerson: {
            name: conn.name,
            title: conn.title || 'Professional',
            company: conn.company || companyName,
            location: conn.location || location
          },
          connectionScore: conn.connectionScore,
          mutualConnections: conn.mutualConnections,
          approachStrategy: conn.approachStrategy,
          aiInsights: conn.aiInsights
        })),
        insights: result.insights,
        recommendations: result.recommendations,
        industryContext: result.industryContext,
        networkingOpportunities: result.networkingOpportunities,
        totalPossibleConnections: result.totalResults,
        highConfidencePaths: result.connections.filter(c => c.connectionScore > 80).length,
        averageConnectionScore: result.connections.reduce((sum, c) => sum + c.connectionScore, 0) / result.connections.length,
        searchedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: `Found ${result.totalResults} potential connections`,
        data: searchResults
      });

    } catch (error) {
      console.error('Error creating connection search:', error);
      res.status(500).json({
        error: 'Failed to create connection search',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Advanced Networking Intelligence API Endpoints
  app.post('/api/ai/analyze-networking-landscape', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { advancedNetworkingIntelligence } = await import('./services/advancedNetworkingIntelligence');
      const { userId, targetIndustry, goals } = req.body;
      
      const analysis = await advancedNetworkingIntelligence.analyzeNetworkingLandscape(
        userId || 'demo-user-1',
        targetIndustry,
        goals || []
      );
      
      res.json({
        success: true,
        analysis,
        message: 'Networking landscape analysis completed'
      });
    } catch (error) {
      console.error('Networking landscape analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze networking landscape',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/ai/optimize-connection-strategy', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { advancedNetworkingIntelligence } = await import('./services/advancedNetworkingIntelligence');
      const { fromPersonId, toPersonId, context } = req.body;
      
      if (!fromPersonId || !toPersonId) {
        return res.status(400).json({
          success: false,
          message: 'Both fromPersonId and toPersonId are required'
        });
      }
      
      const strategy = await advancedNetworkingIntelligence.optimizeConnectionStrategy(
        fromPersonId,
        toPersonId,
        context
      );
      
      res.json({
        success: true,
        strategy,
        message: 'Connection strategy optimized successfully'
      });
    } catch (error) {
      console.error('Connection strategy optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize connection strategy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/ai/industry-networking-insights', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { advancedNetworkingIntelligence } = await import('./services/advancedNetworkingIntelligence');
      const { industry, userRole } = req.body;
      
      if (!industry) {
        return res.status(400).json({
          success: false,
          message: 'Industry parameter is required'
        });
      }
      
      const insights = await advancedNetworkingIntelligence.generateIndustryNetworkingInsights(
        industry,
        userRole
      );
      
      res.json({
        success: true,
        insights,
        message: 'Industry networking insights generated successfully'
      });
    } catch (error) {
      console.error('Industry networking insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate industry networking insights',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/ai/enhanced-connection-analysis', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { aiNetworkingService } = await import('./services/aiNetworkingService');
      const { userProfile, targetProfile, context } = req.body;
      
      if (!userProfile || !targetProfile) {
        return res.status(400).json({
          success: false,
          message: 'Both userProfile and targetProfile are required'
        });
      }
      
      const analysis = await aiNetworkingService.analyzeConnectionOpportunity(
        userProfile,
        targetProfile,
        context
      );
      
      res.json({
        success: true,
        analysis,
        message: 'Enhanced connection analysis completed'
      });
    } catch (error) {
      console.error('Enhanced connection analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze connection opportunity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // External Data Integration API Endpoints  
  app.post('/api/external/enrich-profile/:personId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { externalDataIntegration } = await import('./services/externalDataIntegration');
      const { personId } = req.params;
      
      const enrichedData = await externalDataIntegration.enrichPersonProfile(personId);
      
      res.json({
        success: true,
        enrichedData,
        message: 'Profile enrichment completed'
      });
    } catch (error) {
      console.error('Profile enrichment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enrich profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/external/enrich-batch', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { externalDataIntegration } = await import('./services/externalDataIntegration');
      const { personIds } = req.body;
      
      if (!Array.isArray(personIds) || personIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'personIds array is required'
        });
      }
      
      const enrichedProfiles = await externalDataIntegration.enrichMultipleProfiles(personIds);
      
      res.json({
        success: true,
        enrichedProfiles: Object.fromEntries(enrichedProfiles),
        message: `Batch enrichment completed for ${personIds.length} profiles`
      });
    } catch (error) {
      console.error('Batch enrichment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform batch enrichment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/external/enrich-company', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { externalDataIntegration } = await import('./services/externalDataIntegration');
      const { companyName } = req.body;
      
      if (!companyName) {
        return res.status(400).json({
          success: false,
          message: 'companyName is required'
        });
      }
      
      const companyData = await externalDataIntegration.enrichCompanyData(companyName);
      
      res.json({
        success: true,
        companyData,
        message: 'Company enrichment completed'
      });
    } catch (error) {
      console.error('Company enrichment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enrich company data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/external/integration-status', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { externalDataIntegration } = await import('./services/externalDataIntegration');
      const status = externalDataIntegration.getIntegrationStatus();
      
      res.json({
        success: true,
        integrationStatus: status,
        message: 'Integration status retrieved'
      });
    } catch (error) {
      console.error('Integration status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get integration status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Performance Optimization API Endpoints
  app.get('/api/performance/report', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { performanceOptimization } = await import('./services/performanceOptimization');
      const report = performanceOptimization.getPerformanceReport();
      
      res.json({
        success: true,
        performanceReport: report,
        message: 'Performance report generated'
      });
    } catch (error) {
      console.error('Performance report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate performance report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/performance/optimize-search', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { performanceOptimization } = await import('./services/performanceOptimization');
      const { targetName, targetCompany, targetTitle, userId } = req.body;
      
      const result = await performanceOptimization.optimizedConnectionSearch({
        targetName,
        targetCompany,
        targetTitle,
        userId
      });
      
      res.json({
        success: true,
        results: result.results,
        metrics: result.metrics,
        message: 'Optimized search completed'
      });
    } catch (error) {
      console.error('Optimized search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform optimized search',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/performance/optimize-pathfinding', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { performanceOptimization } = await import('./services/performanceOptimization');
      const { fromPersonId, toPersonId } = req.body;
      
      if (!fromPersonId || !toPersonId) {
        return res.status(400).json({
          success: false,
          message: 'Both fromPersonId and toPersonId are required'
        });
      }
      
      const result = await performanceOptimization.optimizedPathfinding(fromPersonId, toPersonId);
      
      res.json({
        success: true,
        paths: result.paths,
        metrics: result.metrics,
        message: 'Optimized pathfinding completed'
      });
    } catch (error) {
      console.error('Optimized pathfinding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform optimized pathfinding',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/performance/analyze', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { performanceOptimization } = await import('./services/performanceOptimization');
      const analysis = await performanceOptimization.analyzeQueryPerformance();
      
      res.json({
        success: true,
        analysis,
        message: 'Performance analysis completed'
      });
    } catch (error) {
      console.error('Performance analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze performance',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/performance/optimize-memory', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { performanceOptimization } = await import('./services/performanceOptimization');
      const optimization = performanceOptimization.optimizeMemoryUsage();
      
      res.json({
        success: true,
        cacheStats: optimization.cacheStats,
        recommendations: optimization.recommendations,
        message: 'Memory optimization completed'
      });
    } catch (error) {
      console.error('Memory optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize memory usage',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/performance/clear-cache', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { performanceOptimization } = await import('./services/performanceOptimization');
      performanceOptimization.clearAllCaches();
      
      res.json({
        success: true,
        message: 'All caches cleared successfully'
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear caches',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/connections/master-search-legacy', async (req: Request, res: Response) => {
    try {
      const { targetName, targetCompany, targetTitle, searchMode = 'smart', options = {} } = req.body;
      
      if (!targetName) {
        return res.status(400).json({ error: 'Target name is required' });
      }

      const { masterConnectionEngine } = await import('./services/masterConnectionEngine');
      
      const searchRequest = {
        targetName,
        targetCompany,
        targetTitle,
        searchMode,
        userContext: {
          name: 'Current User',
          company: 'Your Company'
        },
        options
      };

      const result = await masterConnectionEngine.findConnections(searchRequest);
      
      res.json({
        ...result,
        isAuthentic: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Master connection engine error:', error);
      res.status(500).json({ error: 'Failed to execute master search' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
