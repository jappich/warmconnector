// Comprehensive data source integration service for WarmConnector
// Handles multiple APIs: Clearbit, Hunter, PDL, Whitepages, Family Search, Facebook, HubSpot

import { RELATIONSHIP_TYPES, RelationshipType, DEFAULT_STRENGTHS, RELATIONSHIP_SENSITIVITY } from '@shared/relationshipTypes';

interface DataSourceConfig {
  name: string;
  apiKey?: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
  relationshipTypes: RelationshipType[];
  confidenceLevel: number; // 1-100
}

interface PersonData {
  id: string;
  name: string;
  email?: string;
  company?: string;
  title?: string;
  location?: string;
  linkedinUrl?: string;
  metadata?: Record<string, any>;
}

interface RelationshipData {
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  subtype?: string;
  strength: number;
  confidence: number;
  metadata: Record<string, any>;
  source: string;
  sensitivityLevel: string;
}

export class DataSourceIntegrationService {
  private dataSources: Map<string, DataSourceConfig> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: number }> = new Map();

  constructor() {
    this.initializeDataSources();
  }

  private initializeDataSources() {
    // Primary Data Sources
    this.addDataSource({
      name: 'clearbit',
      baseUrl: 'https://person.clearbit.com',
      rateLimit: 600, // 10 requests per second
      relationshipTypes: [
        RELATIONSHIP_TYPES.COWORKER,
        RELATIONSHIP_TYPES.MANAGER,
        RELATIONSHIP_TYPES.DIRECT_REPORT,
        RELATIONSHIP_TYPES.VENDOR_CLIENT,
        RELATIONSHIP_TYPES.INDUSTRY_PEERS
      ],
      confidenceLevel: 85
    });

    this.addDataSource({
      name: 'hunter',
      baseUrl: 'https://api.hunter.io',
      rateLimit: 100,
      relationshipTypes: [
        RELATIONSHIP_TYPES.COWORKER,
        RELATIONSHIP_TYPES.VENDOR_CLIENT
      ],
      confidenceLevel: 80
    });

    this.addDataSource({
      name: 'pdl',
      baseUrl: 'https://api.peopledatalabs.com',
      rateLimit: 1000,
      relationshipTypes: [
        RELATIONSHIP_TYPES.COWORKER,
        RELATIONSHIP_TYPES.EDUCATION,
        RELATIONSHIP_TYPES.INDUSTRY_PEERS,
        RELATIONSHIP_TYPES.RESEARCH_COLLABORATOR
      ],
      confidenceLevel: 90
    });

    this.addDataSource({
      name: 'whitepages',
      baseUrl: 'https://proapi.whitepages.com',
      rateLimit: 240,
      relationshipTypes: [
        RELATIONSHIP_TYPES.FAMILY,
        RELATIONSHIP_TYPES.NEIGHBORHOOD,
        RELATIONSHIP_TYPES.HOMETOWN
      ],
      confidenceLevel: 75
    });

    this.addDataSource({
      name: 'familysearch',
      baseUrl: 'https://api.familysearch.org',
      rateLimit: 60,
      relationshipTypes: [
        RELATIONSHIP_TYPES.FAMILY,
        RELATIONSHIP_TYPES.SPOUSE,
        RELATIONSHIP_TYPES.SIBLING,
        RELATIONSHIP_TYPES.PARENT_CHILD,
        RELATIONSHIP_TYPES.EXTENDED_FAMILY
      ],
      confidenceLevel: 95
    });

    // Secondary Data Sources
    this.addDataSource({
      name: 'facebook',
      baseUrl: 'https://graph.facebook.com',
      rateLimit: 200,
      relationshipTypes: [
        RELATIONSHIP_TYPES.SOCIAL,
        RELATIONSHIP_TYPES.FRIEND,
        RELATIONSHIP_TYPES.FAMILY,
        RELATIONSHIP_TYPES.PARENTING_NETWORK,
        RELATIONSHIP_TYPES.HOBBY_CLUB,
        RELATIONSHIP_TYPES.RELIGIOUS_COMMUNITY,
        RELATIONSHIP_TYPES.LIFE_EVENT_SHARED
      ],
      confidenceLevel: 70
    });

    this.addDataSource({
      name: 'hubspot',
      baseUrl: 'https://api.hubapi.com',
      rateLimit: 100,
      relationshipTypes: [
        RELATIONSHIP_TYPES.VENDOR_CLIENT,
        RELATIONSHIP_TYPES.SALES_RELATIONSHIP,
        RELATIONSHIP_TYPES.CUSTOMER_SUPPORT,
        RELATIONSHIP_TYPES.PROJECT_COLLABORATOR
      ],
      confidenceLevel: 85
    });

    this.addDataSource({
      name: 'linkedin',
      baseUrl: 'https://api.linkedin.com',
      rateLimit: 500,
      relationshipTypes: [
        RELATIONSHIP_TYPES.COWORKER,
        RELATIONSHIP_TYPES.INDUSTRY_PEERS,
        RELATIONSHIP_TYPES.EDUCATION,
        RELATIONSHIP_TYPES.ADVISOR_ADVISEE,
        RELATIONSHIP_TYPES.CONFERENCE_SPEAKER
      ],
      confidenceLevel: 90
    });

    // Additional APIs
    this.addDataSource({
      name: 'crunchbase',
      baseUrl: 'https://api.crunchbase.com',
      rateLimit: 200,
      relationshipTypes: [
        RELATIONSHIP_TYPES.INVESTOR_ENTREPRENEUR,
        RELATIONSHIP_TYPES.BOARD_MEMBER,
        RELATIONSHIP_TYPES.ADVISOR_ADVISEE,
        RELATIONSHIP_TYPES.ACCELERATOR_COHORT
      ],
      confidenceLevel: 85
    });

    this.addDataSource({
      name: 'github',
      baseUrl: 'https://api.github.com',
      rateLimit: 5000,
      relationshipTypes: [
        RELATIONSHIP_TYPES.OPEN_SOURCE_CONTRIBUTOR,
        RELATIONSHIP_TYPES.PROJECT_COLLABORATOR,
        RELATIONSHIP_TYPES.RESEARCH_COLLABORATOR
      ],
      confidenceLevel: 95
    });

    this.addDataSource({
      name: 'meetup',
      baseUrl: 'https://api.meetup.com',
      rateLimit: 200,
      relationshipTypes: [
        RELATIONSHIP_TYPES.MEETUP_ATTENDEE,
        RELATIONSHIP_TYPES.HOBBY_CLUB,
        RELATIONSHIP_TYPES.ONLINE_COMMUNITY
      ],
      confidenceLevel: 70
    });
  }

  private addDataSource(config: DataSourceConfig) {
    this.dataSources.set(config.name, config);
    this.rateLimiters.set(config.name, { requests: 0, resetTime: Date.now() + 60000 });
  }

  // Core integration methods
  async enrichPersonData(personId: string, email?: string, linkedinUrl?: string): Promise<PersonData[]> {
    const enrichedData: PersonData[] = [];
    
    // Clearbit Person API
    if (email) {
      const clearbitData = await this.queryClearbit(email);
      if (clearbitData) enrichedData.push(clearbitData);
    }

    // PDL Person Enrichment
    if (email || linkedinUrl) {
      const pdlData = await this.queryPDL({ email, linkedinUrl });
      if (pdlData) enrichedData.push(pdlData);
    }

    // Hunter Domain Search
    if (email) {
      const domain = email.split('@')[1];
      const hunterData = await this.queryHunter(domain);
      enrichedData.push(...hunterData);
    }

    return enrichedData;
  }

  async findRelationships(personData: PersonData): Promise<RelationshipData[]> {
    const relationships: RelationshipData[] = [];

    // Find coworker relationships
    const coworkerRels = await this.findCoworkerRelationships(personData);
    relationships.push(...coworkerRels);

    // Find family relationships
    const familyRels = await this.findFamilyRelationships(personData);
    relationships.push(...familyRels);

    // Find education relationships
    const educationRels = await this.findEducationRelationships(personData);
    relationships.push(...educationRels);

    // Find social media relationships
    const socialRels = await this.findSocialRelationships(personData);
    relationships.push(...socialRels);

    // Find investment/startup relationships
    const investmentRels = await this.findInvestmentRelationships(personData);
    relationships.push(...investmentRels);

    return relationships;
  }

  // Specific relationship finder methods
  private async findCoworkerRelationships(person: PersonData): Promise<RelationshipData[]> {
    const relationships: RelationshipData[] = [];

    // Clearbit + Hunter: Current and former colleagues
    if (person.company) {
      const colleagues = await this.queryHunter(person.company);
      for (const colleague of colleagues) {
        if (colleague.id !== person.id) {
          relationships.push({
            fromPersonId: person.id,
            toPersonId: colleague.id,
            type: RELATIONSHIP_TYPES.COWORKER,
            strength: DEFAULT_STRENGTHS[RELATIONSHIP_TYPES.COWORKER],
            confidence: 85,
            metadata: { company: person.company, source_api: 'hunter' },
            source: 'hunter',
            sensitivityLevel: RELATIONSHIP_SENSITIVITY[RELATIONSHIP_TYPES.COWORKER]
          });
        }
      }
    }

    // PDL: Employment history analysis
    const pdlEmploymentData = await this.queryPDL({ 
      company: person.company,
      title: person.title 
    });
    // Process PDL employment relationships...

    return relationships;
  }

  private async findFamilyRelationships(person: PersonData): Promise<RelationshipData[]> {
    const relationships: RelationshipData[] = [];

    // FamilySearch API integration
    if (person.name) {
      const familyMembers = await this.queryFamilySearch(person.name);
      for (const member of familyMembers) {
        relationships.push({
          fromPersonId: person.id,
          toPersonId: member.id,
          type: RELATIONSHIP_TYPES.FAMILY,
          subtype: member.relation, // 'spouse', 'sibling', 'parent', etc.
          strength: DEFAULT_STRENGTHS[RELATIONSHIP_TYPES.FAMILY],
          confidence: 95,
          metadata: { 
            relation: member.relation,
            family_tree_verified: true,
            source_api: 'familysearch' 
          },
          source: 'familysearch',
          sensitivityLevel: RELATIONSHIP_SENSITIVITY[RELATIONSHIP_TYPES.FAMILY]
        });
      }
    }

    // Whitepages: Household and address-based family connections
    const whitepagesData = await this.queryWhitepages(person.name, person.location);
    // Process Whitepages family data...

    return relationships;
  }

  private async findEducationRelationships(person: PersonData): Promise<RelationshipData[]> {
    const relationships: RelationshipData[] = [];

    // PDL: Education history and classmates
    const educationData = await this.queryPDL({ education: true });
    // Process education relationships...

    // LinkedIn: Alumni networks
    const linkedinAlumni = await this.queryLinkedIn({ education: person.metadata?.education });
    // Process LinkedIn alumni data...

    return relationships;
  }

  private async findSocialRelationships(person: PersonData): Promise<RelationshipData[]> {
    const relationships: RelationshipData[] = [];

    // Facebook Graph API: Friends and mutual connections
    if (person.metadata?.facebookId) {
      const facebookFriends = await this.queryFacebook(person.metadata.facebookId);
      for (const friend of facebookFriends) {
        relationships.push({
          fromPersonId: person.id,
          toPersonId: friend.id,
          type: RELATIONSHIP_TYPES.SOCIAL,
          strength: this.calculateSocialStrength(friend.mutualFriends, friend.interactions),
          confidence: 70,
          metadata: { 
            mutual_friends: friend.mutualFriends,
            interaction_history: friend.interactions,
            source_api: 'facebook' 
          },
          source: 'facebook',
          sensitivityLevel: RELATIONSHIP_SENSITIVITY[RELATIONSHIP_TYPES.SOCIAL]
        });
      }
    }

    return relationships;
  }

  private async findInvestmentRelationships(person: PersonData): Promise<RelationshipData[]> {
    const relationships: RelationshipData[] = [];

    // Crunchbase: Investor-entrepreneur relationships
    const crunchbaseData = await this.queryCrunchbase(person.name, person.company);
    // Process investment relationships...

    return relationships;
  }

  // API-specific query methods (implementations would vary based on actual API contracts)
  private async queryClearbit(email: string): Promise<PersonData | null> {
    if (!this.checkRateLimit('clearbit')) return null;
    
    try {
      // Actual Clearbit API implementation
      const response = await fetch(`https://person.clearbit.com/v2/people/find?email=${email}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return this.transformClearbitData(data);
      }
    } catch (error) {
      console.error('Clearbit API error:', error);
    }
    
    return null;
  }

  private async queryPDL(params: { email?: string; linkedinUrl?: string; company?: string; title?: string; education?: boolean }): Promise<PersonData | null> {
    if (!this.checkRateLimit('pdl')) return null;
    
    try {
      // PDL API implementation
      const response = await fetch('https://api.peopledatalabs.com/v5/person/enrich', {
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.PDL_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        const data = await response.json();
        return this.transformPDLData(data);
      }
    } catch (error) {
      console.error('PDL API error:', error);
    }
    
    return null;
  }

  private async queryHunter(domain: string): Promise<PersonData[]> {
    if (!this.checkRateLimit('hunter')) return [];
    
    try {
      // Hunter API implementation
      const response = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`);
      
      if (response.ok) {
        const data = await response.json();
        return this.transformHunterData(data);
      }
    } catch (error) {
      console.error('Hunter API error:', error);
    }
    
    return [];
  }

  private async queryFamilySearch(name: string): Promise<any[]> {
    if (!this.checkRateLimit('familysearch')) return [];
    // FamilySearch API implementation
    return [];
  }

  private async queryWhitepages(name: string, location?: string): Promise<any[]> {
    if (!this.checkRateLimit('whitepages')) return [];
    // Whitepages API implementation
    return [];
  }

  private async queryFacebook(facebookId: string): Promise<any[]> {
    if (!this.checkRateLimit('facebook')) return [];
    // Facebook Graph API implementation
    return [];
  }

  private async queryLinkedIn(params: any): Promise<any[]> {
    if (!this.checkRateLimit('linkedin')) return [];
    // LinkedIn API implementation
    return [];
  }

  private async queryCrunchbase(name: string, company?: string): Promise<any[]> {
    if (!this.checkRateLimit('crunchbase')) return [];
    // Crunchbase API implementation
    return [];
  }

  // Utility methods
  private checkRateLimit(source: string): boolean {
    const limiter = this.rateLimiters.get(source);
    const config = this.dataSources.get(source);
    
    if (!limiter || !config) return false;
    
    const now = Date.now();
    if (now > limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = now + 60000; // Reset every minute
    }
    
    if (limiter.requests >= config.rateLimit) {
      return false;
    }
    
    limiter.requests++;
    return true;
  }

  private calculateSocialStrength(mutualFriends: number, interactions: number): number {
    // Algorithm to calculate relationship strength based on social signals
    const baseStrength = DEFAULT_STRENGTHS[RELATIONSHIP_TYPES.SOCIAL];
    const mutualBonus = Math.min(mutualFriends * 2, 20);
    const interactionBonus = Math.min(interactions * 3, 15);
    
    return Math.min(baseStrength + mutualBonus + interactionBonus, 100);
  }

  // Data transformation methods
  private transformClearbitData(data: any): PersonData {
    return {
      id: `clearbit_${data.id}`,
      name: `${data.name.givenName} ${data.name.familyName}`,
      email: data.email,
      company: data.employment?.name,
      title: data.employment?.title,
      location: data.location,
      linkedinUrl: data.linkedin?.handle,
      metadata: { source: 'clearbit', originalData: data }
    };
  }

  private transformPDLData(data: any): PersonData {
    return {
      id: `pdl_${data.id}`,
      name: data.full_name,
      email: data.emails?.[0]?.address,
      company: data.experience?.[0]?.company?.name,
      title: data.experience?.[0]?.title?.name,
      location: data.location_names?.[0],
      linkedinUrl: data.linkedin_url,
      metadata: { source: 'pdl', originalData: data }
    };
  }

  private transformHunterData(data: any): PersonData[] {
    return data.data.emails.map((email: any) => ({
      id: `hunter_${email.value.replace('@', '_at_')}`,
      name: `${email.first_name} ${email.last_name}`,
      email: email.value,
      company: data.data.domain,
      title: email.position,
      metadata: { source: 'hunter', confidence: email.confidence }
    }));
  }
}

export const dataSourceService = new DataSourceIntegrationService();