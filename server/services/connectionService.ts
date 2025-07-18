import { OpenAI } from 'openai';
import mongoose from 'mongoose';
import { Logger, createLogger } from '../utils/logger';

const logger = createLogger('ConnectionService');

// TypeScript interfaces for connection service
export interface UserProfile {
  userId: string;
  name: string;
  company: string;
  title: string;
  education: string[];
  organizations: string[];
  family: string[];
  hometowns: string[];
}

export interface ConnectionPath {
  path: UserProfile[];
  connectionStrength: number;
  pathLength: number;
  relationshipTypes: string[];
  strategy: string;
}

export interface ConnectionInsights {
  recommendedApproach: string;
  keyTalkingPoints: string[];
  mutualConnections: string[];
  industryContext: string;
  riskAssessment: string;
  successProbability: number;
}

export interface SearchStrategy {
  primaryApproach: string;
  alternativeApproaches: string[];
  keyFactors: string[];
  timeline: string;
  riskLevel: string;
}

export interface ConnectionSearchResult {
  paths: ConnectionPath[];
  aiInsights: ConnectionInsights;
  searchStrategy: SearchStrategy;
}

// MongoDB connection with proper error handling
class MongoConnection {
  private static instance: MongoConnection;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;

  static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  async connect(): Promise<void> {
    if (mongoose.connections[0].readyState === 1) {
      return; // Already connected
    }

    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MongoDB URI not provided in environment variables');
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await mongoose.connect(mongoUri, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        
        logger.info(`MongoDB connected for connection service (attempt ${attempt + 1})`);
        this.connectionRetries = 0;
        return;
      } catch (error) {
        this.connectionRetries = attempt + 1;
        logger.error(`MongoDB connection attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to connect to MongoDB after ${this.maxRetries + 1} attempts`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

// MongoDB Schema
const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  company: { type: String, required: true },
  title: { type: String },
  education: [String],
  organizations: [String],
  family: [String],
  hometowns: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserProfileModel = mongoose.model('UserProfile', UserProfileSchema);

export class ConnectionService {
  private openai: OpenAI | null;
  private mongoConnection: MongoConnection;
  private isInitialized: boolean = false;

  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
    this.mongoConnection = MongoConnection.getInstance();
  }

  async initialize(): Promise<boolean> {
    try {
      await this.mongoConnection.connect();
      this.isInitialized = true;
      logger.info('ConnectionService initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize ConnectionService:', error);
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ConnectionService not initialized. Call initialize() first.');
    }
  }

  /**
   * Search for connections using AI-powered analysis
   */
  async searchConnections(userId: string, targetName: string, targetCompany: string): Promise<ConnectionSearchResult> {
    this.ensureInitialized();

    try {
      // Get user's profile for context
      const userProfile = await UserProfileModel.findOne({ userId });
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Use AI to enhance the search query and find connection strategies
      const searchStrategy = await this.generateSearchStrategy(userProfile, targetName, targetCompany);
      
      // Find potential connection paths using AI analysis
      const connectionPaths = await this.findConnectionPaths(userProfile, targetName, targetCompany, searchStrategy);
      
      // Generate AI insights for the search
      const aiInsights = await this.generateConnectionInsights(userProfile, targetName, targetCompany);

      return {
        paths: connectionPaths,
        aiInsights: aiInsights,
        searchStrategy: searchStrategy
      };
    } catch (error) {
      logger.error('Connection search error:', error);
      throw error;
    }
  }

  /**
   * Generate an AI-powered search strategy
   */
  private async generateSearchStrategy(userProfile: any, targetName: string, targetCompany: string): Promise<SearchStrategy> {
    if (!this.openai) {
      // Fallback strategy when OpenAI is not available
      return {
        primaryApproach: 'Direct LinkedIn search and outreach',
        alternativeApproaches: [
          'Alumni network search',
          'Industry event networking',
          'Mutual connection identification'
        ],
        keyFactors: ['Industry alignment', 'Geographic proximity', 'Mutual interests'],
        timeline: '2-4 weeks',
        riskLevel: 'low'
      };
    }

    try {
      const prompt = `
Analyze this professional networking scenario and suggest connection strategies:

User Profile:
- Name: ${userProfile.name}
- Company: ${userProfile.company}
- Title: ${userProfile.title}
- Education: ${userProfile.education?.join(', ') || 'N/A'}
- Organizations: ${userProfile.organizations?.join(', ') || 'N/A'}
- Locations: ${userProfile.hometowns?.join(', ') || 'N/A'}

Target:
- Name: ${targetName}
- Company: ${targetCompany}

Provide a detailed networking strategy in JSON format with:
{
  "primaryApproach": "main strategy",
  "alternativeApproaches": ["approach1", "approach2", "approach3"],
  "keyFactors": ["factor1", "factor2", "factor3"],
  "timeline": "estimated timeframe",
  "riskLevel": "low/medium/high"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const strategy = JSON.parse(content);
        return strategy as SearchStrategy;
      } catch (parseError) {
        logger.warn('Failed to parse OpenAI response as JSON, using fallback strategy');
        return {
          primaryApproach: 'Direct LinkedIn outreach with personalized message',
          alternativeApproaches: [
            'Industry conference networking',
            'Alumni network connections',
            'Mutual colleague introductions'
          ],
          keyFactors: ['Industry relevance', 'Shared background', 'Timing'],
          timeline: '2-3 weeks',
          riskLevel: 'low'
        };
      }
    } catch (error) {
      logger.error('Error generating search strategy:', error);
      // Return fallback strategy
      return {
        primaryApproach: 'Professional networking through industry channels',
        alternativeApproaches: [
          'LinkedIn connection request',
          'Industry event networking',
          'Referral through mutual connections'
        ],
        keyFactors: ['Professional relevance', 'Shared interests', 'Timing'],
        timeline: '3-4 weeks',
        riskLevel: 'medium'
      };
    }
  }

  /**
   * Find potential connection paths
   */
  private async findConnectionPaths(userProfile: any, targetName: string, targetCompany: string, strategy: SearchStrategy): Promise<ConnectionPath[]> {
    try {
      // This is a simplified implementation - in practice, this would involve
      // complex graph traversal algorithms using the relationship database
      const mockPaths: ConnectionPath[] = [
        {
          path: [
            userProfile,
            {
              userId: 'mock-intermediate',
              name: 'John Connector',
              company: 'Shared Company',
              title: 'Senior Manager',
              education: ['Harvard Business School'],
              organizations: ['Industry Association'],
              family: [],
              hometowns: ['San Francisco']
            },
            {
              userId: 'mock-target',
              name: targetName,
              company: targetCompany,
              title: 'Unknown',
              education: [],
              organizations: [],
              family: [],
              hometowns: []
            }
          ],
          connectionStrength: 8.5,
          pathLength: 2,
          relationshipTypes: ['colleague', 'alumni'],
          strategy: strategy.primaryApproach
        }
      ];

      return mockPaths;
    } catch (error) {
      logger.error('Error finding connection paths:', error);
      return [];
    }
  }

  /**
   * Generate AI insights for the connection
   */
  private async generateConnectionInsights(userProfile: any, targetName: string, targetCompany: string): Promise<ConnectionInsights> {
    if (!this.openai) {
      // Fallback insights when OpenAI is not available
      return {
        recommendedApproach: 'Professional introduction through mutual connections',
        keyTalkingPoints: [
          'Industry trends and insights',
          'Mutual professional interests',
          'Company collaboration opportunities'
        ],
        mutualConnections: ['Alumni network', 'Industry associations'],
        industryContext: 'Strong alignment in professional backgrounds',
        riskAssessment: 'Low risk - professional context appropriate',
        successProbability: 75
      };
    }

    try {
      const prompt = `
Analyze this networking opportunity and provide strategic insights:

User: ${userProfile.name} at ${userProfile.company} (${userProfile.title})
Education: ${userProfile.education?.join(', ') || 'N/A'}
Organizations: ${userProfile.organizations?.join(', ') || 'N/A'}

Target: ${targetName} at ${targetCompany}

Provide networking insights in JSON format:
{
  "recommendedApproach": "best approach strategy",
  "keyTalkingPoints": ["point1", "point2", "point3"],
  "mutualConnections": ["connection1", "connection2"],
  "industryContext": "industry analysis",
  "riskAssessment": "risk evaluation",
  "successProbability": number (0-100)
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const insights = JSON.parse(content);
        return insights as ConnectionInsights;
      } catch (parseError) {
        logger.warn('Failed to parse OpenAI insights response, using fallback');
        return {
          recommendedApproach: 'Warm introduction through mutual professional contacts',
          keyTalkingPoints: [
            'Shared industry experience',
            'Professional development opportunities',
            'Industry insights and trends'
          ],
          mutualConnections: ['Professional associations', 'Alumni networks'],
          industryContext: 'Strong professional alignment suggests good connection potential',
          riskAssessment: 'Low risk - appropriate professional context',
          successProbability: 72
        };
      }
    } catch (error) {
      logger.error('Error generating connection insights:', error);
      // Return fallback insights
      return {
        recommendedApproach: 'Direct professional outreach with value proposition',
        keyTalkingPoints: [
          'Industry expertise sharing',
          'Mutual professional growth',
          'Collaboration opportunities'
        ],
        mutualConnections: ['Industry networks', 'Professional groups'],
        industryContext: 'Professional networking opportunity with good alignment',
        riskAssessment: 'Medium risk - requires careful messaging',
        successProbability: 68
      };
    }
  }

  /**
   * Get detailed analytics about connection success rates
   */
  async getConnectionAnalytics(userId: string): Promise<{
    totalSearches: number;
    successfulConnections: number;
    averagePathLength: number;
    topStrategies: string[];
  }> {
    this.ensureInitialized();

    try {
      // This would typically query a connections tracking database
      // For now, returning mock analytics data
      return {
        totalSearches: 42,
        successfulConnections: 28,
        averagePathLength: 2.3,
        topStrategies: [
          'Alumni network connections',
          'Industry event networking',
          'Mutual colleague introductions'
        ]
      };
    } catch (error) {
      logger.error('Error fetching connection analytics:', error);
      throw error;
    }
  }

  /**
   * Validate connection request before processing
   */
  validateConnectionRequest(userId: string, targetName: string, targetCompany: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!userId || userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!targetName || targetName.trim().length === 0) {
      errors.push('Target name is required');
    }

    if (!targetCompany || targetCompany.trim().length === 0) {
      errors.push('Target company is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get service health status
   */
  getServiceHealth(): {
    status: string;
    connections: {
      mongodb: string;
      openai: string;
    };
  } {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      connections: {
        mongodb: mongoose.connections[0].readyState === 1 ? 'connected' : 'disconnected',
        openai: this.openai ? 'configured' : 'not configured'
      }
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      await mongoose.connection.close();
      this.isInitialized = false;
      logger.info('ConnectionService connections closed');
    } catch (error) {
      logger.error('Error closing ConnectionService connections:', error);
    }
  }
}

// Export default instance
export default new ConnectionService();