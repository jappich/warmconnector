import { MongoClient } from 'mongodb';

interface UserProfile {
  oktaId: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  location?: string;
  socialProfiles?: Array<{ provider: string; url: string }>;
  education?: Array<{ school: string; degree: string; year: number; major?: string }>;
  greekLife?: { org: string; chapter: string; role: string; years?: string };
  hometowns?: Array<{ city: string; state: string; country: string }>;
  family?: Array<{ oktaId: string; relation: string; name: string; email: string }>;
  directory?: Array<{ oktaId: string; name: string; email: string; title?: string }>;
  demo?: boolean;
}

interface NetworkEdge {
  fromId: string;
  toId: string;
  type: string;
  data: Record<string, any>;
  strength: number;
}

export class EnhancedGraphIngestionService {
  private mongoClient: MongoClient | null = null;
  private adjacencyMap: Map<string, Array<{ id: string; type: string; data: any; strength: number }>> = new Map();

  async initialize() {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    this.mongoClient = new MongoClient(process.env.MONGODB_URI);
    await this.mongoClient.connect();
    console.log('Enhanced Graph Ingestion Service connected to MongoDB');
  }

  async rebuildEnhancedGraph(): Promise<{ nodes: number; edges: number; types: Record<string, number> }> {
    if (!this.mongoClient) {
      await this.initialize();
    }

    console.log('Starting enhanced graph rebuild...');
    
    const db = this.mongoClient!.db();
    const collection = db.collection('userprofiles');
    
    // Clear existing adjacency map
    this.adjacencyMap.clear();
    
    // Fetch all user profiles
    const profiles = await collection.find({}).toArray() as UserProfile[];
    console.log(`Processing ${profiles.length} user profiles`);
    
    // Initialize adjacency map with all users
    profiles.forEach(profile => {
      this.adjacencyMap.set(profile.oktaId, []);
    });
    
    const edgeStats = {
      coworker: 0,
      family: 0,
      education: 0,
      greekLife: 0,
      hometown: 0,
      social: 0
    };
    
    // Process each relationship type
    await this.processCoworkerConnections(profiles, edgeStats);
    await this.processFamilyConnections(profiles, edgeStats);
    await this.processEducationConnections(profiles, edgeStats);
    await this.processGreekLifeConnections(profiles, edgeStats);
    await this.processHometownConnections(profiles, edgeStats);
    await this.processSocialConnections(profiles, edgeStats);
    
    const totalNodes = this.adjacencyMap.size;
    const totalEdges = Object.values(edgeStats).reduce((sum, count) => sum + count, 0);
    
    console.log('Enhanced graph rebuild completed:', {
      nodes: totalNodes,
      edges: totalEdges,
      types: edgeStats
    });
    
    return { nodes: totalNodes, edges: totalEdges, types: edgeStats };
  }

  private async processCoworkerConnections(profiles: UserProfile[], stats: Record<string, number>) {
    console.log('Processing coworker connections...');
    
    // Group profiles by company
    const companiesMap = new Map<string, UserProfile[]>();
    
    profiles.forEach(profile => {
      if (profile.company) {
        if (!companiesMap.has(profile.company)) {
          companiesMap.set(profile.company, []);
        }
        companiesMap.get(profile.company)!.push(profile);
      }
    });
    
    // Create bidirectional coworker connections
    for (const [company, employees] of companiesMap.entries()) {
      for (let i = 0; i < employees.length; i++) {
        for (let j = i + 1; j < employees.length; j++) {
          const emp1 = employees[i];
          const emp2 = employees[j];
          
          this.addBidirectionalEdge(
            emp1.oktaId,
            emp2.oktaId,
            'coworker',
            { company, title1: emp1.title, title2: emp2.title },
            0.7
          );
          
          stats.coworker += 2; // Count both directions
        }
      }
    }
    
    console.log(`Created ${stats.coworker} coworker connections`);
  }

