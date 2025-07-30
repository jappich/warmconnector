import { db } from '../db';
import { persons, relationshipEdges as relationships, users } from '../../shared/schema';

export class SimpleDemoSeeder {
  async seedRealisticNetworkingData(): Promise<{
    personsCreated: number;
    relationshipsCreated: number;
    networkStats: {
      totalConnections: number;
      connectionsByType: Record<string, number>;
      companiesRepresented: number;
    };
  }> {
    console.log('Seeding realistic professional networking data...');

    // Create comprehensive professional profiles
    const professionalProfiles = [
      // Demo user
      {
        id: 'demo_user_1',
        name: 'Alex Morgan',
        email: 'alex.morgan@warmconnector.com',
        company: 'WarmConnector',
        title: 'Product Manager',
        industry: 'Technology',
        location: 'San Francisco, CA',
        education: 'Stanford University',
        greekLife: 'Beta Theta Pi',
        hometown: 'Austin, TX',
        socialProfiles: JSON.stringify({
          linkedin: 'linkedin.com/in/alexmorgan',
          twitter: 'twitter.com/alexmorgan'
        }),
        skills: JSON.stringify(['Product Management', 'User Research', 'Analytics']),
        interests: JSON.stringify(['Technology', 'Startups', 'Rock Climbing'])
      },
      // Google employees
      {
        id: 'person_2',
        name: 'Sarah Chen',
        email: 'sarah.chen@google.com',
        company: 'Google',
        title: 'Senior Software Engineer',
        industry: 'Technology',
        location: 'Mountain View, CA',
        education: 'MIT',
        greekLife: null,
        hometown: 'Seattle, WA',
        socialProfiles: JSON.stringify({
          linkedin: 'linkedin.com/in/sarahchen',
          twitter: 'twitter.com/sarahchen'
        }),
        skills: JSON.stringify(['JavaScript', 'Python', 'Machine Learning']),
        interests: JSON.stringify(['AI', 'Photography', 'Hiking'])
      },
      {
        id: 'person_3',
        name: 'Michael Rodriguez',
        email: 'michael.rodriguez@google.com',
        company: 'Google',
        title: 'Product Manager',
        industry: 'Technology',
        location: 'Mountain View, CA',
        education: 'Stanford University',
        greekLife: 'Beta Theta Pi',
        hometown: 'Los Angeles, CA',
        socialProfiles: JSON.stringify({
          linkedin: 'linkedin.com/in/michaelrodriguez'
        }),
        skills: JSON.stringify(['Product Strategy', 'Data Analysis', 'Leadership']),
        interests: JSON.stringify(['Technology', 'Sports', 'Travel'])
      },
      // Microsoft employees
      {
        id: 'person_4',
        name: 'Emily Watson',
        email: 'emily.watson@microsoft.com',
        company: 'Microsoft',
        title: 'Engineering Manager',
        industry: 'Technology',
        location: 'Seattle, WA',
        education: 'University of Washington',
        greekLife: null,
        hometown: 'Portland, OR',
        socialProfiles: JSON.stringify({
          linkedin: 'linkedin.com/in/emilywatson'
        }),
        skills: JSON.stringify(['Team Leadership', 'Software Architecture', 'Azure']),
        interests: JSON.stringify(['Technology', 'Mentoring', 'Coffee'])
      },
      {
        id: 'person_5',
        name: 'David Kim',
        email: 'david.kim@microsoft.com',
        company: 'Microsoft',
        title: 'Senior Developer',
        industry: 'Technology',
        location: 'Seattle, WA',
        education: 'MIT',
        greekLife: null,
        hometown: 'Austin, TX',
        socialProfiles: JSON.stringify({
          linkedin: 'linkedin.com/in/davidkim'
        }),
        skills: JSON.stringify(['C#', 'Azure', 'DevOps']),
        interests: JSON.stringify(['Technology', 'Gaming', 'Music'])
      },
      // Stanford alumni
      {
        id: 'person_6',
        name: 'Jessica Park',
        email: 'jessica.park@meta.com',
        company: 'Meta',
        title: 'UX Designer',
        industry: 'Technology',
        location: 'Menlo Park, CA',
        education: 'Stanford University',
        greekLife: null,
        hometown: 'San Diego, CA',
        socialProfiles: JSON.stringify({
          linkedin: 'linkedin.com/in/jessicapark'
        }),
        skills: JSON.stringify(['UI/UX Design', 'Figma', 'User Research']),
        interests: JSON.stringify(['Design', 'Art', 'Travel'])
      },
      // Greek life connection
      {
        id: 'person_7',
        name: 'Ryan Thompson',
        email: 'ryan.thompson@salesforce.com',
        company: 'Salesforce',
        title: 'Account Executive',
        industry: 'Technology',
        location: 'San Francisco, CA',
        education: 'UC Berkeley',
        greekLife: 'Beta Theta Pi',
        hometown: 'Denver, CO',
        socialProfiles: JSON.stringify({
          linkedin: 'linkedin.com/in/ryanthompson'
        }),
        skills: JSON.stringify(['Sales', 'CRM', 'Relationship Building']),
        interests: JSON.stringify(['Sales', 'Networking', 'Skiing'])
      },
      // Hometown connection
      {
        id: 'person_8',
        name: 'Amanda Johnson',
        email: 'amanda.johnson@apple.com',
        company: 'Apple',
        title: 'Marketing Manager',
        industry: 'Technology',
        location: 'Cupertino, CA',
        education: 'UT Austin',
        greekLife: null,
        hometown: 'Austin, TX',
        socialProfiles: JSON.stringify({
          linkedin: 'linkedin.com/in/amandajohnson'
        }),
        skills: JSON.stringify(['Marketing', 'Brand Management', 'Analytics']),
        interests: JSON.stringify(['Marketing', 'Music', 'Food'])
      }
    ];

    // Insert persons
    for (const person of professionalProfiles) {
      await db.insert(persons).values({
        id: person.id,
        name: person.name,
        email: person.email,
        company: person.company,
        title: person.title,
        industry: person.industry,
        location: person.location,
        education: person.education,
        greekLife: person.greekLife,
        hometown: person.hometown,
        socialProfiles: person.socialProfiles,
        skills: person.skills,
        interests: person.interests,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    }

    // Create realistic relationships
    const relationships_data = [
      // Alex (demo_user_1) connections
      // Coworker at previous company (Stanford connection)
      {
        fromId: 'demo_user_1',
        toId: 'person_3', // Michael at Google, Stanford + Greek life
        type: 'education',
        confidenceScore: 80,
        evidence: JSON.stringify({
          university: 'Stanford University',
          graduationYear: 2018,
          sameProgram: true
        })
      },
      {
        fromId: 'demo_user_1',
        toId: 'person_3',
        type: 'greek_life',
        confidenceScore: 85,
        evidence: JSON.stringify({
          organization: 'Beta Theta Pi',
          pledge_class: 2016,
          active_together: true
        })
      },
      // Greek life connection
      {
        fromId: 'demo_user_1',
        toId: 'person_7', // Ryan at Salesforce
        type: 'greek_life',
        confidenceScore: 75,
        evidence: JSON.stringify({
          organization: 'Beta Theta Pi',
          pledge_class: 2015,
          active_together: false
        })
      },
      // Hometown connection
      {
        fromId: 'demo_user_1',
        toId: 'person_5', // David at Microsoft
        type: 'hometown',
        confidenceScore: 60,
        evidence: JSON.stringify({
          hometown: 'Austin, TX',
          connection_type: 'family_friend',
          years_known: 15
        })
      },
      {
        fromId: 'demo_user_1',
        toId: 'person_8', // Amanda at Apple
        type: 'hometown',
        confidenceScore: 65,
        evidence: JSON.stringify({
          hometown: 'Austin, TX',
          connection_type: 'high_school',
          years_known: 12
        })
      },
      // Stanford connection
      {
        fromId: 'demo_user_1',
        toId: 'person_6', // Jessica at Meta
        type: 'education',
        confidenceScore: 70,
        evidence: JSON.stringify({
          university: 'Stanford University',
          graduationYear: 2018,
          sameProgram: false
        })
      },
      // Second-degree connections (Michael's connections)
      {
        fromId: 'person_3', // Michael at Google
        toId: 'person_2', // Sarah at Google
        type: 'coworker',
        confidenceScore: 90,
        evidence: JSON.stringify({
          company: 'Google',
          connectionDate: '2020-01-15',
          workedTogether: true
        })
      },
      // David's connection to Emily (both at Microsoft)
      {
        fromId: 'person_5', // David at Microsoft
        toId: 'person_4', // Emily at Microsoft
        type: 'coworker',
        confidenceScore: 85,
        evidence: JSON.stringify({
          company: 'Microsoft',
          connectionDate: '2019-03-10',
          workedTogether: true
        })
      },
      // MIT alumni connection
      {
        fromId: 'person_2', // Sarah at Google
        toId: 'person_5', // David at Microsoft
        type: 'education',
        confidenceScore: 65,
        evidence: JSON.stringify({
          university: 'MIT',
          graduationYear: 2017,
          sameProgram: true
        })
      }
    ];

    // Insert relationships
    for (const relationship of relationships_data) {
      await db.insert(relationships).values(relationship).onConflictDoNothing();
    }

    // Create demo user record
    await db.insert(users).values({
      email: 'alex.morgan@warmconnector.com',
      name: 'Alex Morgan',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();

    // Calculate network statistics
    const connectionsByType: Record<string, number> = {};
    relationships_data.forEach(rel => {
      connectionsByType[rel.relationshipType] = (connectionsByType[rel.relationshipType] || 0) + 1;
    });

    const companies = new Set(professionalProfiles.map(p => p.company));

    return {
      personsCreated: professionalProfiles.length,
      relationshipsCreated: relationships_data.length,
      networkStats: {
        totalConnections: relationships_data.length,
        connectionsByType,
        companiesRepresented: companies.size
      }
    };
  }
}

export const simpleDemoSeeder = new SimpleDemoSeeder();