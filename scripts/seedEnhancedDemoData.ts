import { db } from '../server/db';
import { persons, relationshipEdges as relationships, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Realistic data for seeding
const companies = ['JLL', 'Microsoft', 'Google', 'Apple', 'Amazon', 'Facebook', 'Salesforce', 'Oracle'];
const universities = ['Stanford University', 'Harvard University', 'MIT', 'UC Berkeley', 'Yale University', 'Princeton University', 'Columbia University', 'Northwestern University'];
const greekOrgs = ['Alpha Phi Alpha', 'Beta Theta Pi', 'Gamma Phi Beta', 'Delta Delta Delta', 'Kappa Alpha Theta', 'Sigma Chi', 'Pi Beta Phi', 'Phi Delta Theta'];
const cities = [
  { city: 'San Francisco', state: 'CA', country: 'USA' },
  { city: 'New York', state: 'NY', country: 'USA' },
  { city: 'Chicago', state: 'IL', country: 'USA' },
  { city: 'Los Angeles', state: 'CA', country: 'USA' },
  { city: 'Boston', state: 'MA', country: 'USA' },
  { city: 'Seattle', state: 'WA', country: 'USA' },
  { city: 'Austin', state: 'TX', country: 'USA' },
  { city: 'Denver', state: 'CO', country: 'USA' }
];

const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'Christopher', 'Jennifer', 'William', 'Jessica', 'James', 'Ashley', 'Daniel', 'Amanda'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'company.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${getRandomElement(domains)}`;
}

function generateSocialProfiles(firstName: string, lastName: string) {
  const profiles = [];
  if (Math.random() < 0.8) {
    profiles.push({
      provider: 'LinkedIn',
      handle: `${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      url: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`
    });
  }
  if (Math.random() < 0.5) {
    profiles.push({
      provider: 'Twitter',
      handle: `@${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      url: `https://twitter.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`
    });
  }
  return profiles;
}

function generateEducation() {
  const education = [];
  if (Math.random() < 0.9) {
    education.push({
      school: getRandomElement(universities),
      degree: getRandomElement(['Bachelor of Science', 'Bachelor of Arts', 'Master of Science', 'Master of Business Administration']),
      field: getRandomElement(['Computer Science', 'Business Administration', 'Engineering', 'Economics', 'Marketing', 'Finance']),
      year: Math.floor(Math.random() * 15) + 2005
    });
  }
  return education;
}

