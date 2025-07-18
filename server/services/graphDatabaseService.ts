import neo4j, { Driver, Session, Result, Integer } from 'neo4j-driver';
import { Logger, createLogger } from '../utils/logger';

const logger = createLogger('GraphDatabaseService');

// TypeScript interfaces for graph database operations
export interface PersonNode {
  id: string;
  name: string;
  email?: string;
  company?: string;
  title?: string;
  department?: string;
  location?: string;
  skills?: string[];
  education?: string[];
}

export interface RelationshipEdge {
  fromPersonId: string;
  toPersonId: string;
  relationshipType: string;
  strength: number;
  metadata?: Record<string, any>;
}

export interface PathResult {
  nodes: PersonNode[];
  relationships: RelationshipEdge[];
  length: number;
  totalStrength: number;
}

export interface NetworkStats {
  totalNodes: number;
  totalRelationships: number;
  averageDegree: number;
  strongestConnections: Array<{
    from: string;
    to: string;
    strength: number;
    type: string;
  }>;
}

export interface GraphQuery {
  cypher: string;
  parameters?: Record<string, any>;
}

// Connection management with retry logic
class Neo4jConnection {
  private static instance: Neo4jConnection;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;

  static getInstance(): Neo4jConnection {
    if (!Neo4jConnection.instance) {
      Neo4jConnection.instance = new Neo4jConnection();
    }
    return Neo4jConnection.instance;
  }

  async createDriver(): Promise<Driver> {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
      throw new Error('Neo4j credentials not configured. Please set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables.');
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
        
        // Test connection
        const session = driver.session();
        try {
          await session.run('RETURN 1');
          logger.info(`Neo4j connection established successfully (attempt ${attempt + 1})`);
          this.connectionRetries = 0;
          return driver;
        } catch (error) {
          await session.close();
          throw error;
        } finally {
          await session.close();
        }
      } catch (error) {
        this.connectionRetries = attempt + 1;
        logger.error(`Neo4j connection attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to connect to Neo4j after ${this.maxRetries + 1} attempts`);
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }

    throw new Error('Unexpected error in Neo4j connection');
  }
}

export class GraphDatabaseService {
  private driver: Driver | null = null;
  private neo4jConnection: Neo4jConnection;
  private isInitialized: boolean = false;

  constructor() {
    this.neo4jConnection = Neo4jConnection.getInstance();
  }

  async initialize(): Promise<boolean> {
    try {
      this.driver = await this.neo4jConnection.createDriver();
      this.isInitialized = true;
      logger.info('GraphDatabaseService initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize GraphDatabaseService:', error);
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.driver) {
      throw new Error('GraphDatabaseService not initialized. Call initialize() first.');
    }
  }

  async connect(): Promise<void> {
    if (!this.driver) {
      await this.initialize();
    }
  }

  async getSession(): Promise<Session> {
    this.ensureInitialized();
    return this.driver!.session();
  }

