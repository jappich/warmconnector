import { db } from '../db';
import { persons, relationships, users } from '../../shared/schema';

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
        fromPersonId: 'demo_user_1',
        toPersonId: 'person_3', // Michael at Google, Stanford + Greek life
        relationshipType: 'education',
        strength: 80,
        metadata: JSON.stringify({
          university: 'Stanford University',
          graduationYear: 2018,
          sameProgram: true
        })
      },
      {
        fromPersonId: 'demo_user_1',
        toPersonId: 'person_3',
        relationshipType: 'greek_life',
        strength: 85,
        metadata: JSON.stringify({
          organization: 'Beta Theta Pi',
          pledge_class: 2016,
          active_together: true
        })
      },
      // Greek life connection
      {
        fromPersonId: 'demo_user_1',
        toPersonId: 'person_7', // Ryan at Salesforce
        relationshipType: 'greek_life',
        strength: 75,
        metadata: JSON.stringify({
          organization: 'Beta Theta Pi',
          pledge_class: 2015,
          active_together: false
        })
      },
      // Hometown connection
      {
        fromPersonId: 'demo_user_1',
        toPersonId: 'person_5', // David at Microsoft
        relationshipType: 'hometown',
        strength: 60,
        metadata: JSON.stringify({
          hometown: 'Austin, TX',
          connection_type: 'family_friend',
          years_known: 15
        })
      },
      {
        fromPersonId: 'demo_user_1',
        toPersonId: 'person_8', // Amanda at Apple
        relationshipType: 'hometown',
        strength: 65,
        metadata: JSON.stringify({
          hometown: 'Austin, TX',
          connection_type: 'high_school',
          years_known: 12
        })
      },
      // Stanford connection
      {
        fromPersonId: 'demo_user_1',
        toPersonId: 'person_6', // Jessica at Meta
        relationshipType: 'education',
        strength: 70,
        metadata: JSON.stringify({
          university: 'Stanford University',
          graduationYear: 2018,
          sameProgram: false
        })
      },
      // Second-degree connections (Michael's connections)
      {
        fromPersonId: 'person_3', // Michael at Google
        toPersonId: 'person_2', // Sarah at Google
        relationshipType: 'coworker',
        strength: 90,
        metadata: JSON.stringify({
          company: 'Google',
          connectionDate: '2020-01-15',
          workedTogether: true
        })
      },
      // David's connection to Emily (both at Microsoft)
      {
        fromPersonId: 'person_5', // David at Microsoft
        toPersonId: 'person_4', // Emily at Microsoft
        relationshipType: 'coworker',
        strength: 85,
        metadata: JSON.stringify({
          company: 'Microsoft',
          connectionDate: '2019-03-10',
          workedTogether: true
        })
      },
      // MIT alumni connection
      {
        fromPersonId: 'person_2', // Sarah at Google
        toPersonId: 'person_5', // David at Microsoft
        relationshipType: 'education',
        strength: 65,
        metadata: JSON.stringify({
          university: 'MIT',
          graduationYear: 2017,
          sameProgram: true
        })
      }
    ];

    // Insert relationships
    for (const relationship of relationships_data) {
      await db.insert(relationships).values({
        fromPersonId: relationship.fromPersonId,
        toPersonId: relationship.toPersonId,
        relationshipType: relationship.relationshipType,
        strength: relationship.strength,
        metadata: relationship.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
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