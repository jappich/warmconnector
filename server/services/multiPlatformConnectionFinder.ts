import axios from 'axios';
import OpenAI from 'openai';
import { db } from '../db';
import { persons, relationships } from '@shared/schema';
import { eq, like, or } from 'drizzle-orm';
import { webScrapingService } from './webScrapingService';

interface ConnectionPlatform {
  name: string;
  enabled: boolean;
  searchUrl?: string;
  apiKey?: string;
}

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  platform: string;
  relevanceScore: number;
}

interface ComprehensivePersonProfile {
  name: string;
  company: string;
  title: string;
  location?: string;
  email?: string;
  platforms: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    personal_website?: string;
    company_bio?: string;
  };
  webMentions: WebSearchResult[];
  socialSignals: {
    professionalActivity: string[];
    expertise: string[];
    recentUpdates: string[];
  };
  confidence: number;
}

export class MultiPlatformConnectionFinder {
  private openai: OpenAI;
  private platforms: ConnectionPlatform[] = [
    { name: 'LinkedIn', enabled: true },
    { name: 'Twitter/X', enabled: true },
    { name: 'GitHub', enabled: true },
    { name: 'Personal Websites', enabled: true },
    { name: 'Company Pages', enabled: true },
    { name: 'Professional Forums', enabled: true },
    { name: 'News Articles', enabled: true },
    { name: 'Conference Speakers', enabled: true }
  ];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async findComprehensiveConnectionInfo(
    personName: string,
    companyName?: string,
    additionalContext?: string
  ): Promise<ComprehensivePersonProfile> {
    console.log(`Searching comprehensive information for: ${personName} at ${companyName}`);

    // Start with database search
    const existingProfile = await this.searchDatabase(personName, companyName);
    
    // Use comprehensive web scraping service for authentic data
    const comprehensiveData = await webScrapingService.searchComprehensivePersonData(
      personName,
      companyName,
      { additionalContext }
    );
    
    // Perform targeted web searches across multiple platforms
    const webResults = await this.performWebSearch(personName, companyName, additionalContext);
    
    // Combine web scraping data with targeted search results
    const combinedWebMentions = [
      ...comprehensiveData.publicRecords.map(record => ({
        title: record.content.substring(0, 100),
        url: record.url,
        snippet: record.content,
        platform: record.source,
        relevanceScore: record.relevance
      })),
      ...webResults
    ];
    
    // Use AI to analyze and synthesize all available information
    const synthesizedProfile = await this.synthesizeProfileData(
      personName,
      companyName,
      combinedWebMentions,
      existingProfile,
      comprehensiveData
    );

    return synthesizedProfile;
  }

  private async searchDatabase(name: string, company?: string): Promise<any | null> {
    try {
      let query = db.select().from(persons);
      
      if (company) {
        query = query.where(
          or(
            like(persons.name, `%${name}%`),
            like(persons.company, `%${company}%`)
          )
        );
      } else {
        query = query.where(like(persons.name, `%${name}%`));
      }

      const results = await query.limit(1);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Database search error:', error);
      return null;
    }
  }

  private async performWebSearch(
    name: string,
    company?: string,
    context?: string
  ): Promise<WebSearchResult[]> {
    const searchQueries = this.generateSearchQueries(name, company, context);
    const allResults: WebSearchResult[] = [];

    for (const query of searchQueries) {
      try {
        // Use Perplexity API for comprehensive web search
        const results = await this.searchWithPerplexity(query);
        allResults.push(...results);
      } catch (error) {
        console.error(`Search error for query "${query}":`, error);
      }
    }

    return this.deduplicateAndRankResults(allResults);
  }

  private generateSearchQueries(name: string, company?: string, context?: string): string[] {
    const queries = [
      `"${name}" LinkedIn profile`,
      `"${name}" professional background`,
      `"${name}" contact information email`,
    ];

    if (company) {
      queries.push(
        `"${name}" "${company}" employee`,
        `"${name}" "${company}" team`,
        `"${name}" "${company}" biography`
      );
    }

    if (context) {
      queries.push(`"${name}" ${context}`);
    }

    // Platform-specific searches
    queries.push(
      `"${name}" site:linkedin.com`,
      `"${name}" site:twitter.com`,
      `"${name}" site:github.com`,
      `"${name}" conference speaker`,
      `"${name}" industry expert`,
      `"${name}" published articles`
    );

    return queries.slice(0, 8); // Limit to prevent excessive API calls
  }

  private async searchWithPerplexity(query: string): Promise<WebSearchResult[]> {
    try {
      if (!process.env.PERPLEXITY_API_KEY) {
        // Fallback to OpenAI-powered analysis
        return await this.searchWithOpenAI(query);
      }

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a professional network researcher. Search for comprehensive information about the person and return structured data about their professional presence.'
          },
          {
            role: 'user',
            content: `Search for: ${query}. Return information about their professional background, current role, contact methods, and recent professional activity.`
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
        return_related_questions: false,
        search_recency_filter: 'month'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return this.parsePerplexityResponse(response.data, query);
    } catch (error) {
      console.error('Perplexity search error:', error);
      return await this.searchWithOpenAI(query);
    }
  }

