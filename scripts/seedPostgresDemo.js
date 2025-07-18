import { db } from '../server/db.js';
import { persons, relationshipEdges } from '../shared/schema.js';
import { faker } from '@faker-js/faker';
import { sql, eq } from 'drizzle-orm';

// Demo data configuration for PostgreSQL
const DEMO_CONFIG = {
  totalUsers: 1200,
  companies: [
    { name: 'JLL', userCount: 180 },
    { name: 'Google', userCount: 150 },
    { name: 'Microsoft', userCount: 120 },
    { name: 'Amazon', userCount: 100 },
    { name: 'Meta', userCount: 90 },
    { name: 'Apple', userCount: 85 },
    { name: 'Tesla', userCount: 75 },
    { name: 'Netflix', userCount: 65 },
    { name: 'Salesforce', userCount: 60 },
    { name: 'Oracle', userCount: 55 },
    { name: 'Adobe', userCount: 50 },
    { name: 'Uber', userCount: 45 },
    { name: 'Airbnb', userCount: 40 },
    { name: 'Stripe', userCount: 35 },
    { name: 'Zoom', userCount: 30 },
    { name: 'Slack', userCount: 25 }
  ],
  schools: [
    'Stanford University', 'Harvard University', 'MIT', 'UC Berkeley', 
    'UCLA', 'University of Texas', 'NYU', 'Columbia University',
    'Yale University', 'Princeton University', 'Northwestern University',
    'University of Chicago', 'Carnegie Mellon', 'Cornell University'
  ],
  fraternities: [
    'Alpha Phi Alpha', 'Beta Theta Pi', 'Delta Tau Delta', 'Kappa Alpha',
    'Lambda Chi Alpha', 'Phi Delta Theta', 'Sigma Alpha Epsilon', 'Sigma Chi'
  ],
  cities: [
    'San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
    'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Denver, CO'
  ]
};

