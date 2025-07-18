import { db } from '../server/db.js';
import { persons, relationships } from '../shared/schema.js';
import { faker } from '@faker-js/faker';
import { sql, eq } from 'drizzle-orm';

// Comprehensive demo data configuration
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
    'University of Chicago', 'Carnegie Mellon', 'Cornell University',
    'Duke University', 'Vanderbilt University', 'USC', 'Boston University'
  ],
  fraternities: [
    'Alpha Phi Alpha', 'Beta Theta Pi', 'Delta Tau Delta', 'Kappa Alpha',
    'Lambda Chi Alpha', 'Phi Delta Theta', 'Phi Gamma Delta', 'Pi Kappa Alpha',
    'Sigma Alpha Epsilon', 'Sigma Chi', 'Sigma Nu', 'Sigma Phi Epsilon',
    'Tau Kappa Epsilon', 'Alpha Chi Omega', 'Chi Omega', 'Delta Delta Delta',
    'Gamma Phi Beta', 'Kappa Delta', 'Kappa Kappa Gamma', 'Pi Beta Phi'
  ],
  cities: [
    'San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
    'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Denver, CO', 'Atlanta, GA',
    'Miami, FL', 'Dallas, TX', 'Portland, OR', 'San Diego, CA', 'Nashville, TN'
  ],
  jobTitles: {
    junior: ['Analyst', 'Associate', 'Junior Developer', 'Coordinator', 'Specialist'],
    mid: ['Manager', 'Senior Analyst', 'Project Manager', 'Lead Developer', 'Principal'],
    senior: ['Director', 'VP', 'Senior Director', 'Head of', 'Chief']
  }
};

function generateOktaId() {
  return `okta_${faker.string.alphanumeric(8)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRandomEmail(firstName, lastName, company) {
  const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
  const formats = [
    `${firstName}.${lastName}@${domain}`,
    `${firstName.charAt(0)}${lastName}@${domain}`,
    `${firstName}${lastName.charAt(0)}@${domain}`,
    `${firstName}${Math.floor(Math.random() * 99)}@${domain}`
  ];
  return formats[Math.floor(Math.random() * formats.length)].toLowerCase();
}

function generateSocialProfiles(firstName, lastName) {
  const profiles = {};
  const platforms = ['linkedin', 'twitter', 'github', 'instagram'];
  
  // Ensure each person has 2+ social profiles
  const numProfiles = Math.floor(Math.random() * 3) + 2; // 2-4 profiles
  const selectedPlatforms = faker.helpers.shuffle(platforms).slice(0, numProfiles);
  
  selectedPlatforms.forEach(platform => {
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`;
    profiles[platform] = `https://${platform}.com/${username}`;
  });
  
  return profiles;
}

function selectJobTitle(company, experienceLevel) {
  const { jobTitles } = DEMO_CONFIG;
  let titlePool;
  
  if (experienceLevel < 3) titlePool = jobTitles.junior;
  else if (experienceLevel < 7) titlePool = jobTitles.mid;
  else titlePool = jobTitles.senior;
  
  const baseTitle = faker.helpers.arrayElement(titlePool);
  
  // Add department context for some roles
  if (Math.random() > 0.6) {
    const departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'Product'];
    return `${baseTitle}, ${faker.helpers.arrayElement(departments)}`;
  }
  
  return baseTitle;
}

function generateFamilyConnections(users) {
  const familyGroups = [];
  const usedUserIds = new Set();
  
  // Create family groups (0-2 family ties per person as specified)
  for (let i = 0; i < Math.floor(users.length * 0.15); i++) {
    const availableUsers = users.filter(u => !usedUserIds.has(u.id));
    if (availableUsers.length < 2) break;
    
    const familySize = Math.floor(Math.random() * 3) + 2; // 2-4 family members
    const family = faker.helpers.shuffle(availableUsers).slice(0, familySize);
    
    family.forEach(user => usedUserIds.add(user.id));
    familyGroups.push(family);
  }
  
  return familyGroups;
}

