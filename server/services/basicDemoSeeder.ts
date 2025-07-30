import { db } from '../db';
import { persons, relationshipEdges, users } from '../../shared/schema';

export class BasicDemoSeeder {
  async seedBasicNetworkingData(): Promise<{
    personsCreated: number;
    relationshipsCreated: number;
    networkStats: {
      totalConnections: number;
      companiesRepresented: number;
    };
  }> {
    console.log('Seeding basic professional networking data...');

    // Create basic professional profiles
    const professionalProfiles = [
      // Demo user
      {
        id: 'demo_user_1',
        name: 'Alex Morgan',
        email: 'alex.morgan@warmconnector.com',
        company: 'WarmConnector',
        title: 'Product Manager',
        industry: 'Technology',
        location: 'San Francisco, CA'
      },
      // Google employees
      {
        id: 'person_2',
        name: 'Sarah Chen',
        email: 'sarah.chen@google.com',
        company: 'Google',
        title: 'Senior Software Engineer',
        industry: 'Technology',
        location: 'Mountain View, CA'
      },
      {
        id: 'person_3',
        name: 'Michael Rodriguez',
        email: 'michael.rodriguez@google.com',
        company: 'Google',
        title: 'Product Manager',
        industry: 'Technology',
        location: 'Mountain View, CA'
      },
      // Microsoft employees
      {
        id: 'person_4',
        name: 'Emily Watson',
        email: 'emily.watson@microsoft.com',
        company: 'Microsoft',
        title: 'Engineering Manager',
        industry: 'Technology',
        location: 'Seattle, WA'
      },
      {
        id: 'person_5',
        name: 'David Kim',
        email: 'david.kim@microsoft.com',
        company: 'Microsoft',
        title: 'Senior Developer',
        industry: 'Technology',
        location: 'Seattle, WA'
      },
      // Meta employee
      {
        id: 'person_6',
        name: 'Jessica Park',
        email: 'jessica.park@meta.com',
        company: 'Meta',
        title: 'UX Designer',
        industry: 'Technology',
        location: 'Menlo Park, CA'
      }
    ];

    // Insert persons
    for (const person of professionalProfiles) {
      await db.insert(persons).values({
        id: person.id,
        name: person.name,
        email: person.email,
        company: person.company,
        title: person.title,
        industry: person.industry,
        location: person.location,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    }

    // Create basic relationships
    const relationships_data = [
      // Alex (demo_user_1) connections
      {
        fromPersonId: 'demo_user_1',
        toPersonId: 'person_3', // Michael at Google
        type: 'education',
        strength: 80
      },
      {
        fromPersonId: 'demo_user_1',
        toPersonId: 'person_5', // David at Microsoft
        type: 'hometown',
        strength: 60
      },
      // Second-degree connections
      {
        fromPersonId: 'person_3', // Michael at Google
        toPersonId: 'person_2', // Sarah at Google
        type: 'coworker',
        strength: 90
      },
      {
        fromPersonId: 'person_5', // David at Microsoft
        toPersonId: 'person_4', // Emily at Microsoft
        type: 'coworker',
        strength: 85
      },
      {
        fromPersonId: 'person_2', // Sarah at Google
        toPersonId: 'person_6', // Jessica at Meta
        type: 'education',
        strength: 65
      }
    ];

    // Insert relationships
    for (const relationship of relationships_data) {
      await db.insert(relationshipEdges).values({
        fromId: relationship.fromPersonId,
        toId: relationship.toPersonId,
        type: relationship.type,
        confidenceScore: relationship.strength,
        createdAt: new Date(),
      }).onConflictDoNothing();
    }

    // Create demo user record (skip for now due to schema mismatch)
    console.log('User creation skipped due to schema compatibility');

    const companies = new Set(professionalProfiles.map(p => p.company));

    return {
      personsCreated: professionalProfiles.length,
      relationshipsCreated: relationships_data.length,
      networkStats: {
        totalConnections: relationships_data.length,
        companiesRepresented: companies.size
      }
    };
  }
}

export const basicDemoSeeder = new BasicDemoSeeder();