function generateGreekLife() {
  if (Math.random() < 0.3) {
    return {
      org: getRandomElement(greekOrgs),
      chapter: getRandomElement(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']),
      role: getRandomElement(['Member', 'President', 'Vice President', 'Treasurer', 'Secretary'])
    };
  }
  return null;
}

export async function seedEnhancedDemoData() {
  console.log('Starting enhanced demo data seeding...');

  try {
    // Clear existing data in correct order (relationships first due to foreign key constraints)
    await db.delete(relationships);
    await db.delete(persons);
    console.log('Cleared existing data');

    // Generate 200 persons
    const personsData = [];
    const createdPersons = [];

    for (let i = 0; i < 200; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const email = generateRandomEmail(firstName, lastName);
      const company = getRandomElement(companies);
      const hometown = getRandomElement(cities);
      
      const personData = {
        id: `demo_${i + 1}`,
        name: `${firstName} ${lastName}`,
        email,
        company,
        title: getRandomElement(['Software Engineer', 'Product Manager', 'Sales Director', 'Marketing Manager', 'Data Scientist', 'UX Designer']),
        socialProfiles: generateSocialProfiles(firstName, lastName),
        education: generateEducation(),
        greekLife: generateGreekLife(),
        hometowns: [hometown]
      };

      personsData.push(personData);
    }

    // Insert persons into database
    for (const person of personsData) {
      const [createdPerson] = await db.insert(persons).values({
        id: person.id,
        name: person.name,
        email: person.email,
        company: person.company,
        title: person.title,
        socialProfiles: JSON.stringify(person.socialProfiles),
        education: JSON.stringify(person.education),
        greekLife: person.greekLife ? JSON.stringify(person.greekLife) : null,
        hometowns: JSON.stringify(person.hometowns)
      }).returning();
      
      createdPersons.push({...createdPerson, ...person});
    }

    console.log(`Created ${createdPersons.length} persons`);

    // Create relationships
    const relationshipsData = [];

    // 1. COWORKER relationships (same company)
    const companiesMap = new Map();
    createdPersons.forEach(person => {
      if (!companiesMap.has(person.company)) {
        companiesMap.set(person.company, []);
      }
      companiesMap.get(person.company).push(person);
    });

    for (const [company, colleagues] of companiesMap.entries()) {
      for (let i = 0; i < colleagues.length; i++) {
        for (let j = i + 1; j < colleagues.length; j++) {
          relationshipsData.push({
            fromId: colleagues[i].id,
            toId: colleagues[j].id,
            type: 'COWORKER',
            confidenceScore: Math.random() * 0.5 + 0.3, // 0.3-0.8
            metadata: JSON.stringify({ company }),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // 2. EDUCATION relationships (same school)
    const schoolsMap = new Map();
    createdPersons.forEach(person => {
      if (person.education && person.education.length > 0) {
        const school = person.education[0].school;
        if (!schoolsMap.has(school)) {
          schoolsMap.set(school, []);
        }
        schoolsMap.get(school).push(person);
      }
    });

    for (const [school, alumni] of schoolsMap.entries()) {
      for (let i = 0; i < alumni.length; i++) {
        for (let j = i + 1; j < alumni.length; j++) {
          relationshipsData.push({
            fromId: alumni[i].id,
            toId: alumni[j].id,
            type: 'EDUCATION',
            confidenceScore: Math.random() * 0.4 + 0.2, // 0.2-0.6
            metadata: JSON.stringify({ school }),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // 3. GREEK_LIFE relationships
    const greekMap = new Map();
    createdPersons.forEach(person => {
      if (person.greekLife) {
        const key = `${person.greekLife.org}_${person.greekLife.chapter}`;
        if (!greekMap.has(key)) {
          greekMap.set(key, []);
        }
        greekMap.get(key).push(person);
      }
    });

    for (const [org, members] of greekMap.entries()) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          relationshipsData.push({
            fromId: members[i].id,
            toId: members[j].id,
            type: 'GREEK_LIFE',
            confidenceScore: Math.random() * 0.6 + 0.4, // 0.4-1.0
            metadata: JSON.stringify({ 
              org: members[i].greekLife.org, 
              chapter: members[i].greekLife.chapter 
            }),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // 4. HOMETOWN relationships
    const hometownMap = new Map();
    createdPersons.forEach(person => {
      if (person.hometowns && person.hometowns.length > 0) {
        const hometown = person.hometowns[0];
        const key = `${hometown.city}_${hometown.state}_${hometown.country}`;
        if (!hometownMap.has(key)) {
          hometownMap.set(key, []);
        }
        hometownMap.get(key).push(person);
      }
    });

    for (const [location, residents] of hometownMap.entries()) {
      for (let i = 0; i < residents.length; i++) {
        for (let j = i + 1; j < residents.length; j++) {
          relationshipsData.push({
            fromId: residents[i].id,
            toId: residents[j].id,
            type: 'HOMETOWN',
            confidenceScore: Math.random() * 0.3 + 0.1, // 0.1-0.4
            metadata: JSON.stringify(residents[i].hometowns[0]),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // 5. FAMILY relationships (random assignment)
    const familyCount = Math.floor(createdPersons.length * 0.1); // 10% have family connections
    for (let i = 0; i < familyCount; i++) {
      const person1 = getRandomElement(createdPersons);
      const person2 = getRandomElement(createdPersons.filter(p => p.id !== person1.id));
      
      relationshipsData.push({
        fromId: person1.id,
        toId: person2.id,
        type: 'FAMILY',
        confidenceScore: Math.random() * 0.5 + 0.5, // 0.5-1.0
        metadata: JSON.stringify({ 
          relation: getRandomElement(['sibling', 'cousin', 'spouse']) 
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 6. SOCIAL relationships (based on social platforms)
    const socialCount = Math.floor(createdPersons.length * 0.15); // 15% have social connections
    for (let i = 0; i < socialCount; i++) {
      const person1 = getRandomElement(createdPersons);
      const person2 = getRandomElement(createdPersons.filter(p => p.id !== person1.id));
      
      relationshipsData.push({
        fromId: person1.id,
        toId: person2.id,
        type: 'SOCIAL',
        confidenceScore: Math.random() * 0.4 + 0.1, // 0.1-0.5
        metadata: JSON.stringify({ 
          platform: getRandomElement(['LinkedIn', 'Twitter', 'Facebook']) 
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Insert relationships in batches
    const batchSize = 50;
    for (let i = 0; i < relationshipsData.length; i += batchSize) {
      const batch = relationshipsData.slice(i, i + batchSize);
      await db.insert(relationships).values(batch);
    }

    console.log(`Created ${relationshipsData.length} relationships`);
    console.log('Enhanced demo data seeding completed successfully!');

    return {
      persons: createdPersons.length,
      relationships: relationshipsData.length,
      relationshipTypes: ['COWORKER', 'EDUCATION', 'GREEK_LIFE', 'HOMETOWN', 'FAMILY', 'SOCIAL']
    };

  } catch (error) {
    console.error('Error seeding enhanced demo data:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEnhancedDemoData()
    .then((stats) => {
      console.log('Seeding stats:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}