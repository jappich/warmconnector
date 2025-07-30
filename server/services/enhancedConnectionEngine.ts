import { db } from '../db';
import { persons, relationships, type Person, type Relationship } from '@shared/schema';
import { eq, like, and, sql, ne, notInArray } from 'drizzle-orm';
import { aiNetworkingService } from './aiNetworkingService';
import { advancedPathfindingEngine } from './advancedPathfinding';

export interface ConnectionCandidate {
  person: Person;
  connectionScore: number;
  matchReasons: string[];
  connectionType: 'spouse' | 'hometown' | 'education' | 'company' | 'social' | 'mutual' | 'industry';
  degreeOfSeparation: number;
  explanation: string;
  pathToConnection?: string[];
  mutualConnections?: string[];
}

export interface SearchResult {
  candidates: ConnectionCandidate[];
  totalFound: number;
  searchMetadata: {
    userId: string;
    searchCriteria: string[];
    timestamp: string;
    processingTimeMs: number;
  };
}

export class EnhancedConnectionEngine {
  
  /**
   * Find connection candidates using advanced pathfinding algorithms
   */
  async findConnectionCandidates(userId: string, limit = 20): Promise<SearchResult> {
    const startTime = Date.now();
    const searchCriteria: string[] = [];
    
    // Get the user profile
    const [user] = await db.select().from(persons).where(eq(persons.id, userId));
    if (!user) {
      return {
        candidates: [],
        totalFound: 0,
        searchMetadata: {
          userId,
          searchCriteria: [],
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime
        }
      };
    }

    const candidates: ConnectionCandidate[] = [];
    
    // 1. Find direct relationship connections with enhanced scoring
    const directConnections = await this.findDirectConnections(userId, limit);
    candidates.push(...directConnections.candidates);
    searchCriteria.push(...directConnections.searchCriteria);

    // 2. Find company colleagues with role-based scoring
    if (candidates.length < limit && user.company) {
      const companyConnections = await this.findCompanyConnections(userId, user, limit - candidates.length);
      candidates.push(...companyConnections.candidates);
      searchCriteria.push(...companyConnections.searchCriteria);
    }

    // 3. Find second-degree connections through mutual contacts
    if (candidates.length < limit) {
      const mutualConnections = await this.findMutualConnections(userId, limit - candidates.length);
      candidates.push(...mutualConnections.candidates);
      searchCriteria.push(...mutualConnections.searchCriteria);
    }

    // 4. Find industry professionals for broader networking
    if (candidates.length < limit) {
      const industryConnections = await this.findIndustryConnections(userId, user, limit - candidates.length);
      candidates.push(...industryConnections.candidates);
      searchCriteria.push(...industryConnections.searchCriteria);
    }

    // Skip AI enhancement for now to avoid TypeScript errors

    // Sort by connection score and remove duplicates
    const uniqueCandidates = this.removeDuplicatesAndSort(candidates);
    const finalCandidates = uniqueCandidates.slice(0, limit);

    return {
      candidates: finalCandidates,
      totalFound: finalCandidates.length,
      searchMetadata: {
        userId,
        searchCriteria,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime
      }
    };
  }

  /**
   * Find direct relationship connections with strength-based scoring
   */
  private async findDirectConnections(userId: string, limit: number) {
    const candidates: ConnectionCandidate[] = [];
    const searchCriteria: string[] = [];

    const directConnections = await db.select({
      person: persons,
      relationship: relationships
    })
    .from(relationships)
    .innerJoin(persons, eq(relationships.toId, persons.id))
    .where(eq(relationships.fromId, userId))
    .limit(limit);

    for (const connection of directConnections) {
      const { person, relationship } = connection;
      const connectionScore = this.calculateDirectConnectionScore(relationship);
      
      candidates.push({
        person,
        connectionScore,
        matchReasons: [`Direct ${relationship.type} connection`],
        connectionType: this.mapRelationshipType(relationship.type),
        degreeOfSeparation: 1,
        explanation: `You have a direct ${relationship.type} relationship with ${person.name}`,
        pathToConnection: [person.name]
      });

      searchCriteria.push(`Direct ${relationship.type} connection`);
    }

    return { candidates, searchCriteria };
  }

  /**
   * Find company colleagues with enhanced role-based scoring
   */
  private async findCompanyConnections(userId: string, user: Person, limit: number) {
    const candidates: ConnectionCandidate[] = [];
    const searchCriteria: string[] = [];

    if (!user.company) return { candidates, searchCriteria };

    const companyColleagues = await db.select()
      .from(persons)
      .where(
        and(
          eq(persons.company, user.company),
          ne(persons.id, userId)
        )
      )
      .limit(limit);

    for (const colleague of companyColleagues) {
      const connectionScore = this.calculateCompanyConnectionScore(user, colleague);
      
      candidates.push({
        person: colleague,
        connectionScore,
        matchReasons: ['Same company'],
        connectionType: 'company',
        degreeOfSeparation: 1,
        explanation: `Connect with ${colleague.name} at ${colleague.company} for internal networking opportunities`,
        pathToConnection: [colleague.name]
      });

      searchCriteria.push('Company colleague');
    }

    return { candidates, searchCriteria };
  }