  private async searchWithOpenAI(query: string): Promise<WebSearchResult[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional network researcher. Based on the search query, provide structured information about likely professional platforms and contact methods where this person might be found.'
          },
          {
            role: 'user',
            content: `Generate likely professional presence information for: ${query}`
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      const content = response.choices[0].message.content || '';
      return this.parseOpenAIResponse(content, query);
    } catch (error) {
      console.error('OpenAI search error:', error);
      return [];
    }
  }

  private parsePerplexityResponse(data: any, query: string): WebSearchResult[] {
    const results: WebSearchResult[] = [];
    
    try {
      const content = data.choices[0]?.message?.content || '';
      const citations = data.citations || [];

      citations.forEach((citation: string, index: number) => {
        results.push({
          title: `Professional Information - ${query}`,
          url: citation,
          snippet: content.substring(index * 100, (index + 1) * 100),
          platform: this.detectPlatform(citation),
          relevanceScore: 0.8 - (index * 0.1)
        });
      });
    } catch (error) {
      console.error('Error parsing Perplexity response:', error);
    }

    return results;
  }

  private parseOpenAIResponse(content: string, query: string): WebSearchResult[] {
    const results: WebSearchResult[] = [];
    
    // Extract platform mentions and create structured results
    const platforms = ['linkedin', 'twitter', 'github', 'email', 'website'];
    
    platforms.forEach((platform, index) => {
      if (content.toLowerCase().includes(platform)) {
        results.push({
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Presence`,
          url: `https://${platform}.com/search?q=${encodeURIComponent(query)}`,
          snippet: `Likely to have professional presence on ${platform}`,
          platform,
          relevanceScore: 0.7 - (index * 0.1)
        });
      }
    });

    return results;
  }

  private detectPlatform(url: string): string {
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
    if (url.includes('github.com')) return 'GitHub';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('instagram.com')) return 'Instagram';
    return 'Web';
  }

  private deduplicateAndRankResults(results: WebSearchResult[]): WebSearchResult[] {
    const seen = new Set<string>();
    const unique = results.filter(result => {
      const key = `${result.platform}-${result.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15); // Top 15 results
  }

  private async synthesizeProfileData(
    name: string,
    company?: string,
    webResults: WebSearchResult[] = [],
    existingProfile: any = null,
    comprehensiveData?: any
  ): Promise<ComprehensivePersonProfile> {
    try {
      const prompt = `
        Synthesize comprehensive professional information for ${name}${company ? ` at ${company}` : ''}
        
        Database information: ${existingProfile ? JSON.stringify(existingProfile) : 'None'}
        
        Web search results: ${JSON.stringify(webResults)}
        
        Return a JSON object with:
        - name, company, title, location, email (if found)
        - platforms object with URLs for linkedin, twitter, github, personal_website, company_bio
        - webMentions array (top 5 relevant results)
        - socialSignals with professionalActivity, expertise, recentUpdates arrays
        - confidence score (0-1) based on information quality
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional network analyst. Synthesize available information into a comprehensive profile. Return valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000
      });

      const synthesized = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        name: synthesized.name || name,
        company: synthesized.company || company || '',
        title: synthesized.title || '',
        location: synthesized.location,
        email: synthesized.email,
        platforms: synthesized.platforms || {},
        webMentions: webResults.slice(0, 5),
        socialSignals: synthesized.socialSignals || {
          professionalActivity: [],
          expertise: [],
          recentUpdates: []
        },
        confidence: synthesized.confidence || 0.6
      };
    } catch (error) {
      console.error('Profile synthesis error:', error);
      
      // Fallback profile structure
      return {
        name,
        company: company || '',
        title: '',
        platforms: {},
        webMentions: webResults.slice(0, 5),
        socialSignals: {
          professionalActivity: [],
          expertise: [],
          recentUpdates: []
        },
        confidence: 0.3
      };
    }
  }

  async findConnectionPath(fromPerson: string, toPerson: string): Promise<{
    directConnection: boolean;
    path: string[];
    strength: number;
    recommendations: string[];
  }> {
    // Check for direct connection in database
    const directRel = await db.select().from(relationships)
      .where(eq(relationships.fromPersonId, fromPerson))
      .where(eq(relationships.toPersonId, toPerson))
      .limit(1);

    if (directRel.length > 0) {
      return {
        directConnection: true,
        path: [fromPerson, toPerson],
        strength: directRel[0].strength || 50,
        recommendations: ['Direct connection - reach out directly']
      };
    }

    // Find mutual connections (2nd degree)
    const fromConnections = await db.select().from(relationships)
      .where(eq(relationships.fromPersonId, fromPerson));
    
    const toConnections = await db.select().from(relationships)
      .where(eq(relationships.toPersonId, toPerson));

    const mutualConnections = fromConnections.filter(from =>
      toConnections.some(to => from.toPersonId === to.fromPersonId)
    );

    if (mutualConnections.length > 0) {
      const strongestMutual = mutualConnections.reduce((prev, current) =>
        (prev.strength || 0) > (current.strength || 0) ? prev : current
      );

      return {
        directConnection: false,
        path: [fromPerson, strongestMutual.toPersonId, toPerson],
        strength: Math.round(((strongestMutual.strength || 50) + 50) / 2),
        recommendations: [
          `Ask ${strongestMutual.toPersonId} for an introduction`,
          'Mention shared connections when reaching out'
        ]
      };
    }

    return {
      directConnection: false,
      path: [],
      strength: 0,
      recommendations: [
        'No direct path found - consider cold outreach',
        'Look for shared interests or mutual connections',
        'Engage with their professional content first'
      ]
    };
  }
}

export const multiPlatformFinder = new MultiPlatformConnectionFinder();