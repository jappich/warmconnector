import { db } from '../db';
import { persons, relationships } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface ProfessionalProfile {
  name: string;
  email: string;
  company: string;
  title: string;
  location: string;
  industry: string;
  skills: string[];
  linkedinUrl: string;
  experience: number;
}

export class EnhancedDemoSeeder {
  private profiles: ProfessionalProfile[] = [
    {
      name: "Sarah Chen",
      email: "sarah.chen@techcorp.com",
      company: "TechCorp Solutions",
      title: "Senior Software Engineer",
      location: "San Francisco, CA",
      industry: "Technology",
      skills: ["Python", "React", "Machine Learning", "AWS"],
      linkedinUrl: "https://linkedin.com/in/sarahchen",
      experience: 8
    },
    {
      name: "Marcus Rodriguez",
      email: "marcus.rodriguez@innovateai.com",
      company: "InnovateAI",
      title: "AI Research Director",
      location: "Boston, MA", 
      industry: "Artificial Intelligence",
      skills: ["Deep Learning", "TensorFlow", "Research", "Team Leadership"],
      linkedinUrl: "https://linkedin.com/in/marcusrodriguez",
      experience: 12
    },
    {
      name: "Emily Zhang",
      email: "emily.zhang@globalfinance.com",
      company: "Global Finance Corp",
      title: "VP of Digital Transformation",
      location: "New York, NY",
      industry: "Financial Services",
      skills: ["Digital Strategy", "Fintech", "Project Management", "Blockchain"],
      linkedinUrl: "https://linkedin.com/in/emilyzhang",
      experience: 15
    },
    {
      name: "David Kim",
      email: "david.kim@startupventures.com",
      company: "Startup Ventures",
      title: "Venture Partner",
      location: "Palo Alto, CA",
      industry: "Venture Capital",
      skills: ["Investment Analysis", "Due Diligence", "Portfolio Management", "Networking"],
      linkedinUrl: "https://linkedin.com/in/davidkim",
      experience: 10
    },
    {
      name: "Lisa Thompson",
      email: "lisa.thompson@healthtech.com",
      company: "HealthTech Innovations",
      title: "Chief Technology Officer",
      location: "Seattle, WA",
      industry: "Healthcare Technology",
      skills: ["Healthcare IT", "HIPAA Compliance", "Cloud Architecture", "Team Building"],
      linkedinUrl: "https://linkedin.com/in/lisathompson",
      experience: 18
    },
    {
      name: "James Wilson",
      email: "james.wilson@greenenergy.com",
      company: "Green Energy Solutions",
      title: "Head of Business Development",
      location: "Austin, TX",
      industry: "Renewable Energy",
      skills: ["Business Development", "Sustainability", "Partnership Strategy", "Sales"],
      linkedinUrl: "https://linkedin.com/in/jameswilson",
      experience: 13
    },
    {
      name: "Rachel Brown",
      email: "rachel.brown@edutech.com",
      company: "EduTech Platform",
      title: "Product Manager",
      location: "Chicago, IL",
      industry: "Education Technology",
      skills: ["Product Strategy", "User Experience", "Agile", "Data Analytics"],
      linkedinUrl: "https://linkedin.com/in/rachelbrown",
      experience: 7
    },
    {
      name: "Michael Singh",
      email: "michael.singh@cybersecurity.com",
      company: "CyberSecure Inc",
      title: "Security Architect",
      location: "Washington, DC",
      industry: "Cybersecurity",
      skills: ["Information Security", "Penetration Testing", "Risk Assessment", "Compliance"],
      linkedinUrl: "https://linkedin.com/in/michaelsingh",
      experience: 11
    },
    {
      name: "Alexandra Petrov",
      email: "alexandra.petrov@biotech.com",
      company: "BioTech Research Labs",
      title: "Research Scientist",
      location: "Cambridge, MA",
      industry: "Biotechnology",
      skills: ["Molecular Biology", "Clinical Research", "Data Analysis", "Publications"],
      linkedinUrl: "https://linkedin.com/in/alexandrapetrov",
      experience: 9
    },
    {
      name: "Robert Davis",
      email: "robert.davis@retailtech.com",
      company: "RetailTech Solutions",
      title: "E-commerce Director",
      location: "Los Angeles, CA",
      industry: "Retail Technology",
      skills: ["E-commerce", "Digital Marketing", "Supply Chain", "Customer Analytics"],
      linkedinUrl: "https://linkedin.com/in/robertdavis",
      experience: 14
    }
  ];

  private relationships = [
    { from: 0, to: 1, type: "colleagues", strength: 85, context: "Worked together on AI integration project" },
    { from: 0, to: 3, type: "professional", strength: 70, context: "Met at TechCorp investor meeting" },
    { from: 1, to: 4, type: "industry_peers", strength: 80, context: "Collaborate on AI healthcare initiatives" },
    { from: 1, to: 8, type: "research_collaboration", strength: 90, context: "Co-authored research papers" },
    { from: 2, to: 3, type: "client_relationship", strength: 75, context: "Global Finance is portfolio company" },
    { from: 2, to: 9, type: "advisory", strength: 65, context: "Emily advises on fintech integration" },
    { from: 3, to: 5, type: "investor_relationship", strength: 80, context: "David led Series A investment" },
    { from: 4, to: 8, type: "conference_connection", strength: 60, context: "Met at healthcare tech conference" },
    { from: 5, to: 6, type: "sustainable_tech", strength: 70, context: "Exploring green education initiatives" },
    { from: 6, to: 7, type: "product_security", strength: 85, context: "Collaborating on secure learning platform" },
    { from: 7, to: 4, type: "security_consulting", strength: 75, context: "Michael consults on healthcare security" },
    { from: 8, to: 1, type: "research_partnership", strength: 95, context: "Joint NIH grant application" },
    { from: 9, to: 2, type: "technology_partnership", strength: 70, context: "Implementing payment solutions" }
  ];

