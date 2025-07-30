// Company enrichment service for ghost profile creation
// Triggered when first employee from a domain signs up

import { db } from '../db';
import { companies, persons, relationshipEdges, backgroundJobs, edgeWeights } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { backgroundJobService } from './backgroundJobService';

interface EnrichmentResult {
  profiles: Array<{
    name: string;
    email: string;
    title: string;
    linkedinUrl?: string;
    source: 'PDL' | 'Clearbit' | 'Hunter';
  }>;
  relationships: Array<{
    fromEmail: string;
    toEmail: string;
    type: string;
  }>;
}

export class CompanyEnrichmentService {

  // Check if company needs enrichment when user signs up
  async checkAndEnrichCompany(userEmail: string, companyName: string, domain: string): Promise<void> {
    console.log(`🔍 Checking enrichment for ${domain}`);

    // Find or create company
    let company = await db.select()
      .from(companies)
      .where(eq(companies.domain, domain))
      .limit(1);

    if (!company[0]) {
      // Create company record
      const newCompany = await db.insert(companies).values({
        name: companyName,
        domain,
        city: 'Unknown',
        state: 'Unknown', 
        country: 'Unknown',
        enrichmentStatus: 'pending'
      }).returning();
      
      company = newCompany;
      console.log(`📊 Created company record for ${companyName}`);
    }

    const companyRecord = company[0];

    // Check if enrichment is needed
    if (companyRecord.enrichmentStatus === 'pending' || !companyRecord.lastEnrichedAt) {
      // Queue enrichment job
      await backgroundJobService.addJob('enrich_company', {
        companyId: companyRecord.id,
        domain: domain,
        triggerEmail: userEmail
      }, 8); // High priority

      console.log(`🚀 Queued enrichment job for ${domain}`);
    }
  }

  // Main enrichment process
  async enrichCompany(companyId: string, domain: string): Promise<{
    ghostProfilesCreated: number;
    relationshipsCreated: number;
  }> {
    console.log(`🎯 Starting enrichment for company ${companyId} (${domain})`);

    // Update company status
    await db.update(companies)
      .set({ enrichmentStatus: 'running' })
      .where(eq(companies.id, companyId));

    try {
      // Mock API calls (replace with real APIs later)
      const enrichmentData = await this.fetchCompanyData(domain);
      
      // Create ghost profiles
      const ghostProfilesCreated = await this.createGhostProfiles(
        companyId, 
        domain, 
        enrichmentData.profiles
      );

      // Create relationships between profiles
      const relationshipsCreated = await this.createGhostRelationships(
        domain,
        enrichmentData.relationships
      );

      // Update company as completed
      await db.update(companies)
        .set({ 
          enrichmentStatus: 'done',
          lastEnrichedAt: new Date()
        })
        .where(eq(companies.id, companyId));

      console.log(`✅ Enrichment complete: ${ghostProfilesCreated} profiles, ${relationshipsCreated} relationships`);

      return {
        ghostProfilesCreated,
        relationshipsCreated
      };

    } catch (error) {
      console.error(`❌ Enrichment failed for ${domain}:`, error);
      
      await db.update(companies)
        .set({ enrichmentStatus: 'error' })
        .where(eq(companies.id, companyId));

      throw error;
    }
  }

