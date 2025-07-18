import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, and, or } from 'drizzle-orm';

export interface ConnectionStrengthResult {
  strength: number;
  factors: {
    baseRelationshipStrength: number;
    companyOverlap: number;
    educationOverlap: number;
    locationOverlap: number;
    mutualConnections: number;
    totalBonus: number;
  };
}

export class ConnectionStrengthService {
  
  // Base relationship type strengths
  private readonly RELATIONSHIP_STRENGTHS = {
    'FAMILY': 85,
    'COWORKER': 60,
    'SCHOOL': 50,
    'FRAT': 40,
    'SOCIAL': 35,
    'HOMETOWN': 25
  };

  // Bonus point values
  private readonly BONUS_POINTS = {
    COMPANY_OVERLAP: 15,
    EDUCATION_OVERLAP: 10,
    LOCATION_OVERLAP: 8,
    MUTUAL_CONNECTION: 1
  };

  async calculateConnectionStrength(fromPersonId: string, toPersonId: string): Promise<ConnectionStrengthResult> {
    try {
      // Get person details
      const [person1] = await db.select().from(persons).where(eq(persons.id, fromPersonId));
      const [person2] = await db.select().from(persons).where(eq(persons.id, toPersonId));

      if (!person1 || !person2) {
        throw new Error('Person not found');
      }

      // Get direct relationship
      const [relationship] = await db.select()
        .from(relationships)
        .where(
          or(
            and(eq(relationships.fromPersonId, fromPersonId), eq(relationships.toPersonId, toPersonId)),
            and(eq(relationships.fromPersonId, toPersonId), eq(relationships.toPersonId, fromPersonId))
          )
        );

      // Base relationship strength
      const baseStrength = relationship 
        ? this.RELATIONSHIP_STRENGTHS[relationship.relationshipType as keyof typeof this.RELATIONSHIP_STRENGTHS] || 30
        : 0;

      // Calculate bonuses
      const companyBonus = this.calculateCompanyOverlap(person1, person2);
      const educationBonus = this.calculateEducationOverlap(person1, person2);
      const locationBonus = this.calculateLocationOverlap(person1, person2);
      const mutualBonus = await this.calculateMutualConnections(fromPersonId, toPersonId);

      const totalBonus = companyBonus + educationBonus + locationBonus + mutualBonus;
      const finalStrength = Math.min(100, Math.max(0, baseStrength + totalBonus));

      return {
        strength: finalStrength,
        factors: {
          baseRelationshipStrength: baseStrength,
          companyOverlap: companyBonus,
          educationOverlap: educationBonus,
          locationOverlap: locationBonus,
          mutualConnections: mutualBonus,
          totalBonus: totalBonus
        }
      };
    } catch (error) {
      console.error('Error calculating connection strength:', error);
      return {
        strength: 0,
        factors: {
          baseRelationshipStrength: 0,
          companyOverlap: 0,
          educationOverlap: 0,
          locationOverlap: 0,
          mutualConnections: 0,
          totalBonus: 0
        }
      };
    }
  }

  private calculateCompanyOverlap(person1: any, person2: any): number {
    if (!person1.company || !person2.company) return 0;
    
    if (person1.company.toLowerCase() === person2.company.toLowerCase()) {
      return this.BONUS_POINTS.COMPANY_OVERLAP;
    }
    
    return 0;
  }

  private calculateEducationOverlap(person1: any, person2: any): number {
    if (!person1.education || !person2.education) return 0;
    
    const education1 = Array.isArray(person1.education) ? person1.education : [person1.education];
    const education2 = Array.isArray(person2.education) ? person2.education : [person2.education];
    
    for (const edu1 of education1) {
      for (const edu2 of education2) {
        if (edu1.school && edu2.school && 
            edu1.school.toLowerCase() === edu2.school.toLowerCase()) {
          return this.BONUS_POINTS.EDUCATION_OVERLAP;
        }
      }
    }
    
    return 0;
  }