  private async processFamilyConnections(profiles: UserProfile[], stats: Record<string, number>) {
    console.log('Processing family connections...');
    
    profiles.forEach(profile => {
      if (profile.family && profile.family.length > 0) {
        profile.family.forEach(familyMember => {
          // Add family edge with high strength
          this.addEdge(
            profile.oktaId,
            familyMember.oktaId,
            'family',
            { relation: familyMember.relation },
            0.9
          );
          
          stats.family++;
        });
      }
    });
    
    console.log(`Created ${stats.family} family connections`);
  }

  private async processEducationConnections(profiles: UserProfile[], stats: Record<string, number>) {
    console.log('Processing education connections...');
    
    // Group profiles by school
    const schoolsMap = new Map<string, UserProfile[]>();
    
    profiles.forEach(profile => {
      if (profile.education && profile.education.length > 0) {
        profile.education.forEach(edu => {
          const schoolKey = edu.school.toLowerCase().trim();
          if (!schoolsMap.has(schoolKey)) {
            schoolsMap.set(schoolKey, []);
          }
          schoolsMap.get(schoolKey)!.push(profile);
        });
      }
    });
    
    // Create bidirectional education connections
    for (const [school, alumni] of schoolsMap.entries()) {
      for (let i = 0; i < alumni.length; i++) {
        for (let j = i + 1; j < alumni.length; j++) {
          const alum1 = alumni[i];
          const alum2 = alumni[j];
          
          // Find the education records for this school
          const edu1 = alum1.education?.find(e => e.school.toLowerCase().trim() === school);
          const edu2 = alum2.education?.find(e => e.school.toLowerCase().trim() === school);
          
          this.addBidirectionalEdge(
            alum1.oktaId,
            alum2.oktaId,
            'education',
            { 
              school: edu1?.school || school,
              year1: edu1?.year,
              year2: edu2?.year,
              degree1: edu1?.degree,
              degree2: edu2?.degree
            },
            0.6
          );
          
          stats.education += 2;
        }
      }
    }
    
    console.log(`Created ${stats.education} education connections`);
  }