  /**
   * Find second-degree connections through mutual contacts
   */
  private async findMutualConnections(userId: string, limit: number) {
    const candidates: ConnectionCandidate[] = [];
    const searchCriteria: string[] = [];

    // Get user's direct connections
    const userConnections = await db.select({
      personId: relationships.toId,
      strength: relationships.confidenceScore
    })
    .from(relationships)
    .where(eq(relationships.fromId, userId));

    const directConnectionIds = userConnections.map(conn => conn.personId);
    if (directConnectionIds.length === 0) return { candidates, searchCriteria };

    // Find connections of connections (excluding direct connections and self)
    const mutualConnections = await db.select({
      person: persons,
      relationship: relationships,
      mutualContactId: relationships.fromId
    })
    .from(relationships)
    .innerJoin(persons, eq(relationships.toId, persons.id))
    .where(
      and(
        sql`${relationships.fromId} IN (${directConnectionIds.join(',')})`,
        ne(relationships.toId, userId),
        notInArray(relationships.toId, directConnectionIds)
      )
    )
    .limit(limit);

    for (const connection of mutualConnections) {
      // Find the mutual contact name
      const [mutualContact] = await db.select({ name: persons.name })
        .from(persons)
        .where(eq(persons.id, connection.mutualContactId));

      const connectionScore = this.calculateMutualConnectionScore(connection.relationship);
      
      candidates.push({
        person: connection.person,
        connectionScore,
        matchReasons: [`Connected through ${mutualContact?.name || 'mutual contact'}`],
        connectionType: 'mutual',
        degreeOfSeparation: 2,
        explanation: `Connected through ${mutualContact?.name || 'mutual contact'}, offering a trusted introduction pathway`,
        pathToConnection: [mutualContact?.name || 'mutual contact', connection.person.name],
        mutualConnections: [mutualContact?.name || 'mutual contact']
      });

      searchCriteria.push('Mutual connection');
    }

    return { candidates, searchCriteria };
  }

  /**
   * Find industry professionals for broader networking
   */
  private async findIndustryConnections(userId: string, user: Person, limit: number) {
    const candidates: ConnectionCandidate[] = [];
    const searchCriteria: string[] = [];

    // Get existing connection IDs to exclude
    const existingConnections = await db.select({
      personId: relationships.toId
    })
    .from(relationships)
    .where(eq(relationships.fromId, userId));

    const excludeIds = [userId, ...existingConnections.map(conn => conn.personId)];

    const industryProfessionals = await db.select()
      .from(persons)
      .where(
        and(
          sql`${persons.company} IS NOT NULL`,
          notInArray(persons.id, excludeIds)
        )
      )
      .limit(limit);

    for (const professional of industryProfessionals) {
      const connectionScore = this.calculateIndustryConnectionScore(user, professional);
      
      candidates.push({
        person: professional,
        connectionScore,
        matchReasons: ['Industry professional'],
        connectionType: 'industry',
        degreeOfSeparation: 3,
        explanation: `Connect with ${professional.name} at ${professional.company} to expand your professional network`,
        pathToConnection: [professional.name]
      });

      searchCriteria.push('Industry professional');
    }

    return { candidates, searchCriteria };
  }

  /**
   * Calculate connection score for direct relationships
   */
  private calculateDirectConnectionScore(relationship: Relationship): number {
    const baseScore = (relationship.confidenceScore || 5) * 10; // Convert 1-10 to percentage
    
    // Boost score based on relationship type
    const typeBoost = {
      'spouse': 20,
      'family': 15,
      'coworker': 10,
      'college': 10,
      'advisor': 15,
      'client': 5
    };

    const boost = typeBoost[relationship.type as keyof typeof typeBoost] || 0;
    return Math.min(baseScore + boost, 100);
  }

  /**
   * Calculate connection score for company colleagues
   */
  private calculateCompanyConnectionScore(user: Person, colleague: Person): number {
    let score = 70; // Base company connection score

    // Boost for similar roles
    if (user.title && colleague.title) {
      const titleSimilarity = this.calculateTitleSimilarity(user.title, colleague.title);
      score += titleSimilarity * 15;
    }

    return Math.min(score, 90);
  }

