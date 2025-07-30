import { db } from '../db';
import { persons, relationships, type Person, type Relationship } from '@shared/schema';
import { eq, and, sql, ne, notInArray } from 'drizzle-orm';

export interface PathNode {
  person: Person;
  relationshipType: string;
  strength: number;
  depth: number;
}

export interface ConnectionPath {
  nodes: PathNode[];
  totalStrength: number;
  pathLength: number;
  score: number;
}

export interface PathfindingResult {
  directPaths: ConnectionPath[];
  mutualPaths: ConnectionPath[];
  industryPaths: ConnectionPath[];
  optimalPath?: ConnectionPath;
}

export class AdvancedPathfindingEngine {
  
  /**
   * Find optimal paths between two persons using Dijkstra-like algorithm
   */
  async findOptimalPaths(fromPersonId: string, toPersonId: string, maxDepth = 4): Promise<PathfindingResult> {
    const directPaths = await this.findDirectPaths(fromPersonId, toPersonId);
    const mutualPaths = await this.findMutualPaths(fromPersonId, toPersonId, maxDepth);
    const industryPaths = await this.findIndustryPaths(fromPersonId, toPersonId);
    
    const allPaths = [...directPaths, ...mutualPaths, ...industryPaths];
    const optimalPath = this.selectOptimalPath(allPaths);
    
    return {
      directPaths,
      mutualPaths,
      industryPaths,
      optimalPath
    };
  }

