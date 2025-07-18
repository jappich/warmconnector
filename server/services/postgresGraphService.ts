import { db } from '../db';
import { persons, relationships, type Person, type Relationship } from '../../shared/schema';
import { eq, or, and, like } from 'drizzle-orm';

export interface NetworkPath {
  id: string;
  name: string;
  company?: string;
  title?: string;
  relationshipType?: string;
  strength?: number;
}

export interface ConnectionPath {
  path: NetworkPath[];
  totalHops: number;
  totalStrength: number;
  pathDescription: string;
}

/**
 * PostgreSQL-based graph service for finding connection paths
 * No external graph database required - uses efficient SQL queries
 */
export class PostgresGraphService {
  
  /**
   * Find the shortest connection path between two people
   */
  async findConnectionPath(fromPersonId: string, toPersonId: string): Promise<ConnectionPath | null> {
    try {
      // Simple direct connection check first
      const directConnection = await db.select()
        .from(relationships)
        .innerJoin(persons, eq(relationships.toPersonId, persons.id))
        .where(
          and(
            eq(relationships.fromPersonId, fromPersonId),
            eq(relationships.toPersonId, toPersonId)
          )
        )
        .limit(1);

      if (directConnection.length > 0) {
        const fromPerson = await db.select().from(persons).where(eq(persons.id, fromPersonId)).limit(1);
        const toPerson = directConnection[0].persons;
        const relationship = directConnection[0].relationships;

        return {
          path: [
            {
              id: fromPersonId,
              name: fromPerson[0]?.name || 'Unknown',
              company: fromPerson[0]?.company || undefined,
              title: fromPerson[0]?.title || undefined
            },
            {
              id: toPerson.id,
              name: toPerson.name,
              company: toPerson.company || undefined,
              title: toPerson.title || undefined,
              relationshipType: relationship.type,
              strength: relationship.strength || undefined
            }
          ],
          totalHops: 1,
          totalStrength: relationship.strength || 1,
          pathDescription: `Direct ${relationship.type} connection`
        };
      }

      // For more complex paths, use a simpler approach
      // Find 2-hop connections (Person A -> Person B -> Person C)
      const twoHopConnections = await db.select({
        middlePerson: persons,
        firstRel: relationships,
        fromPerson: persons
      })
        .from(relationships)
        .innerJoin(persons, eq(relationships.toPersonId, persons.id))
        .where(eq(relationships.fromPersonId, fromPersonId))
        .limit(10);

      for (const middleConnection of twoHopConnections) {
        const finalConnection = await db.select()
          .from(relationships)
          .innerJoin(persons, eq(relationships.toPersonId, persons.id))
          .where(
            and(
              eq(relationships.fromPersonId, middleConnection.middlePerson.id),
              eq(relationships.toPersonId, toPersonId)
            )
          )
          .limit(1);

        if (finalConnection.length > 0) {
          const fromPerson = await db.select().from(persons).where(eq(persons.id, fromPersonId)).limit(1);
          const finalPerson = finalConnection[0].persons;
          const finalRel = finalConnection[0].relationships;

          return {
            path: [
              {
                id: fromPersonId,
                name: fromPerson[0]?.name || 'Unknown',
                company: fromPerson[0]?.company,
                title: fromPerson[0]?.title
              },
              {
                id: middleConnection.middlePerson.id,
                name: middleConnection.middlePerson.name,
                company: middleConnection.middlePerson.company,
                title: middleConnection.middlePerson.title,
                relationshipType: middleConnection.firstRel.type,
                strength: middleConnection.firstRel.strength
              },
              {
                id: finalPerson.id,
                name: finalPerson.name,
                company: finalPerson.company,
                title: finalPerson.title,
                relationshipType: finalRel.type,
                strength: finalRel.strength
              }
            ],
            totalHops: 2,
            totalStrength: (middleConnection.firstRel.strength || 1) + (finalRel.strength || 1),
            pathDescription: `Path via ${middleConnection.middlePerson.name}`
          };
        }
      }

      return null;

    } catch (error) {
      console.error('Error finding connection path:', error);
      return null;
    }
  }

