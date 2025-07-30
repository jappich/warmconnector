import { db } from './db';
import { persons, relationshipEdges as relationships } from '../shared/schema';

/**
 * Seed the database with sample persons and relationships for demo purposes
 */
export async function seedSampleData() {
  try {
    console.log('Seeding sample data...');

    // Sample persons
    const samplePersons = [
      { id: 'user-1', name: 'You', company: 'Your Company', title: 'Your Title', email: 'you@example.com', userId: 1 },
      { id: 'john-smith', name: 'John Smith', company: 'Tech Corp', title: 'Software Engineer', email: 'john@techcorp.com' },
      { id: 'sarah-jones', name: 'Sarah Jones', company: 'Apple Inc', title: 'Product Manager', email: 'sarah@apple.com' },
      { id: 'mike-wilson', name: 'Mike Wilson', company: 'Google', title: 'Engineering Manager', email: 'mike@google.com' },
      { id: 'lisa-brown', name: 'Lisa Brown', company: 'Apple Inc', title: 'Senior Director', email: 'lisa@apple.com' },
      { id: 'tim-cook', name: 'Tim Cook', company: 'Apple Inc', title: 'CEO', email: 'tim@apple.com' },
      { id: 'jane-doe', name: 'Jane Doe', company: 'Microsoft', title: 'Principal Engineer', email: 'jane@microsoft.com' },
      { id: 'bob-miller', name: 'Bob Miller', company: 'Startup X', title: 'CTO', email: 'bob@startupx.com' }
    ];

    // Insert persons (ignore duplicates)
    for (const person of samplePersons) {
      try {
        await db.insert(persons).values(person).onConflictDoNothing();
      } catch (error) {
        // Person already exists, skip
      }
    }

    // Sample relationships
    const sampleRelationships = [
      { fromId: 'user-1', toId: 'john-smith', type: 'coworker', confidenceScore: 8 },
      { fromId: 'john-smith', toId: 'sarah-jones', type: 'college', confidenceScore: 6 },
      { fromId: 'sarah-jones', toId: 'lisa-brown', type: 'coworker', confidenceScore: 9 },
      { fromId: 'lisa-brown', toId: 'tim-cook', type: 'coworker', confidenceScore: 10 },
      { fromId: 'user-1', toId: 'mike-wilson', type: 'friend', confidenceScore: 7 },
      { fromId: 'mike-wilson', toId: 'jane-doe', type: 'college', confidenceScore: 5 },
      { fromId: 'john-smith', toId: 'bob-miller', type: 'friend', confidenceScore: 6 }
    ];

    // Insert relationships
    for (const relationship of sampleRelationships) {
      try {
        await db.insert(relationships).values(relationship);
      } catch (error) {
        // Relationship already exists, skip
      }
    }

    console.log('Sample data seeded successfully');
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
}