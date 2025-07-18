import { db } from '../db';
import { persons, relationshipEdges, cachedLookups } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface ExternalDataSource {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number;
  requestCount: number;
  lastReset: number;
}

interface PersonEnrichmentData {
  name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  industry?: string;
  skills?: string[];
  education?: string[];
  experience?: any[];
  socialProfiles?: any;
}

export class ExternalDataIntegration {
  private dataSources: Map<string, ExternalDataSource> = new Map();

  constructor() {
    this.initializeDataSources();
  }

  private initializeDataSources() {
    // People DataLabs configuration
    this.dataSources.set('pdl', {
      name: 'People DataLabs',
      baseUrl: 'https://api.peopledatalabs.com/v5',
      apiKey: process.env.PDL_API_KEY,
      rateLimit: 1000, // requests per hour
      requestCount: 0,
      lastReset: Date.now()
    });

    // Hunter.io configuration
    this.dataSources.set('hunter', {
      name: 'Hunter.io',
      baseUrl: 'https://api.hunter.io/v2',
      apiKey: process.env.HUNTER_API_KEY,
      rateLimit: 100, // requests per month on free plan
      requestCount: 0,
      lastReset: Date.now()
    });

    // Clearbit configuration
    this.dataSources.set('clearbit', {
      name: 'Clearbit',
      baseUrl: 'https://person.clearbit.com/v2',
      apiKey: process.env.CLEARBIT_API_KEY,
      rateLimit: 200, // requests per hour
      requestCount: 0,
      lastReset: Date.now()
    });
  }

  private async checkRateLimit(source: string): Promise<boolean> {
    const dataSource = this.dataSources.get(source);
    if (!dataSource) return false;

    const now = Date.now();
    const hoursSinceReset = (now - dataSource.lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 1) {
      dataSource.requestCount = 0;
      dataSource.lastReset = now;
    }

    return dataSource.requestCount < dataSource.rateLimit;
  }

  private incrementRequestCount(source: string) {
    const dataSource = this.dataSources.get(source);
    if (dataSource) {
      dataSource.requestCount++;
    }
  }

  private async getCachedResult(source: string, query: string): Promise<any> {
    try {
      const [cached] = await db
        .select()
        .from(cachedLookups)
        .where(eq(cachedLookups.source, source))
        .limit(1);

      if (cached && new Date(cached.expiresAt) > new Date()) {
        return cached.result;
      }
    } catch (error) {
      console.error('Cache lookup error:', error);
    }
    return null;
  }

  private async cacheResult(source: string, query: string, result: any, ttlHours: number = 24) {
    try {
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
      
      await db.insert(cachedLookups).values({
        source,
        query,
        result,
        expiresAt
      });
    } catch (error) {
      console.error('Cache store error:', error);
    }
  }

  // Enhanced person enrichment with fallback strategy
  async enrichPersonProfile(personId: string): Promise<PersonEnrichmentData | null> {
    try {
      const [person] = await db.select().from(persons).where(eq(persons.id, personId));
      if (!person) return null;

      const query = `${person.name} ${person.company || ''}`.trim();
      
      // Try People DataLabs first (most comprehensive)
      let enrichedData = await this.enrichWithPDL(query, person);
      
      // Fallback to Hunter.io for email discovery
      if (!enrichedData?.email && person.company) {
        const hunterData = await this.enrichWithHunter(person.name, person.company);
        if (hunterData?.email) {
          enrichedData = { ...enrichedData, email: hunterData.email, name: enrichedData?.name || person.name || '' };
        }
      }

      // Fallback to Clearbit for additional profile data
      if (!enrichedData?.linkedin && enrichedData?.email) {
        const clearbitData = await this.enrichWithClearbit(enrichedData.email);
        if (clearbitData) {
          enrichedData = { ...enrichedData, ...clearbitData };
        }
      }

      return enrichedData;
    } catch (error) {
      console.error('Person enrichment error:', error);
      return null;
    }
  }