  private calculateLocationOverlap(person1: any, person2: any): number {
    if (!person1.location || !person2.location) return 0;
    
    if (person1.location.toLowerCase() === person2.location.toLowerCase()) {
      return this.BONUS_POINTS.LOCATION_OVERLAP;
    }
    
    // Check hometowns
    const hometowns1 = Array.isArray(person1.hometowns) ? person1.hometowns : [];
    const hometowns2 = Array.isArray(person2.hometowns) ? person2.hometowns : [];
    
    for (const hometown1 of hometowns1) {
      for (const hometown2 of hometowns2) {
        if (hometown1.city && hometown2.city &&
            hometown1.city.toLowerCase() === hometown2.city.toLowerCase() &&
            hometown1.state && hometown2.state &&
            hometown1.state.toLowerCase() === hometown2.state.toLowerCase()) {
          return this.BONUS_POINTS.LOCATION_OVERLAP;
        }
      }
    }
    
    return 0;
  }

  private async calculateMutualConnections(personId1: string, personId2: string): Promise<number> {
    try {
      // Get all connections for person1
      const person1Connections = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, personId1),
            eq(relationships.toPersonId, personId1)
          )
        );

      // Get all connections for person2
      const person2Connections = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, personId2),
            eq(relationships.toPersonId, personId2)
          )
        );

      // Extract connected person IDs
      const person1ConnectedIds = new Set<string>();
      for (const rel of person1Connections) {
        if (rel.fromPersonId !== personId1) person1ConnectedIds.add(rel.fromPersonId);
        if (rel.toPersonId !== personId1) person1ConnectedIds.add(rel.toPersonId);
      }

      const person2ConnectedIds = new Set<string>();
      for (const rel of person2Connections) {
        if (rel.fromPersonId !== personId2) person2ConnectedIds.add(rel.fromPersonId);
        if (rel.toPersonId !== personId2) person2ConnectedIds.add(rel.toPersonId);
      }

      // Count mutual connections
      let mutualCount = 0;
      for (const id of person1ConnectedIds) {
        if (person2ConnectedIds.has(id)) {
          mutualCount++;
        }
      }

      return mutualCount * this.BONUS_POINTS.MUTUAL_CONNECTION;
    } catch (error) {
      console.error('Error calculating mutual connections:', error);
      return 0;
    }
  }

  async calculatePathStrength(path: string[]): Promise<number> {
    if (path.length < 2) return 0;

    let totalStrength = 0;
    const connectionCount = path.length - 1;

    for (let i = 0; i < connectionCount; i++) {
      const strengthResult = await this.calculateConnectionStrength(path[i], path[i + 1]);
      totalStrength += strengthResult.strength;
    }

    // Return average strength across all connections in path
    return Math.round(totalStrength / connectionCount);
  }

  async findStrongestConnections(personId: string, limit: number = 10): Promise<Array<{
    personId: string;
    name: string;
    company?: string;
    strength: number;
    relationshipType: string;
  }>> {
    try {
      // Get all relationships for this person
      const relationships = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, personId),
            eq(relationships.toPersonId, personId)
          )
        );

      const strengthResults = [];

      for (const rel of relationships) {
        const otherPersonId = rel.fromPersonId === personId ? rel.toPersonId : rel.fromPersonId;
        const [otherPerson] = await db.select().from(persons).where(eq(persons.id, otherPersonId));
        
        if (otherPerson) {
          const strengthResult = await this.calculateConnectionStrength(personId, otherPersonId);
          strengthResults.push({
            personId: otherPersonId,
            name: otherPerson.name,
            company: otherPerson.company,
            strength: strengthResult.strength,
            relationshipType: rel.relationshipType
          });
        }
      }

      // Sort by strength and return top results
      return strengthResults
        .sort((a, b) => b.strength - a.strength)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding strongest connections:', error);
      return [];
    }
  }
}

export const connectionStrengthService = new ConnectionStrengthService();