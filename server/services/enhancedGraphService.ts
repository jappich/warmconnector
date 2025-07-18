import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, or, ilike, and } from 'drizzle-orm';
import { connectionStrengthService } from './connectionStrengthService';

export interface PathNode {
  id: string;
  name: string;
  email?: string;
  company?: string;
  title?: string;
  relationshipType?: string;
  relationshipData?: any;
}

export interface ConnectionPath {
  path: PathNode[];
  hops: number;
  totalStrength: number;
}

export class EnhancedGraphService {
  
  async findConnectionPaths(
    startPersonId: string, 
    targetName: string, 
    targetCompany?: string,
    maxHops: number = 3,
    maxPaths: number = 5
  ): Promise<ConnectionPath[]> {
    try {
      // Find target persons matching the criteria
      const targetPersons = await this.findTargetPersons(targetName, targetCompany);
      
      if (targetPersons.length === 0) {
        return [];
      }

      const allPaths: ConnectionPath[] = [];

      // Find paths to each potential target
      for (const target of targetPersons) {
        const paths = await this.breadthFirstSearch(startPersonId, target.id, maxHops);
        
        // Calculate strength for each path and add metadata
        for (const path of paths) {
          const pathWithStrength = await this.enhancePathWithStrength(path);
          allPaths.push(pathWithStrength);
        }
      }

      // Sort by strength and return top results
      return allPaths
        .sort((a, b) => b.totalStrength - a.totalStrength)
        .slice(0, maxPaths);
        
    } catch (error) {
      console.error('Error finding connection paths:', error);
      return [];
    }
  }

  private async findTargetPersons(name: string, company?: string): Promise<Array<{id: string; name: string; company?: string}>> {
    let baseQuery = db.select().from(persons);
    
    if (company) {
      const results = await baseQuery
        .where(
          and(
            ilike(persons.name, `%${name}%`),
            ilike(persons.company, `%${company}%`)
          )
        )
        .limit(10);
      return results.map(p => ({ id: p.id, name: p.name, company: p.company || undefined }));
    } else {
      const results = await baseQuery
        .where(ilike(persons.name, `%${name}%`))
        .limit(10);
      return results.map(p => ({ id: p.id, name: p.name, company: p.company || undefined }));
    }
  }

