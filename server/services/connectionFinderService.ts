import { db } from '../db';
import { persons, relationshipEdges as relationships, type Person } from '../../shared/schema';
import { eq, and, or, ne, ilike, sql } from 'drizzle-orm';
import OpenAI from 'openai';

// Repository interface for clean abstraction (Neo4j migration ready)
export interface ConnectionRepository {
  findUserById(userId: string): Promise<Person | null>;
  findConnectionCandidates(userId: string, limit?: number): Promise<ConnectionCandidate[]>;
  findBySpouse(spouseName: string): Promise<Person[]>;
  findByHometown(hometown: string): Promise<Person[]>;
  findByEducation(school: string): Promise<Person[]>;
  findByCompany(company: string): Promise<Person[]>;
  findBySocialConnection(platform: string, handle: string): Promise<Person[]>;
  calculateConnectionStrength(userA: Person, userB: Person): Promise<number>;
}

export interface ConnectionCandidate {
  person: Person;
  connectionScore: number;
  matchReasons: string[];
  connectionType: 'spouse' | 'hometown' | 'education' | 'company' | 'social' | 'mutual';
  degreeOfSeparation: number;
  explanation: string;
}

export interface ConnectionSearchResult {
  candidates: ConnectionCandidate[];
  totalFound: number;
  searchMetadata: {
    userId: string;
    searchCriteria: string[];
    timestamp: Date;
    processingTimeMs: number;
  };
}

// PostgreSQL implementation of ConnectionRepository
export class PostgreSQLConnectionRepository implements ConnectionRepository {
  
