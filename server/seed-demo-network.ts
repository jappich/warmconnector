import { db } from './db';
import { persons, relationships, type InsertPerson, type InsertRelationship } from '../shared/schema';

/**
 * Seed demo network data for testing connection pathfinding
 */
export async function seedDemoNetworkData() {
  try {
    console.log('Seeding demo network data...');

    // Sample persons for demo
    const demoPersons: InsertPerson[] = [
      {
        id: 'alex-johnson',
        name: 'Alex Johnson',
        email: 'alex@techcorp.com',
        company: 'TechCorp Solutions',
        title: 'Senior Engineer',
        userId: 1
      },
      {
        id: 'sarah-chen',
        name: 'Sarah Chen',
        email: 'sarah@microsoft.com',
        company: 'Microsoft',
        title: 'Product Manager',
        userId: null
      },
      {
        id: 'mike-rodriguez',
        name: 'Mike Rodriguez',
        email: 'mike@google.com',
        company: 'Google',
        title: 'Software Engineer',
        userId: null
      },
      {
        id: 'emma-wilson',
        name: 'Emma Wilson',
        email: 'emma@linkedin.com',
        company: 'LinkedIn',
        title: 'VP Engineering',
        userId: null
      },
      {
        id: 'david-brown',
        name: 'David Brown',
        email: 'david@salesforce.com',
        company: 'Salesforce',
        title: 'Director of Sales',
        userId: null
      },
      {
        id: 'lisa-kim',
        name: 'Lisa Kim',
        email: 'lisa@apple.com',
        company: 'Apple',
        title: 'Senior Designer',
        userId: null
      },
      {
        id: 'john-smith',
        name: 'John Smith',
        email: 'john@startup.com',
        company: 'InnovateCorp',
        title: 'Founder & CEO',
        userId: null
      }
    ];

    // Insert persons (ignore conflicts)
    for (const person of demoPersons) {
      try {
        await db.insert(persons).values(person).onConflictDoNothing();
      } catch (error) {
        // Ignore duplicate key errors
        console.log(`Person ${person.name} already exists, skipping...`);
      }
    }

    // Sample relationships for demo network
    const demoRelationships: InsertRelationship[] = [
      // Alex's connections
      {
        fromPersonId: 'alex-johnson',
        toPersonId: 'sarah-chen',
        type: 'colleague',
        strength: 8
      },
      {
        fromPersonId: 'alex-johnson',
        toPersonId: 'mike-rodriguez',
        type: 'university',
        strength: 6
      },
      
      // Sarah's connections
      {
        fromPersonId: 'sarah-chen',
        toPersonId: 'emma-wilson',
        type: 'professional',
        strength: 9
      },
      {
        fromPersonId: 'sarah-chen',
        toPersonId: 'david-brown',
        type: 'conference',
        strength: 5
      },
      
      // Mike's connections
      {
        fromPersonId: 'mike-rodriguez',
        toPersonId: 'lisa-kim',
        type: 'university',
        strength: 7
      },
      {
        fromPersonId: 'mike-rodriguez',
        toPersonId: 'john-smith',
        type: 'mentor',
        strength: 9
      },
      
      // Emma's connections
      {
        fromPersonId: 'emma-wilson',
        toPersonId: 'john-smith',
        type: 'investor',
        strength: 8
      },
      
      // Create reverse relationships for undirected graph
      {
        fromPersonId: 'sarah-chen',
        toPersonId: 'alex-johnson',
        type: 'colleague',
        strength: 8
      },
      {
        fromPersonId: 'mike-rodriguez',
        toPersonId: 'alex-johnson',
        type: 'university',
        strength: 6
      },
      {
        fromPersonId: 'emma-wilson',
        toPersonId: 'sarah-chen',
        type: 'professional',
        strength: 9
      },
      {
        fromPersonId: 'david-brown',
        toPersonId: 'sarah-chen',
        type: 'conference',
        strength: 5
      },
      {
        fromPersonId: 'lisa-kim',
        toPersonId: 'mike-rodriguez',
        type: 'university',
        strength: 7
      },
      {
        fromPersonId: 'john-smith',
        toPersonId: 'mike-rodriguez',
        type: 'mentor',
        strength: 9
      },
      {
        fromPersonId: 'john-smith',
        toPersonId: 'emma-wilson',
        type: 'investor',
        strength: 8
      }
    ];

    // Insert relationships (ignore conflicts)
    for (const relationship of demoRelationships) {
      try {
        await db.insert(relationships).values(relationship).onConflictDoNothing();
      } catch (error) {
        // Ignore duplicate relationship errors
        console.log(`Relationship ${relationship.fromPersonId} -> ${relationship.toPersonId} already exists, skipping...`);
      }
    }

    console.log('Demo network data seeded successfully!');
    console.log(`Added ${demoPersons.length} persons and ${demoRelationships.length} relationships`);
    
    return { 
      personsAdded: demoPersons.length, 
      relationshipsAdded: demoRelationships.length 
    };

  } catch (error) {
    console.error('Error seeding demo network data:', error);
    throw error;
  }
}