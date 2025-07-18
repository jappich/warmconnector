import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { persons, relationships } from '../shared/schema.js';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { persons, relationships } });

// Demo data arrays for realistic diversity
const firstNames = [
  'Sarah', 'Michael', 'David', 'Jessica', 'James', 'Emily', 'Robert', 'Ashley', 'Christopher', 'Amanda',
  'Matthew', 'Stephanie', 'Joshua', 'Melissa', 'Daniel', 'Nicole', 'Andrew', 'Elizabeth', 'Joseph', 'Jennifer',
  'Ryan', 'Kimberly', 'Brandon', 'Amy', 'Jason', 'Angela', 'William', 'Tiffany', 'Jonathan', 'Heather',
  'Justin', 'Samantha', 'Anthony', 'Rachel', 'Kevin', 'Amber', 'Steven', 'Crystal', 'Thomas', 'Brittany',
  'Timothy', 'Danielle', 'Adam', 'Katherine', 'Nathan', 'Rebecca', 'Zachary', 'Sharon', 'Patrick', 'Cynthia'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const companies = [
  'JLL', 'JLL', 'JLL', 'JLL', 'JLL', // Many JLL employees
  'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta',
  'Goldman Sachs', 'JPMorgan Chase', 'Morgan Stanley', 'Bank of America',
  'McKinsey & Company', 'Bain & Company', 'Boston Consulting Group',
  'Deloitte', 'PwC', 'EY', 'KPMG',
  'Salesforce', 'Oracle', 'IBM', 'Cisco',
  'Netflix', 'Uber', 'Airbnb', 'Tesla',
  'Startup Inc', 'TechCorp', 'DataCorp', 'CloudFirst'
];

const jobTitles = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
  'Sales Manager', 'Marketing Director', 'Operations Manager', 'Business Analyst',
  'Senior Consultant', 'Account Executive', 'Project Manager', 'Research Analyst',
  'VP Engineering', 'VP Sales', 'VP Marketing', 'CTO', 'CFO', 'COO',
  'Associate', 'Senior Associate', 'Principal', 'Director', 'Managing Director'
];

const universities = [
  'Harvard University', 'Stanford University', 'MIT', 'University of California Berkeley',
  'Yale University', 'Princeton University', 'Columbia University', 'University of Pennsylvania',
  'Northwestern University', 'University of Chicago', 'Duke University', 'Dartmouth College',
  'Cornell University', 'Brown University', 'Vanderbilt University', 'Rice University',
  'University of Notre Dame', 'Georgetown University', 'Carnegie Mellon University', 'UCLA'
];

const degrees = [
  'Bachelor of Science', 'Bachelor of Arts', 'Master of Business Administration',
  'Master of Science', 'Master of Engineering', 'Doctor of Philosophy',
  'Juris Doctor', 'Master of Public Administration'
];

const greekOrganizations = [
  { org: 'Delta Kappa Epsilon', chapters: ['Alpha', 'Beta', 'Gamma', 'Delta'] },
  { org: 'Kappa Alpha Theta', chapters: ['Alpha', 'Beta', 'Gamma', 'Delta'] },
  { org: 'Sigma Chi', chapters: ['Alpha', 'Beta', 'Gamma', 'Delta'] },
  { org: 'Alpha Phi', chapters: ['Alpha', 'Beta', 'Gamma', 'Delta'] },
  { org: 'Phi Delta Theta', chapters: ['Alpha', 'Beta', 'Gamma', 'Delta'] }
];

const greekRoles = ['Member', 'Treasurer', 'Secretary', 'Vice President', 'President'];

const cities = [
  { city: 'New York', state: 'NY', country: 'USA' },
  { city: 'Los Angeles', state: 'CA', country: 'USA' },
  { city: 'Chicago', state: 'IL', country: 'USA' },
  { city: 'Houston', state: 'TX', country: 'USA' },
  { city: 'Phoenix', state: 'AZ', country: 'USA' },
  { city: 'Philadelphia', state: 'PA', country: 'USA' },
  { city: 'San Antonio', state: 'TX', country: 'USA' },
  { city: 'San Diego', state: 'CA', country: 'USA' },
  { city: 'Dallas', state: 'TX', country: 'USA' },
  { city: 'San Jose', state: 'CA', country: 'USA' },
  { city: 'Austin', state: 'TX', country: 'USA' },
  { city: 'Jacksonville', state: 'FL', country: 'USA' },
  { city: 'San Francisco', state: 'CA', country: 'USA' },
  { city: 'Columbus', state: 'OH', country: 'USA' },
  { city: 'Charlotte', state: 'NC', country: 'USA' },
  { city: 'Indianapolis', state: 'IN', country: 'USA' },
  { city: 'Seattle', state: 'WA', country: 'USA' },
  { city: 'Denver', state: 'CO', country: 'USA' },
  { city: 'Boston', state: 'MA', country: 'USA' },
  { city: 'Nashville', state: 'TN', country: 'USA' }
];

