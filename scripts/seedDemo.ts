import { MongoClient, Db, Collection } from 'mongodb';
import { faker } from '@faker-js/faker';

// TypeScript interfaces for type safety
interface SocialProfile {
  provider: string;
  url: string;
  handle: string;
}

interface Education {
  school: string;
  degree: string;
  year: number;
}

interface GreekLife {
  org: string;
  chapter: string;
  role: string;
}

interface FamilyMember {
  name: string;
  oktaId: string;
  relation: string;
}

interface DemoUser {
  userId: string;
  oktaId: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  socialProfiles: SocialProfile[];
  education: Education;
  greekLife: GreekLife;
  family: FamilyMember[];
  hometown: string;
  organizations: string[];
  directory: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CompanyEmployees {
  [company: string]: string[];
}

async function connectDB(): Promise<Db> {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  await client.connect();
  return client.db('warmconnector');
}

function generateRandomEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateSocialProfiles(firstName: string, lastName: string): SocialProfile[] {
  const profiles: SocialProfile[] = [];
  
  // LinkedIn (90% chance)
  if (Math.random() > 0.1) {
    profiles.push({
      provider: 'linkedin',
      url: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      handle: `${firstName.toLowerCase()}-${lastName.toLowerCase()}`
    });
  }
  
  // Twitter (60% chance)
  if (Math.random() > 0.4) {
    profiles.push({
      provider: 'twitter',
      url: `https://twitter.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      handle: `@${firstName.toLowerCase()}${lastName.toLowerCase()}`
    });
  }
  
  // Facebook (70% chance)
  if (Math.random() > 0.3) {
    profiles.push({
      provider: 'facebook',
      url: `https://facebook.com/${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
      handle: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    });
  }
  
  return profiles;
}

function generateEducation(): Education {
  const schools = [
    'Harvard University', 'Stanford University', 'MIT', 'UC Berkeley',
    'Columbia University', 'Yale University', 'Princeton University',
    'University of Pennsylvania', 'Northwestern University', 'Duke University',
    'University of Chicago', 'Cornell University', 'UCLA', 'USC',
    'New York University', 'Georgetown University', 'Emory University',
    'Carnegie Mellon University', 'Vanderbilt University', 'Rice University'
  ];
  
  const degrees = [
    'Bachelor of Science', 'Bachelor of Arts', 'Master of Business Administration',
    'Master of Science', 'Doctor of Philosophy', 'Juris Doctor',
    'Master of Engineering', 'Bachelor of Engineering'
  ];
  
  return {
    school: schools[Math.floor(Math.random() * schools.length)],
    degree: degrees[Math.floor(Math.random() * degrees.length)],
    year: faker.date.between({ from: new Date('1990-01-01'), to: new Date('2024-01-01') }).getFullYear()
  };
}

function generateGreekLife(): GreekLife {
  const orgs = [
    'Alpha Phi Alpha', 'Kappa Alpha Psi', 'Omega Psi Phi', 'Phi Beta Sigma',
    'Iota Phi Theta', 'Alpha Kappa Alpha', 'Delta Sigma Theta', 'Zeta Phi Beta',
    'Sigma Gamma Rho', 'Sigma Phi Epsilon', 'Sigma Alpha Epsilon', 'Pi Kappa Alpha',
    'Kappa Sigma', 'Phi Delta Theta', 'Lambda Chi Alpha', 'Tau Kappa Epsilon'
  ];
  
  const chapters = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  const roles = ['Member', 'President', 'Vice President', 'Treasurer', 'Secretary', 'Social Chair'];
  
  if (Math.random() > 0.7) { // 30% chance of Greek life
    return {
      org: orgs[Math.floor(Math.random() * orgs.length)],
      chapter: chapters[Math.floor(Math.random() * chapters.length)],
      role: roles[Math.floor(Math.random() * roles.length)]
    };
  }
  
  return { org: '', chapter: '', role: '' };
}

function generateOrganizations(): string[] {
  const organizations = [
    'Toastmasters International', 'Junior Achievement', 'Rotary Club',
    'Chamber of Commerce', 'Professional Women\'s Network', 'Young Professionals Group',
    'Industry Association', 'Volunteer Fire Department', 'Red Cross',
    'Habitat for Humanity', 'United Way', 'YMCA', 'Boys & Girls Club'
  ];
  
  const numOrgs = Math.floor(Math.random() * 4); // 0-3 organizations
  const selectedOrgs: string[] = [];
  
  for (let i = 0; i < numOrgs; i++) {
    const org = organizations[Math.floor(Math.random() * organizations.length)];
    if (!selectedOrgs.includes(org)) {
      selectedOrgs.push(org);
    }
  }
  
  return selectedOrgs;
}

export async function seedDemoData(): Promise<void> {
  try {
    const db = await connectDB();
    const usersCollection: Collection<DemoUser> = db.collection('userprofiles');
    
    // Clear existing demo data
    await usersCollection.deleteMany({});
    
    console.log('Starting enhanced demo data generation...');
    
    const companies = [
      'JLL', 'CBRE', 'Cushman & Wakefield', 'Colliers', 'Newmark',
      'HFF', 'Eastdil Secured', 'Marcus & Millichap', 'Avison Young', 'Transwestern'
    ];
    
    const demoUsers: DemoUser[] = [];
    
    // Generate 200 demo users
    for (let i = 0; i < 200; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const oktaId = `okta_${faker.string.uuid()}`;
      const company = companies[Math.floor(Math.random() * companies.length)];
      
      const user: DemoUser = {
        userId: faker.string.uuid(),
        oktaId,
        email: generateRandomEmail(firstName, lastName),
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        company,
        title: faker.person.jobTitle(),
        socialProfiles: generateSocialProfiles(firstName, lastName),
        education: generateEducation(),
        greekLife: generateGreekLife(),
        family: [],
        hometown: `${faker.location.city()}, ${faker.location.state()}`,
        organizations: generateOrganizations(),
        directory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      demoUsers.push(user);
    }
    
    // Generate family relationships (10% chance of having family connections)
    for (let i = 0; i < demoUsers.length; i++) {
      if (Math.random() < 0.1) { // 10% chance
        const familyRelations = ['spouse', 'sibling', 'parent', 'child', 'cousin'];
        const relation = familyRelations[Math.floor(Math.random() * familyRelations.length)];
        
        // Find another user to be family member
        const randomIndex = Math.floor(Math.random() * demoUsers.length);
        if (randomIndex !== i) {
          demoUsers[i].family.push({
            name: demoUsers[randomIndex].name,
            oktaId: demoUsers[randomIndex].oktaId,
            relation
          });
          
          // Create bidirectional family relationship
          const reverseRelations: { [key: string]: string } = {
            'spouse': 'spouse',
            'sibling': 'sibling',
            'parent': 'child',
            'child': 'parent',
            'cousin': 'cousin'
          };
          
          demoUsers[randomIndex].family.push({
            name: demoUsers[i].name,
            oktaId: demoUsers[i].oktaId,
            relation: reverseRelations[relation]
          });
        }
      }
    }
    
    // Populate directory with coworkers
    const companyEmployees: CompanyEmployees = {};
    demoUsers.forEach(user => {
      if (!companyEmployees[user.company]) {
        companyEmployees[user.company] = [];
      }
      companyEmployees[user.company].push(user.oktaId);
    });
    
    demoUsers.forEach(user => {
      user.directory = companyEmployees[user.company].filter(oktaId => oktaId !== user.oktaId);
    });
    
    // Insert all demo users
    await usersCollection.insertMany(demoUsers);
    
    console.log('Seeded 200 demo users');
    console.log(`Companies: ${Object.keys(companyEmployees).length}`);
    console.log(`JLL employees: ${companyEmployees['JLL']?.length || 0}`);
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

// Enhanced seeding with more realistic data distribution
export async function seedEnhancedDemoData(): Promise<void> {
  try {
    const db = await connectDB();
    const usersCollection: Collection<DemoUser> = db.collection('userprofiles');
    
    // Clear existing demo data
    await usersCollection.deleteMany({});
    
    console.log('Starting enhanced realistic demo data generation...');
    
    // More realistic company distribution based on actual market presence
    const companiesWithWeights = [
      { name: 'JLL', weight: 25, minEmployees: 50, maxEmployees: 100 },
      { name: 'CBRE', weight: 20, minEmployees: 40, maxEmployees: 80 },
      { name: 'Cushman & Wakefield', weight: 15, minEmployees: 30, maxEmployees: 60 },
      { name: 'Colliers', weight: 12, minEmployees: 25, maxEmployees: 50 },
      { name: 'Newmark', weight: 10, minEmployees: 20, maxEmployees: 40 },
      { name: 'Avison Young', weight: 8, minEmployees: 15, maxEmployees: 30 },
      { name: 'Marcus & Millichap', weight: 5, minEmployees: 10, maxEmployees: 25 },
      { name: 'HFF', weight: 3, minEmployees: 8, maxEmployees: 20 },
      { name: 'Eastdil Secured', weight: 1, minEmployees: 5, maxEmployees: 15 },
      { name: 'Transwestern', weight: 1, minEmployees: 5, maxEmployees: 15 }
    ];
    
    const demoUsers: DemoUser[] = [];
    let userCounter = 0;
    
    // Generate users for each company based on weights
    for (const companyData of companiesWithWeights) {
      const employeeCount = faker.number.int({ 
        min: companyData.minEmployees, 
        max: companyData.maxEmployees 
      });
      
      for (let i = 0; i < employeeCount; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const oktaId = `okta_${userCounter}_${faker.string.uuid().slice(0, 8)}`;
        
        const user: DemoUser = {
          userId: faker.string.uuid(),
          oktaId,
          email: generateRandomEmail(firstName, lastName),
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          company: companyData.name,
          title: faker.person.jobTitle(),
          socialProfiles: generateSocialProfiles(firstName, lastName),
          education: generateEducation(),
          greekLife: generateGreekLife(),
          family: [],
          hometown: `${faker.location.city()}, ${faker.location.state()}`,
          organizations: generateOrganizations(),
          directory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        demoUsers.push(user);
        userCounter++;
      }
    }
    
    // Generate more realistic family relationships (15% chance)
    for (let i = 0; i < demoUsers.length; i++) {
      if (Math.random() < 0.15) { // 15% chance
        const familyRelations = ['spouse', 'sibling', 'parent', 'child', 'cousin'];
        const relation = familyRelations[Math.floor(Math.random() * familyRelations.length)];
        
        // Find another user to be family member (prefer different companies for realism)
        const candidates = demoUsers.filter((user, index) => 
          index !== i && user.company !== demoUsers[i].company
        );
        
        if (candidates.length > 0) {
          const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
          const candidateIndex = demoUsers.findIndex(user => user.oktaId === randomCandidate.oktaId);
          
          demoUsers[i].family.push({
            name: randomCandidate.name,
            oktaId: randomCandidate.oktaId,
            relation
          });
          
          // Create bidirectional family relationship
          const reverseRelations: { [key: string]: string } = {
            'spouse': 'spouse',
            'sibling': 'sibling',
            'parent': 'child',
            'child': 'parent',
            'cousin': 'cousin'
          };
          
          if (candidateIndex !== -1) {
            demoUsers[candidateIndex].family.push({
              name: demoUsers[i].name,
              oktaId: demoUsers[i].oktaId,
              relation: reverseRelations[relation]
            });
          }
        }
      }
    }
    
    // Populate directory with coworkers
    const companyEmployees: CompanyEmployees = {};
    demoUsers.forEach(user => {
      if (!companyEmployees[user.company]) {
        companyEmployees[user.company] = [];
      }
      companyEmployees[user.company].push(user.oktaId);
    });
    
    demoUsers.forEach(user => {
      user.directory = companyEmployees[user.company].filter(oktaId => oktaId !== user.oktaId);
    });
    
    // Insert all demo users
    await usersCollection.insertMany(demoUsers);
    
    console.log(`✅ Enhanced demo data seeded successfully:`);
    console.log(`   - Total users: ${demoUsers.length}`);
    console.log(`   - Companies: ${Object.keys(companyEmployees).length}`);
    
    // Log company breakdown
    Object.entries(companyEmployees).forEach(([company, employees]) => {
      console.log(`   - ${company}: ${employees.length} employees`);
    });
    
    const familyConnections = demoUsers.reduce((count, user) => count + user.family.length, 0);
    console.log(`   - Family connections: ${familyConnections}`);
    
  } catch (error) {
    console.error('Error seeding enhanced demo data:', error);
    throw error;
  }
}

// Export functions for use in other modules
export { seedDemoData as default };

// CLI execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'basic';
  
  if (mode === 'enhanced') {
    seedEnhancedDemoData().then(() => {
      console.log('Enhanced demo data seeding completed');
      process.exit(0);
    }).catch(error => {
      console.error('Enhanced demo data seeding failed:', error);
      process.exit(1);
    });
  } else {
    seedDemoData().then(() => {
      console.log('Demo data seeding completed');
      process.exit(0);
    }).catch(error => {
      console.error('Demo data seeding failed:', error);
      process.exit(1);
    });
  }
}