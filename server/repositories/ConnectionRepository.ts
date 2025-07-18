import { db } from '../db';
import { persons, relationships, cachedLookups } from '../../shared/schema';
import { eq, and, or, like, sql } from 'drizzle-orm';

export interface ConnectionEvidence {
  source: string;
  evidence: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface ConnectionResult {
  userA_id: string;
  userB_id: string;
  connections: ConnectionEvidence[];
  top_connection_score: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  company?: string;
  title?: string;
  location?: string;
  spouse?: string;
  fraternity?: string;
  hometown?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  github?: string;
  instagram?: string;
  education?: string[];
  interests?: string[];
  [key: string]: any;
}

export class ConnectionRepository {
  
  async findUserProfile(userId: string): Promise<UserProfile | null> {
    const [user] = await db
      .select()
      .from(persons)
      .where(eq(persons.id, userId))
      .limit(1);
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email || undefined,
      company: user.company || undefined,
      title: user.title || undefined,
      location: user.location || undefined,
      spouse: user.spouse || undefined,
      fraternity: user.fraternity || user.greekLife || undefined,
      hometown: user.hometown || undefined,
      linkedin: user.linkedinProfile || user.linkedin || undefined,
      twitter: user.twitterHandle || undefined,
      facebook: user.facebookProfile || undefined,
      github: user.githubProfile || undefined,
      instagram: user.instagramHandle || undefined,
      education: Array.isArray(user.education) ? user.education : user.education ? [user.education] : [],
      interests: Array.isArray(user.interests) ? user.interests : []
    };
  }

  async findDirectFieldMatches(userA: UserProfile, userB: UserProfile): Promise<ConnectionEvidence[]> {
    const connections: ConnectionEvidence[] = [];
    
    // Direct field matches with 100% confidence
    const fieldMappings = [
      { fieldA: 'fraternity', fieldB: 'fraternity', label: 'fraternity' },
      { fieldA: 'company', fieldB: 'company', label: 'current employer' },
      { fieldA: 'hometown', fieldB: 'hometown', label: 'hometown' },
      { fieldA: 'spouse', fieldB: 'spouse', label: 'spouse' }
    ];

    for (const mapping of fieldMappings) {
      const valueA = userA[mapping.fieldA];
      const valueB = userB[mapping.fieldB];
      
      if (valueA && valueB && valueA.toLowerCase() === valueB.toLowerCase()) {
        connections.push({
          source: 'User-Provided Data',
          evidence: `Both list '${valueA}' as ${mapping.label}`,
          score: 1.0,
          metadata: { field: mapping.fieldA, value: valueA }
        });
      }
    }

    // Education overlap
    if (userA.education && userB.education) {
      const commonEducation = userA.education.filter(edu => 
        userB.education!.some(eduB => 
          edu.toLowerCase().includes(eduB.toLowerCase()) || 
          eduB.toLowerCase().includes(edu.toLowerCase())
        )
      );
      
      for (const edu of commonEducation) {
        connections.push({
          source: 'User-Provided Data',
          evidence: `Both attended ${edu}`,
          score: 1.0,
          metadata: { field: 'education', value: edu }
        });
      }
    }

    // Interest overlap
    if (userA.interests && userB.interests) {
      const commonInterests = userA.interests.filter(interest => 
        userB.interests!.some(interestB => 
          interest.toLowerCase() === interestB.toLowerCase()
        )
      );
      
      for (const interest of commonInterests) {
        connections.push({
          source: 'User-Provided Data',
          evidence: `Both interested in ${interest}`,
          score: 0.8,
          metadata: { field: 'interests', value: interest }
        });
      }
    }

    return connections;
  }

  async findExistingRelationships(userAId: string, userBId: string): Promise<ConnectionEvidence[]> {
    const existingRelationships = await db
      .select()
      .from(relationships)
      .where(
        or(
          and(eq(relationships.fromPersonId, userAId), eq(relationships.toPersonId, userBId)),
          and(eq(relationships.fromPersonId, userBId), eq(relationships.toPersonId, userAId))
        )
      );

    return existingRelationships.map((rel: any) => ({
      source: 'Existing Database',
      evidence: `${rel.relationshipType} connection`,
      score: (rel.strength || 70) / 100,
      metadata: { 
        relationshipType: rel.relationshipType,
        strength: rel.strength,
        source: rel.metadata?.source || 'manual'
      }
    }));
  }

  async cacheLookup(
    source: string, 
    query: string, 
    result: any, 
    expiresAt: Date
  ): Promise<void> {
    await db
      .insert(cachedLookups)
      .values({
        source,
        query,
        result,
        expiresAt
      })
      .onConflictDoUpdate({
        target: [cachedLookups.source, cachedLookups.query],
        set: {
          result,
          expiresAt,
          updatedAt: new Date()
        }
      });
  }

  async getCachedLookup(source: string, query: string): Promise<any | null> {
    const [cached] = await db
      .select()
      .from(cachedLookups)
      .where(
        and(
          eq(cachedLookups.source, source),
          eq(cachedLookups.query, query),
          sql`${cachedLookups.expiresAt} > NOW()`
        )
      )
      .limit(1);

    return cached?.result || null;
  }

  async findLocationConnections(userA: UserProfile, userB: UserProfile): Promise<ConnectionEvidence[]> {
    const connections: ConnectionEvidence[] = [];
    
    if (userA.location && userB.location) {
      const locationA = userA.location.toLowerCase();
      const locationB = userB.location.toLowerCase();
      
      // Exact location match
      if (locationA === locationB) {
        connections.push({
          source: 'Location Data',
          evidence: `Both currently in ${userA.location}`,
          score: 0.8,
          metadata: { location: userA.location }
        });
      }
      // City/state overlap
      else if (locationA.includes(locationB) || locationB.includes(locationA)) {
        connections.push({
          source: 'Location Data',
          evidence: `Similar locations: ${userA.location} and ${userB.location}`,
          score: 0.5,
          metadata: { locationA: userA.location, locationB: userB.location }
        });
      }
    }

    return connections;
  }

  async findAllConnections(userAId: string, userBId: string): Promise<ConnectionResult> {
    const userA = await this.findUserProfile(userAId);
    const userB = await this.findUserProfile(userBId);
    
    if (!userA || !userB) {
      return {
        userA_id: userAId,
        userB_id: userBId,
        connections: [],
        top_connection_score: 0
      };
    }

    const allConnections: ConnectionEvidence[] = [];

    // Phase 1: Direct field matches and existing relationships
    const directMatches = await this.findDirectFieldMatches(userA, userB);
    const existingRels = await this.findExistingRelationships(userAId, userBId);
    const locationConnections = await this.findLocationConnections(userA, userB);

    allConnections.push(...directMatches, ...existingRels, ...locationConnections);

    // Sort by score descending
    allConnections.sort((a, b) => b.score - a.score);

    const topScore = allConnections.length > 0 ? allConnections[0].score : 0;

    return {
      userA_id: userAId,
      userB_id: userBId,
      connections: allConnections,
      top_connection_score: topScore
    };
  }
}

export const connectionRepository = new ConnectionRepository();