async function generateComprehensiveDemoData() {
  console.log('🚀 Starting comprehensive demo data generation...');
  
  try {
    // Clear existing demo data
    console.log('🗑️  Clearing existing demo data...');
    await db.delete(relationships).where(sql`metadata->>'demo' = 'true'`);
    await db.delete(persons).where(sql`metadata->>'demo' = 'true'`);
    
    const allUsers = [];
    let userIdCounter = 1;
    
    // Generate users for each company
    for (const company of DEMO_CONFIG.companies) {
      console.log(`👥 Generating ${company.userCount} users for ${company.name}...`);
      
      for (let i = 0; i < company.userCount; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const experienceLevel = Math.floor(Math.random() * 12) + 1; // 1-12 years
        
        const user = {
          id: `demo_user_${userIdCounter++}`,
          oktaId: generateOktaId(),
          name: `${firstName} ${lastName}`,
          email: generateRandomEmail(firstName, lastName, company.name),
          company: company.name,
          title: selectJobTitle(company.name, experienceLevel),
          school: Math.random() > 0.3 ? faker.helpers.arrayElement(DEMO_CONFIG.schools) : null,
          greekLife: Math.random() > 0.7 ? faker.helpers.arrayElement(DEMO_CONFIG.fraternities) : null,
          hometown: faker.helpers.arrayElement(DEMO_CONFIG.cities),
          socialProfiles: generateSocialProfiles(firstName, lastName),
          bio: faker.lorem.sentences(2),
          skills: faker.helpers.shuffle([
            'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker',
            'Leadership', 'Strategy', 'Sales', 'Marketing', 'Analytics',
            'Product Management', 'Design', 'Finance', 'Operations'
          ]).slice(0, Math.floor(Math.random() * 5) + 3),
          metadata: {
            demo: true,
            experienceLevel,
            generatedAt: new Date().toISOString(),
            industry: company.name === 'JLL' ? 'Real Estate' : 'Technology'
          }
        };
        
        allUsers.push(user);
      }
    }
    
    // Insert all users into database
    console.log(`💾 Inserting ${allUsers.length} users into database...`);
    
    const batchSize = 100;
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      await db.insert(persons).values(batch);
    }
    
    console.log('🔗 Generating relationship networks...');
    
    // Generate coworker relationships
    const coworkerRelationships = [];
    const companyGroups = {};
    
    allUsers.forEach(user => {
      if (!companyGroups[user.company]) companyGroups[user.company] = [];
      companyGroups[user.company].push(user);
    });
    
    Object.values(companyGroups).forEach(companyUsers => {
      // Create coworker relationships within each company
      for (let i = 0; i < companyUsers.length; i++) {
        const numConnections = Math.floor(Math.random() * 8) + 2; // 2-9 coworker connections
        const availableCoworkers = companyUsers.filter((_, index) => index !== i);
        const connections = faker.helpers.shuffle(availableCoworkers).slice(0, numConnections);
        
        connections.forEach(coworker => {
          coworkerRelationships.push({
            fromPersonId: companyUsers[i].id,
            toPersonId: coworker.id,
            relationshipType: 'coworker',
            strength: Math.floor(Math.random() * 40) + 60, // 60-99 strength
            metadata: {
              demo: true,
              company: companyUsers[i].company,
              establishedDate: faker.date.past({ years: 3 }).toISOString()
            }
          });
        });
      }
    });
    
    // Generate school relationships
    const schoolRelationships = [];
    const schoolGroups = {};
    
    allUsers.filter(u => u.school).forEach(user => {
      if (!schoolGroups[user.school]) schoolGroups[user.school] = [];
      schoolGroups[user.school].push(user);
    });
    
    Object.values(schoolGroups).forEach(schoolmates => {
      if (schoolmates.length < 2) return;
      
      for (let i = 0; i < schoolmates.length; i++) {
        const numConnections = Math.min(Math.floor(Math.random() * 5) + 1, schoolmates.length - 1);
        const availableSchoolmates = schoolmates.filter((_, index) => index !== i);
        const connections = faker.helpers.shuffle(availableSchoolmates).slice(0, numConnections);
        
        connections.forEach(schoolmate => {
          schoolRelationships.push({
            fromPersonId: schoolmates[i].id,
            toPersonId: schoolmate.id,
            relationshipType: 'school',
            strength: Math.floor(Math.random() * 30) + 50, // 50-79 strength
            metadata: {
              demo: true,
              school: schoolmates[i].school,
              graduationYear: faker.date.past({ years: 10 }).getFullYear()
            }
          });
        });
      }
    });
    
    // Generate family relationships
    const familyRelationships = [];
    const familyGroups = generateFamilyConnections(allUsers);
    
    familyGroups.forEach(family => {
      for (let i = 0; i < family.length; i++) {
        for (let j = i + 1; j < family.length; j++) {
          const relationshipTypes = ['sibling', 'cousin', 'parent', 'spouse'];
          const relType = faker.helpers.arrayElement(relationshipTypes);
          
          // Add bidirectional family relationships
          [
            { from: family[i].id, to: family[j].id },
            { from: family[j].id, to: family[i].id }
          ].forEach(({ from, to }) => {
            familyRelationships.push({
              fromPersonId: from,
              toPersonId: to,
              relationshipType: 'family',
              strength: Math.floor(Math.random() * 20) + 80, // 80-99 strength
              metadata: {
                demo: true,
                familyType: relType,
                oktaLinked: true
              }
            });
          });
        }
      }
    });
    
    // Generate fraternity/sorority relationships
    const greekRelationships = [];
    const greekGroups = {};
    
    allUsers.filter(u => u.greekLife).forEach(user => {
      if (!greekGroups[user.greekLife]) greekGroups[user.greekLife] = [];
      greekGroups[user.greekLife].push(user);
    });
    
    Object.values(greekGroups).forEach(greekMembers => {
      if (greekMembers.length < 2) return;
      
      for (let i = 0; i < greekMembers.length; i++) {
        const numConnections = Math.min(Math.floor(Math.random() * 6) + 2, greekMembers.length - 1);
        const availableMembers = greekMembers.filter((_, index) => index !== i);
        const connections = faker.helpers.shuffle(availableMembers).slice(0, numConnections);
        
        connections.forEach(member => {
          greekRelationships.push({
            fromPersonId: greekMembers[i].id,
            toPersonId: member.id,
            relationshipType: 'greek_life',
            strength: Math.floor(Math.random() * 25) + 65, // 65-89 strength
            metadata: {
              demo: true,
              organization: greekMembers[i].greekLife,
              pledgeYear: faker.date.past({ years: 8 }).getFullYear()
            }
          });
        });
      }
    });
    
    // Insert all relationships
    const allRelationships = [
      ...coworkerRelationships,
      ...schoolRelationships,
      ...familyRelationships,
      ...greekRelationships
    ];
    
    console.log(`💾 Inserting ${allRelationships.length} relationships...`);
    
    for (let i = 0; i < allRelationships.length; i += batchSize) {
      const batch = allRelationships.slice(i, i + batchSize);
      await db.insert(relationships).values(batch);
    }
    
    // Create admin test account
    const adminUser = {
      id: 'admin_test_user',
      oktaId: generateOktaId(),
      name: 'Alex Johnson',
      email: 'alex.johnson@warmconnect.com',
      company: 'WarmConnect',
      title: 'CEO & Founder',
      school: 'Stanford University',
      greekLife: 'Alpha Phi Alpha',
      hometown: 'San Francisco, CA',
      socialProfiles: {
        linkedin: 'https://linkedin.com/in/alexjohnson',
        twitter: 'https://twitter.com/alexjohnson',
        github: 'https://github.com/alexjohnson'
      },
      bio: 'Serial entrepreneur and networking technology pioneer. Founded WarmConnect to revolutionize professional relationship building.',
      skills: ['Leadership', 'Strategy', 'Product Management', 'Fundraising', 'Networking'],
      metadata: {
        demo: true,
        isAdmin: true,
        generatedAt: new Date().toISOString(),
        testAccount: true
      }
    };
    
    await db.insert(persons).values([adminUser]);
    
    // Connect admin to various people for testing
    const adminConnections = faker.helpers.shuffle(allUsers).slice(0, 25);
    const adminRelationships = adminConnections.map(user => ({
      fromPersonId: adminUser.id,
      toPersonId: user.id,
      relationshipType: faker.helpers.arrayElement(['school', 'greek_life', 'professional']),
      strength: Math.floor(Math.random() * 30) + 70,
      metadata: {
        demo: true,
        testConnection: true
      }
    }));
    
    await db.insert(relationships).values(adminRelationships);
    
    console.log('✅ Demo data generation completed successfully!');
    console.log(`📊 Generated:
    - ${allUsers.length + 1} users (including admin)
    - ${DEMO_CONFIG.companies.length} companies
    - ${allRelationships.length + adminRelationships.length} relationships
    - ${Object.keys(schoolGroups).length} schools represented
    - ${Object.keys(greekGroups).length} greek organizations
    - ${familyGroups.length} family groups`);
    
    return {
      usersCreated: allUsers.length + 1,
      relationshipsCreated: allRelationships.length + adminRelationships.length,
      companiesRepresented: DEMO_CONFIG.companies.length,
      adminUser: adminUser
    };
    
  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    throw error;
  }
}

// Export for use in other scripts
export { generateComprehensiveDemoData };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateComprehensiveDemoData()
    .then(result => {
      console.log('🎉 Demo data generation complete:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Demo data generation failed:', error);
      process.exit(1);
    });
}