  /**
   * Map relationship types to connection types
   */
  private mapRelationshipType(relationshipType: string): 'spouse' | 'hometown' | 'education' | 'company' | 'social' | 'mutual' {
    const typeMap: Record<string, 'spouse' | 'hometown' | 'education' | 'company' | 'social' | 'mutual'> = {
      'spouse': 'spouse',
      'family': 'spouse',
      'coworker': 'company',
      'colleague': 'company',
      'college': 'education',
      'university': 'education',
      'professor': 'education',
      'advisor': 'education',
      'alumni': 'education',
      'friend': 'social',
      'social': 'social',
      'industry': 'company',
      'client': 'company',
      'hometown': 'hometown',
      'neighbor': 'hometown'
    };
    
    return typeMap[relationshipType.toLowerCase()] || 'mutual';
  }


  
  async findUserById(userId: string): Promise<Person | null> {
    try {
      const [user] = await db.select()
        .from(persons)
        .where(eq(persons.id, userId))
        .limit(1);
      
      return user || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async findConnectionCandidates(userId: string, limit = 20): Promise<ConnectionCandidate[]> {
    const user = await this.findUserById(userId);
    if (!user) return [];

    const candidates: ConnectionCandidate[] = [];
    
    // Find direct relationship connections
    const directConnections = await db.select({
      person: persons,
      relationship: relationships
    })
    .from(relationships)
    .innerJoin(persons, eq(relationships.toId, persons.id))
    .where(eq(relationships.fromId, userId))
    .limit(limit);

    // Process direct connections
    for (const connection of directConnections) {
      const { person, relationship } = connection;
      candidates.push({
        person,
        connectionScore: (relationship.confidenceScore || 5) * 10, // Convert 1-10 scale to percentage
        matchReasons: [`Direct ${relationship.type} connection`],
        connectionType: this.mapRelationshipType(relationship.type),
        degreeOfSeparation: 1,
        explanation: `You have a direct ${relationship.type} relationship`
      });
    }

    // Find company matches (if still need more results)
    if (candidates.length < limit && user.company) {
      const companyMatches = await this.findByCompany(user.company);
      for (const match of companyMatches) {
        if (match.id !== userId && !candidates.some(c => c.person.id === match.id)) {
          candidates.push({
            person: match,
            connectionScore: 75,
            matchReasons: ['Same company'],
            connectionType: 'company',
            degreeOfSeparation: 1,
            explanation: `Connect with ${match.name} at ${match.company} to expand your internal network and explore collaboration opportunities`
          });
        }
      }
    }

    // Find industry connections based on similar company types
    if (candidates.length < limit) {
      const industryMatches = await db.select()
        .from(persons)
        .where(
          and(
            sql`${persons.id} != ${userId}`,
            sql`${persons.company} IS NOT NULL`,
            sql`${persons.id} NOT IN (
              SELECT "toId" FROM "relationships" WHERE "fromId" = ${userId}
            )`
          )
        )
        .limit(limit - candidates.length);

      for (const match of industryMatches) {
        if (!candidates.some(c => c.person.id === match.id)) {
          candidates.push({
            person: match,
            connectionScore: 55,
            matchReasons: ['Industry professional'],
            connectionType: 'mutual',
            degreeOfSeparation: 2,
            explanation: `Connect with ${match.name} at ${match.company} to expand your professional network across the industry`
          });
        }
      }
    }

    // Sort by connection score and limit results
    return candidates
      .sort((a, b) => b.connectionScore - a.connectionScore)
      .slice(0, limit);
  }

  async findBySpouse(spouseName: string): Promise<Person[]> {
    try {
      // Mock implementation - in real app, would query spouse field
      return await db.select()
        .from(persons)
        .where(ilike(persons.name, `%${spouseName.split(' ')[0]}%`))
        .limit(5);
    } catch (error) {
      console.error('Error finding by spouse:', error);
      return [];
    }
  }

  async findByHometown(hometown: string): Promise<Person[]> {
    try {
      // Using company as hometown proxy for demo
      return await db.select()
        .from(persons)
        .where(ilike(persons.company, `%${hometown}%`))
        .limit(10);
    } catch (error) {
      console.error('Error finding by hometown:', error);
      return [];
    }
  }

  async findByEducation(school: string): Promise<Person[]> {
    try {
      // Mock implementation - would query education field
      return await db.select()
        .from(persons)
        .where(ilike(persons.title, '%Engineer%'))
        .limit(10);
    } catch (error) {
      console.error('Error finding by education:', error);
      return [];
    }
  }

  async findByCompany(company: string): Promise<Person[]> {
    try {
      return await db.select()
        .from(persons)
        .where(ilike(persons.company, `%${company}%`))
        .limit(10);
    } catch (error) {
      console.error('Error finding by company:', error);
      return [];
    }
  }

  async findBySocialConnection(platform: string, handle: string): Promise<Person[]> {
    try {
      // TODO: Implement socialAccounts table in schema
      console.log(`Social connection search for ${platform} not yet implemented`);
      return [];
    } catch (error) {
      console.error('Error finding by social connection:', error);
      return [];
    }
  }

  async calculateConnectionStrength(userA: Person, userB: Person): Promise<number> {
    let strength = 0;
    
    // Company match
    if (userA.company && userB.company && userA.company === userB.company) {
      strength += 30;
    }
    
    // Name similarity (could indicate family/mutual connections)
    if (userA.name && userB.name) {
      const nameWords = userA.name.toLowerCase().split(' ');
      const otherNameWords = userB.name.toLowerCase().split(' ');
      const commonWords = nameWords.filter(word => otherNameWords.includes(word));
      strength += commonWords.length * 15;
    }
    
    // Title similarity
    if (userA.title && userB.title && userA.title === userB.title) {
      strength += 20;
    }
    
    return Math.min(strength, 100);
  }
}

// Main Connection Finder Service
export class ConnectionFinderService {
  private repository: ConnectionRepository;
  private openai: OpenAI;

  constructor(repository?: ConnectionRepository) {
    this.repository = repository || new PostgreSQLConnectionRepository();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Core connection finding method - demo ready
   */
  async findConnections(
    userId: string, 
    options: {
      limit?: number;
      includeExternalEnrichment?: boolean;
      filterByType?: string[];
    } = {}
  ): Promise<ConnectionSearchResult> {
    const startTime = Date.now();
    const { limit = 20, includeExternalEnrichment = false, filterByType } = options;

    try {
      // Get base candidates from repository
      const candidates = await this.repository.findConnectionCandidates(userId, limit);
      
      // External enrichment (if enabled)
      let enrichedCandidates = candidates;
      if (includeExternalEnrichment) {
        enrichedCandidates = await this.enrichWithExternalData(candidates);
      }

      // AI-powered ranking and explanation enhancement
      const intelligentCandidates = await this.enhanceWithAI(enrichedCandidates);

      // Apply filters if specified
      let filteredCandidates = intelligentCandidates;
      if (filterByType && filterByType.length > 0) {
        filteredCandidates = intelligentCandidates.filter(
          candidate => filterByType.includes(candidate.connectionType)
        );
      }

      const processingTime = Date.now() - startTime;

      return {
        candidates: filteredCandidates,
        totalFound: filteredCandidates.length,
        searchMetadata: {
          userId,
          searchCriteria: this.extractSearchCriteria(filteredCandidates),
          timestamp: new Date(),
          processingTimeMs: processingTime
        }
      };

    } catch (error) {
      console.error('Error in connection finding:', error);
      return {
        candidates: [],
        totalFound: 0,
        searchMetadata: {
          userId,
          searchCriteria: [],
          timestamp: new Date(),
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * External data enrichment (LinkedIn, public directories, etc.)
   */
  private async enrichWithExternalData(candidates: ConnectionCandidate[]): Promise<ConnectionCandidate[]> {
    // Mock external enrichment - in production would query LinkedIn API, etc.
    return candidates.map(candidate => ({
      ...candidate,
      connectionScore: Math.min(candidate.connectionScore + 5, 100),
      matchReasons: [...candidate.matchReasons, 'External verification']
    }));
  }

  /**
   * AI-powered enhancement of candidates
   */
  private async enhanceWithAI(candidates: ConnectionCandidate[]): Promise<ConnectionCandidate[]> {
    if (!process.env.OPENAI_API_KEY || candidates.length === 0) {
      return candidates;
    }

    try {
      // Process top candidates with AI for better explanations
      const topCandidates = candidates.slice(0, 5);
      
      for (const candidate of topCandidates) {
        const enhancedExplanation = await this.generateAIExplanation(candidate);
        candidate.explanation = enhancedExplanation || candidate.explanation;
      }

      return candidates;
    } catch (error) {
      console.error('AI enhancement error:', error);
      return candidates;
    }
  }

  /**
   * Generate AI-powered explanation for connection
   */
  private async generateAIExplanation(candidate: ConnectionCandidate): Promise<string | null> {
    try {
      const prompt = `
        Explain why this professional connection is valuable:
        
        Person: ${candidate.person.name}
        Title: ${candidate.person.title}
        Company: ${candidate.person.company}
        Connection Type: ${candidate.connectionType}
        Match Reasons: ${candidate.matchReasons.join(', ')}
        
        Provide a brief, professional explanation (1-2 sentences) of why this connection could be valuable for networking.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional networking expert. Provide concise, valuable explanations for why connections matter."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      return response.choices[0].message.content?.trim() || null;
    } catch (error) {
      console.error('Error generating AI explanation:', error);
      return null;
    }
  }

  /**
   * Extract search criteria from results for metadata
   */
  private extractSearchCriteria(candidates: ConnectionCandidate[]): string[] {
    const criteria = new Set<string>();
    
    candidates.forEach(candidate => {
      criteria.add(candidate.connectionType);
      candidate.matchReasons.forEach(reason => criteria.add(reason));
    });
    
    return Array.from(criteria);
  }

  /**
   * Get detailed connection analysis between two specific users
   */
  async analyzeConnection(userAId: string, userBId: string): Promise<{
    connectionStrength: number;
    analysis: string;
    sharedAttributes: string[];
    recommendedApproach: string;
  }> {
    const userA = await this.repository.findUserById(userAId);
    const userB = await this.repository.findUserById(userBId);
    
    if (!userA || !userB) {
      throw new Error('Users not found');
    }

    const strength = await this.repository.calculateConnectionStrength(userA, userB);
    const sharedAttributes = this.findSharedAttributes(userA, userB);
    
    return {
      connectionStrength: strength,
      analysis: `Connection strength: ${strength}% based on ${sharedAttributes.length} shared attributes`,
      sharedAttributes,
      recommendedApproach: this.generateApproachRecommendation(userA, userB, sharedAttributes)
    };
  }

  /**
   * Find shared attributes between two users
   */
  private findSharedAttributes(userA: Person, userB: Person): string[] {
    const shared: string[] = [];
    
    if (userA.company === userB.company && userA.company) {
      shared.push(`Both work at ${userA.company}`);
    }
    
    if (userA.title === userB.title && userA.title) {
      shared.push(`Same role: ${userA.title}`);
    }
    
    // Mock additional attributes - in real app would check education, hometown, etc.
    if (userA.name && userB.name) {
      const aWords = userA.name.toLowerCase().split(' ');
      const bWords = userB.name.toLowerCase().split(' ');
      const commonWords = aWords.filter(word => bWords.includes(word));
      if (commonWords.length > 0) {
        shared.push('Potential family or mutual connection');
      }
    }
    
    return shared;
  }

  /**
   * Generate approach recommendation
   */
  private generateApproachRecommendation(userA: Person, userB: Person, sharedAttributes: string[]): string {
    if (sharedAttributes.length === 0) {
      return 'Reach out with a general introduction highlighting your professional background';
    }
    
    if (sharedAttributes.some(attr => attr.includes('work at'))) {
      return 'Mention your shared company connection as an ice breaker';
    }
    
    if (sharedAttributes.some(attr => attr.includes('role'))) {
      return 'Connect over shared professional experiences and industry insights';
    }
    
    return `Leverage your shared connection: ${sharedAttributes[0]}`;
  }

}

// Export singleton instance
export const connectionFinderService = new ConnectionFinderService();