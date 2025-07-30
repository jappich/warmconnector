import { db } from '../db';
import { persons, relationships, users } from '../../shared/schema';
import { faker } from '@faker-js/faker';

interface DemoPersonProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  industry: string;
  location: string;
  education: string;
  greekLife?: string;
  hometown: string;
  socialProfiles: Record<string, string>;
  skills: string[];
  interests: string[];
}

interface DemoRelationship {
  fromPersonId: string;
  toPersonId: string;
  relationshipType: 'coworker' | 'education' | 'family' | 'greek_life' | 'hometown' | 'social';
  strength: number;
  metadata: Record<string, any>;
}

export class ComprehensiveDemoSeeder {
  private demoPersons: DemoPersonProfile[] = [];
  private demoRelationships: DemoRelationship[] = [];

  async seedComprehensiveNetworkData(): Promise<{
    personsCreated: number;
    relationshipsCreated: number;
    networkStats: {
      totalConnections: number;
      connectionsByType: Record<string, number>;
      companiesRepresented: number;
      universitiesRepresented: number;
    };
  }> {
    console.log('Starting comprehensive demo data seeding...');

    // Generate realistic professional profiles
    await this.generateProfessionalProfiles();
    
    // Create multi-layered relationships
    await this.generateRealisticRelationships();
    
    // Insert into database
    await this.insertDemoData();
    
    // Generate network statistics
    const networkStats = await this.calculateNetworkStats();
    
    return {
      personsCreated: this.demoPersons.length,
      relationshipsCreated: this.demoRelationships.length,
      networkStats
    };
  }

  private async generateProfessionalProfiles(): Promise<void> {
    const companies = [
      'Microsoft', 'Google', 'Amazon', 'Apple', 'Meta',
      'Netflix', 'Salesforce', 'Adobe', 'Tesla', 'SpaceX',
      'Goldman Sachs', 'JPMorgan Chase', 'McKinsey & Company',
      'Boston Consulting Group', 'Deloitte', 'PwC', 'EY', 'KPMG',
      'Johnson & Johnson', 'Pfizer', 'Moderna', 'Stripe',
      'Airbnb', 'Uber', 'Lyft', 'DoorDash', 'Instacart'
    ];

    const universities = [
      'Stanford University', 'Harvard University', 'MIT',
      'University of California Berkeley', 'Yale University',
      'Princeton University', 'Columbia University', 'NYU',
      'University of Pennsylvania', 'Duke University',
      'Northwestern University', 'University of Chicago',
      'Carnegie Mellon University', 'Cornell University'
    ];

    const greekOrganizations = [
      'Alpha Phi Alpha', 'Beta Theta Pi', 'Delta Tau Delta',
      'Kappa Alpha Psi', 'Lambda Chi Alpha', 'Phi Beta Sigma',
      'Alpha Chi Omega', 'Delta Delta Delta', 'Kappa Kappa Gamma',
      'Pi Beta Phi', 'Sigma Delta Tau'
    ];

    const techSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'AWS',
      'Machine Learning', 'Data Science', 'Product Management',
      'UI/UX Design', 'DevOps', 'Kubernetes', 'Docker'
    ];

    // Create the demo user first
    this.demoPersons.push({
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
      socialProfiles: {
        linkedin: 'linkedin.com/in/alexmorgan',
        twitter: 'twitter.com/alexmorgan'
      },
      skills: ['Product Management', 'User Research', 'Analytics'],
      interests: ['Technology', 'Startups', 'Rock Climbing']
    });