function generateOktaId() {
  return `okta_${faker.string.alphanumeric(8)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateEmail(firstName, lastName, company) {
  const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
  const username = `${firstName}.${lastName}`.toLowerCase();
  return `${username}@${domain}`;
}

function generateSocialProfiles(firstName, lastName) {
  const profiles = {};
  
  // LinkedIn (most common)
  if (Math.random() > 0.1) {
    profiles.linkedin = `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  }
  
  // Twitter
  if (Math.random() > 0.4) {
    profiles.twitter = `https://twitter.com/${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}`;
  }
  
  // GitHub (for tech companies)
  if (Math.random() > 0.6) {
    profiles.github = `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  }
  
  return profiles;
}

async function generatePostgresDemoData() {
  console.log('Starting PostgreSQL demo data generation...');
  
  try {
    // Clear existing demo data (relationships first due to foreign key constraints)
    console.log('Clearing existing demo data...');
    await db.delete(relationshipEdges).where(eq(relationshipEdges.source, 'demo'));
    await db.delete(relationshipEdges); // Clear all relationships to avoid constraint issues
    await db.delete(persons).where(eq(persons.source, 'demo'));
    
    const allUsers = [];
    let userIdCounter = 1;
    
    // Generate users for each company
    for (const company of DEMO_CONFIG.companies) {
      console.log(`Generating ${company.userCount} users for ${company.name}...`);
      
      for (let i = 0; i < company.userCount; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        
        const user = {
          id: `demo_user_${userIdCounter++}`,
          name: `${firstName} ${lastName}`,
          email: generateEmail(firstName, lastName, company.name),
          company: company.name,
          title: faker.person.jobTitle(),
          location: faker.helpers.arrayElement(DEMO_CONFIG.cities),
          education: Math.random() > 0.3 ? faker.helpers.arrayElement(DEMO_CONFIG.schools) : null,
          greekLife: Math.random() > 0.7 ? faker.helpers.arrayElement(DEMO_CONFIG.fraternities) : null,
          hometown: faker.helpers.arrayElement(DEMO_CONFIG.cities),
          socialProfiles: generateSocialProfiles(firstName, lastName),
          skills: [
            faker.helpers.arrayElement(['JavaScript', 'Python', 'React', 'Sales', 'Marketing']),
            faker.helpers.arrayElement(['Leadership', 'Strategy', 'Analytics', 'Design', 'Finance'])
          ],
          source: 'demo'
        };
        
        allUsers.push(user);
      }
    }
    
    // Insert users in batches
    console.log(`Inserting ${allUsers.length} users...`);
    const batchSize = 100;
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      await db.insert(persons).values(batch);
    }
    
    // Generate relationships
    console.log('Generating relationships...');
    const allRelationships = [];
    
    // Coworker relationships
    const companyGroups = {};
    allUsers.forEach(user => {
      if (!companyGroups[user.company]) companyGroups[user.company] = [];
      companyGroups[user.company].push(user);
    });
    
    Object.values(companyGroups).forEach(companyUsers => {
      for (let i = 0; i < companyUsers.length; i++) {
        const numConnections = Math.min(Math.floor(Math.random() * 5) + 2, companyUsers.length - 1);
        const connections = faker.helpers.shuffle(companyUsers)
          .filter((_, index) => index !== i)
          .slice(0, numConnections);
        
        connections.forEach(coworker => {
          allRelationships.push({
            fromId: companyUsers[i].id,
            toId: coworker.id,
            type: 'COWORKER',
            confidenceScore: Math.floor(Math.random() * 40) + 60,
            source: 'demo',
            evidence: JSON.stringify({
              company: companyUsers[i].company
            })
          });
        });
      }
    });
    
    // School relationships
    const schoolGroups = {};
    allUsers.filter(u => u.education).forEach(user => {
      if (!schoolGroups[user.education]) schoolGroups[user.education] = [];
      schoolGroups[user.education].push(user);
    });
    
    Object.values(schoolGroups).forEach(schoolmates => {
      if (schoolmates.length < 2) return;
      
      for (let i = 0; i < schoolmates.length; i++) {
        const numConnections = Math.min(Math.floor(Math.random() * 3) + 1, schoolmates.length - 1);
        const connections = faker.helpers.shuffle(schoolmates)
          .filter((_, index) => index !== i)
          .slice(0, numConnections);
        
        connections.forEach(schoolmate => {
          allRelationships.push({
            fromId: schoolmates[i].id,
            toId: schoolmate.id,
            type: 'ALUMNI',
            confidenceScore: Math.floor(Math.random() * 30) + 50,
            source: 'demo',
            evidence: JSON.stringify({
              school: schoolmates[i].education
            })
          });
        });
      }
    });
    
    // Family relationships (smaller subset)
    const familyPairs = Math.floor(allUsers.length * 0.05); // 5% have family connections
    for (let i = 0; i < familyPairs; i++) {
      const person1 = faker.helpers.arrayElement(allUsers);
      const person2 = faker.helpers.arrayElement(allUsers.filter(u => u.id !== person1.id));
      
      // Bidirectional family relationship
      [
        { from: person1.id, to: person2.id },
        { from: person2.id, to: person1.id }
      ].forEach(({ from, to }) => {
        allRelationships.push({
          fromId: from,
          toId: to,
          type: 'HOMETOWN',
          confidenceScore: Math.floor(Math.random() * 20) + 80,
          source: 'demo',
          evidence: JSON.stringify({
            familyType: 'sibling'
          })
        });
      });
    }
    
    // Insert relationships in batches
    console.log(`Inserting ${allRelationships.length} relationships...`);
    for (let i = 0; i < allRelationships.length; i += batchSize) {
      const batch = allRelationships.slice(i, i + batchSize);
      await db.insert(relationshipEdges).values(batch);
    }
    
    // Create admin test account
    const adminUser = {
      id: 'admin_test_user',
      name: 'Alex Johnson',
      email: 'alex.johnson@warmconnect.com',
      company: 'WarmConnect',
      title: 'CEO & Founder',
      location: 'San Francisco, CA',
      education: 'Stanford University',
      greekLife: 'Alpha Phi Alpha',
      hometown: 'San Francisco, CA',
      socialProfiles: {
        linkedin: 'https://linkedin.com/in/alexjohnson',
        twitter: 'https://twitter.com/alexjohnson'
      },
      skills: ['Leadership', 'Strategy', 'Product Management'],
      source: 'demo'
    };
    
    await db.insert(persons).values([adminUser]);
    
    // Connect admin to sample users for testing
    const adminConnections = faker.helpers.shuffle(allUsers).slice(0, 20);
    const adminRelationships = adminConnections.map(user => ({
      fromId: adminUser.id,
      toId: user.id,
      type: faker.helpers.arrayElement(['ALUMNI', 'COWORKER']),
      confidenceScore: Math.floor(Math.random() * 30) + 70,
      source: 'demo',
      evidence: JSON.stringify({
        testConnection: true
      })
    }));
    
    await db.insert(relationshipEdges).values(adminRelationships);
    
    console.log('Demo data generation completed successfully!');
    console.log(`Generated:
    - ${allUsers.length + 1} users (including admin)
    - ${DEMO_CONFIG.companies.length} companies
    - ${allRelationships.length + adminRelationships.length} relationships`);
    
    return {
      usersCreated: allUsers.length + 1,
      relationshipsCreated: allRelationships.length + adminRelationships.length,
      companiesRepresented: DEMO_CONFIG.companies.length,
      adminUser: adminUser
    };
    
  } catch (error) {
    console.error('Error generating demo data:', error);
    throw error;
  }
}

// Export for use in other scripts
export { generatePostgresDemoData };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePostgresDemoData()
    .then(result => {
      console.log('Demo data generation complete:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Demo data generation failed:', error);
      process.exit(1);
    });
}