  /**
   * Create or update a person node in the graph
   */
  async createPersonNode(person: PersonNode): Promise<PersonNode> {
    const session = await this.getSession();
    try {
      const result = await session.run(
        `MERGE (p:Person {id: $id})
         SET p.name = $name,
             p.email = $email,
             p.company = $company,
             p.title = $title,
             p.department = $department,
             p.location = $location,
             p.skills = $skills,
             p.education = $education,
             p.updatedAt = datetime()
         RETURN p`,
        {
          id: person.id,
          name: person.name,
          email: person.email || null,
          company: person.company || null,
          title: person.title || null,
          department: person.department || null,
          location: person.location || null,
          skills: person.skills || [],
          education: person.education || []
        }
      );

      const record = result.records[0];
      if (record) {
        const node = record.get('p').properties;
        return {
          id: node.id,
          name: node.name,
          email: node.email,
          company: node.company,
          title: node.title,
          department: node.department,
          location: node.location,
          skills: node.skills || [],
          education: node.education || []
        };
      }

      throw new Error('Failed to create person node');
    } catch (error) {
      logger.error('Error creating person node:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a relationship between two people
   */
  async createRelationship(relationship: RelationshipEdge): Promise<void> {
    const session = await this.getSession();
    try {
      await session.run(
        `MATCH (from:Person {id: $fromId}), (to:Person {id: $toId})
         MERGE (from)-[r:${relationship.relationshipType.toUpperCase()}]->(to)
         SET r.strength = $strength,
             r.metadata = $metadata,
             r.createdAt = datetime(),
             r.updatedAt = datetime()
         RETURN r`,
        {
          fromId: relationship.fromPersonId,
          toId: relationship.toPersonId,
          strength: relationship.strength,
          metadata: relationship.metadata || {}
        }
      );

      logger.debug(`Created relationship: ${relationship.fromPersonId} -> ${relationship.toPersonId} (${relationship.relationshipType})`);
    } catch (error) {
      logger.error('Error creating relationship:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find shortest path between two people
   */
  async findShortestPath(fromPersonId: string, toPersonId: string, maxHops: number = 6): Promise<PathResult[]> {
    const session = await this.getSession();
    try {
      const result = await session.run(
        `MATCH (start:Person {id: $fromId}), (end:Person {id: $toId})
         MATCH path = shortestPath((start)-[*1..${maxHops}]-(end))
         WITH path, relationships(path) as rels
         RETURN 
           [node in nodes(path) | {
             id: node.id,
             name: node.name,
             company: node.company,
             title: node.title
           }] as nodes,
           [rel in rels | {
             type: type(rel),
             strength: rel.strength,
             metadata: rel.metadata
           }] as relationships,
           length(path) as pathLength,
           reduce(total = 0, rel in rels | total + rel.strength) as totalStrength
         ORDER BY pathLength, totalStrength DESC
         LIMIT 10`,
        {
          fromId: fromPersonId,
          toId: toPersonId
        }
      );

      const paths: PathResult[] = [];
      for (const record of result.records) {
        const nodes = record.get('nodes');
        const relationships = record.get('relationships');
        const pathLength = record.get('pathLength').toNumber();
        const totalStrength = record.get('totalStrength').toNumber();

        paths.push({
          nodes: nodes.map((n: any) => ({
            id: n.id,
            name: n.name,
            company: n.company,
            title: n.title
          })),
          relationships: relationships.map((r: any) => ({
            fromPersonId: '', // Would need to be derived from path order
            toPersonId: '',
            relationshipType: r.type,
            strength: r.strength || 0
          })),
          length: pathLength,
          totalStrength: totalStrength
        });
      }

      return paths;
    } catch (error) {
      logger.error('Error finding shortest path:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get network statistics for a person
   */
  async getPersonNetworkStats(personId: string): Promise<{
    directConnections: number;
    secondDegreeConnections: number;
    strongestConnections: Array<{
      personId: string;
      name: string;
      company: string;
      strength: number;
      relationshipType: string;
    }>;
    companies: string[];
  }> {
    const session = await this.getSession();
    try {
      // Get direct connections
      const directResult = await session.run(
        `MATCH (p:Person {id: $personId})-[r]-(connected:Person)
         RETURN count(DISTINCT connected) as directCount`,
        { personId }
      );

      // Get second degree connections
      const secondDegreeResult = await session.run(
        `MATCH (p:Person {id: $personId})-[*2]-(connected:Person)
         WHERE connected.id <> $personId
         RETURN count(DISTINCT connected) as secondDegreeCount`,
        { personId }
      );

      // Get strongest connections
      const strongestResult = await session.run(
        `MATCH (p:Person {id: $personId})-[r]-(connected:Person)
         RETURN connected.id as personId,
                connected.name as name,
                connected.company as company,
                r.strength as strength,
                type(r) as relationshipType
         ORDER BY r.strength DESC
         LIMIT 10`,
        { personId }
      );

      // Get connected companies
      const companiesResult = await session.run(
        `MATCH (p:Person {id: $personId})-[r]-(connected:Person)
         WHERE connected.company IS NOT NULL
         RETURN DISTINCT connected.company as company`,
        { personId }
      );

      const directConnections = directResult.records[0]?.get('directCount').toNumber() || 0;
      const secondDegreeConnections = secondDegreeResult.records[0]?.get('secondDegreeCount').toNumber() || 0;

      const strongestConnections = strongestResult.records.map(record => ({
        personId: record.get('personId'),
        name: record.get('name'),
        company: record.get('company') || '',
        strength: record.get('strength')?.toNumber() || 0,
        relationshipType: record.get('relationshipType')
      }));

      const companies = companiesResult.records.map(record => record.get('company'));

      return {
        directConnections,
        secondDegreeConnections,
        strongestConnections,
        companies
      };
    } catch (error) {
      logger.error('Error getting person network stats:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get overall network statistics
   */
  async getNetworkStats(): Promise<NetworkStats> {
    const session = await this.getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person) 
         OPTIONAL MATCH (p)-[r]-()
         WITH count(DISTINCT p) as nodeCount, count(r) as relCount
         MATCH (p1:Person)-[r:STRONG_CONNECTION]-(p2:Person)
         RETURN nodeCount, relCount, 
                collect({
                  from: p1.name,
                  to: p2.name,
                  strength: r.strength,
                  type: type(r)
                })[0..10] as strongestConnections`
      );

      const record = result.records[0];
      if (!record) {
        return {
          totalNodes: 0,
          totalRelationships: 0,
          averageDegree: 0,
          strongestConnections: []
        };
      }

      const totalNodes = record.get('nodeCount').toNumber();
      const totalRelationships = record.get('relCount').toNumber();
      const strongestConnections = record.get('strongestConnections') || [];

      return {
        totalNodes,
        totalRelationships,
        averageDegree: totalNodes > 0 ? totalRelationships / totalNodes : 0,
        strongestConnections: strongestConnections.map((conn: any) => ({
          from: conn.from,
          to: conn.to,
          strength: conn.strength?.toNumber() || 0,
          type: conn.type
        }))
      };
    } catch (error) {
      logger.error('Error getting network stats:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Execute custom Cypher query
   */
  async executeQuery(query: GraphQuery): Promise<any[]> {
    const session = await this.getSession();
    try {
      const result = await session.run(query.cypher, query.parameters || {});
      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          const value = record.get(key);
          // Convert Neo4j integers to regular numbers
          if (value && typeof value.toNumber === 'function') {
            obj[key] = value.toNumber();
          } else {
            obj[key] = value;
          }
        });
        return obj;
      });
    } catch (error) {
      logger.error('Error executing query:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Batch create multiple person nodes
   */
  async batchCreatePersonNodes(persons: PersonNode[]): Promise<void> {
    const session = await this.getSession();
    try {
      const batchSize = 100;
      for (let i = 0; i < persons.length; i += batchSize) {
        const batch = persons.slice(i, i + batchSize);
        
        await session.run(
          `UNWIND $persons as person
           MERGE (p:Person {id: person.id})
           SET p.name = person.name,
               p.email = person.email,
               p.company = person.company,
               p.title = person.title,
               p.department = person.department,
               p.location = person.location,
               p.skills = person.skills,
               p.education = person.education,
               p.updatedAt = datetime()`,
          { persons: batch }
        );
      }

      logger.info(`Batch created ${persons.length} person nodes`);
    } catch (error) {
      logger.error('Error in batch create person nodes:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Clear all graph data
   */
  async clearGraph(): Promise<void> {
    const session = await this.getSession();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
      logger.info('Graph cleared successfully');
    } catch (error) {
      logger.error('Error clearing graph:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: string;
    connected: boolean;
    version?: string;
    nodeCount?: number;
    relationshipCount?: number;
  }> {
    try {
      this.ensureInitialized();
      
      const session = await this.getSession();
      try {
        // Test connection and get basic stats
        const result = await session.run(
          `CALL dbms.components() YIELD name, versions
           WITH head(versions) as version
           MATCH (n) WITH count(n) as nodeCount, version
           MATCH ()-[r]-() WITH nodeCount, count(r) as relCount, version
           RETURN nodeCount, relCount, version`
        );

        const record = result.records[0];
        return {
          status: 'healthy',
          connected: true,
          version: record?.get('version') || 'unknown',
          nodeCount: record?.get('nodeCount')?.toNumber() || 0,
          relationshipCount: record?.get('relCount')?.toNumber() || 0
        };
      } finally {
        await session.close();
      }
    } catch (error) {
      logger.error('Neo4j health check failed:', error);
      return {
        status: 'unhealthy',
        connected: false
      };
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      if (this.driver) {
        await this.driver.close();
        this.driver = null;
      }
      this.isInitialized = false;
      logger.info('GraphDatabaseService connections closed');
    } catch (error) {
      logger.error('Error closing GraphDatabaseService connections:', error);
    }
  }
}

// Export default instance
export default new GraphDatabaseService();