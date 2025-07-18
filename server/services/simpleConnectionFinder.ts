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

export class SimpleConnectionFinder {
  async findConnections(fromPersonId: string, toPersonId: string, maxDepth: number = 3): Promise<ConnectionResult> {
    const startTime = Date.now();
    
    // Check if both persons exist
    const [fromPerson, toPerson] = await Promise.all([
      db.select().from(persons).where(eq(persons.id, fromPersonId)).limit(1),
      db.select().from(persons).where(eq(persons.id, toPersonId)).limit(1)
    ]);
    
    if (fromPerson.length === 0 || toPerson.length === 0) {
      return {
        found: false,
        paths: [],
        searchDepth: 0,
        totalPossiblePaths: 0,
        executionTime: Date.now() - startTime
      };
    }
    
    // Try direct connection first
    const directPath = await this.findDirectConnection(fromPersonId, toPersonId);
    if (directPath) {
      return {
        found: true,
        paths: [directPath],
        searchDepth: 1,
        totalPossiblePaths: 1,
        executionTime: Date.now() - startTime
      };
    }
    
    // Try 2-hop connections
    const twoHopPaths = await this.find2HopConnections(fromPersonId, toPersonId);
    
    return {
      found: twoHopPaths.length > 0,
      paths: twoHopPaths.slice(0, 5), // Return top 5 paths
      searchDepth: 2,
      totalPossiblePaths: twoHopPaths.length,
      executionTime: Date.now() - startTime
    };
  }
  
  private async findDirectConnection(fromPersonId: string, toPersonId: string): Promise<ConnectionPath | null> {
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
    
    const [fromPerson, toPerson] = await Promise.all([
      db.select().from(persons).where(eq(persons.id, fromPersonId)).limit(1),
      db.select().from(persons).where(eq(persons.id, toPersonId)).limit(1)
    ]);
    
    if (fromPerson.length === 0 || toPerson.length === 0) return null;
    
    const rel = relationship[0];
    const strength = rel.strength || 50;
    
    return {
      path: [
        {
          id: fromPerson[0].id,
          name: fromPerson[0].name,
          company: fromPerson[0].company || undefined,
          title: fromPerson[0].title || undefined
        },
        {
          id: toPerson[0].id,
          name: toPerson[0].name,
          company: toPerson[0].company || undefined,
          title: toPerson[0].title || undefined,
          relationshipType: rel.type,
          strength: strength
        }
      ],
      totalStrength: strength,
      pathLength: 1,
      strengthScore: strength
    };
  }
  
  private async find2HopConnections(fromPersonId: string, toPersonId: string): Promise<ConnectionPath[]> {
    // Find all people connected to fromPersonId
    const fromConnections = await db
      .select({
        personId: relationships.toPersonId,
        relationshipType: relationships.relationshipType,
        strength: relationships.strength
      })
      .from(relationships)
      .where(eq(relationships.fromPersonId, fromPersonId));
    
    const paths: ConnectionPath[] = [];
    
    for (const fromConn of fromConnections) {
      // Check if this intermediate person is connected to toPersonId
      const toConnection = await db
        .select({
          relationshipType: relationships.relationshipType,
          strength: relationships.strength
        })
        .from(relationships)
        .where(
          and(
            eq(relationships.fromPersonId, fromConn.personId),
            eq(relationships.toPersonId, toPersonId)
          )
        )
        .limit(1);
      
      if (toConnection.length > 0) {
        // Get intermediate person details
        const intermediatePerson = await db
          .select()
          .from(persons)
          .where(eq(persons.id, fromConn.personId))
          .limit(1);
        
        if (intermediatePerson.length > 0) {
          const [fromPerson, toPerson] = await Promise.all([
            db.select().from(persons).where(eq(persons.id, fromPersonId)).limit(1),
            db.select().from(persons).where(eq(persons.id, toPersonId)).limit(1)
          ]);
          
          if (fromPerson.length > 0 && toPerson.length > 0) {
            const strength1 = fromConn.strength || 50;
            const strength2 = toConnection[0].strength || 50;
            const avgStrength = (strength1 + strength2) / 2;
            
            paths.push({
              path: [
                {
                  id: fromPerson[0].id,
                  name: fromPerson[0].name,
                  company: fromPerson[0].company || undefined,
                  title: fromPerson[0].title || undefined
                },
                {
                  id: intermediatePerson[0].id,
                  name: intermediatePerson[0].name,
                  company: intermediatePerson[0].company || undefined,
                  title: intermediatePerson[0].title || undefined,
                  relationshipType: fromConn.relationshipType,
                  strength: strength1
                },
                {
                  id: toPerson[0].id,
                  name: toPerson[0].name,
                  company: toPerson[0].company || undefined,
                  title: toPerson[0].title || undefined,
                  relationshipType: toConnection[0].relationshipType,
                  strength: strength2
                }
              ],
              totalStrength: strength1 + strength2,
              pathLength: 2,
              strengthScore: avgStrength * 0.8 // Penalty for longer path
            });
          }
        }
      }
    }
    
    // Sort by strength score (higher is better)
    return paths.sort((a, b) => b.strengthScore - a.strengthScore);
  }
  
  async getConnectionStrength(fromPersonId: string, toPersonId: string): Promise<number> {
    const result = await this.findConnections(fromPersonId, toPersonId, 2);
    
    if (!result.found || result.paths.length === 0) {
      return 0;
    }
    
    // Return the strength of the best path
    return result.paths[0].strengthScore;
  }
}