  async seedEnhancedData(): Promise<{
    profilesCreated: number;
    relationshipsCreated: number;
    networkStats: {
      totalConnections: number;
      companiesRepresented: number;
      industriesRepresented: number;
      averageConnectionStrength: number;
    };
  }> {
    console.log('Seeding enhanced professional networking data...');

    let profilesCreated = 0;
    let relationshipsCreated = 0;

    // Create professional profiles
    for (let i = 0; i < this.profiles.length; i++) {
      const profile = this.profiles[i];
      const personId = `enhanced_demo_${i + 1}`;

      try {
        const existing = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
        
        if (existing.length === 0) {
          await db.insert(persons).values({
            id: personId,
            name: profile.name,
            email: profile.email,
            company: profile.company,
            title: profile.title,
            location: profile.location,
            industry: profile.industry,
            skills: profile.skills,
            connections: [],
            linkedinUrl: profile.linkedinUrl,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          profilesCreated++;
        }
      } catch (error) {
        console.error(`Error creating profile ${profile.name}:`, error);
      }
    }

    // Create relationships
    for (const rel of this.relationships) {
      const fromPersonId = `enhanced_demo_${rel.from + 1}`;
      const toPersonId = `enhanced_demo_${rel.to + 1}`;

      try {
        const existing = await db.select().from(relationships)
          .where(eq(relationships.fromId, fromPersonId))
          .where(eq(relationships.toId, toPersonId))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(relationships).values({
            fromId: fromPersonId,
            toId: toPersonId,
            type: rel.type,
            confidenceScore: rel.strength,
            evidence: JSON.stringify({ context: rel.context }),
            createdAt: new Date(),
          });
          relationshipsCreated++;

          // Create reverse relationship for bidirectional connections
          const reverseExists = await db.select().from(relationships)
            .where(eq(relationships.fromId, toPersonId))
            .where(eq(relationships.toId, fromPersonId))
            .limit(1);

          if (reverseExists.length === 0) {
            await db.insert(relationships).values({
              fromId: toPersonId,
              toId: fromPersonId,
              type: rel.type,
              confidenceScore: rel.strength,
              evidence: JSON.stringify({ context: rel.context }),
              createdAt: new Date(),
            });
            relationshipsCreated++;
          }
        }
      } catch (error) {
        console.error(`Error creating relationship ${fromPersonId} -> ${toPersonId}:`, error);
      }
    }

    // Calculate network statistics
    const companies = new Set(this.profiles.map(p => p.company));
    const industries = new Set(this.profiles.map(p => p.industry));
    const avgStrength = this.relationships.reduce((sum, rel) => sum + rel.strength, 0) / this.relationships.length;

    const networkStats = {
      totalConnections: relationshipsCreated,
      companiesRepresented: companies.size,
      industriesRepresented: industries.size,
      averageConnectionStrength: Math.round(avgStrength)
    };

    console.log(`Enhanced demo data seeded: ${profilesCreated} profiles, ${relationshipsCreated} relationships`);

    return {
      profilesCreated,
      relationshipsCreated,
      networkStats
    };
  }

  async getNetworkInsights(personId: string): Promise<{
    directConnections: number;
    secondDegreeConnections: number;
    industryDistribution: Record<string, number>;
    strongConnections: number;
    networkReach: number;
  }> {
    // Get direct connections
    const directRels = await db.select().from(relationships)
      .where(eq(relationships.fromId, personId));

    const directConnectionIds = directRels.map(rel => rel.toId);
    
    // Get second degree connections
    let secondDegreeIds: string[] = [];
    for (const connId of directConnectionIds) {
      const secondDegree = await db.select().from(relationships)
        .where(eq(relationships.fromId, connId));
      
      secondDegreeIds.push(...secondDegree.map(rel => rel.toId));
    }

    // Remove duplicates and direct connections
    const uniqueSecondDegree = [...new Set(secondDegreeIds)]
      .filter(id => id !== personId && !directConnectionIds.includes(id));

    // Get industry distribution
    const allConnectionIds = [...directConnectionIds, ...uniqueSecondDegree];
    const connectionProfiles = await db.select().from(persons)
      .where(eq(persons.id, allConnectionIds[0])); // Simplified for demo

    const industryDistribution: Record<string, number> = {};
    for (const profile of connectionProfiles) {
      if (profile.industry) {
        industryDistribution[profile.industry] = (industryDistribution[profile.industry] || 0) + 1;
      }
    }

    // Calculate strong connections (strength > 80)
    const strongConnections = directRels.filter(rel => (rel.confidenceScore || 0) > 80).length;

    return {
      directConnections: directConnectionIds.length,
      secondDegreeConnections: uniqueSecondDegree.length,
      industryDistribution,
      strongConnections,
      networkReach: directConnectionIds.length + uniqueSecondDegree.length
    };
  }
}

export const enhancedDemoSeeder = new EnhancedDemoSeeder();