import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { persons, relationships } from '../shared/schema.ts';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { persons, relationships } });

async function quickSeed() {
  console.log('🌱 Quick seeding demo data...');
  
  const demoPersons = [
    { 
      id: 'person-1',
      name: 'Sarah Johnson', 
      company: 'JLL', 
      title: 'Senior Associate', 
      email: 'sarah.johnson@jll.com',
      linkedin: 'https://linkedin.com/in/sarah-johnson-jll'
    },
    { 
      id: 'person-2',
      name: 'Michael Chen', 
      company: 'TechCorp', 
      title: 'Product Manager', 
      email: 'michael.chen@techcorp.com',
      linkedin: 'https://linkedin.com/in/michael-chen-pm'
    },
    { 
      id: 'person-3',
      name: 'David Wilson', 
      company: 'GlobalSolutions', 
      title: 'Director', 
      email: 'david.wilson@globalsolutions.com',
      linkedin: 'https://linkedin.com/in/david-wilson-director'
    },
    { 
      id: 'person-4',
      name: 'Jessica Brown', 
      company: 'InnovateLab', 
      title: 'Senior Developer', 
      email: 'jessica.brown@innovatelab.com',
      linkedin: 'https://linkedin.com/in/jessica-brown-dev'
    },
    { 
      id: 'person-5',
      name: 'James Davis', 
      company: 'DataDriven', 
      title: 'Analytics Lead', 
      email: 'james.davis@datadriven.com',
      linkedin: 'https://linkedin.com/in/james-davis-analytics'
    },
    { 
      id: 'person-6',
      name: 'Emily Rodriguez', 
      company: 'CloudFirst', 
      title: 'VP Engineering', 
      email: 'emily.rodriguez@cloudfirst.com',
      linkedin: 'https://linkedin.com/in/emily-rodriguez-vp'
    },
    { 
      id: 'person-7',
      name: 'Robert Kim', 
      company: 'NextGen Systems', 
      title: 'CTO', 
      email: 'robert.kim@nextgensystems.com',
      linkedin: 'https://linkedin.com/in/robert-kim-cto'
    },
    { 
      id: 'person-8',
      name: 'Ashley Martinez', 
      company: 'FutureTech', 
      title: 'Head of Sales', 
      email: 'ashley.martinez@futuretech.com',
      linkedin: 'https://linkedin.com/in/ashley-martinez-sales'
    }
  ];
  
  // Insert persons
  for (const person of demoPersons) {
    try {
      await db.insert(persons).values(person).onConflictDoNothing();
    } catch (error) {
      console.log(`Person ${person.name} already exists or error:`, error.message);
    }
  }
  
  // Create some relationships for demo
  const demoRelationships = [
    { fromPersonId: 'person-1', toPersonId: 'person-2', relationshipType: 'colleague', strength: 8 },
    { fromPersonId: 'person-2', toPersonId: 'person-3', relationshipType: 'former_colleague', strength: 7 },
    { fromPersonId: 'person-3', toPersonId: 'person-4', relationshipType: 'university', strength: 6 },
    { fromPersonId: 'person-1', toPersonId: 'person-5', relationshipType: 'professional', strength: 5 },
    { fromPersonId: 'person-4', toPersonId: 'person-6', relationshipType: 'colleague', strength: 9 },
    { fromPersonId: 'person-5', toPersonId: 'person-7', relationshipType: 'mentor', strength: 8 },
    { fromPersonId: 'person-6', toPersonId: 'person-8', relationshipType: 'professional', strength: 7 },
    { fromPersonId: 'person-2', toPersonId: 'person-7', relationshipType: 'conference', strength: 4 }
  ];
  
  for (const rel of demoRelationships) {
    try {
      await db.insert(relationships).values(rel).onConflictDoNothing();
    } catch (error) {
      console.log(`Relationship already exists or error:`, error.message);
    }
  }
  
  console.log('✅ Quick demo data seeded successfully!');
  console.log(`📊 Inserted ${demoPersons.length} persons and ${demoRelationships.length} relationships`);
  
  await pool.end();
  process.exit(0);
}

quickSeed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});