  private async processGreekLifeConnections(profiles: UserProfile[], stats: Record<string, number>) {
    console.log('Processing Greek life connections...');
    
    // Group profiles by Greek organization and chapter
    const greekMap = new Map<string, UserProfile[]>();
    
    profiles.forEach(profile => {
      if (profile.greekLife) {
        const greekKey = `${profile.greekLife.org}:${profile.greekLife.chapter}`.toLowerCase();
        if (!greekMap.has(greekKey)) {
          greekMap.set(greekKey, []);
        }
        greekMap.get(greekKey)!.push(profile);
      }
    });
    
    // Create bidirectional Greek life connections
    for (const [greekKey, members] of greekMap.entries()) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const member1 = members[i];
          const member2 = members[j];
          
          this.addBidirectionalEdge(
            member1.oktaId,
            member2.oktaId,
            'greekLife',
            {
              org: member1.greekLife!.org,
              chapter: member1.greekLife!.chapter,
              role1: member1.greekLife!.role,
              role2: member2.greekLife!.role
            },
            0.8
          );
          
          stats.greekLife += 2;
        }
      }
    }
    
    console.log(`Created ${stats.greekLife} Greek life connections`);
  }

  private async processHometownConnections(profiles: UserProfile[], stats: Record<string, number>) {
    console.log('Processing hometown connections...');
    
    // Group profiles by hometown
    const hometownMap = new Map<string, UserProfile[]>();
    
    profiles.forEach(profile => {
      if (profile.hometowns && profile.hometowns.length > 0) {
        profile.hometowns.forEach(hometown => {
          const hometownKey = `${hometown.city}:${hometown.state}:${hometown.country}`.toLowerCase();
          if (!hometownMap.has(hometownKey)) {
            hometownMap.set(hometownKey, []);
          }
          hometownMap.get(hometownKey)!.push(profile);
        });
      }
    });
    
    // Create bidirectional hometown connections
    for (const [hometownKey, residents] of hometownMap.entries()) {
      for (let i = 0; i < residents.length; i++) {
        for (let j = i + 1; j < residents.length; j++) {
          const resident1 = residents[i];
          const resident2 = residents[j];
          
          // Find the hometown record
          const hometown = resident1.hometowns?.find(h => 
            `${h.city}:${h.state}:${h.country}`.toLowerCase() === hometownKey
          );
          
          this.addBidirectionalEdge(
            resident1.oktaId,
            resident2.oktaId,
            'hometown',
            {
              city: hometown?.city,
              state: hometown?.state,
              country: hometown?.country
            },
            0.5
          );
          
          stats.hometown += 2;
        }
      }
    }
    
    console.log(`Created ${stats.hometown} hometown connections`);
  }

  private async processSocialConnections(profiles: UserProfile[], stats: Record<string, number>) {
    console.log('Processing social media connections...');
    
    // Group profiles by social media platform and URL
    const socialMap = new Map<string, UserProfile[]>();
    
    profiles.forEach(profile => {
      if (profile.socialProfiles && profile.socialProfiles.length > 0) {
        profile.socialProfiles.forEach(social => {
          const socialKey = `${social.provider}:${social.url}`.toLowerCase();
          if (!socialMap.has(socialKey)) {
            socialMap.set(socialKey, []);
          }
          socialMap.get(socialKey)!.push(profile);
        });
      }
    });
    
    // Create bidirectional social connections
    for (const [socialKey, users] of socialMap.entries()) {
      if (users.length > 1) {
        const [provider, url] = socialKey.split(':');
        
        for (let i = 0; i < users.length; i++) {
          for (let j = i + 1; j < users.length; j++) {
            const user1 = users[i];
            const user2 = users[j];
            
            this.addBidirectionalEdge(
              user1.oktaId,
              user2.oktaId,
              'social',
              { provider, url },
              0.4
            );
            
            stats.social += 2;
          }
        }
      }
    }
    
    console.log(`Created ${stats.social} social media connections`);
  }

  private addEdge(fromId: string, toId: string, type: string, data: any, strength: number) {
    if (!this.adjacencyMap.has(fromId)) {
      this.adjacencyMap.set(fromId, []);
    }
    
    const neighbors = this.adjacencyMap.get(fromId)!;
    
    // Check if edge already exists
    const existingEdge = neighbors.find(n => n.id === toId && n.type === type);
    if (!existingEdge) {
      neighbors.push({ id: toId, type, data, strength });
    }
  }

  private addBidirectionalEdge(id1: string, id2: string, type: string, data: any, strength: number) {
    this.addEdge(id1, id2, type, data, strength);
    this.addEdge(id2, id1, type, data, strength);
  }

  getAdjacencyMap(): Map<string, Array<{ id: string; type: string; data: any; strength: number }>> {
    return this.adjacencyMap;
  }

  async findShortestPath(fromId: string, toId: string): Promise<Array<{ id: string; name: string; type?: string; data?: any }> | null> {
    if (!this.adjacencyMap.has(fromId) || !this.adjacencyMap.has(toId)) {
      return null;
    }

    const queue: Array<{ id: string; path: Array<{ id: string; name: string; type?: string; data?: any }> }> = [];
    const visited = new Set<string>();
    
    queue.push({ id: fromId, path: [{ id: fromId, name: 'Start' }] });
    visited.add(fromId);
    
    while (queue.length > 0) {
      const { id: currentId, path } = queue.shift()!;
      
      if (currentId === toId) {
        return path;
      }
      
      const neighbors = this.adjacencyMap.get(currentId) || [];
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push({
            id: neighbor.id,
            path: [...path, { 
              id: neighbor.id, 
              name: neighbor.id, // Would need to lookup actual name
              type: neighbor.type,
              data: neighbor.data
            }]
          });
        }
      }
    }
    
    return null;
  }

  async close() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }
}

export const enhancedGraphIngestionService = new EnhancedGraphIngestionService();