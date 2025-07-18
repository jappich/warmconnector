import { db } from '../server/db.ts';
import { persons, relationships } from '../shared/schema.ts';

// Realistic demo network for warm introduction scenarios
const demoPersons = [
  // User (you)
  {
    id: 'user-1',
    name: 'You',
    email: 'you@company.com',
    company: 'Your Company',
    title: 'Professional',
    location: 'San Francisco, CA',
    linkedinHandle: 'your-profile',
    isUser: true
  },
  
  // Direct connections (1st degree)
  {
    id: 'alex-chen',
    name: 'Alex Chen',
    email: 'alex.chen@meta.com',
    company: 'Meta',
    title: 'Senior Product Manager',
    location: 'Menlo Park, CA',
    linkedinHandle: 'alexchen-meta',
    instagramHandle: 'alexc_tech'
  },
  {
    id: 'sarah-rodriguez',
    name: 'Sarah Rodriguez',
    email: 'sarah.r@google.com',
    company: 'Google',
    title: 'Staff Software Engineer',
    location: 'Mountain View, CA',
    linkedinHandle: 'sarah-rodriguez-swe',
    twitterHandle: 'sarahcodes'
  },
  {
    id: 'mike-johnson',
    name: 'Mike Johnson',
    email: 'mjohnson@netflix.com',
    company: 'Netflix',
    title: 'VP Engineering',
    location: 'Los Gatos, CA',
    linkedinHandle: 'mike-johnson-netflix'
  },
  
  // Second degree connections (through Alex)
  {
    id: 'david-kim',
    name: 'David Kim',
    email: 'dkim@apple.com',
    company: 'Apple',
    title: 'Principal Engineer',
    location: 'Cupertino, CA',
    linkedinHandle: 'david-kim-apple',
    twitterHandle: 'dkim_ios'
  },
  {
    id: 'lisa-wang',
    name: 'Lisa Wang',
    email: 'lisa.wang@stripe.com',
    company: 'Stripe',
    title: 'Director of Product',
    location: 'San Francisco, CA',
    linkedinHandle: 'lisa-wang-stripe'
  },
  
  // Second degree connections (through Sarah)
  {
    id: 'james-wilson',
    name: 'James Wilson',
    email: 'jwilson@tesla.com',
    company: 'Tesla',
    title: 'Senior Data Scientist',
    location: 'Palo Alto, CA',
    linkedinHandle: 'james-wilson-data',
    githubHandle: 'jwilson-ml'
  },
  {
    id: 'emily-davis',
    name: 'Emily Davis',
    email: 'emily.davis@airbnb.com',
    company: 'Airbnb',
    title: 'Head of Growth',
    location: 'San Francisco, CA',
    linkedinHandle: 'emily-davis-growth'
  },
  
  // Third degree connections (target contacts)
  {
    id: 'john-doe',
    name: 'John Doe',
    email: 'john.doe@openai.com',
    company: 'OpenAI',
    title: 'Research Scientist',
    location: 'San Francisco, CA',
    linkedinHandle: 'john-doe-ai'
  },
  {
    id: 'maria-garcia',
    name: 'Maria Garcia',
    email: 'maria.garcia@anthropic.com',
    company: 'Anthropic',
    title: 'ML Engineer',
    location: 'San Francisco, CA',
    linkedinHandle: 'maria-garcia-ml'
  }
];

const demoRelationships = [
  // User's direct connections
  { fromPersonId: 'user-1', toPersonId: 'alex-chen', type: 'colleague', strength: 85, platform: 'linkedin' },
  { fromPersonId: 'user-1', toPersonId: 'sarah-rodriguez', type: 'colleague', strength: 90, platform: 'linkedin' },
  { fromPersonId: 'user-1', toPersonId: 'mike-johnson', type: 'professional', strength: 75, platform: 'linkedin' },
  
  // Alex's connections
  { fromPersonId: 'alex-chen', toPersonId: 'david-kim', type: 'colleague', strength: 80, platform: 'linkedin' },
  { fromPersonId: 'alex-chen', toPersonId: 'lisa-wang', type: 'professional', strength: 70, platform: 'linkedin' },
  
  // Sarah's connections
  { fromPersonId: 'sarah-rodriguez', toPersonId: 'james-wilson', type: 'colleague', strength: 85, platform: 'linkedin' },
  { fromPersonId: 'sarah-rodriguez', toPersonId: 'emily-davis', type: 'professional', strength: 75, platform: 'linkedin' },
  
  // Target connections (3rd degree)
  { fromPersonId: 'david-kim', toPersonId: 'john-doe', type: 'colleague', strength: 88, platform: 'linkedin' },
  { fromPersonId: 'james-wilson', toPersonId: 'maria-garcia', type: 'professional', strength: 82, platform: 'linkedin' },
  
  // Additional cross-connections for richer network
  { fromPersonId: 'mike-johnson', toPersonId: 'emily-davis', type: 'professional', strength: 65, platform: 'linkedin' },
  { fromPersonId: 'lisa-wang', toPersonId: 'james-wilson', type: 'professional', strength: 60, platform: 'linkedin' }
];

async function seedDemoNetwork() {
  try {
    console.log('🌱 Seeding demo network data...');
    
    // Clear existing data
    await db.delete(relationships);
    await db.delete(persons);
    
    // Insert demo persons
    console.log('📝 Inserting demo persons...');
    await db.insert(persons).values(demoPersons);
    
    // Insert demo relationships
    console.log('🔗 Inserting demo relationships...');
    await db.insert(relationships).values(demoRelationships);
    
    console.log('✅ Demo network seeded successfully!');
    console.log(`   - ${demoPersons.length} persons added`);
    console.log(`   - ${demoRelationships.length} relationships added`);
    console.log('');
    console.log('🎯 Try searching for these targets:');
    console.log('   - "John Doe" at OpenAI (3 hops via Alex → David)');
    console.log('   - "Maria Garcia" at Anthropic (3 hops via Sarah → James)');
    
  } catch (error) {
    console.error('❌ Error seeding demo network:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoNetwork()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedDemoNetwork };