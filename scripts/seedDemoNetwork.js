import { db } from '../server/db.ts';
import { persons, relationshipEdges as relationships } from '../shared/schema.ts';

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
  { fromId: 'user-1', toId: 'alex-chen', type: 'colleague', confidenceScore: 85 },
  { fromId: 'user-1', toId: 'sarah-rodriguez', type: 'colleague', confidenceScore: 90 },
  { fromId: 'user-1', toId: 'mike-johnson', type: 'professional', confidenceScore: 75 },
  
  // Alex's connections
  { fromId: 'alex-chen', toId: 'david-kim', type: 'colleague', confidenceScore: 80 },
  { fromId: 'alex-chen', toId: 'lisa-wang', type: 'professional', confidenceScore: 70 },
  
  // Sarah's connections
  { fromId: 'sarah-rodriguez', toId: 'james-wilson', type: 'colleague', confidenceScore: 85 },
  { fromId: 'sarah-rodriguez', toId: 'emily-davis', type: 'professional', confidenceScore: 75 },
  
  // Target connections (3rd degree)
  { fromId: 'david-kim', toId: 'john-doe', type: 'colleague', confidenceScore: 88 },
  { fromId: 'james-wilson', toId: 'maria-garcia', type: 'professional', confidenceScore: 82 },
  
  // Additional cross-connections for richer network
  { fromId: 'mike-johnson', toId: 'emily-davis', type: 'professional', confidenceScore: 65 },
  { fromId: 'lisa-wang', toId: 'james-wilson', type: 'professional', confidenceScore: 60 }
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