  // Mock API data fetching (replace with real APIs)
  private async fetchCompanyData(domain: string): Promise<EnrichmentResult> {
    console.log(`📡 Fetching data for ${domain} (using mock data)`);

    // Mock data - replace with real API calls
    const mockProfiles = [
      {
        name: 'Sarah Chen',
        email: `sarah.chen@${domain}`,
        title: 'Engineering Manager',
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        source: 'PDL' as const
      },
      {
        name: 'Marcus Rodriguez',
        email: `marcus.rodriguez@${domain}`,
        title: 'Senior Developer',
        source: 'Clearbit' as const
      },
      {
        name: 'Emily Watson',
        email: `emily.watson@${domain}`,
        title: 'Product Manager',
        source: 'PDL' as const
      },
      {
        name: 'David Kim',
        email: `david.kim@${domain}`,
        title: 'Executive Assistant to CEO',
        source: 'Hunter' as const
      }
    ];

    const mockRelationships = [
      {
        fromEmail: `sarah.chen@${domain}`,
        toEmail: `marcus.rodriguez@${domain}`,
        type: 'COWORKER'
      },
      {
        fromEmail: `sarah.chen@${domain}`,
        toEmail: `emily.watson@${domain}`,
        type: 'COWORKER'
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      profiles: mockProfiles,
      relationships: mockRelationships
    };
  }

  // Create ghost profiles from enrichment data
  private async createGhostProfiles(
    companyId: string,
    domain: string, 
    profiles: EnrichmentResult['profiles']
  ): Promise<number> {
    let created = 0;

    for (const profile of profiles) {
      try {
        // Check if profile already exists
        const existing = await db.select()
          .from(persons)
          .where(eq(persons.email, profile.email))
          .limit(1);

        if (existing.length > 0) {
          console.log(`⏭️ Profile already exists: ${profile.email}`);
          continue;
        }

        // Create ghost profile
        await db.insert(persons).values({
          id: `ghost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: profile.name,
          email: profile.email,
          title: profile.title,
          company: domain.split('.')[0], // Extract company name from domain
          linkedinProfile: profile.linkedinUrl,
          isGhost: true,
          ghostSource: profile.source,
          trustScore: 60, // Ghosts start with lower trust
          source: profile.source.toLowerCase(),
          createdAt: new Date()
        });

        created++;
        console.log(`👻 Created ghost profile: ${profile.name} (${profile.source})`);

      } catch (error) {
        console.error(`Failed to create ghost profile ${profile.email}:`, error);
      }
    }

    return created;
  }

  // Create relationships between ghost profiles
  private async createGhostRelationships(
    domain: string,
    relationships: EnrichmentResult['relationships']
  ): Promise<number> {
    let created = 0;

    for (const rel of relationships) {
      try {
        // Find the persons by email
        const fromPerson = await db.select()
          .from(persons)
          .where(eq(persons.email, rel.fromEmail))
          .limit(1);

        const toPerson = await db.select()
          .from(persons)
          .where(eq(persons.email, rel.toEmail))
          .limit(1);

        if (!fromPerson[0] || !toPerson[0]) {
          console.log(`⚠️ Could not find persons for relationship: ${rel.fromEmail} -> ${rel.toEmail}`);
          continue;
        }

        // Get edge weight configuration
        const edgeWeight = await this.getEdgeWeight(rel.type);

        // Create relationship
        await db.insert(relationshipEdges).values({
          fromId: fromPerson[0].id,
          toId: toPerson[0].id,
          type: rel.type,
          confidenceScore: edgeWeight.ghostAdjustedWeight,
          source: 'company_enrichment',
          isGhost: fromPerson[0].isGhost || toPerson[0].isGhost,
          evidence: JSON.stringify({
            enrichmentSource: 'domain_based',
            domain: domain,
            bothGhosts: fromPerson[0].isGhost && toPerson[0].isGhost
          }),
          createdAt: new Date()
        });

        created++;
        console.log(`🔗 Created relationship: ${rel.fromEmail} -> ${rel.toEmail} (${rel.type})`);

      } catch (error) {
        console.error(`Failed to create relationship ${rel.fromEmail} -> ${rel.toEmail}:`, error);
      }
    }

    return created;
  }

  // Get edge weight with ghost penalty applied
  private async getEdgeWeight(relationshipType: string): Promise<{
    baseWeight: number;
    ghostPenalty: number;
    ghostAdjustedWeight: number;
  }> {
    const weight = await db.select()
      .from(edgeWeights)
      .where(eq(edgeWeights.type, relationshipType))
      .limit(1);

    if (weight[0]) {
      const ghostAdjustedWeight = Math.max(
        weight[0].baseWeight! - weight[0].ghostPenalty!, 
        20
      );
      
      return {
        baseWeight: weight[0].baseWeight!,
        ghostPenalty: weight[0].ghostPenalty!,
        ghostAdjustedWeight
      };
    }

    // Default weights if not configured
    return {
      baseWeight: 70,
      ghostPenalty: 30,
      ghostAdjustedWeight: 40
    };
  }

  // Initialize edge weight configurations
  async initializeEdgeWeights(): Promise<void> {
    const weights = [
      { type: 'COWORKER', baseWeight: 100, ghostPenalty: 30, description: 'Same company colleagues' },
      { type: 'ALUMNI', baseWeight: 80, ghostPenalty: 30, description: 'Same school/university' },
      { type: 'ASSISTANT_TO', baseWeight: 95, ghostPenalty: 10, description: 'Executive assistant relationship' },
      { type: 'BOARD_MEMBER', baseWeight: 85, ghostPenalty: 20, description: 'Board member connections' },
      { type: 'HOMETOWN', baseWeight: 50, ghostPenalty: 30, description: 'Same hometown/location' },
      { type: 'FAMILY', baseWeight: 100, ghostPenalty: 0, description: 'Family relationships' }
    ];

    for (const weight of weights) {
      try {
        await db.insert(edgeWeights).values(weight);
      } catch (error) {
        // Weight might already exist
      }
    }

    console.log('✅ Edge weights initialized');
  }

  // Get enrichment stats for a company
  async getEnrichmentStats(companyId: string): Promise<{
    realProfiles: number;
    ghostProfiles: number;
    totalRelationships: number;
    lastEnrichedAt?: Date;
    status: string;
  }> {
    const company = await db.select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company[0]) {
      throw new Error('Company not found');
    }

    const domain = company[0].domain;

    const stats = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN is_ghost = false THEN 1 END) as real_profiles,
        COUNT(CASE WHEN is_ghost = true THEN 1 END) as ghost_profiles,
        COUNT(*) as total_profiles
      FROM persons 
      WHERE company LIKE ${`%${domain?.split('.')[0]}%`}
    `);

    const relationships = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM relationship_edges re
      JOIN persons p1 ON re.from_id = p1.id
      WHERE p1.company LIKE ${`%${domain?.split('.')[0]}%`}
    `);

    return {
      realProfiles: Number(stats[0]?.real_profiles || 0),
      ghostProfiles: Number(stats[0]?.ghost_profiles || 0),
      totalRelationships: Number(relationships[0]?.count || 0),
      lastEnrichedAt: company[0].lastEnrichedAt || undefined,
      status: company[0].enrichmentStatus || 'pending'
    };
  }
}

export const companyEnrichmentService = new CompanyEnrichmentService();