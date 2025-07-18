import { db } from '../db';
import { persons, relationships } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export interface UserProfile {
  oktaId: string;
  name: string;
  email: string;
  company?: string;
  socialProfiles?: Array<{ provider: string; url: string; handle?: string }>;
  education?: Array<{ school: string; degree: string; year: number }>;
  greekLife?: { org: string; chapter: string; role: string };
  family?: Array<{ name: string; relation: string; oktaId?: string }>;
  hometowns?: Array<{ city: string; state: string; country: string }>;
  directory?: string[];
}

export class GraphIngestionService {
  private adjacencyMap = new Map<string, Array<{ id: string; type: string; data: any }>>();
  
  /**
   * Rebuild the entire graph with all relationship types
   */
  async rebuildGraph(): Promise<void> {
    console.log('Starting comprehensive graph rebuild...');
    
    // Clear adjacency map
    this.adjacencyMap.clear();
    
    // Get all users with their profile data
    const allPersons = await db.select().from(persons);
    
    // Clear existing relationships
    await db.delete(relationships);
    
    // Process each relationship type
    await this.ingestCoworkerRelationships(allPersons);
    await this.ingestEducationRelationships(allPersons);
    await this.ingestGreekLifeRelationships(allPersons);
    await this.ingestHometownRelationships(allPersons);
    await this.ingestFamilyRelationships(allPersons);
    await this.ingestSocialTieRelationships(allPersons);
    
    console.log('Graph rebuild complete');
  }
  
  /**
   * Get adjacency map for BFS pathfinding
   */
  getAdjacencyMap(): Map<string, Array<{ id: string; type: string; data: any }>> {
    return this.adjacencyMap;
  }
  
  /**
   * Ingest coworker relationships
   */
  private async ingestCoworkerRelationships(allPersons: any[]): Promise<void> {
    const companyGroups = new Map<string, any[]>();
    
    // Group by company
    allPersons.forEach(person => {
      if (person.company) {
        if (!companyGroups.has(person.company)) {
          companyGroups.set(person.company, []);
        }
        companyGroups.get(person.company)!.push(person);
      }
    });
    
    // Create relationships within each company
    for (const company of companyGroups.keys()) {
      const colleagues = companyGroups.get(company)!;
      for (let i = 0; i < colleagues.length; i++) {
        for (let j = i + 1; j < colleagues.length; j++) {
          await this.createBidirectionalRelationship(
            colleagues[i].id,
            colleagues[j].id,
            'coworker',
            { company }
          );
        }
      }
    }
    
    console.log(`Created coworker relationships for ${companyGroups.size} companies`);
  }
  
  /**
   * Ingest education relationships
   */
  private async ingestEducationRelationships(allPersons: any[]): Promise<void> {
    const schoolGroups = new Map<string, any[]>();
    
    // Group by school from education array
    allPersons.forEach(person => {
      const education = this.extractEducationFromMetadata(person);
      if (education && education.length > 0) {
        education.forEach((edu: any) => {
          if (edu.school) {
            if (!schoolGroups.has(edu.school)) {
              schoolGroups.set(edu.school, []);
            }
            schoolGroups.get(edu.school)!.push({ person, education: edu });
          }
        });
      }
    });
    
    // Create relationships within each school
    for (const school of schoolGroups.keys()) {
      const alumni = schoolGroups.get(school)!;
      for (let i = 0; i < alumni.length; i++) {
        for (let j = i + 1; j < alumni.length; j++) {
          await this.createBidirectionalRelationship(
            alumni[i].person.id,
            alumni[j].person.id,
            'school',
            { 
              school,
              degree1: alumni[i].education.degree,
              degree2: alumni[j].education.degree,
              year1: alumni[i].education.year,
              year2: alumni[j].education.year
            }
          );
        }
      }
    }
    
    console.log(`Created school relationships for ${schoolGroups.size} schools`);
  }
  