    // Generate 150 additional professional profiles
    for (let i = 0; i < 150; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const company = faker.helpers.arrayElement(companies);
      const university = faker.helpers.arrayElement(universities);
      
      const person: DemoPersonProfile = {
        id: `person_${i + 2}`,
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }),
        company,
        title: this.generateRealisticTitle(company),
        industry: this.mapCompanyToIndustry(company),
        location: faker.location.city() + ', ' + faker.location.state({ abbreviated: true }),
        education: university,
        greekLife: faker.datatype.boolean(0.3) ? faker.helpers.arrayElement(greekOrganizations) : undefined,
        hometown: faker.location.city() + ', ' + faker.location.state({ abbreviated: true }),
        socialProfiles: {
          linkedin: `linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
          twitter: faker.datatype.boolean(0.6) ? `twitter.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : ''
        },
        skills: faker.helpers.arrayElements(techSkills, { min: 2, max: 5 }),
        interests: faker.helpers.arrayElements([
          'Technology', 'Travel', 'Photography', 'Music', 'Sports',
          'Reading', 'Cooking', 'Hiking', 'Art', 'Entrepreneurship'
        ], { min: 2, max: 4 })
      };

      this.demoPersons.push(person);
    }
  }

  private generateRealisticTitle(company: string): string {
    const techTitles = [
      'Software Engineer', 'Senior Software Engineer', 'Staff Engineer',
      'Product Manager', 'Senior Product Manager', 'Engineering Manager',
      'Data Scientist', 'UX Designer', 'DevOps Engineer'
    ];

    const financeTitles = [
      'Investment Banking Analyst', 'Associate', 'Vice President',
      'Managing Director', 'Portfolio Manager', 'Risk Analyst'
    ];

    const consultingTitles = [
      'Business Analyst', 'Associate', 'Senior Associate',
      'Principal', 'Partner', 'Managing Director'
    ];

    if (['Microsoft', 'Google', 'Amazon', 'Apple', 'Meta'].includes(company)) {
      return faker.helpers.arrayElement(techTitles);
    } else if (['Goldman Sachs', 'JPMorgan Chase'].includes(company)) {
      return faker.helpers.arrayElement(financeTitles);
    } else if (['McKinsey & Company', 'Boston Consulting Group'].includes(company)) {
      return faker.helpers.arrayElement(consultingTitles);
    }

    return faker.helpers.arrayElement(techTitles);
  }

  private mapCompanyToIndustry(company: string): string {
    const industryMap: Record<string, string> = {
      'Microsoft': 'Technology',
      'Google': 'Technology',
      'Amazon': 'E-commerce',
      'Apple': 'Technology',
      'Meta': 'Social Media',
      'Goldman Sachs': 'Financial Services',
      'JPMorgan Chase': 'Banking',
      'McKinsey & Company': 'Consulting',
      'Johnson & Johnson': 'Healthcare',
      'Tesla': 'Automotive'
    };

    return industryMap[company] || 'Technology';
  }

  private async generateRealisticRelationships(): Promise<void> {
    // Create coworker relationships
    this.createCoworkerConnections();
    
    // Create education-based relationships
    this.createEducationConnections();
    
    // Create Greek life connections
    this.createGreekLifeConnections();
    
    // Create hometown connections
    this.createHometownConnections();
    
    // Create social media connections
    this.createSocialConnections();
    
    // Create family connections (limited)
    this.createFamilyConnections();
  }

  private createCoworkerConnections(): void {
    // Group by company
    const companiesMap = new Map<string, DemoPersonProfile[]>();
    
    this.demoPersons.forEach(person => {
      if (!companiesMap.has(person.company)) {
        companiesMap.set(person.company, []);
      }
      companiesMap.get(person.company)!.push(person);
    });

    // Create connections within companies
    for (const [company, employees] of companiesMap) {
      for (let i = 0; i < employees.length; i++) {
        for (let j = i + 1; j < employees.length; j++) {
          // 70% chance of coworker connection
          if (faker.datatype.boolean(0.7)) {
            this.demoRelationships.push({
              fromPersonId: employees[i].id,
              toPersonId: employees[j].id,
              relationshipType: 'coworker',
              strength: faker.number.int({ min: 60, max: 90 }),
              metadata: {
                company,
                connectionDate: faker.date.past({ years: 3 }),
                workedTogether: true
              }
            });
          }
        }
      }
    }
  }

  private createEducationConnections(): void {
    const universitiesMap = new Map<string, DemoPersonProfile[]>();
    
    this.demoPersons.forEach(person => {
      if (!universitiesMap.has(person.education)) {
        universitiesMap.set(person.education, []);
      }
      universitiesMap.get(person.education)!.push(person);
    });

    for (const [university, alumni] of universitiesMap) {
      for (let i = 0; i < alumni.length; i++) {
        // Connect to 2-4 random alumni
        const connectionCount = faker.number.int({ min: 2, max: 4 });
        const availableAlumni = alumni.filter((_, index) => index !== i);
        const selectedAlumni = faker.helpers.arrayElements(availableAlumni, connectionCount);

        selectedAlumni.forEach(alumnus => {
          this.demoRelationships.push({
            fromPersonId: alumni[i].id,
            toPersonId: alumnus.id,
            relationshipType: 'education',
            strength: faker.number.int({ min: 50, max: 80 }),
            metadata: {
              university,
              graduationYear: faker.date.past({ years: 10 }).getFullYear(),
              sameProgram: faker.datatype.boolean(0.4)
            }
          });
        });
      }
    }
  }

  private createGreekLifeConnections(): void {
    const greekMap = new Map<string, DemoPersonProfile[]>();
    
    this.demoPersons.forEach(person => {
      if (person.greekLife) {
        if (!greekMap.has(person.greekLife)) {
          greekMap.set(person.greekLife, []);
        }
        greekMap.get(person.greekLife)!.push(person);
      }
    });

    for (const [organization, members] of greekMap) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          // 80% chance of Greek life connection
          if (faker.datatype.boolean(0.8)) {
            this.demoRelationships.push({
              fromPersonId: members[i].id,
              toPersonId: members[j].id,
              relationshipType: 'greek_life',
              strength: faker.number.int({ min: 65, max: 85 }),
              metadata: {
                organization,
                pledge_class: faker.date.past({ years: 8 }).getFullYear(),
                active_together: faker.datatype.boolean(0.6)
              }
            });
          }
        }
      }
    }
  }

  private createHometownConnections(): void {
    const hometownMap = new Map<string, DemoPersonProfile[]>();
    
    this.demoPersons.forEach(person => {
      if (!hometownMap.has(person.hometown)) {
        hometownMap.set(person.hometown, []);
      }
      hometownMap.get(person.hometown)!.push(person);
    });

    for (const [hometown, residents] of hometownMap) {
      for (let i = 0; i < residents.length; i++) {
        // Connect to 1-2 people from hometown
        const connectionCount = Math.min(faker.number.int({ min: 1, max: 2 }), residents.length - 1);
        const availableResidents = residents.filter((_, index) => index !== i);
        const selectedResidents = faker.helpers.arrayElements(availableResidents, connectionCount);

        selectedResidents.forEach(resident => {
          this.demoRelationships.push({
            fromPersonId: residents[i].id,
            toPersonId: resident.id,
            relationshipType: 'hometown',
            strength: faker.number.int({ min: 40, max: 70 }),
            metadata: {
              hometown,
              connection_type: faker.helpers.arrayElement(['high_school', 'family_friend', 'neighbor']),
              years_known: faker.number.int({ min: 5, max: 20 })
            }
          });
        });
      }
    }
  }

  private createSocialConnections(): void {
    // Create random social connections (LinkedIn, mutual interests)
    for (let i = 0; i < 200; i++) {
      const person1 = faker.helpers.arrayElement(this.demoPersons);
      const person2 = faker.helpers.arrayElement(this.demoPersons.filter(p => p.id !== person1.id));

      // Check if they have mutual interests or similar backgrounds
      const hasCommonInterests = person1.interests.some(interest => person2.interests.includes(interest));
      const hasCommonSkills = person1.skills.some(skill => person2.skills.includes(skill));

      if (hasCommonInterests || hasCommonSkills) {
        this.demoRelationships.push({
          fromPersonId: person1.id,
          toPersonId: person2.id,
          relationshipType: 'social',
          strength: faker.number.int({ min: 30, max: 60 }),
          metadata: {
            platform: 'linkedin',
            common_interests: person1.interests.filter(interest => person2.interests.includes(interest)),
            connection_date: faker.date.past({ years: 2 })
          }
        });
      }
    }
  }

  private createFamilyConnections(): void {
    // Create a few family connections for demo purposes
    for (let i = 0; i < 10; i++) {
      const person1 = faker.helpers.arrayElement(this.demoPersons);
      const person2 = faker.helpers.arrayElement(this.demoPersons.filter(p => p.id !== person1.id));

      this.demoRelationships.push({
        fromPersonId: person1.id,
        toPersonId: person2.id,
        relationshipType: 'family',
        strength: faker.number.int({ min: 80, max: 95 }),
        metadata: {
          relationship: faker.helpers.arrayElement(['sibling', 'cousin', 'uncle', 'aunt']),
          family_name: faker.person.lastName()
        }
      });
    }
  }

  private async insertDemoData(): Promise<void> {
    console.log('Inserting demo persons into database...');
    
    // Insert persons
    for (const person of this.demoPersons) {
      await db.insert(persons).values({
        id: person.id,
        name: person.name,
        email: person.email,
        company: person.company,
        title: person.title,
        industry: person.industry,
        location: person.location,
        education: person.education,
        greekLife: person.greekLife || null,
        hometown: person.hometown,
        socialProfiles: JSON.stringify(person.socialProfiles),
        skills: JSON.stringify(person.skills),
        interests: JSON.stringify(person.interests),
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    }

    console.log('Inserting demo relationships into database...');
    
    // Insert relationships
    for (const relationship of this.demoRelationships) {
      await db.insert(relationships).values({
        id: `rel_${relationship.fromPersonId}_${relationship.toPersonId}`,
        fromPersonId: relationship.fromPersonId,
        toPersonId: relationship.toPersonId,
        relationshipType: relationship.relationshipType,
        strength: relationship.strength,
        metadata: JSON.stringify(relationship.metadata),
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    }

    // Create a demo user record
    await db.insert(users).values({
      id: 'demo_user_1',
      email: 'alex.morgan@warmconnector.com',
      name: 'Alex Morgan',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
  }

  private async calculateNetworkStats(): Promise<{
    totalConnections: number;
    connectionsByType: Record<string, number>;
    companiesRepresented: number;
    universitiesRepresented: number;
  }> {
    const connectionsByType: Record<string, number> = {};
    
    this.demoRelationships.forEach(rel => {
      connectionsByType[rel.relationshipType] = (connectionsByType[rel.relationshipType] || 0) + 1;
    });

    const companies = new Set(this.demoPersons.map(p => p.company));
    const universities = new Set(this.demoPersons.map(p => p.education));

    return {
      totalConnections: this.demoRelationships.length,
      connectionsByType,
      companiesRepresented: companies.size,
      universitiesRepresented: universities.size
    };
  }
}

export const comprehensiveDemoSeeder = new ComprehensiveDemoSeeder();