  /**
   * Find all possible connection candidates using multi-layered pathfinding
   */
  async findConnectionCandidatesAdvanced(userId: string, limit = 20): Promise<Person[]> {
    const candidates = new Map<string, { person: Person; score: number; path: string[] }>();
    
    // Layer 1: Direct connections (highest priority)
    const directConnections = await this.getDirectConnections(userId);
    for (const conn of directConnections) {
      candidates.set(conn.person.id, {
        person: conn.person,
        score: conn.strength * 10,
        path: [conn.person.name]
      });
    }

    // Layer 2: Second-degree connections
    if (candidates.size < limit) {
      const secondDegreeConnections = await this.getSecondDegreeConnections(userId, limit - candidates.size);
      for (const conn of secondDegreeConnections) {
        if (!candidates.has(conn.person.id)) {
          candidates.set(conn.person.id, {
            person: conn.person,
            score: conn.score,
            path: conn.path
          });
        }
      }
    }

    // Layer 3: Third-degree connections (if needed)
    if (candidates.size < limit) {
      const thirdDegreeConnections = await this.getThirdDegreeConnections(userId, limit - candidates.size);
      for (const conn of thirdDegreeConnections) {
        if (!candidates.has(conn.person.id)) {
          candidates.set(conn.person.id, {
            person: conn.person,
            score: conn.score,
            path: conn.path
          });
        }
      }
    }

    // Convert to array and sort by score
    const sortedCandidates = Array.from(candidates.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return sortedCandidates.map(c => c.person);
  }

  /**
   * Find direct relationship paths
   */
  private async findDirectPaths(fromPersonId: string, toPersonId: string): Promise<ConnectionPath[]> {
    const directRelation = await db.select({
      relationship: relationships,
      person: persons
    })
    .from(relationships)
    .innerJoin(persons, eq(relationships.toId, persons.id))
    .where(
      and(
        eq(relationships.fromId, fromPersonId),
        eq(relationships.toId, toPersonId)
      )
    );

    if (directRelation.length === 0) return [];

    const relation = directRelation[0];
    return [{
      nodes: [{
        person: relation.person,
        relationshipType: relation.relationship.type,
        strength: relation.relationship.confidenceScore || 5,
        depth: 1
      }],
      totalStrength: relation.relationship.confidenceScore || 5,
      pathLength: 1,
      score: (relation.relationship.confidenceScore || 5) * 20
    }];
  }

  /**
   * Find mutual connection paths using BFS-like approach
   */
  private async findMutualPaths(fromPersonId: string, toPersonId: string, maxDepth: number): Promise<ConnectionPath[]> {
    const paths: ConnectionPath[] = [];
    const visited = new Set<string>();
    const queue: { personId: string; path: PathNode[]; totalStrength: number }[] = [];

    // Initialize queue with direct connections of fromPerson
    const directConnections = await this.getDirectConnections(fromPersonId);
    for (const conn of directConnections) {
      queue.push({
        personId: conn.person.id,
        path: [{
          person: conn.person,
          relationshipType: conn.relationshipType,
          strength: conn.strength,
          depth: 1
        }],
        totalStrength: conn.strength
      });
    }

    while (queue.length > 0 && paths.length < 10) {
      const current = queue.shift()!;
      
      if (visited.has(current.personId) || current.path.length >= maxDepth) {
        continue;
      }
      
      visited.add(current.personId);

      // Check if current person connects to target
      const connectionToTarget = await db.select({
        relationship: relationships,
        person: persons
      })
      .from(relationships)
      .innerJoin(persons, eq(relationships.toId, persons.id))
      .where(
        and(
          eq(relationships.fromId, current.personId),
          eq(relationships.toId, toPersonId)
        )
      );

      if (connectionToTarget.length > 0) {
        const finalConnection = connectionToTarget[0];
        const completePath = [
          ...current.path,
          {
            person: finalConnection.person,
            relationshipType: finalConnection.relationship.type,
            strength: finalConnection.relationship.confidenceScore || 5,
            depth: current.path.length + 1
          }
        ];

        const totalStrength = current.totalStrength + (finalConnection.relationship.confidenceScore || 5);
        const avgStrength = totalStrength / completePath.length;

        paths.push({
          nodes: completePath,
          totalStrength,
          pathLength: completePath.length,
          score: avgStrength * (10 - completePath.length) // Prefer shorter paths
        });
      }

      // Add next level connections to queue
      if (current.path.length < maxDepth - 1) {
        const nextConnections = await this.getDirectConnections(current.personId);
        for (const nextConn of nextConnections) {
          if (!visited.has(nextConn.person.id) && nextConn.person.id !== fromPersonId) {
            queue.push({
              personId: nextConn.person.id,
              path: [
                ...current.path,
                {
                  person: nextConn.person,
                  relationshipType: nextConn.relationshipType,
                  strength: nextConn.strength,
                  depth: current.path.length + 1
                }
              ],
              totalStrength: current.totalStrength + nextConn.strength
            });
          }
        }
      }
    }

    return paths.sort((a, b) => b.score - a.score);
  }

  /**
   * Find industry-based connection paths
   */
  private async findIndustryPaths(fromPersonId: string, toPersonId: string): Promise<ConnectionPath[]> {
    const [fromPerson] = await db.select().from(persons).where(eq(persons.id, fromPersonId));
    const [toPerson] = await db.select().from(persons).where(eq(persons.id, toPersonId));

    if (!fromPerson || !toPerson || !fromPerson.company || !toPerson.company) {
      return [];
    }

    // Find people in same industry as intermediaries
    const fromIndustryKeyword = this.extractIndustryKeyword(fromPerson.company);
    const toIndustryKeyword = this.extractIndustryKeyword(toPerson.company);
    
    const industryIntermediaries = await db.select()
      .from(persons)
      .where(
        and(
          sql`(${persons.company} LIKE ${`%${fromIndustryKeyword}%`} OR ${persons.company} LIKE ${`%${toIndustryKeyword}%`})`,
          ne(persons.id, fromPersonId),
          ne(persons.id, toPersonId)
        )
      )
      .limit(5);

    const paths: ConnectionPath[] = [];

    for (const intermediary of industryIntermediaries) {
      // Check if fromPerson connects to intermediary and intermediary connects to toPerson
      const pathToIntermediary = await this.findDirectPaths(fromPersonId, intermediary.id);
      const pathFromIntermediary = await this.findDirectPaths(intermediary.id, toPersonId);

      if (pathToIntermediary.length > 0 && pathFromIntermediary.length > 0) {
        paths.push({
          nodes: [
            ...pathToIntermediary[0].nodes,
            ...pathFromIntermediary[0].nodes
          ],
          totalStrength: pathToIntermediary[0].totalStrength + pathFromIntermediary[0].totalStrength,
          pathLength: pathToIntermediary[0].pathLength + pathFromIntermediary[0].pathLength,
          score: (pathToIntermediary[0].score + pathFromIntermediary[0].score) / 2
        });
      }
    }

    return paths;
  }

  /**
   * Get direct connections for a person
   */
  private async getDirectConnections(personId: string): Promise<Array<{ person: Person; relationshipType: string; strength: number }>> {
    const connections = await db.select({
      person: persons,
      relationship: relationships
    })
    .from(relationships)
    .innerJoin(persons, eq(relationships.toId, persons.id))
    .where(eq(relationships.fromId, personId));

    return connections.map(conn => ({
      person: conn.person,
      relationshipType: conn.relationship.type,
      strength: conn.relationship.confidenceScore || 5
    }));
  }

  /**
   * Get second-degree connections with path information
   */
  private async getSecondDegreeConnections(userId: string, limit: number): Promise<Array<{ person: Person; score: number; path: string[] }>> {
    const results: Array<{ person: Person; score: number; path: string[] }> = [];
    
    // Get user's direct connections
    const directConnections = await this.getDirectConnections(userId);
    
    for (const directConn of directConnections.slice(0, 10)) { // Limit to avoid too many queries
      const secondDegreeConns = await this.getDirectConnections(directConn.person.id);
      
      for (const secondConn of secondDegreeConns) {
        if (secondConn.person.id !== userId && !results.some(r => r.person.id === secondConn.person.id)) {
          const avgStrength = (directConn.strength + secondConn.strength) / 2;
          results.push({
            person: secondConn.person,
            score: avgStrength * 7, // Scale for second-degree
            path: [directConn.person.name, secondConn.person.name]
          });
        }
      }
      
      if (results.length >= limit) break;
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Get third-degree connections for broader networking
   */
  private async getThirdDegreeConnections(userId: string, limit: number): Promise<Array<{ person: Person; score: number; path: string[] }>> {
    const results: Array<{ person: Person; score: number; path: string[] }> = [];
    
    // Get existing connection IDs to exclude
    const existingConnections = await db.select({
      personId: relationships.toId
    })
    .from(relationships)
    .where(eq(relationships.fromId, userId));

    const excludeIds = [userId, ...existingConnections.map(conn => conn.personId)];

    // Find industry professionals as third-degree connections
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
      results.push({
        person: professional,
        score: 40, // Lower score for third-degree
        path: ['Industry', professional.name]
      });
    }

    return results;
  }

  /**
   * Select the optimal path based on multiple criteria
   */
  private selectOptimalPath(paths: ConnectionPath[]): ConnectionPath | undefined {
    if (paths.length === 0) return undefined;

    return paths.reduce((best, current) => {
      // Prefer shorter paths with higher strength
      const bestRatio = best.totalStrength / best.pathLength;
      const currentRatio = current.totalStrength / current.pathLength;
      
      if (currentRatio > bestRatio) {
        return current;
      } else if (currentRatio === bestRatio && current.pathLength < best.pathLength) {
        return current;
      }
      
      return best;
    });
  }

  /**
   * Extract industry keyword from company name
   */
  private extractIndustryKeyword(company: string): string {
    const keywords = ['Tech', 'Solutions', 'Consulting', 'Capital', 'Bank', 'University', 'Health', 'Media'];
    
    for (const keyword of keywords) {
      if (company.includes(keyword)) {
        return keyword;
      }
    }
    
    return company.split(' ')[0]; // Default to first word
  }
}

// Export singleton instance
export const advancedPathfindingEngine = new AdvancedPathfindingEngine();