  /**
   * Find all people matching search criteria
   */
  async findPeople(searchTerm: string, company?: string): Promise<Person[]> {
    try {
      if (company && searchTerm) {
        return await db.select().from(persons).where(
          and(
            or(
              like(persons.name, `%${searchTerm}%`),
              like(persons.email, `%${searchTerm}%`)
            ),
            like(persons.company, `%${company}%`)
          )
        ).limit(50);
      } else if (searchTerm) {
        return await db.select().from(persons).where(
          or(
            like(persons.name, `%${searchTerm}%`),
            like(persons.email, `%${searchTerm}%`),
            like(persons.company, `%${searchTerm}%`)
          )
        ).limit(50);
      } else if (company) {
        return await db.select().from(persons).where(like(persons.company, `%${company}%`)).limit(50);
      }

      return await db.select().from(persons).limit(50);
    } catch (error) {
      console.error('Error finding people:', error);
      return [];
    }
  }

  /**
   * Find multiple connection paths to different people
   */
  async findMultipleConnectionPaths(
    fromPersonId: string,
    targetName: string,
    targetCompany?: string
  ): Promise<ConnectionPath[]> {
    try {
      // First find people matching the criteria
      const matchingPeople = await this.findPeople(targetName, targetCompany);
      
      const paths: ConnectionPath[] = [];
      
      // Find paths to each matching person (limit to top 5)
      for (const person of matchingPeople.slice(0, 5)) {
        if (person.id !== fromPersonId) {
          const path = await this.findConnectionPath(fromPersonId, person.id);
          if (path) {
            paths.push(path);
          }
        }
      }
      
      // Sort by shortest path and highest strength
      return paths.sort((a, b) => {
        if (a.totalHops !== b.totalHops) {
          return a.totalHops - b.totalHops;
        }
        return b.totalStrength - a.totalStrength;
      });
      
    } catch (error) {
      console.error('Error finding multiple connection paths:', error);
      return [];
    }
  }

  /**
   * Get network statistics for a person
   */
  async getNetworkStats(personId: string): Promise<{
    directConnections: number;
    secondDegreeConnections: number;
    strongestConnection: Person | null;
    companies: string[];
  }> {
    try {
      // Count direct connections using Drizzle ORM
      const directConnections = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, personId),
            eq(relationships.toPersonId, personId)
          )
        );

      // Get strongest connection
      const strongestConnections = await db.select()
        .from(relationships)
        .innerJoin(persons, 
          or(
            and(eq(relationships.fromPersonId, personId), eq(relationships.toPersonId, persons.id)),
            and(eq(relationships.toPersonId, personId), eq(relationships.fromPersonId, persons.id))
          )
        )
        .where(
          or(
            eq(relationships.fromPersonId, personId),
            eq(relationships.toPersonId, personId)
          )
        )
        .orderBy(relationships.strength)
        .limit(1);

      // Get connected companies
      const companiesData = await db.select({
        company: persons.company
      })
        .from(relationships)
        .innerJoin(persons, 
          or(
            and(eq(relationships.fromPersonId, personId), eq(relationships.toPersonId, persons.id)),
            and(eq(relationships.toPersonId, personId), eq(relationships.fromPersonId, persons.id))
          )
        )
        .where(
          or(
            eq(relationships.fromPersonId, personId),
            eq(relationships.toPersonId, personId)
          )
        );

      const companies = [...new Set(companiesData.map(item => item.company).filter(Boolean))];

      return {
        directConnections: directConnections.length,
        secondDegreeConnections: 0, // Simplified for now
        strongestConnection: strongestConnections[0]?.persons || null,
        companies
      };

    } catch (error) {
      console.error('Error getting network stats:', error);
      return {
        directConnections: 0,
        secondDegreeConnections: 0,
        strongestConnection: null,
        companies: []
      };
    }
  }

  /**
   * Add a new relationship between two people
   */
  async addRelationship(
    fromPersonId: string,
    toPersonId: string,
    type: string,
    strength: number = 5
  ): Promise<boolean> {
    try {
      await db.insert(relationships).values({
        fromPersonId,
        toPersonId,
        type,
        strength
      });
      
      // Also add reverse relationship for undirected graph
      await db.insert(relationships).values({
        fromPersonId: toPersonId,
        toPersonId: fromPersonId,
        type,
        strength
      });
      
      return true;
    } catch (error) {
      console.error('Error adding relationship:', error);
      return false;
    }
  }

  /**
   * Generate human-readable path description
   */
  private generatePathDescription(path: NetworkPath[]): string {
    if (path.length <= 1) return "Direct connection";
    if (path.length === 2) return "Direct connection";
    
    const connections = [];
    for (let i = 1; i < path.length; i++) {
      const person = path[i];
      connections.push(`${person.name} (${person.relationshipType})`);
    }
    
    return `Path: ${connections.join(" → ")}`;
  }
}

export const postgresGraphService = new PostgresGraphService();