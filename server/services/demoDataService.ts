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
          fromId: 'demo_1',
          toId: 'demo_4',
          type: 'COWORKER',
          confidenceScore: 0.7,
          evidence: JSON.stringify({ company: 'JLL' }),
          createdAt: new Date(),
        },
        // Education relationships (Alice, Bob, Emily all went to Stanford)
        {
          fromId: 'demo_1',
          toId: 'demo_2',
          type: 'EDUCATION',
          confidenceScore: 0.5,
          evidence: JSON.stringify({ school: 'Stanford University' }),
          createdAt: new Date(),
        },
        {
          fromId: 'demo_1',
          toId: 'demo_5',
          type: 'EDUCATION',
          confidenceScore: 0.4,
          evidence: JSON.stringify({ school: 'Stanford University' }),
          createdAt: new Date(),
        },
        // Greek life relationships (Alice and Carol in same organization)
        {
          fromId: 'demo_1',
          toId: 'demo_3',
          type: 'GREEK_LIFE',
          confidenceScore: 0.8,
          evidence: JSON.stringify({ org: 'Alpha Phi Alpha', chapter: 'Beta' }),
          createdAt: new Date(),
        },
        // Hometown relationships (Alice and Carol from San Francisco)
        {
          fromId: 'demo_1',
          toId: 'demo_3',
          type: 'HOMETOWN',
          confidenceScore: 0.3,
          evidence: JSON.stringify({ city: 'San Francisco', state: 'CA' }),
          createdAt: new Date(),
        },
        // Family relationship (example)
        {
          fromId: 'demo_2',
          toId: 'demo_5',
          type: 'FAMILY',
          confidenceScore: 0.9,
          evidence: JSON.stringify({ relation: 'sibling' }),
          createdAt: new Date(),
        },
        // Social relationship
        {
          fromId: 'demo_3',
          toId: 'demo_4',
          type: 'SOCIAL',
          confidenceScore: 0.4,
          evidence: JSON.stringify({ platform: 'LinkedIn' }),
          createdAt: new Date(),
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