  private async breadthFirstSearch(startId: string, targetId: string, maxHops: number): Promise<string[][]> {
    if (startId === targetId) return [];

    const queue: { path: string[], visited: Set<string> }[] = [
      { path: [startId], visited: new Set([startId]) }
    ];
    const foundPaths: string[][] = [];

    while (queue.length > 0 && foundPaths.length < 3) {
      const { path, visited } = queue.shift()!;
      
      if (path.length > maxHops + 1) continue;

      const currentPersonId = path[path.length - 1];
      
      // Get all connections for current person
      const connections = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, currentPersonId),
            eq(relationships.toPersonId, currentPersonId)
          )
        );

      for (const connection of connections) {
        const nextPersonId = connection.fromPersonId === currentPersonId 
          ? connection.toPersonId 
          : connection.fromPersonId;

        if (visited.has(nextPersonId)) continue;

        const newPath = [...path, nextPersonId];

        if (nextPersonId === targetId) {
          foundPaths.push(newPath);
          continue;
        }

        if (newPath.length <= maxHops) {
          const newVisited = new Set(visited);
          newVisited.add(nextPersonId);
          queue.push({ path: newPath, visited: newVisited });
        }
      }
    }

    return foundPaths;
  }

  private async enhancePathWithStrength(path: string[]): Promise<ConnectionPath> {
    const pathNodes: PathNode[] = [];
    let totalStrength = 0;

    // Get person details for each node in path
    for (let i = 0; i < path.length; i++) {
      const personId = path[i];
      const [person] = await db.select().from(persons).where(eq(persons.id, personId));
      
      if (person) {
        const node: PathNode = {
          id: person.id,
          name: person.name,
          email: person.email || undefined,
          company: person.company || undefined,
          title: person.title || undefined
        };

        // Add relationship type for connections (except first node)
        if (i > 0) {
          const prevPersonId = path[i - 1];
          const [relationship] = await db.select()
            .from(relationships)
            .where(
              or(
                eq(relationships.fromPersonId, prevPersonId) && eq(relationships.toPersonId, personId),
                eq(relationships.fromPersonId, personId) && eq(relationships.toPersonId, prevPersonId)
              )
            );
          
          if (relationship) {
            node.relationshipType = relationship.relationshipType;
            node.relationshipData = relationship.metadata;
          }
        }

        pathNodes.push(node);
      }
    }

    // Calculate total path strength
    if (path.length > 1) {
      totalStrength = await connectionStrengthService.calculatePathStrength(path);
    }

    return {
      path: pathNodes,
      hops: path.length - 1,
      totalStrength
    };
  }

  async getNetworkStats(personId: string): Promise<{
    totalConnections: number;
    connectionsByType: Record<string, number>;
    strongestConnections: Array<{
      name: string;
      company?: string;
      strength: number;
      relationshipType: string;
    }>;
  }> {
    try {
      // Get all relationships for this person
      const allRelationships = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, personId),
            eq(relationships.toPersonId, personId)
          )
        );

      // Count by relationship type
      const connectionsByType: Record<string, number> = {};
      for (const rel of allRelationships) {
        connectionsByType[rel.relationshipType] = (connectionsByType[rel.relationshipType] || 0) + 1;
      }

      // Get strongest connections
      const strongestConnections = await connectionStrengthService.findStrongestConnections(personId, 5);

      return {
        totalConnections: allRelationships.length,
        connectionsByType,
        strongestConnections
      };
    } catch (error) {
      console.error('Error getting network stats:', error);
      return {
        totalConnections: 0,
        connectionsByType: {},
        strongestConnections: []
      };
    }
  }

  async findPeopleByCompany(companyName: string, limit: number = 20): Promise<PathNode[]> {
    try {
      const people = await db.select()
        .from(persons)
        .where(ilike(persons.company, `%${companyName}%`))
        .limit(limit);

      return people.map(person => ({
        id: person.id,
        name: person.name,
        email: person.email || undefined,
        company: person.company || undefined,
        title: person.title || undefined
      }));
    } catch (error) {
      console.error('Error finding people by company:', error);
      return [];
    }
  }

  async findMutualConnections(personId1: string, personId2: string): Promise<PathNode[]> {
    try {
      // Get connections for both people
      const person1Connections = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, personId1),
            eq(relationships.toPersonId, personId1)
          )
        );

      const person2Connections = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, personId2),
            eq(relationships.toPersonId, personId2)
          )
        );

      // Find mutual connection IDs
      const person1ConnectedIds = new Set<string>();
      for (const rel of person1Connections) {
        const otherId = rel.fromPersonId === personId1 ? rel.toPersonId : rel.fromPersonId;
        person1ConnectedIds.add(otherId);
      }

      const mutualIds: string[] = [];
      for (const rel of person2Connections) {
        const otherId = rel.fromPersonId === personId2 ? rel.toPersonId : rel.fromPersonId;
        if (person1ConnectedIds.has(otherId)) {
          mutualIds.push(otherId);
        }
      }

      // Get person details for mutual connections
      const mutualConnections: PathNode[] = [];
      for (const id of mutualIds) {
        const [person] = await db.select().from(persons).where(eq(persons.id, id));
        if (person) {
          mutualConnections.push({
            id: person.id,
            name: person.name,
            email: person.email || undefined,
            company: person.company || undefined,
            title: person.title || undefined
          });
        }
      }

      return mutualConnections;
    } catch (error) {
      console.error('Error finding mutual connections:', error);
      return [];
    }
  }
}

export const enhancedGraphService = new EnhancedGraphService();