import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path';
import { db } from './db';
import { persons, relationships, type Person, type Relationship } from '../shared/schema';
import { eq, or, and, like } from 'drizzle-orm';

export interface PathNode {
  id: string;
  name: string;
  company?: string;
  title?: string;
  relationshipType?: string;
}

export interface IntroductionPath {
  path: PathNode[];
  hops: number;
  totalStrength: number;
}

class GraphService {
  private graph: Graph;
  private lastUpdate: Date;
  private updateInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.graph = new Graph({ type: 'undirected' });
    this.lastUpdate = new Date(0);
    this.initializeGraph();
  }

  /**
   * Initialize the graph with data from the database
   */
  private async initializeGraph(): Promise<void> {
    try {
      console.log('Initializing graph database...');
      
      // Load all persons
      const allPersons = await db.select().from(persons);
      
      // Add nodes to graph
      for (const person of allPersons) {
        this.graph.addNode(person.id, {
          name: person.name,
          company: person.company,
          title: person.title,
          email: person.email,
          userId: person.userId
        });
      }

      // Load all relationships
      const allRelationships = await db.select().from(relationships);
      
      // Add edges to graph
      for (const rel of allRelationships) {
        if (this.graph.hasNode(rel.fromPersonId) && this.graph.hasNode(rel.toPersonId)) {
          this.graph.addEdge(rel.fromPersonId, rel.toPersonId, {
            type: rel.type,
            strength: rel.strength || 1,
            id: rel.id
          });
        }
      }

      this.lastUpdate = new Date();
      console.log(`Graph initialized with ${this.graph.order} nodes and ${this.graph.size} edges`);
    } catch (error) {
      console.error('Error initializing graph:', error);
    }
  }

  /**
   * Refresh the graph if it's been too long since last update
   */
  private async refreshIfNeeded(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastUpdate.getTime() > this.updateInterval) {
      this.graph.clear();
      await this.initializeGraph();
    }
  }

  /**
   * Find the shortest path between two persons
   */
  async findShortestPath(fromPersonId: string, toPersonId: string): Promise<IntroductionPath | null> {
    await this.refreshIfNeeded();

    if (!this.graph.hasNode(fromPersonId) || !this.graph.hasNode(toPersonId)) {
      return null;
    }

    try {
      const pathIds = bidirectional(this.graph, fromPersonId, toPersonId);
      
      if (!pathIds || pathIds.length === 0) {
        return null;
      }

      const path: PathNode[] = [];
      let totalStrength = 0;

      for (let i = 0; i < pathIds.length; i++) {
        const personId = pathIds[i];
        const nodeData = this.graph.getNodeAttributes(personId);
        
        let relationshipType: string | undefined;
        
        // Get relationship type from the edge (except for the first node)
        if (i > 0) {
          const prevPersonId = pathIds[i - 1];
          const edgeData = this.graph.getEdgeAttributes(this.graph.edge(prevPersonId, personId));
          relationshipType = edgeData.type;
          totalStrength += edgeData.strength || 1;
        }

        path.push({
          id: personId,
          name: nodeData.name,
          company: nodeData.company,
          title: nodeData.title,
          relationshipType
        });
      }

      return {
        path,
        hops: pathIds.length - 1,
        totalStrength
      };
    } catch (error) {
      console.error('Error finding shortest path:', error);
      return null;
    }
  }

  /**
   * Find all possible paths to persons matching the target criteria
   */
  async findIntroductionPaths(
    currentUserPersonId: string, 
    targetName: string, 
    targetCompany?: string
  ): Promise<IntroductionPath[]> {
    await this.refreshIfNeeded();

    // Find matching target persons
    const matchingPersons = await this.findMatchingPersons(targetName, targetCompany);
    
    if (matchingPersons.length === 0) {
      return [];
    }

    const paths: IntroductionPath[] = [];

    for (const targetPerson of matchingPersons) {
      const path = await this.findShortestPath(currentUserPersonId, targetPerson.id);
      if (path) {
        paths.push(path);
      }
    }

    // Sort by number of hops, then by total strength
    paths.sort((a, b) => {
      if (a.hops !== b.hops) {
        return a.hops - b.hops;
      }
      return b.totalStrength - a.totalStrength;
    });

    return paths;
  }

  /**
   * Find persons matching the search criteria
   */
  private async findMatchingPersons(targetName: string, targetCompany?: string): Promise<Person[]> {
    const namePattern = `%${targetName.toLowerCase()}%`;
    
    if (targetCompany) {
      const companyPattern = `%${targetCompany.toLowerCase()}%`;
      return await db.select().from(persons)
        .where(
          and(
            like(persons.name, namePattern),
            like(persons.company, companyPattern)
          )
        );
    } else {
      return await db.select().from(persons)
        .where(like(persons.name, namePattern));
    }
  }

  /**
   * Add a new person to the graph
   */
  async addPerson(person: Person): Promise<void> {
    this.graph.addNode(person.id, {
      name: person.name,
      company: person.company,
      title: person.title,
      email: person.email,
      userId: person.userId
    });
  }

  /**
   * Add a new relationship to the graph
   */
  async addRelationship(relationship: Relationship): Promise<void> {
    if (this.graph.hasNode(relationship.fromPersonId) && this.graph.hasNode(relationship.toPersonId)) {
      this.graph.addEdge(relationship.fromPersonId, relationship.toPersonId, {
        type: relationship.type,
        strength: relationship.strength || 1,
        id: relationship.id
      });
    }
  }

  /**
   * Get graph statistics
   */
  getStats(): { nodes: number; edges: number; lastUpdate: Date } {
    return {
      nodes: this.graph.order,
      edges: this.graph.size,
      lastUpdate: this.lastUpdate
    };
  }
}

// Singleton instance
export const graphService = new GraphService();