import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

interface ConnectionPath {
  path: Array<{
    id: string;
    name: string;
    company?: string;
    title?: string;
    relationshipType?: string;
    strength?: number;
  }>;
  totalStrength: number;
  pathLength: number;
  strengthScore: number;
}

interface ConnectionResult {
  found: boolean;
  paths: ConnectionPath[];
  searchDepth: number;
  totalPossiblePaths: number;
  executionTime: number;
}

export class EnhancedConnectionFinder {
  private maxDepth: number = 4;
  private minStrength: number = 20; // Minimum relationship strength to consider
  
  async findConnections(fromPersonId: string, toPersonId: string, maxDepth: number = 4): Promise<ConnectionResult> {
    const startTime = Date.now();
    this.maxDepth = maxDepth;
    
    // Direct connection check
    const directConnection = await this.findDirectConnection(fromPersonId, toPersonId);
    if (directConnection) {
      return {
        found: true,
        paths: [directConnection],
        searchDepth: 1,
        totalPossiblePaths: 1,
        executionTime: Date.now() - startTime
      };
    }
    
    // Multi-hop pathfinding
    const paths = await this.findAllPaths(fromPersonId, toPersonId, maxDepth);
    
    // Sort paths by strength score (higher is better)
    const sortedPaths = paths.sort((a, b) => b.strengthScore - a.strengthScore);
    
    return {
      found: sortedPaths.length > 0,
      paths: sortedPaths.slice(0, 10), // Return top 10 paths
      searchDepth: maxDepth,
      totalPossiblePaths: paths.length,
      executionTime: Date.now() - startTime
    };
  }
  
  private async findDirectConnection(fromPersonId: string, toPersonId: string): Promise<ConnectionPath | null> {
    // Get the relationship between two people
    const relationship = await db
      .select({
        type: relationships.relationshipType,
        strength: relationships.strength
      })
      .from(relationships)
      .where(
        and(
          eq(relationships.fromPersonId, fromPersonId),
          eq(relationships.toPersonId, toPersonId)
        )
      )
      .limit(1);
      
    if (relationship.length === 0) return null;
    
    // Get both person details
    const [fromPerson, toPerson] = await Promise.all([
      db.select().from(persons).where(eq(persons.id, fromPersonId)).limit(1),
      db.select().from(persons).where(eq(persons.id, toPersonId)).limit(1)
    ]);
    
    if (fromPerson.length === 0 || toPerson.length === 0) return null;
    
    const conn = connection[0];
    const strength = conn.relationship.strength || 50;
    
    return {
      path: [
        {
          id: conn.fromPerson.id,
          name: conn.fromPerson.name,
          company: conn.fromPerson.company || undefined,
          title: conn.fromPerson.title || undefined
        },
        {
          id: conn.toPerson.id,
          name: conn.toPerson.name,
          company: conn.toPerson.company || undefined,
          title: conn.toPerson.title || undefined,
          relationshipType: conn.relationship.type,
          strength: strength
        }
      ],
      totalStrength: strength,
      pathLength: 1,
      strengthScore: this.calculateStrengthScore([strength])
    };
  }
  
  private async findAllPaths(fromPersonId: string, toPersonId: string, maxDepth: number): Promise<ConnectionPath[]> {
    const visited = new Set<string>();
    const allPaths: ConnectionPath[] = [];
    
    await this.findPathsRecursive(
      fromPersonId,
      toPersonId,
      [],
      visited,
      allPaths,
      0,
      maxDepth
    );
    
    return allPaths;
  }
  
