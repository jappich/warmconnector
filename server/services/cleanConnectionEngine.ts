import { db } from '../db';
import { persons, relationships, type Person } from '@shared/schema';
import { eq, and, ne, sql } from 'drizzle-orm';

export interface ConnectionCandidate {
  person: Person;
  connectionScore: number;
  matchReasons: string[];
  connectionType: 'direct' | 'company' | 'mutual' | 'industry';
  degreeOfSeparation: number;
  explanation: string;
  pathToConnection?: string[];
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

export class CleanConnectionEngine {
  
  async findConnectionCandidates(userId: string, limit = 20): Promise<SearchResult> {
    const startTime = Date.now();
    const searchCriteria: string[] = [];
    const candidates: ConnectionCandidate[] = [];

    // Get the user profile
    const [user] = await db.select().from(persons).where(eq(persons.id, userId));
    if (!user) {
      return this.emptyResult(userId, startTime);
    }

    // 1. Find direct connections
    const directConnections = await this.findDirectConnections(userId);
    candidates.push(...directConnections);
    if (directConnections.length > 0) {
      searchCriteria.push('Direct relationships');
    }

    // 2. Find company colleagues
    if (candidates.length < limit && user.company) {
      const companyConnections = await this.findCompanyConnections(userId, user.company);
      candidates.push(...companyConnections);
      if (companyConnections.length > 0) {
        searchCriteria.push('Company colleagues');
      }
    }

    // 3. Find second-degree connections
    if (candidates.length < limit) {
      const mutualConnections = await this.findMutualConnections(userId, limit - candidates.length);
      candidates.push(...mutualConnections);
      if (mutualConnections.length > 0) {
        searchCriteria.push('Mutual connections');
      }
    }

    // 4. Find industry professionals
    if (candidates.length < limit) {
      const industryConnections = await this.findIndustryConnections(userId, limit - candidates.length);
      candidates.push(...industryConnections);
      if (industryConnections.length > 0) {
        searchCriteria.push('Industry professionals');
      }
    }

    // Remove duplicates and sort by score
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

  private async findDirectConnections(userId: string): Promise<ConnectionCandidate[]> {
    const candidates: ConnectionCandidate[] = [];

    const directConnections = await db.select({
      person: persons,
      relationship: relationships
    })
    .from(relationships)
    .innerJoin(persons, eq(relationships.toPersonId, persons.id))
    .where(eq(relationships.fromPersonId, userId));

    for (const connection of directConnections) {
      const { person, relationship } = connection;
      candidates.push({
        person,
        connectionScore: (relationship.strength || 5) * 10,
        matchReasons: [`Direct ${relationship.type} connection`],
        connectionType: 'direct',
        degreeOfSeparation: 1,
        explanation: `You have a direct ${relationship.type} relationship with ${person.name}`,
        pathToConnection: [person.name]
      });
    }

    return candidates;
  }

  private async findCompanyConnections(userId: string, company: string): Promise<ConnectionCandidate[]> {
    const candidates: ConnectionCandidate[] = [];

    const companyColleagues = await db.select()
      .from(persons)
      .where(
        and(
          eq(persons.company, company),
          ne(persons.id, userId)
        )
      );

    for (const colleague of companyColleagues) {
      candidates.push({
        person: colleague,
        connectionScore: 75,
        matchReasons: ['Same company'],
        connectionType: 'company',
        degreeOfSeparation: 1,
        explanation: `Connect with ${colleague.name} at ${colleague.company} for internal networking opportunities`,
        pathToConnection: [colleague.name]
      });
    }

    return candidates;
  }

  private async findMutualConnections(userId: string, limit: number): Promise<ConnectionCandidate[]> {
    const candidates: ConnectionCandidate[] = [];

    // Get user's direct connections
    const userConnections = await db.select({
      personId: relationships.toPersonId
    })
    .from(relationships)
    .where(eq(relationships.fromPersonId, userId));

    if (userConnections.length === 0) return candidates;

    const directConnectionIds = userConnections.map(conn => conn.personId);

    // Simple approach: find connections one level deeper
    for (const directConn of userConnections.slice(0, 5)) {
      const secondDegreeConnections = await db.select({
        person: persons,
        relationship: relationships
      })
      .from(relationships)
      .innerJoin(persons, eq(relationships.toPersonId, persons.id))
      .where(
        and(
          eq(relationships.fromPersonId, directConn.personId),
          ne(relationships.toPersonId, userId),
          sql`${relationships.toPersonId} NOT IN (${directConnectionIds.map(id => `'${id}'`).join(',')})`
        )
      )
      .limit(3);

      // Get mutual contact name
      const [mutualContact] = await db.select({ name: persons.name })
        .from(persons)
        .where(eq(persons.id, directConn.personId));

      for (const connection of secondDegreeConnections) {
        if (!candidates.some(c => c.person.id === connection.person.id)) {
          candidates.push({
            person: connection.person,
            connectionScore: 60,
            matchReasons: [`Connected through ${mutualContact?.name || 'mutual contact'}`],
            connectionType: 'mutual',
            degreeOfSeparation: 2,
            explanation: `Connected through ${mutualContact?.name || 'mutual contact'}, offering a trusted introduction pathway`,
            pathToConnection: [mutualContact?.name || 'mutual contact', connection.person.name]
          });
        }
      }

      if (candidates.length >= limit) break;
    }

    return candidates;
  }

  private async findIndustryConnections(userId: string, limit: number): Promise<ConnectionCandidate[]> {
    const candidates: ConnectionCandidate[] = [];

    // Get existing connection IDs to exclude
    const existingConnections = await db.select({
      personId: relationships.toPersonId
    })
    .from(relationships)
    .where(eq(relationships.fromPersonId, userId));

    const excludeIds = [userId, ...existingConnections.map(conn => conn.personId)];

    // Find industry professionals
    const industryProfessionals = await db.select()
      .from(persons)
      .where(
        and(
          sql`${persons.company} IS NOT NULL`,
          sql`${persons.id} NOT IN (${excludeIds.map(id => `'${id}'`).join(',')})`
        )
      )
      .limit(limit);

    for (const professional of industryProfessionals) {
      candidates.push({
        person: professional,
        connectionScore: 45,
        matchReasons: ['Industry professional'],
        connectionType: 'industry',
        degreeOfSeparation: 3,
        explanation: `Connect with ${professional.name} at ${professional.company} to expand your professional network`,
        pathToConnection: [professional.name]
      });
    }

    return candidates;
  }

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

  private emptyResult(userId: string, startTime: number): SearchResult {
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
}

export const cleanConnectionEngine = new CleanConnectionEngine();