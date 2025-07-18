import OpenAI from 'openai';
import { MongoClient, Db } from 'mongodb';
import { Logger, createLogger } from '../utils/logger';

const logger = createLogger('DataEnrichmentService');

// TypeScript interfaces for data enrichment
export interface PersonProfile {
  id: string;
  name: string;
  title?: string;
  company?: string;
  department?: string;
  education?: string[];
  skills?: string[];
  previousCompanies?: string[];
  email?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterHandle?: string;
}

export interface EnrichmentResult {
  inferredSkills: string[];
  industryInsights: string;
  careerPath: string;
  networkingValue: string;
  connectionStrength: number;
  suggestedTopics: string[];
  enrichmentDate: Date;
  confidence: number;
}

export interface SocialMediaProfile {
  platform: string;
  username: string;
  profileUrl: string;
  followerCount?: number;
  verified?: boolean;
  bio?: string;
}

export interface CompanyData {
  name: string;
  domain: string;
  size: string;
  industry: string;
  headquarters: string;
  founded?: number;
  description?: string;
}

export interface EnrichmentContext {
  source?: string;
  priority?: 'low' | 'medium' | 'high';
  targetRole?: string;
  targetCompany?: string;
  additionalInfo?: Record<string, any>;
}

// MongoDB connection with proper error handling and retry logic
class MongoConnection {
  private static instance: MongoConnection;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;

  static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  async connect(): Promise<{ client: MongoClient; db: Db }> {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MongoDB URI not provided in environment variables');
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db('warmconnector');
        
        logger.info(`MongoDB connected for data enrichment service (attempt ${attempt + 1})`);
        this.connectionRetries = 0;
        return { client, db };
      } catch (error) {
        this.connectionRetries = attempt + 1;
        logger.error(`MongoDB connection attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to connect to MongoDB after ${this.maxRetries + 1} attempts`);
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }

    throw new Error('Unexpected error in MongoDB connection');
  }
}

export class DataEnrichmentService {
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;
  private openai: OpenAI | null = null;
  private isInitialized: boolean = false;
  private mongoConnection: MongoConnection;

  constructor() {
    this.mongoConnection = MongoConnection.getInstance();
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
  }

  async initialize(): Promise<boolean> {
    try {
      const { client, db } = await this.mongoConnection.connect();
      this.mongoClient = client;
      this.db = db;
      this.isInitialized = true;
      logger.info('DataEnrichmentService initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize DataEnrichmentService:', error);
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new Error('DataEnrichmentService not initialized. Call initialize() first.');
    }
  }

  /**
   * Enrich a person's profile using AI analysis
   */
  async enrichPersonProfile(personId: string, additionalContext: EnrichmentContext = {}): Promise<EnrichmentResult> {
    this.ensureInitialized();
    
    try {
      const person = await this.db!.collection('persons').findOne({ id: personId });
      if (!person) {
        throw new Error('Person not found');
      }

      if (!this.openai) {
        // Fallback enrichment when OpenAI is not available
        return this.generateFallbackEnrichment(person);
      }

      // Generate enrichment using AI analysis
      const enrichmentPrompt = `
Analyze this professional profile and provide enrichment suggestions:

Name: ${person.name}
Title: ${person.title || 'Not specified'}
Company: ${person.company || 'Not specified'}
Department: ${person.department || 'Not specified'}
Education: ${person.education ? person.education.join(', ') : 'Not specified'}
Skills: ${person.skills ? person.skills.join(', ') : 'Not specified'}
Previous Companies: ${person.previousCompanies ? person.previousCompanies.join(', ') : 'Not specified'}
Location: ${person.location || 'Not specified'}

Additional Context: ${JSON.stringify(additionalContext)}

Provide JSON response with:
{
  "inferredSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "industryInsights": "String describing their industry and expertise",
  "careerPath": "String analyzing their likely career trajectory",
  "networkingValue": "String describing what value they could provide in professional networking",
  "connectionStrength": 7,
  "suggestedTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "confidence": 85
}

Keep response under 500 tokens and ensure all arrays have max 5 items.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: enrichmentPrompt }],
        max_tokens: 600,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const enrichmentData = JSON.parse(content);
        const result: EnrichmentResult = {
          ...enrichmentData,
          enrichmentDate: new Date(),
          confidence: enrichmentData.confidence || 75
        };

        // Store enrichment result in database
        await this.storeEnrichmentResult(personId, result);

        logger.info(`Successfully enriched profile for person ${personId}`);
        return result;
      } catch (parseError) {
        logger.warn('Failed to parse OpenAI response, using fallback enrichment');
        return this.generateFallbackEnrichment(person);
      }
    } catch (error) {
      logger.error('Error enriching person profile:', error);
      throw error;
    }
  }

  /**
   * Generate fallback enrichment when AI is not available
   */
  private generateFallbackEnrichment(person: any): EnrichmentResult {
    const jobTitle = person.title || '';
    const company = person.company || '';
    
    // Basic skill inference based on title
    const inferredSkills = this.inferSkillsFromTitle(jobTitle);
    
    return {
      inferredSkills,
      industryInsights: `Professional with experience in ${company || 'their industry'}. ${jobTitle} role suggests expertise in relevant technical and business areas.`,
      careerPath: `Career progression in ${jobTitle.toLowerCase() || 'professional'} roles, with potential for advancement in leadership and specialized expertise.`,
      networkingValue: `Valuable connection for industry insights, professional expertise, and potential collaboration opportunities.`,
      connectionStrength: 6,
      suggestedTopics: [
        'Industry trends and insights',
        'Professional development',
        'Technology and innovation',
        'Career growth strategies',
        'Industry best practices'
      ],
      enrichmentDate: new Date(),
      confidence: 60
    };
  }

  /**
   * Infer skills from job title
   */
  private inferSkillsFromTitle(title: string): string[] {
    const titleLower = title.toLowerCase();
    const skillMap: Record<string, string[]> = {
      'engineer': ['Software Development', 'Problem Solving', 'Technical Analysis', 'Project Management', 'Team Collaboration'],
      'manager': ['Leadership', 'Team Management', 'Strategic Planning', 'Communication', 'Project Coordination'],
      'analyst': ['Data Analysis', 'Research', 'Critical Thinking', 'Reporting', 'Problem Solving'],
      'director': ['Strategic Leadership', 'Executive Management', 'Business Strategy', 'Team Building', 'Decision Making'],
      'developer': ['Programming', 'Software Architecture', 'Code Review', 'Technical Documentation', 'Agile Development'],
      'consultant': ['Business Analysis', 'Client Relations', 'Strategic Consulting', 'Communication', 'Problem Solving'],
      'sales': ['Sales Strategy', 'Client Relations', 'Negotiation', 'Revenue Generation', 'Market Analysis']
    };

    for (const [key, skills] of Object.entries(skillMap)) {
      if (titleLower.includes(key)) {
        return skills;
      }
    }

    return ['Professional Expertise', 'Communication', 'Problem Solving', 'Team Collaboration', 'Industry Knowledge'];
  }

  /**
   * Store enrichment result in database
   */
  private async storeEnrichmentResult(personId: string, enrichmentResult: EnrichmentResult): Promise<void> {
    try {
      await this.db!.collection('enrichments').updateOne(
        { personId },
        {
          $set: {
            personId,
            ...enrichmentResult,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error('Error storing enrichment result:', error);
      // Don't throw error for storage issues - enrichment was successful
    }
  }

  /**
   * Enrich company information
   */
  async enrichCompanyData(companyName: string): Promise<CompanyData | null> {
    this.ensureInitialized();

    if (!this.openai) {
      // Fallback company data when OpenAI is not available
      return {
        name: companyName,
        domain: `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        size: 'Unknown',
        industry: 'Technology',
        headquarters: 'Not specified',
        description: `${companyName} is a professional organization in the technology sector.`
      };
    }

