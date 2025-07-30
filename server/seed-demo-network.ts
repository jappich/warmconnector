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
        fromId: 'alex-johnson',
        toId: 'sarah-chen',
        type: 'colleague',
      },
      {
        fromId: 'alex-johnson',
        toId: 'mike-rodriguez',
        type: 'university',
      },
      
      // Sarah's connections
      {
        fromId: 'sarah-chen',
        toId: 'emma-wilson',
        type: 'professional',
      },
      {
        fromId: 'sarah-chen',
        toId: 'david-brown',
        type: 'conference',
      },
      
      // Mike's connections
      {
        fromId: 'mike-rodriguez',
        toId: 'lisa-kim',
        type: 'university',
      },
      {
        fromId: 'mike-rodriguez',
        toId: 'john-smith',
        type: 'mentor',
      },
      
      // Emma's connections
      {
        fromId: 'emma-wilson',
        toId: 'john-smith',
        type: 'investor',
      },
      
      // Create reverse relationships for undirected graph
      {
        fromId: 'sarah-chen',
        toId: 'alex-johnson',
        type: 'colleague',
      },
      {
        fromId: 'mike-rodriguez',
        toId: 'alex-johnson',
        type: 'university',
      },
      {
        fromId: 'emma-wilson',
        toId: 'sarah-chen',
        type: 'professional',
      },
      {
        fromId: 'david-brown',
        toId: 'sarah-chen',
        type: 'conference',
      },
      {
        fromId: 'lisa-kim',
        toId: 'mike-rodriguez',
        type: 'university',
      },
      {
        fromId: 'john-smith',
        toId: 'mike-rodriguez',
        type: 'mentor',
      },
      {
        fromId: 'john-smith',
        toId: 'emma-wilson',
        type: 'investor',
      }
    ];

    // Insert relationships (ignore conflicts)
    for (const relationship of demoRelationships) {
      try {
        await db.insert(relationships).values(relationship).onConflictDoNothing();
      } catch (error) {
        // Ignore duplicate relationship errors
        console.log(`Relationship ${relationship.fromId} -> ${relationship.toId} already exists, skipping...`);
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