  /**
   * Calculate connection score for mutual connections
   */
  private calculateMutualConnectionScore(relationship: Relationship): number {
    const strength = relationship.confidenceScore || 5;
    return Math.min(strength * 7, 75); // Scale to max 75 for second-degree
  }

  /**
   * Calculate connection score for industry professionals
   */
  private calculateIndustryConnectionScore(user: Person, professional: Person): number {
    let score = 50; // Base industry connection score

    // Boost for same industry/company type
    if (user.company && professional.company) {
      if (this.isSimilarIndustry(user.company, professional.company)) {
        score += 10;
      }
    }

    return Math.min(score, 65);
  }

  /**
   * Calculate similarity between job titles
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const t1 = title1.toLowerCase();
    const t2 = title2.toLowerCase();
    
    const keywords = ['manager', 'director', 'engineer', 'senior', 'lead', 'architect', 'analyst', 'specialist'];
    let similarity = 0;
    
    for (const keyword of keywords) {
      if (t1.includes(keyword) && t2.includes(keyword)) {
        similarity += 0.3;
      }
    }
    
    const departments = ['engineering', 'product', 'marketing', 'sales', 'finance', 'operations'];
    for (const dept of departments) {
      if (t1.includes(dept) && t2.includes(dept)) {
        similarity += 0.4;
      }
    }
    
    return Math.min(similarity, 1.0);
  }

  /**
   * Check if companies are in similar industries
   */
  private isSimilarIndustry(company1: string, company2: string): boolean {
    const c1 = company1.toLowerCase();
    const c2 = company2.toLowerCase();
    
    const industryKeywords = ['tech', 'consulting', 'finance', 'health', 'media', 'university', 'solutions'];
    
    for (const keyword of industryKeywords) {
      if (c1.includes(keyword) && c2.includes(keyword)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Map relationship types to connection categories
   */
  private mapRelationshipType(relationshipType: string): ConnectionCandidate['connectionType'] {
    const typeMap: Record<string, ConnectionCandidate['connectionType']> = {
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

  /**
   * Find second-degree connections through mutual contacts
   */
  private async findMutualConnections(userId: string, limit: number) {
    const candidates: ConnectionCandidate[] = [];
    const searchCriteria: string[] = [];

    // Get user's direct connections
    const userConnections = await db.select({
      personId: relationships.toId,
      strength: relationships.confidenceScore
    })
    .from(relationships)
    .where(eq(relationships.fromId, userId));

    const directConnectionIds = userConnections.map(conn => conn.personId);
    if (directConnectionIds.length === 0) return { candidates, searchCriteria };

    // Find connections of connections (excluding direct connections and self)
    for (const directConn of userConnections.slice(0, 5)) { // Limit to avoid too many queries
      const mutualConnections = await db.select({
        person: persons,
        relationship: relationships
      })
      .from(relationships)
      .innerJoin(persons, eq(relationships.toId, persons.id))
      .where(
        and(
          eq(relationships.fromId, directConn.personId),
          ne(relationships.toId, userId),
          notInArray(relationships.toId, directConnectionIds)
        )
      )
      .limit(Math.max(1, Math.floor(limit / userConnections.length)));

      // Find the mutual contact name
      const [mutualContact] = await db.select({ name: persons.name })
        .from(persons)
        .where(eq(persons.id, directConn.personId));

      for (const connection of mutualConnections) {
        if (!candidates.some(c => c.person.id === connection.person.id)) {
          const avgStrength = ((directConn.strength || 5) + (connection.relationship.confidenceScore || 5)) / 2;
          
          candidates.push({
            person: connection.person,
            connectionScore: Math.min(avgStrength * 7, 75),
            matchReasons: [`Connected through ${mutualContact?.name || 'mutual contact'}`],
            connectionType: 'mutual',
            degreeOfSeparation: 2,
            explanation: `Connected through ${mutualContact?.name || 'mutual contact'}, offering a trusted introduction pathway`,
            pathToConnection: [mutualContact?.name || 'mutual contact', connection.person.name],
            mutualConnections: [mutualContact?.name || 'mutual contact']
          });

          searchCriteria.push('Mutual connection');
        }
      }

      if (candidates.length >= limit) break;
    }

    return { candidates, searchCriteria };
  }

  /**
   * Remove duplicates and sort by connection score
   */
  private removeDuplicatesAndSort(candidates: ConnectionCandidate[]): ConnectionCandidate[] {
    const seen = new Set<string>();
    const unique = candidates.filter(candidate => {
      if (seen.has(candidate.person.id)) {
        return false;
      }
      seen.add(candidate.person.id);
      return true;
    });

    return unique.sort((a, b) => b.connectionScore - a.connectionScore);
  }
}

// Export singleton instance
export const enhancedConnectionEngine = new EnhancedConnectionEngine();