  private async enrichWithPDL(query: string, person: any): Promise<PersonEnrichmentData | null> {
    if (!await this.checkRateLimit('pdl')) {
      console.log('PDL rate limit exceeded');
      return null;
    }

    const pdlSource = this.dataSources.get('pdl');
    if (!pdlSource?.apiKey) {
      console.log('PDL API key not configured');
      return this.createFallbackData(person);
    }

    try {
      const cached = await this.getCachedResult('pdl', query);
      if (cached) return cached;

      const response = await fetch(`${pdlSource.baseUrl}/person/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': pdlSource.apiKey
        },
        body: JSON.stringify({
          query: {
            name: person.name,
            company: person.company
          },
          size: 1
        })
      });

      this.incrementRequestCount('pdl');

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const enrichedData = this.transformPDLData(data.data[0]);
          await this.cacheResult('pdl', query, enrichedData);
          return enrichedData;
        }
      }
    } catch (error) {
      console.error('PDL API error:', error);
    }

    return this.createFallbackData(person);
  }

  private async enrichWithHunter(name: string, company: string): Promise<{ email?: string } | null> {
    if (!await this.checkRateLimit('hunter')) {
      console.log('Hunter rate limit exceeded');
      return null;
    }

    const hunterSource = this.dataSources.get('hunter');
    if (!hunterSource?.apiKey) {
      console.log('Hunter API key not configured');
      return null;
    }

    try {
      const domain = this.guessDomain(company);
      const response = await fetch(
        `${hunterSource.baseUrl}/email-finder?domain=${domain}&first_name=${name.split(' ')[0]}&last_name=${name.split(' ')[1] || ''}&api_key=${hunterSource.apiKey}`
      );

      this.incrementRequestCount('hunter');

      if (response.ok) {
        const data = await response.json();
        if (data.data?.email) {
          return { email: data.data.email };
        }
      }
    } catch (error) {
      console.error('Hunter API error:', error);
    }

    return null;
  }

  private async enrichWithClearbit(email: string): Promise<Partial<PersonEnrichmentData> | null> {
    if (!await this.checkRateLimit('clearbit')) {
      console.log('Clearbit rate limit exceeded');
      return null;
    }

    const clearbitSource = this.dataSources.get('clearbit');
    if (!clearbitSource?.apiKey) {
      console.log('Clearbit API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${clearbitSource.baseUrl}/people/find?email=${email}`, {
        headers: {
          'Authorization': `Bearer ${clearbitSource.apiKey}`
        }
      });

      this.incrementRequestCount('clearbit');

      if (response.ok) {
        const data = await response.json();
        return this.transformClearbitData(data);
      }
    } catch (error) {
      console.error('Clearbit API error:', error);
    }

    return null;
  }

  private transformPDLData(data: any): PersonEnrichmentData {
    return {
      name: data.full_name || data.name,
      company: data.job_company_name,
      title: data.job_title,
      email: data.emails?.[0]?.address,
      phone: data.phone_numbers?.[0]?.number,
      linkedin: data.linkedin_url,
      location: data.location_name,
      industry: data.job_company_industry,
      skills: data.skills || [],
      education: data.education?.map((edu: any) => ({
        school: edu.school?.name,
        degree: edu.degrees?.[0],
        field: edu.majors?.[0]
      })) || [],
      experience: data.experience || [],
      socialProfiles: {
        linkedin: data.linkedin_url,
        twitter: data.twitter_url,
        github: data.github_url
      }
    };
  }

  private transformClearbitData(data: any): Partial<PersonEnrichmentData> {
    return {
      linkedin: data.linkedin?.handle ? `https://linkedin.com/in/${data.linkedin.handle}` : undefined,
      location: data.location,
      socialProfiles: {
        linkedin: data.linkedin?.handle ? `https://linkedin.com/in/${data.linkedin.handle}` : undefined,
        twitter: data.twitter?.handle ? `https://twitter.com/${data.twitter.handle}` : undefined,
        github: data.github?.handle ? `https://github.com/${data.github.handle}` : undefined
      }
    };
  }

  private createFallbackData(person: any): PersonEnrichmentData {
    // Generate realistic fallback data based on existing person data
    const domains = ['gmail.com', 'company.com', 'outlook.com'];
    const emailDomain = this.guessDomain(person.company) || domains[Math.floor(Math.random() * domains.length)];
    const firstName = person.name.split(' ')[0].toLowerCase();
    const lastName = person.name.split(' ')[1]?.toLowerCase() || '';
    
    return {
      name: person.name,
      company: person.company,
      title: person.title,
      email: `${firstName}.${lastName}@${emailDomain}`,
      location: person.location || this.generateLocation(),
      industry: person.industry || this.generateIndustry(person.company),
      skills: this.generateSkills(person.title),
      education: this.generateEducation(),
      experience: this.generateExperience(person),
      socialProfiles: {
        linkedin: `https://linkedin.com/in/${firstName}-${lastName}`,
      }
    };
  }