const socialProviders = ['LinkedIn', 'Twitter', 'Facebook', 'Instagram'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com'];
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}@${getRandomElement(domains)}`;
}

function generateSocialProfiles(firstName, lastName) {
  const profiles = [];
  const numProfiles = Math.floor(Math.random() * 3) + 1; // 1-3 profiles
  
  for (let i = 0; i < numProfiles; i++) {
    const provider = getRandomElement(socialProviders);
    const handle = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    profiles.push({
      provider,
      url: `https://${provider.toLowerCase()}.com/in/${handle}`,
      handle
    });
  }
  
  return profiles;
}

function generateEducation() {
  const education = [];
  const numEducation = Math.random() < 0.8 ? 1 : 2; // 80% have 1, 20% have 2
  
  for (let i = 0; i < numEducation; i++) {
    education.push({
      school: getRandomElement(universities),
      degree: getRandomElement(degrees),
      year: 2010 + Math.floor(Math.random() * 14) // 2010-2023
    });
  }
  
  return education;
}

function generateGreekLife() {
  if (Math.random() < 0.3) { // 30% chance of Greek life
    const org = getRandomElement(greekOrganizations);
    return {
      org: org.org,
      chapter: getRandomElement(org.chapters),
      role: getRandomElement(greekRoles)
    };
  }
  return null;
}

async function seedEnhancedDemoData() {
  console.log('🌱 Seeding enhanced demo data with all relationship types...');
  
  const targetCount = 250;
  const seedData = [];
  
  // Generate persons
  for (let i = 0; i < targetCount; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const company = getRandomElement(companies);
    const title = getRandomElement(jobTitles);
    const hometown = getRandomElement(cities);
    
    const userData = {
      id: `person-${i + 1}`,
      name: `${firstName} ${lastName}`,
      email: generateRandomEmail(firstName, lastName),
      company,
      title,
      socialProfiles: JSON.stringify(generateSocialProfiles(firstName, lastName)),
      education: JSON.stringify(generateEducation()),
      greekLife: JSON.stringify(generateGreekLife()),
      hometowns: JSON.stringify([hometown]),
      family: JSON.stringify([]) // Will populate family relationships later
    };
    
    seedData.push(userData);
  }
  
  // Generate family relationships
  const familyRelations = ['spouse', 'sibling', 'parent', 'child'];
  for (let i = 0; i < seedData.length; i++) {
    if (Math.random() < 0.3) { // 30% chance of having family in the system
      const randomRelativeIndex = Math.floor(Math.random() * seedData.length);
      if (randomRelativeIndex !== i) {
        const relation = getRandomElement(familyRelations);
        
        // Add family member to first person
        const currentFamily = JSON.parse(seedData[i].family);
        currentFamily.push({
          oktaId: seedData[randomRelativeIndex].id,
          name: seedData[randomRelativeIndex].name,
          relation
        });
        seedData[i].family = JSON.stringify(currentFamily);
        
        // Add reciprocal relationship
        const relativeFamily = JSON.parse(seedData[randomRelativeIndex].family);
        const reciprocalRelation = relation === 'parent' ? 'child' : 
                                 relation === 'child' ? 'parent' : relation;
        relativeFamily.push({
          oktaId: seedData[i].id,
          name: seedData[i].name,
          relation: reciprocalRelation
        });
        seedData[randomRelativeIndex].family = JSON.stringify(relativeFamily);
      }
    }
  }
  
  // Insert all persons
  console.log('📝 Inserting persons...');
  for (const person of seedData) {
    try {
      await db.insert(persons).values(person).onConflictDoNothing();
    } catch (error) {
      console.log(`Person ${person.name} already exists or error:`, error.message);
    }
  }
  
  console.log('✅ Enhanced demo data seeded successfully!');
  console.log(`📊 Generated ${seedData.length} persons with:`);
  console.log(`  - Company relationships (coworkers)`);
  console.log(`  - Education relationships (alumni)`);
  console.log(`  - Family relationships`);
  console.log(`  - Greek life relationships`);
  console.log(`  - Hometown relationships`);
  console.log(`  - Social media relationships`);
  
  await pool.end();
  process.exit(0);
}

seedEnhancedDemoData().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});