  private async findPathsRecursive(
    currentPersonId: string,
    targetPersonId: string,
    currentPath: Array<{ id: string; name: string; company?: string; title?: string; relationshipType?: string; strength?: number; }>,
    visited: Set<string>,
    allPaths: ConnectionPath[],
    depth: number,
    maxDepth: number
  ): Promise<void> {
    if (depth >= maxDepth) return;
    if (visited.has(currentPersonId)) return;
    
    visited.add(currentPersonId);
    
    // Get current person details if not in path
    if (currentPath.length === 0) {
      const currentPerson = await db
        .select()
        .from(persons)
        .where(eq(persons.id, currentPersonId))
        .limit(1);
        
      if (currentPerson.length > 0) {
        const person = currentPerson[0];
        currentPath.push({
          id: person.id,
          name: person.name,
          company: person.company || undefined,
          title: person.title || undefined
        });
      }
    }
    
    // Find all connections from current person
    const connections = await db
      .select({
        toPerson: {
          id: sql`to_person.id`.as('to_id'),
          name: sql`to_person.name`.as('to_name'),
          company: sql`to_person.company`.as('to_company'),
          title: sql`to_person.title`.as('to_title')
        },
        relationship: {
          type: relationships.relationshipType,
          strength: relationships.strength
        }
      })
      .from(relationships)
      .innerJoin(sql`${persons.tableName} as to_person`, sql`${relationships.toPersonId} = to_person.id`)
      .where(
        and(
          eq(relationships.fromPersonId, currentPersonId),
          sql`${relationships.strength} >= ${this.minStrength}`
        )
      );
    
    for (const connection of connections) {
      const nextPersonId = connection.toPerson.id;
      const strength = connection.relationship.strength || 50;
      
      if (visited.has(nextPersonId)) continue;
      
      const nextPerson = {
        id: connection.toPerson.id,
        name: connection.toPerson.name,
        company: connection.toPerson.company || undefined,
        title: connection.toPerson.title || undefined,
        relationshipType: connection.relationship.type,
        strength: strength
      };
      
      const newPath = [...currentPath, nextPerson];
      
      // Check if we reached the target
      if (nextPersonId === targetPersonId) {
        const pathStrengths = newPath.slice(1).map(p => p.strength || 50);
        allPaths.push({
          path: newPath,
          totalStrength: pathStrengths.reduce((sum, s) => sum + s, 0),
          pathLength: newPath.length - 1,
          strengthScore: this.calculateStrengthScore(pathStrengths)
        });
        continue;
      }
      
      // Continue searching deeper
      await this.findPathsRecursive(
        nextPersonId,
        targetPersonId,
        newPath,
        new Set(visited),
        allPaths,
        depth + 1,
        maxDepth
      );
    }
    
    visited.delete(currentPersonId);
  }
  
  private calculateStrengthScore(strengths: number[]): number {
    if (strengths.length === 0) return 0;
    
    // Calculate score based on:
    // 1. Average strength (higher is better)
    // 2. Path length penalty (shorter is better)
    // 3. Weakest link penalty (stronger weakest link is better)
    
    const avgStrength = strengths.reduce((sum, s) => sum + s, 0) / strengths.length;
    const minStrength = Math.min(...strengths);
    const pathLengthPenalty = Math.pow(0.8, strengths.length - 1);
    
    return (avgStrength * 0.4 + minStrength * 0.4) * pathLengthPenalty * 0.2;
  }
  
  async getConnectionStrength(fromPersonId: string, toPersonId: string): Promise<number> {
    const result = await this.findConnections(fromPersonId, toPersonId, 3);
    
    if (!result.found || result.paths.length === 0) {
      return 0;
    }
    
    // Return the strength of the best path
    return result.paths[0].strengthScore;
  }
  
  async suggestOptimalIntroductions(targetPersonId: string, userPersonId: string): Promise<Array<{
    introducerPersonId: string;
    introducerName: string;
    connectionStrength: number;
    mutualConnections: number;
    reason: string;
  }>> {
    // Find people who are connected to both the user and the target
    const mutualConnections = await db
      .select({
        person: {
          id: persons.id,
          name: persons.name,
          company: persons.company,
          title: persons.title
        },
        userRelationship: {
          strength: sql`user_rel.strength`.as('user_strength')
        },
        targetRelationship: {
          strength: sql`target_rel.strength`.as('target_strength')
        }
      })
      .from(persons)
      .innerJoin(sql`${relationships.tableName} as user_rel`, 
        sql`user_rel.to_person_id = ${persons.id} AND user_rel.from_person_id = ${userPersonId}`)
      .innerJoin(sql`${relationships.tableName} as target_rel`, 
        sql`target_rel.from_person_id = ${persons.id} AND target_rel.to_person_id = ${targetPersonId}`)
      .where(sql`user_rel.strength >= ${this.minStrength} AND target_rel.strength >= ${this.minStrength}`)
      .limit(10);
    
    return mutualConnections.map(conn => ({
      introducerPersonId: conn.person.id,
      introducerName: conn.person.name,
      connectionStrength: (conn.userRelationship.strength + conn.targetRelationship.strength) / 2,
      mutualConnections: 1, // This person is the mutual connection
      reason: `Strong connection to both you and ${conn.person.name}${conn.person.company ? ` at ${conn.person.company}` : ''}`
    }));
  }
}