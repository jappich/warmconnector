// LinkedIn integration service for executive assistant and professional relationship discovery
// Uses LinkedIn Sales Navigator API and OAuth for professional networking data

import { RELATIONSHIP_TYPES, DEFAULT_STRENGTHS } from '@shared/relationshipTypes';

interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary?: string;
  industry?: string;
  location?: string;
  positions: LinkedInPosition[];
  educations: LinkedInEducation[];
  connections?: number;
}

interface LinkedInPosition {
  id: string;
  title: string;
  companyName: string;
  companyId?: string;
  startDate: { month: number; year: number };
  endDate?: { month: number; year: number };
  isCurrent: boolean;
  summary?: string;
}

interface LinkedInEducation {
  schoolName: string;
  fieldOfStudy?: string;
  degree?: string;
  startDate?: { year: number };
  endDate?: { year: number };
}

interface LinkedInConnection {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  industry?: string;
  location?: string;
  connectionDegree: 1 | 2 | 3;
  connectionDate?: Date;
  mutualConnections?: number;
}

export class LinkedInIntegrationService {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private baseUrl = 'https://api.linkedin.com/v2';

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  }

  // OAuth flow for LinkedIn authentication
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const scope = 'r_liteprofile r_emailaddress w_member_social';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: scope
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    const tokenData = await response.json();
    this.accessToken = tokenData.access_token;
    return tokenData.access_token;
  }

  // Profile data retrieval
  async getUserProfile(): Promise<LinkedInProfile | null> {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    try {
      const profileResponse = await this.makeAuthenticatedRequest('/people/~');
      const positionsResponse = await this.makeAuthenticatedRequest('/people/~/positions');
      const educationsResponse = await this.makeAuthenticatedRequest('/people/~/educations');

      return {
        id: profileResponse.id,
        firstName: profileResponse.localizedFirstName,
        lastName: profileResponse.localizedLastName,
        headline: profileResponse.headline?.localized?.en_US || '',
        industry: profileResponse.industry,
        location: profileResponse.location?.name,
        positions: positionsResponse.elements || [],
        educations: educationsResponse.elements || [],
        connections: 0 // Would need LinkedIn Marketing API for connection count
      };
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
      return null;
    }
  }

  // Executive assistant discovery through LinkedIn
  async findExecutiveAssistants(companyName: string, executiveName?: string): Promise<LinkedInConnection[]> {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    const searchQueries = [
      `"Executive Assistant" AND company:"${companyName}"`,
      `"Chief of Staff" AND company:"${companyName}"`,
      `"Administrative Assistant" AND company:"${companyName}"`
    ];

    if (executiveName) {
      searchQueries.push(`"Assistant to ${executiveName}" AND company:"${companyName}"`);
    }

    const assistantCandidates: LinkedInConnection[] = [];

    for (const query of searchQueries) {
      try {
        const searchResults = await this.searchPeople(query);
        assistantCandidates.push(...searchResults);
      } catch (error) {
        console.error(`Error searching for assistants with query "${query}":`, error);
      }
    }

    // Deduplicate and filter results
    const uniqueAssistants = this.deduplicateConnections(assistantCandidates);
    return uniqueAssistants.filter(assistant => 
      this.isExecutiveAssistantProfile(assistant.headline)
    );
  }

  // Industry peer discovery
  async findIndustryPeers(industry: string, title: string, limit = 50): Promise<LinkedInConnection[]> {
    const query = `industry:"${industry}" AND title:"${title}"`;
    
    try {
      const searchResults = await this.searchPeople(query, limit);
      return searchResults.filter(peer => peer.connectionDegree <= 2);
    } catch (error) {
      console.error('Error finding industry peers:', error);
      return [];
    }
  }

  // Company employee discovery
  async findCompanyEmployees(companyName: string, limit = 100): Promise<LinkedInConnection[]> {
    const query = `company:"${companyName}"`;
    
    try {
      return await this.searchPeople(query, limit);
    } catch (error) {
      console.error('Error finding company employees:', error);
      return [];
    }
  }

  // Alumni network discovery
  async findAlumniConnections(schoolName: string, limit = 100): Promise<LinkedInConnection[]> {
    const query = `school:"${schoolName}"`;
    
    try {
      return await this.searchPeople(query, limit);
    } catch (error) {
      console.error('Error finding alumni connections:', error);
      return [];
    }
  }

  // Generic people search
  private async searchPeople(query: string, limit = 50): Promise<LinkedInConnection[]> {
    // Note: LinkedIn's People Search API requires special partnership
    // This is a simplified version - actual implementation would need LinkedIn Sales Navigator API
    
    const searchUrl = `/people-search?keywords=${encodeURIComponent(query)}&count=${limit}`;
    
    try {
      const response = await this.makeAuthenticatedRequest(searchUrl);
      
      return (response.elements || []).map((person: any) => ({
        id: person.id,
        firstName: person.localizedFirstName,
        lastName: person.localizedLastName,
        headline: person.headline?.localized?.en_US || '',
        industry: person.industry,
        location: person.location?.name,
        connectionDegree: person.connectionDegree || 3,
        mutualConnections: person.mutualConnections || 0
      })) as LinkedInConnection[];
    } catch (error) {
      console.error('Error in people search:', error);
      return [];
    }
  }

  // Company insights and org chart discovery
  async getCompanyInsights(companyId: string): Promise<any> {
    try {
      const companyResponse = await this.makeAuthenticatedRequest(`/companies/${companyId}`);
      const employeesResponse = await this.makeAuthenticatedRequest(`/companies/${companyId}/employees`);
      
      return {
        company: companyResponse,
        employees: employeesResponse.elements || [],
        orgChart: await this.buildOrgChart(employeesResponse.elements || [])
      };
    } catch (error) {
      console.error('Error getting company insights:', error);
      return null;
    }
  }

  // Relationship strength calculation based on LinkedIn data
  calculateLinkedInRelationshipStrength(connection: LinkedInConnection, context: any = {}): number {
    let strength = 30; // Base strength for LinkedIn connections

    // Connection degree impact
    if (connection.connectionDegree === 1) strength += 40;
    else if (connection.connectionDegree === 2) strength += 20;
    else strength += 10;

    // Mutual connections boost
    if (connection.mutualConnections) {
      strength += Math.min(connection.mutualConnections * 2, 20);
    }

    // Industry alignment
    if (context.targetIndustry && connection.industry === context.targetIndustry) {
      strength += 15;
    }

    // Location proximity
    if (context.targetLocation && connection.location === context.targetLocation) {
      strength += 10;
    }

    return Math.min(strength, 100);
  }

  // Helper methods
  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private deduplicateConnections(connections: LinkedInConnection[]): LinkedInConnection[] {
    const seen = new Set<string>();
    return connections.filter(connection => {
      const key = `${connection.firstName}_${connection.lastName}_${connection.headline}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isExecutiveAssistantProfile(headline: string): boolean {
    const assistantKeywords = [
      'executive assistant',
      'chief of staff',
      'administrative assistant',
      'personal assistant',
      'ea to',
      'assistant to'
    ];

    const lowerHeadline = headline.toLowerCase();
    return assistantKeywords.some(keyword => lowerHeadline.includes(keyword));
  }

  private async buildOrgChart(employees: any[]): Promise<any> {
    // Build a simple org chart structure from employee data
    const orgChart = {
      executives: [],
      managers: [],
      assistants: [],
      individual_contributors: []
    };

    for (const employee of employees) {
      const title = employee.headline?.localized?.en_US?.toLowerCase() || '';
      
      if (title.includes('ceo') || title.includes('president') || title.includes('chief')) {
        orgChart.executives.push(employee);
      } else if (title.includes('manager') || title.includes('director') || title.includes('vp')) {
        orgChart.managers.push(employee);
      } else if (title.includes('assistant') || title.includes('coordinator')) {
        orgChart.assistants.push(employee);
      } else {
        orgChart.individual_contributors.push(employee);
      }
    }

    return orgChart;
  }

  // Rate limiting and error handling
  private async handleRateLimit(retryAfter: number): Promise<void> {
    console.log(`LinkedIn API rate limited. Waiting ${retryAfter} seconds...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }

  // Data transformation for WarmConnector schema
  transformLinkedInProfileToPersonRecord(profile: LinkedInProfile): any {
    return {
      id: `linkedin_${profile.id}`,
      name: `${profile.firstName} ${profile.lastName}`,
      email: '', // Would need separate email API call
      company: profile.positions[0]?.companyName || '',
      title: profile.headline,
      industry: profile.industry,
      location: profile.location,
      linkedinProfile: `https://linkedin.com/in/${profile.id}`,
      education: JSON.stringify(profile.educations),
      source: 'linkedin_api'
    };
  }

  transformLinkedInConnectionToRelationship(
    fromPersonId: string, 
    connection: LinkedInConnection, 
    relationshipType: string,
    context: any = {}
  ): any {
    return {
      fromPersonId,
      toPersonId: `linkedin_${connection.id}`,
      relationshipType,
      strength: this.calculateLinkedInRelationshipStrength(connection, context),
      metadata: JSON.stringify({
        connectionDegree: connection.connectionDegree,
        mutualConnections: connection.mutualConnections,
        linkedinHeadline: connection.headline,
        discoveryMethod: 'linkedin_api',
        source: 'linkedin'
      })
    };
  }
}

export const linkedinService = new LinkedInIntegrationService();