  /**
   * Ingest Greek life relationships
   */
  private async ingestGreekLifeRelationships(allPersons: any[]): Promise<void> {
    const greekGroups = new Map<string, any[]>();
    
    allPersons.forEach(person => {
      const greekLife = this.extractGreekLifeFromMetadata(person);
      if (greekLife) {
        const key = `${greekLife.org}_${greekLife.chapter}`;
        if (!greekGroups.has(key)) {
          greekGroups.set(key, []);
        }
        greekGroups.get(key)!.push({ person, greekLife });
      }
    });
    
    // Create relationships within each Greek organization
    for (const [orgKey, members] of greekGroups.entries()) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          await this.createBidirectionalRelationship(
            members[i].person.id,
            members[j].person.id,
            'fraternity',
            { 
              org: members[i].greekLife.org,
              chapter: members[i].greekLife.chapter
            }
          );
        }
      }
    }
    
    console.log(`Created Greek life relationships for ${greekGroups.size} organizations`);
  }
  
  /**
   * Ingest hometown relationships
   */
  private async ingestHometownRelationships(allPersons: any[]): Promise<void> {
    const hometownGroups = new Map<string, any[]>();
    
    allPersons.forEach(person => {
      const hometown = this.extractHometownFromMetadata(person);
      if (hometown) {
        const key = `${hometown.city}_${hometown.state}_${hometown.country}`;
        if (!hometownGroups.has(key)) {
          hometownGroups.set(key, []);
        }
        hometownGroups.get(key)!.push(person);
      }
    });
    
    // Create relationships within each hometown
    for (const [locationKey, residents] of hometownGroups.entries()) {
      for (let i = 0; i < residents.length; i++) {
        for (let j = i + 1; j < residents.length; j++) {
          const [city, state, country] = locationKey.split('_');
          await this.createBidirectionalRelationship(
            residents[i].id,
            residents[j].id,
            'hometown',
            { city, state, country }
          );
        }
      }
    }
    
    console.log(`Created hometown relationships for ${hometownGroups.size} locations`);
  }
  
  /**
   * Ingest family relationships
   */
  private async ingestFamilyRelationships(allPersons: any[]): Promise<void> {
    // For demo purposes, create some family ties based on similar names
    let familyConnections = 0;
    
    for (let i = 0; i < allPersons.length; i++) {
      for (let j = i + 1; j < allPersons.length; j++) {
        const person1 = allPersons[i];
        const person2 = allPersons[j];
        
        // Simple heuristic: if last names match, they might be family
        const lastName1 = person1.name?.split(' ').pop()?.toLowerCase();
        const lastName2 = person2.name?.split(' ').pop()?.toLowerCase();
        
        if (lastName1 && lastName2 && lastName1 === lastName2 && Math.random() < 0.1) {
          await this.createBidirectionalRelationship(
            person1.id,
            person2.id,
            'family',
            { relation: 'sibling' }
          );
          familyConnections++;
        }
      }
    }
    
    console.log(`Created ${familyConnections} family relationships`);
  }
  
  /**
   * Ingest social media tie relationships
   */
  private async ingestSocialTieRelationships(allPersons: any[]): Promise<void> {
    // For demo purposes, create some social connections based on similar industries
    let socialConnections = 0;
    
    for (let i = 0; i < allPersons.length; i++) {
      for (let j = i + 1; j < allPersons.length; j++) {
        const person1 = allPersons[i];
        const person2 = allPersons[j];
        
        // If they're in similar industries or have LinkedIn mentions, create social tie
        if (person1.company && person2.company && 
            person1.company !== person2.company &&
            Math.random() < 0.05) {
          await this.createBidirectionalRelationship(
            person1.id,
            person2.id,
            'social',
            { provider: 'linkedin', platform: 'professional_network' }
          );
          socialConnections++;
        }
      }
    }
    
    console.log(`Created ${socialConnections} social tie relationships`);
  }
  
  /**
   * Create bidirectional relationship between two persons
   */
  private async createBidirectionalRelationship(
    person1Id: string, 
    person2Id: string, 
    type: string, 
    metadata: any
  ): Promise<void> {
    const relationshipData = {
      fromPersonId: person1Id,
      toPersonId: person2Id,
      type,
      strength: this.calculateRelationshipStrength(type),
      metadata: JSON.stringify(metadata),
      createdAt: new Date()
    };
    
    // Create relationship in both directions
    await db.insert(relationships).values([
      relationshipData,
      {
        ...relationshipData,
        fromPersonId: person2Id,
        toPersonId: person1Id
      }
    ]);
  }
  
  /**
   * Calculate relationship strength based on type
   */
  private calculateRelationshipStrength(type: string): number {
    const strengthMap: Record<string, number> = {
      'family': 0.9,
      'coworker': 0.7,
      'fraternity': 0.8,
      'school': 0.6,
      'hometown': 0.4,
      'social': 0.3
    };
    
    return strengthMap[type] || 0.5;
  }
  
  /**
   * Extract school information from person metadata
   */
  private extractSchoolFromMetadata(person: any): string | null {
    // Try to extract school from title or other fields
    if (person.title?.toLowerCase().includes('university')) {
      return person.title;
    }
    if (person.title?.toLowerCase().includes('college')) {
      return person.title;
    }
    // Add more extraction logic based on your data structure
    return null;
  }
  
  /**
   * Extract Greek life information from person metadata
   */
  private extractGreekLifeFromMetadata(person: any): any | null {
    // For demo purposes, randomly assign some Greek life affiliations
    const greekOrgs = ['Alpha Beta Gamma', 'Delta Epsilon Zeta', 'Eta Theta Iota'];
    if (Math.random() < 0.1) { // 10% chance of Greek life
      return {
        org: greekOrgs[Math.floor(Math.random() * greekOrgs.length)],
        chapter: 'Beta Chapter'
      };
    }
    return null;
  }
  
  /**
   * Extract hometown information from person metadata
   */
  private extractHometownFromMetadata(person: any): any | null {
    // For demo purposes, assign random hometowns
    const hometowns = [
      { city: 'New York', state: 'NY', country: 'USA' },
      { city: 'Los Angeles', state: 'CA', country: 'USA' },
      { city: 'Chicago', state: 'IL', country: 'USA' },
      { city: 'Houston', state: 'TX', country: 'USA' },
      { city: 'Atlanta', state: 'GA', country: 'USA' }
    ];
    
    if (Math.random() < 0.8) { // 80% chance of having hometown data
      return hometowns[Math.floor(Math.random() * hometowns.length)];
    }
    return null;
  }
}

export const graphIngestionService = new GraphIngestionService();