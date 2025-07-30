import { db } from './db';
import { persons, relationshipEdges as relationships, users, socialAccounts } from '../shared/schema';

/**
 * Seed comprehensive demo data for connection finder engine
 * This creates a realistic network of professionals with various connection types
 */
export async function seedConnectionFinderDemo() {
  console.log('🌱 Seeding Connection Finder demo data...');

  try {
    // Clear existing data
    await db.delete(relationships);
    await db.delete(socialAccounts);
    await db.delete(persons);

    // Create demo users
    const demoUsers = await db.insert(users).values([
      { username: 'demo_user_1', password: 'demo123' },
      { username: 'demo_user_2', password: 'demo123' },
      { username: 'demo_user_3', password: 'demo123' }
    ]).returning();

    // Create comprehensive person network
    const demoPersons = await db.insert(persons).values([
      // Tech Industry - Primary User Network
      {
        id: 'user-1',
        name: 'Sarah Chen',
        company: 'TechCorp Solutions',
        title: 'Senior Software Engineer',
        email: 'sarah.chen@techcorp.com',
        userId: demoUsers[0].id
      },
      {
        id: 'person-1',
        name: 'Michael Rodriguez',
        company: 'TechCorp Solutions',
        title: 'Engineering Manager',
        email: 'michael.r@techcorp.com',
        userId: null
      },
      {
        id: 'person-2',
        name: 'Emily Wang',
        company: 'TechCorp Solutions',
        title: 'Product Manager',
        email: 'emily.wang@techcorp.com',
        userId: null
      },
      {
        id: 'person-3',
        name: 'David Kim',
        company: 'StartupXYZ',
        title: 'Founder & CEO',
        email: 'david@startupxyz.com',
        userId: null
      },
      {
        id: 'person-4',
        name: 'Lisa Thompson',
        company: 'StartupXYZ',
        title: 'Head of Marketing',
        email: 'lisa@startupxyz.com',
        userId: null
      },

      // Finance Industry Network
      {
        id: 'person-5',
        name: 'Robert Johnson',
        company: 'Goldman Sachs',
        title: 'Investment Banker',
        email: 'robert.johnson@gs.com',
        userId: null
      },
      {
        id: 'person-6',
        name: 'Jennifer Davis',
        company: 'Goldman Sachs',
        title: 'Vice President',
        email: 'jennifer.davis@gs.com',
        userId: null
      },
      {
        id: 'person-7',
        name: 'Alex Martinez',
        company: 'JPMorgan Chase',
        title: 'Senior Analyst',
        email: 'alex.martinez@jpmorgan.com',
        userId: null
      },

      // Consulting Network
      {
        id: 'person-8',
        name: 'Rachel Green',
        company: 'McKinsey & Company',
        title: 'Principal',
        email: 'rachel.green@mckinsey.com',
        userId: null
      },
      {
        id: 'person-9',
        name: 'James Wilson',
        company: 'McKinsey & Company',
        title: 'Associate Partner',
        email: 'james.wilson@mckinsey.com',
        userId: null
      },
      {
        id: 'person-10',
        name: 'Maria Garcia',
        company: 'Boston Consulting Group',
        title: 'Senior Consultant',
        email: 'maria.garcia@bcg.com',
        userId: null
      },

      // Healthcare/Biotech
      {
        id: 'person-11',
        name: 'Dr. Kevin Liu',
        company: 'Genentech',
        title: 'Research Scientist',
        email: 'kevin.liu@gene.com',
        userId: null
      },
      {
        id: 'person-12',
        name: 'Amanda Foster',
        company: 'Pfizer',
        title: 'Clinical Research Manager',
        email: 'amanda.foster@pfizer.com',
        userId: null
      },

      // Education/Academic Network
      {
        id: 'person-13',
        name: 'Professor John Smith',
        company: 'Stanford University',
        title: 'Computer Science Professor',
        email: 'jsmith@stanford.edu',
        userId: null
      },
      {
        id: 'person-14',
        name: 'Dr. Susan Brown',
        company: 'MIT',
        title: 'Associate Professor',
        email: 'sbrown@mit.edu',
        userId: null
      },

      // Entertainment/Media
      {
        id: 'person-15',
        name: 'Tom Anderson',
        company: 'Netflix',
        title: 'Content Strategy Director',
        email: 'tom.anderson@netflix.com',
        userId: null
      },
      {
        id: 'person-16',
        name: 'Sofia Reyes',
        company: 'Disney',
        title: 'Creative Producer',
        email: 'sofia.reyes@disney.com',
        userId: null
      }
    ]).returning();

    // Create realistic relationships
    await db.insert(relationships).values([
      // Company connections (same company)
      {
        fromId: 'user-1',
        toId: 'person-1',
        type: 'coworker',
        confidenceScore: 8
      },
      {
        fromId: 'user-1',
        toId: 'person-2',
        type: 'coworker',
        confidenceScore: 7
      },
      {
        fromId: 'person-1',
        toId: 'person-2',
        type: 'coworker',
        confidenceScore: 6
      },

      // College/Education connections
      {
        fromId: 'user-1',
        toId: 'person-3',
        type: 'college',
        confidenceScore: 7
      },
      {
        fromId: 'person-3',
        toId: 'person-4',
        type: 'coworker',
        confidenceScore: 9
      },
      {
        fromId: 'user-1',
        toId: 'person-13',
        type: 'professor',
        confidenceScore: 5
      },
      {
        fromId: 'person-13',
        toId: 'person-14',
        type: 'colleague',
        confidenceScore: 6
      },

      // Industry connections (tech to finance)
      {
        fromId: 'person-2',
        toId: 'person-5',
        type: 'friend',
        confidenceScore: 6
      },
      {
        fromId: 'person-5',
        toId: 'person-6',
        type: 'coworker',
        confidenceScore: 8
      },
      {
        fromId: 'person-6',
        toId: 'person-7',
        type: 'industry',
        confidenceScore: 5
      },

      // Consulting network
      {
        fromId: 'person-5',
        toId: 'person-8',
        type: 'client',
        confidenceScore: 7
      },
      {
        fromId: 'person-8',
        toId: 'person-9',
        type: 'coworker',
        confidenceScore: 8
      },
      {
        fromId: 'person-9',
        toId: 'person-10',
        type: 'industry',
        confidenceScore: 6
      },

      // Healthcare connections
      {
        fromId: 'person-8',
        toId: 'person-11',
        type: 'client',
        confidenceScore: 6
      },
      {
        fromId: 'person-11',
        toId: 'person-12',
        type: 'industry',
        confidenceScore: 7
      },

      // Academic to industry bridge
      {
        fromId: 'person-14',
        toId: 'person-3',
        type: 'advisor',
        confidenceScore: 7
      },
      {
        fromId: 'person-13',
        toId: 'person-15',
        type: 'alumni',
        confidenceScore: 5
      },

      // Media/Entertainment connections
      {
        fromId: 'person-15',
        toId: 'person-16',
        type: 'industry',
        confidenceScore: 6
      },

      // Cross-industry family/personal connections
      {
        fromId: 'person-4',
        toId: 'person-12',
        type: 'family',
        confidenceScore: 10
      },
      {
        fromId: 'person-7',
        toId: 'person-16',
        type: 'spouse',
        confidenceScore: 10
      },

      // Alumni networks
      {
        fromId: 'person-5',
        toId: 'person-8',
        type: 'college',
        confidenceScore: 6
      },
      {
        fromId: 'person-3',
        toId: 'person-11',
        type: 'college',
        confidenceScore: 5
      }
    ]);

    // Create social media connections
    await db.insert(socialAccounts).values([
      {
        userId: demoUsers[0].id,
        platform: 'linkedin',
        accountId: 'sarah-chen-tech',
        accessToken: 'demo_token_1',
        profileId: 'sarah_chen_linkedin',
        profileData: JSON.stringify({
          name: 'Sarah Chen',
          headline: 'Senior Software Engineer at TechCorp',
          connections: 500
        }),
        connectionCount: 500
      },
      {
        userId: null,
        platform: 'linkedin',
        accountId: 'michael-rodriguez-eng',
        accessToken: 'demo_token_2',
        profileId: 'michael_rodriguez_linkedin',
        profileData: JSON.stringify({
          name: 'Michael Rodriguez',
          headline: 'Engineering Manager at TechCorp',
          connections: 750
        }),
        connectionCount: 750
      },
      {
        userId: null,
        platform: 'twitter',
        accountId: 'david_kim_startup',
        accessToken: 'demo_token_3',
        profileId: 'david_kim_twitter',
        profileData: JSON.stringify({
          name: 'David Kim',
          bio: 'Founder & CEO at StartupXYZ. Building the future.',
          followers: 1200
        }),
        connectionCount: 1200
      }
    ]);

    console.log('✅ Connection Finder demo data seeded successfully!');
    console.log(`Created ${demoPersons.length} persons with realistic professional network`);
    console.log('Network includes: Tech, Finance, Consulting, Healthcare, Academic, and Media professionals');
    console.log('Connection types: coworker, college, family, spouse, industry, client, advisor, alumni');
    
    return {
      persons: demoPersons.length,
      relationships: 20,
      socialAccounts: 3,
      primaryUser: 'user-1'
    };

  } catch (error) {
    console.error('❌ Error seeding connection finder demo:', error);
    throw error;
  }
}

// Function to get demo network statistics
export async function getDemoNetworkStats() {
  const personCount = await db.select().from(persons);
  const relationshipCount = await db.select().from(relationships);
  const socialAccountCount = await db.select().from(socialAccounts);

  return {
    totalPersons: personCount.length,
    totalRelationships: relationshipCount.length,
    totalSocialAccounts: socialAccountCount.length,
    networkDensity: relationshipCount.length / (personCount.length * (personCount.length - 1) / 2),
    averageConnections: relationshipCount.length / personCount.length
  };
}