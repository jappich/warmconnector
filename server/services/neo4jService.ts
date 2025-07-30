import neo4j, { Driver, Session } from 'neo4j-driver';

export class Neo4jService {
  private driver: Driver | null = null;

  constructor() {
    this.initializeDriver();
  }

  private async initializeDriver() {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USER || process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
      console.warn('Neo4j credentials not provided. Graph functionality will be limited.');
      return;
    }

    try {
      // For Neo4j 5.x driver, use the URI directly with proper config
      const config = {
        encrypted: true,
        trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
        maxConnectionPoolSize: 10,
        connectionAcquisitionTimeout: 30000,
        connectionTimeout: 15000
      };

      console.log('Connecting to Neo4j Aura database...');
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password), config);
      
      // Test connection in background to avoid blocking startup
      setTimeout(async () => {
        try {
          const session = this.driver!.session();
          await session.run('RETURN 1 as test');
          await session.close();
          console.log('Neo4j connection verified successfully');
        } catch (testError) {
          console.error('Neo4j connection test failed - using fallback graph service');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to initialize Neo4j driver - using PostgreSQL graph service');
      this.driver = null;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.driver) return false;

    const session = this.driver.session();
    try {
      const result = await session.run('RETURN 1');
      console.log('Neo4j connection successful');
      return true;
    } catch (error) {
      console.error('Neo4j connection verification failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          code: (error as any).code,
          classification: (error as any).classification
        });
      }
      return false;
    } finally {
      await session.close();
    }
  }

  async createPerson(person: {
    id: string;
    name: string;
    email?: string;
    company?: string;
    title?: string;
    platform?: string;
  }) {
    if (!this.driver) throw new Error('Neo4j driver not initialized');

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MERGE (p:Person {id: $id})
        SET p.name = $name,
            p.email = $email,
            p.company = $company,
            p.title = $title,
            p.platform = $platform,
            p.updatedAt = datetime()
        RETURN p
        `,
        person
      );
      return result.records[0]?.get('p').properties;
    } finally {
      await session.close();
    }
  }

  async createRelationship(
    fromPersonId: string,
    toPersonId: string,
    relationshipType: string,
    strength: number = 1.0,
    metadata: Record<string, any> = {}
  ) {
    if (!this.driver) throw new Error('Neo4j driver not initialized');

    const session = this.driver.session();
    try {
      await session.run(
        `
        MATCH (from:Person {id: $fromPersonId})
        MATCH (to:Person {id: $toPersonId})
        MERGE (from)-[r:${relationshipType}]->(to)
        SET r.strength = $strength,
            r.metadata = $metadata,
            r.createdAt = datetime()
        `,
        { fromPersonId, toPersonId, strength, metadata }
      );
    } finally {
      await session.close();
    }
  }

  async findShortestPath(fromPersonId: string, toPersonId: string) {
    if (!this.driver) throw new Error('Neo4j driver not initialized');

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (from:Person {id: $fromPersonId})
        MATCH (to:Person {id: $toPersonId})
        MATCH path = shortestPath((from)-[*..6]-(to))
        RETURN path, length(path) as pathLength,
               [node in nodes(path) | {id: node.id, name: node.name, company: node.company}] as pathNodes,
               [rel in relationships(path) | {type: type(rel), strength: rel.strength}] as pathRelationships
        ORDER BY pathLength ASC
        LIMIT 5
        `,
        { fromPersonId, toPersonId }
      );

      return result.records.map(record => ({
        pathLength: record.get('pathLength').toNumber(),
        nodes: record.get('pathNodes'),
        relationships: record.get('pathRelationships')
      }));
    } finally {
      await session.close();
    }
  }

  async findPathsByName(fromPersonId: string, targetName: string, targetCompany?: string) {
    if (!this.driver) throw new Error('Neo4j driver not initialized');

    const session = this.driver.session();
    try {
      const whereClause = targetCompany 
        ? 'WHERE toLower(to.name) CONTAINS toLower($targetName) AND toLower(to.company) CONTAINS toLower($targetCompany)'
        : 'WHERE toLower(to.name) CONTAINS toLower($targetName)';
        
      const result = await session.run(
        `
        MATCH (from:Person {id: $fromPersonId})
        MATCH (to:Person)
        ${whereClause}
        MATCH path = shortestPath((from)-[*..6]-(to))
        WHERE from <> to
        RETURN path, length(path) as pathLength,
               [node in nodes(path) | {id: node.id, name: node.name, company: node.company, title: node.title}] as pathNodes,
               [rel in relationships(path) | {type: type(rel), strength: rel.strength}] as pathRelationships
        ORDER BY pathLength ASC, to.name ASC
        LIMIT 8
        `,
        { fromPersonId, targetName, targetCompany }
      );

      return result.records.map(record => ({
        pathLength: record.get('pathLength').toNumber(),
        nodes: record.get('pathNodes'),
        relationships: record.get('pathRelationships')
      }));
    } finally {
      await session.close();
    }
  }

  async loadDataFromPostgreSQL() {
    if (!this.driver) throw new Error('Neo4j driver not initialized');
    
    console.log('Loading PostgreSQL data into Neo4j...');
    
    const { db } = await import('../db');
    const schema = await import('../../shared/schema');
    
    // Load persons
    const persons = await db.select().from(schema.persons);
    console.log(`Loading ${persons.length} persons into Neo4j...`);
    
    for (const person of persons) {
      await this.createPerson({
        id: person.id,
        name: person.name,
        email: person.email || '',
        company: person.company || '',
        title: person.title || ''
      });
    }
    
    // Load relationships  
    const relationships = await db.select().from(schema.relationships);
    console.log(`Loading ${relationships.length} relationships into Neo4j...`);
    
    for (const rel of relationships) {
      await this.createRelationship(
        rel.fromId,
        rel.toId,
        rel.type || 'CONNECTED',
        rel.confidenceScore || 50
      );
    }
    
    console.log('Neo4j data loading completed successfully!');
  }

  async findConnectionsAtCompany(companyName: string, targetPersonId?: string) {
    if (!this.driver) throw new Error('Neo4j driver not initialized');

    const session = this.driver.session();
    try {
      let query = `
        MATCH (p:Person)
        WHERE p.company = $companyName
        RETURN p.id as id, p.name as name, p.title as title, p.email as email
        ORDER BY p.name
        LIMIT 50
      `;

      if (targetPersonId) {
        query = `
          MATCH (target:Person {id: $targetPersonId})
          MATCH (p:Person)
          WHERE p.company = $companyName AND p.id <> $targetPersonId
          OPTIONAL MATCH path = shortestPath((target)-[*..4]-(p))
          RETURN p.id as id, p.name as name, p.title as title, p.email as email,
                 CASE WHEN path IS NOT NULL THEN length(path) ELSE null END as connectionDegree
          ORDER BY connectionDegree ASC, p.name
          LIMIT 50
        `;
      }

      const result = await session.run(query, { companyName, targetPersonId });

      return result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        title: record.get('title'),
        email: record.get('email'),
        connectionDegree: record.get('connectionDegree')?.toNumber() || null
      }));
    } finally {
      await session.close();
    }
  }

  async getNetworkStats(personId: string) {
    if (!this.driver) throw new Error('Neo4j driver not initialized');

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH (p)-[r1]-(connected1:Person)
        OPTIONAL MATCH (p)-[*2]-(connected2:Person)
        WHERE connected2.id <> $personId
        OPTIONAL MATCH (p)-[*3]-(connected3:Person)
        WHERE connected3.id <> $personId
        RETURN 
          count(DISTINCT connected1) as directConnections,
          count(DISTINCT connected2) as secondDegreeConnections,
          count(DISTINCT connected3) as thirdDegreeConnections
        `,
        { personId }
      );

      const record = result.records[0];
      return {
        directConnections: record.get('directConnections').toNumber(),
        secondDegreeConnections: record.get('secondDegreeConnections').toNumber(),
        thirdDegreeConnections: record.get('thirdDegreeConnections').toNumber()
      };
    } finally {
      await session.close();
    }
  }

  async findMutualConnections(personId1: string, personId2: string) {
    if (!this.driver) throw new Error('Neo4j driver not initialized');

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p1:Person {id: $personId1})-[]-(mutual:Person)-[]-(p2:Person {id: $personId2})
        WHERE mutual.id <> $personId1 AND mutual.id <> $personId2
        RETURN mutual.id as id, mutual.name as name, mutual.company as company, mutual.title as title
        ORDER BY mutual.name
        LIMIT 20
        `,
        { personId1, personId2 }
      );

      return result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        company: record.get('company'),
        title: record.get('title')
      }));
    } finally {
      await session.close();
    }
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }
}

export const neo4jService = new Neo4jService();