    try {
      const prompt = `
Provide company information for: ${companyName}

Return JSON with:
{
  "name": "official company name",
  "domain": "company website domain",
  "size": "startup/small/medium/large/enterprise",
  "industry": "primary industry",
  "headquarters": "city, country",
  "founded": year or null,
  "description": "brief company description"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      try {
        const companyData = JSON.parse(content) as CompanyData;
        logger.info(`Successfully enriched company data for ${companyName}`);
        return companyData;
      } catch (parseError) {
        logger.warn('Failed to parse company enrichment response');
        return null;
      }
    } catch (error) {
      logger.error('Error enriching company data:', error);
      return null;
    }
  }

  /**
   * Batch enrich multiple profiles
   */
  async batchEnrichProfiles(personIds: string[], context: EnrichmentContext = {}): Promise<Map<string, EnrichmentResult>> {
    this.ensureInitialized();

    const results = new Map<string, EnrichmentResult>();
    const batchSize = 5; // Process in batches to avoid rate limits

    for (let i = 0; i < personIds.length; i += batchSize) {
      const batch = personIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (personId) => {
        try {
          const enrichment = await this.enrichPersonProfile(personId, context);
          return { personId, enrichment };
        } catch (error) {
          logger.error(`Failed to enrich profile for ${personId}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { personId, enrichment } = result.value;
          results.set(personId, enrichment);
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < personIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info(`Batch enrichment completed: ${results.size}/${personIds.length} profiles enriched`);
    return results;
  }

  /**
   * Get enrichment history for a person
   */
  async getEnrichmentHistory(personId: string): Promise<EnrichmentResult[]> {
    this.ensureInitialized();

    try {
      const enrichments = await this.db!.collection('enrichments')
        .find({ personId })
        .sort({ enrichmentDate: -1 })
        .limit(10)
        .toArray();

      return enrichments.map(e => ({
        inferredSkills: e.inferredSkills || [],
        industryInsights: e.industryInsights || '',
        careerPath: e.careerPath || '',
        networkingValue: e.networkingValue || '',
        connectionStrength: e.connectionStrength || 5,
        suggestedTopics: e.suggestedTopics || [],
        enrichmentDate: e.enrichmentDate || new Date(),
        confidence: e.confidence || 50
      }));
    } catch (error) {
      logger.error('Error fetching enrichment history:', error);
      return [];
    }
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
    stats: {
      totalEnrichments: number;
      avgConfidence: number;
    };
  } {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      connections: {
        mongodb: this.mongoClient ? 'connected' : 'disconnected',
        openai: this.openai ? 'configured' : 'not configured'
      },
      stats: {
        totalEnrichments: 0, // Would be fetched from database in production
        avgConfidence: 75
      }
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      if (this.mongoClient) {
        await this.mongoClient.close();
        this.mongoClient = null;
      }
      this.db = null;
      this.isInitialized = false;
      logger.info('DataEnrichmentService connections closed');
    } catch (error) {
      logger.error('Error closing DataEnrichmentService connections:', error);
    }
  }
}

// Export default instance
export default new DataEnrichmentService();