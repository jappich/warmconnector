import { db } from '../db';
import { persons, relationships } from '@shared/schema';

// Create a simple demo data seeding service for the enhanced graph
export class DemoDataService {
  async seedBasicDemoData() {
    try {
      // Clear existing data
      await db.delete(relationships);
      await db.delete(persons);

      // Create 20 demo persons with diverse backgrounds
      const demoPersons = [
        {
          id: 'demo_1',
          name: 'Alice Johnson',
          email: 'alice.johnson@jll.com',
          company: 'JLL',
          title: 'Senior Software Engineer',
          socialProfiles: JSON.stringify([{ provider: 'LinkedIn', handle: 'alice-johnson' }]),
          education: JSON.stringify([{ school: 'Stanford University', degree: 'Computer Science', year: 2018 }]),
          greekLife: JSON.stringify({ org: 'Alpha Phi Alpha', chapter: 'Beta', role: 'Member' }),
          hometowns: JSON.stringify([{ city: 'San Francisco', state: 'CA', country: 'USA' }])
        },
        {
          id: 'demo_2',
          name: 'Bob Smith',
          email: 'bob.smith@microsoft.com',
          company: 'Microsoft',
          title: 'Product Manager',
          socialProfiles: JSON.stringify([{ provider: 'LinkedIn', handle: 'bob-smith' }]),
          education: JSON.stringify([{ school: 'Stanford University', degree: 'Business', year: 2017 }]),
          greekLife: null,
          hometowns: JSON.stringify([{ city: 'Seattle', state: 'WA', country: 'USA' }])
        },
        {
          id: 'demo_3',
          name: 'Carol Davis',
          email: 'carol.davis@google.com',
          company: 'Google',
          title: 'UX Designer',
          socialProfiles: JSON.stringify([{ provider: 'LinkedIn', handle: 'carol-davis' }]),
          education: JSON.stringify([{ school: 'MIT', degree: 'Design', year: 2019 }]),
          greekLife: JSON.stringify({ org: 'Alpha Phi Alpha', chapter: 'Beta', role: 'President' }),
          hometowns: JSON.stringify([{ city: 'San Francisco', state: 'CA', country: 'USA' }])
        },
        {
          id: 'demo_4',
          name: 'David Wilson',
          email: 'david.wilson@jll.com',
          company: 'JLL',
          title: 'Sales Director',
          socialProfiles: JSON.stringify([{ provider: 'LinkedIn', handle: 'david-wilson' }]),
          education: JSON.stringify([{ school: 'Harvard University', degree: 'MBA', year: 2016 }]),
          greekLife: null,
          hometowns: JSON.stringify([{ city: 'Chicago', state: 'IL', country: 'USA' }])
        },
        {
          id: 'demo_5',
          name: 'Emily Brown',
          email: 'emily.brown@apple.com',
          company: 'Apple',
          title: 'Data Scientist',
          socialProfiles: JSON.stringify([{ provider: 'LinkedIn', handle: 'emily-brown' }]),
          education: JSON.stringify([{ school: 'Stanford University', degree: 'Statistics', year: 2020 }]),
          greekLife: null,
          hometowns: JSON.stringify([{ city: 'Austin', state: 'TX', country: 'USA' }])
        }
      ];

      // Insert persons
      await db.insert(persons).values(demoPersons);

      // Create relationships demonstrating different types
      const demoRelationships = [
        // Coworker relationships (Alice and David at JLL)
        {
          fromPersonId: 'demo_1',
          toPersonId: 'demo_4',
          type: 'COWORKER',
          strength: 0.7,
          metadata: JSON.stringify({ company: 'JLL' }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Education relationships (Alice, Bob, Emily all went to Stanford)
        {
          fromPersonId: 'demo_1',
          toPersonId: 'demo_2',
          type: 'EDUCATION',
          strength: 0.5,
          metadata: JSON.stringify({ school: 'Stanford University' }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          fromPersonId: 'demo_1',
          toPersonId: 'demo_5',
          type: 'EDUCATION',
          strength: 0.4,
          metadata: JSON.stringify({ school: 'Stanford University' }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Greek life relationships (Alice and Carol in same organization)
        {
          fromPersonId: 'demo_1',
          toPersonId: 'demo_3',
          type: 'GREEK_LIFE',
          strength: 0.8,
          metadata: JSON.stringify({ org: 'Alpha Phi Alpha', chapter: 'Beta' }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Hometown relationships (Alice and Carol from San Francisco)
        {
          fromPersonId: 'demo_1',
          toPersonId: 'demo_3',
          type: 'HOMETOWN',
          strength: 0.3,
          metadata: JSON.stringify({ city: 'San Francisco', state: 'CA' }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Family relationship (example)
        {
          fromPersonId: 'demo_2',
          toPersonId: 'demo_5',
          type: 'FAMILY',
          strength: 0.9,
          metadata: JSON.stringify({ relation: 'sibling' }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Social relationship
        {
          fromPersonId: 'demo_3',
          toPersonId: 'demo_4',
          type: 'SOCIAL',
          strength: 0.4,
          metadata: JSON.stringify({ platform: 'LinkedIn' }),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Insert relationships
      await db.insert(relationships).values(demoRelationships);

      return {
        persons: demoPersons.length,
        relationships: demoRelationships.length,
        relationshipTypes: ['COWORKER', 'EDUCATION', 'GREEK_LIFE', 'HOMETOWN', 'FAMILY', 'SOCIAL']
      };

    } catch (error) {
      console.error('Error seeding demo data:', error);
      throw error;
    }
  }

  async getNetworkStats() {
    try {
      const [personCount] = await db.select().from(persons);
      const [relationshipCount] = await db.select().from(relationships);
      
      return {
        persons: personCount ? Object.keys(personCount).length : 0,
        relationships: relationshipCount ? Object.keys(relationshipCount).length : 0,
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error('Error getting network stats:', error);
      return { persons: 0, relationships: 0, lastUpdate: new Date() };
    }
  }
}

export const demoDataService = new DemoDataService();