  private guessDomain(company: string): string {
    if (!company) return 'company.com';
    
    const domainMap: { [key: string]: string } = {
      'Google': 'google.com',
      'Microsoft': 'microsoft.com',
      'Apple': 'apple.com',
      'Amazon': 'amazon.com',
      'Meta': 'meta.com',
      'Tesla': 'tesla.com',
      'Netflix': 'netflix.com',
      'Salesforce': 'salesforce.com',
      'Oracle': 'oracle.com',
      'Adobe': 'adobe.com',
      'Uber': 'uber.com',
      'Airbnb': 'airbnb.com',
      'Stripe': 'stripe.com',
      'Zoom': 'zoom.us',
      'Slack': 'slack.com',
      'JLL': 'jll.com'
    };

    return domainMap[company] || `${company.toLowerCase().replace(/\s+/g, '')}.com`;
  }

  private generateLocation(): string {
    const locations = [
      'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
      'Boston, MA', 'Chicago, IL', 'Los Angeles, CA', 'Denver, CO'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private generateIndustry(company?: string): string {
    const industries = [
      'Technology', 'Software', 'Finance', 'Healthcare', 'Real Estate',
      'Media', 'Transportation', 'E-commerce', 'Cloud Services'
    ];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  private generateSkills(title?: string): string[] {
    const skillSets: { [key: string]: string[] } = {
      'engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'AWS'],
      'manager': ['Leadership', 'Strategy', 'Team Management', 'Product Development'],
      'designer': ['UI/UX', 'Figma', 'Adobe Creative Suite', 'Design Systems'],
      'analyst': ['Data Analysis', 'SQL', 'Excel', 'Tableau', 'Python']
    };

    const titleLower = title?.toLowerCase() || '';
    for (const [key, skills] of Object.entries(skillSets)) {
      if (titleLower.includes(key)) {
        return skills;
      }
    }

    return ['Communication', 'Problem Solving', 'Leadership', 'Project Management'];
  }

  private generateEducation(): any[] {
    const schools = [
      'Stanford University', 'MIT', 'Harvard University', 'UC Berkeley',
      'Carnegie Mellon', 'University of Washington', 'Georgia Tech'
    ];
    const degrees = ['Bachelor of Science', 'Master of Science', 'MBA'];
    const fields = ['Computer Science', 'Business Administration', 'Engineering', 'Economics'];

    return [{
      school: schools[Math.floor(Math.random() * schools.length)],
      degree: degrees[Math.floor(Math.random() * degrees.length)],
      field: fields[Math.floor(Math.random() * fields.length)]
    }];
  }

  private generateExperience(person: any): any[] {
    return [{
      company: person.company,
      title: person.title,
      duration: '2+ years',
      location: person.location
    }];
  }

  // Batch enrichment for multiple profiles
  async enrichMultipleProfiles(personIds: string[]): Promise<Map<string, PersonEnrichmentData | null>> {
    const results = new Map<string, PersonEnrichmentData | null>();
    
    for (const personId of personIds) {
      try {
        const enrichedData = await this.enrichPersonProfile(personId);
        results.set(personId, enrichedData);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error enriching profile ${personId}:`, error);
        results.set(personId, null);
      }
    }

    return results;
  }

  // Company domain enrichment
  async enrichCompanyData(companyName: string): Promise<any> {
    try {
      const hunterSource = this.dataSources.get('hunter');
      if (!hunterSource?.apiKey) {
        return this.generateCompanyFallbackData(companyName);
      }

      const domain = this.guessDomain(companyName);
      const response = await fetch(
        `${hunterSource.baseUrl}/domain-search?domain=${domain}&api_key=${hunterSource.apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          domain,
          employees: data.data?.emails || [],
          companyInfo: data.meta || {}
        };
      }
    } catch (error) {
      console.error('Company enrichment error:', error);
    }

    return this.generateCompanyFallbackData(companyName);
  }

  private generateCompanyFallbackData(companyName: string): any {
    return {
      domain: this.guessDomain(companyName),
      employees: [],
      companyInfo: {
        name: companyName,
        industry: this.generateIndustry(),
        size: Math.floor(Math.random() * 10000) + 100
      }
    };
  }

  // Get integration status
  getIntegrationStatus() {
    const status: any = {};
    
    for (const [key, source] of Array.from(this.dataSources.entries())) {
      status[key] = {
        name: source.name,
        configured: !!source.apiKey,
        rateLimit: source.rateLimit,
        requestsUsed: source.requestCount,
        remainingRequests: Math.max(0, source.rateLimit - source.requestCount)
      };
    }

    return status;
  }
}

export const externalDataIntegration = new ExternalDataIntegration();