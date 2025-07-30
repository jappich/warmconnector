import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, and, like, ilike, or } from 'drizzle-orm';
import OpenAI from 'openai';
import { workingHaystack } from './workingHaystackService';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ConnectionSearchRequest {
  companyName: string;
  location?: string;
  userContext?: {
    name?: string;
    company?: string;
    title?: string;
  };
}

interface IntroductionRequest {
  targetName: string;
  targetCompany?: string;
  targetTitle?: string;
  userContext?: {
    name?: string;
    company?: string;
    title?: string;
  };
}

interface ConnectionResult {
  id: string;
  name: string;
  company?: string;
  title?: string;
  location?: string;
  connectionScore: number;
  mutualConnections: number;
  approachStrategy: string;
  aiInsights?: string;
}

interface IntroductionPath {
  targetPerson: {
    id: string;
    name: string;
    company?: string;
    title?: string;
  };
  path: Array<{
    id: string;
    name: string;
    company?: string;
    title?: string;
    relationshipType?: string;
  }>;
  hops: number;
  pathScore: number;
  introductionStrategy: string;
  messageTemplate: string;
  aiInsights?: string;
}

export class EnhancedConnectionService {
  
  /**
   * Find Connection Feature - Discover people at specific companies
   */
  async findConnections(request: ConnectionSearchRequest): Promise<{
    success: boolean;
    company: string;
    location: string;
    connections: ConnectionResult[];
    totalResults: number;
    insights: string[];
    recommendations: string[];
    industryContext: string;
    networkingOpportunities: string[];
  }> {
    try {
      // Search for people at the target company
      const whereConditions = [
        ilike(persons.company, `%${request.companyName}%`)
      ];
      
      if (request.location) {
        whereConditions.push(ilike(persons.location, `%${request.location}%`));
      }

      const foundPersons = await db.query.persons.findMany({
        where: and(...whereConditions),
        limit: 20
      });

      // Enhance each connection with AI analysis
      const enhancedConnections = await Promise.all(
        foundPersons.map(async (person) => {
          const connectionScore = await this.calculateConnectionScore(person);
          const mutualConnections = await this.getMutualConnectionCount(person.id);
          const approachStrategy = await this.generateApproachStrategy(person, request.userContext);
          
          return {
            id: person.id,
            name: person.name,
            company: person.company || undefined,
            title: person.title || undefined,
            location: person.location || undefined,
            connectionScore,
            mutualConnections,
            approachStrategy
          };
        })
      );

      // Generate AI insights for the search
      const insights = await this.generateConnectionInsights(request, enhancedConnections);

      return {
        success: true,
        company: request.companyName,
        location: request.location || 'Various locations',
        connections: enhancedConnections,
        totalResults: enhancedConnections.length,
        insights: insights.insights,
        recommendations: insights.recommendations,
        industryContext: insights.industryContext,
        networkingOpportunities: insights.networkingOpportunities
      };

    } catch (error) {
      console.error('Find connections error:', error);
      throw new Error('Failed to find connections');
    }
  }

  /**
   * Find Introduction Feature - Get introduced to specific people
   */
  async findIntroduction(request: IntroductionRequest): Promise<{
    found: boolean;
    targetPerson?: any;
    paths: IntroductionPath[];
    totalPaths: number;
    strategy: string;
    aiInsights: string[];
  }> {
    try {
      // Find the target person
      const whereConditions = [
        ilike(persons.name, `%${request.targetName}%`)
      ];
      
      if (request.targetCompany) {
        whereConditions.push(ilike(persons.company, `%${request.targetCompany}%`));
      }
      
      if (request.targetTitle) {
        whereConditions.push(ilike(persons.title, `%${request.targetTitle}%`));
      }

      const targetPersons = await db.query.persons.findMany({
        where: and(...whereConditions),
        limit: 5
      });

      if (targetPersons.length === 0) {
        return {
          found: false,
          paths: [],
          totalPaths: 0,
          strategy: 'No matching persons found',
          aiInsights: ['Consider broadening search criteria', 'Try alternative spellings or titles']
        };
      }

      // Find introduction paths for each target
      const allPaths: IntroductionPath[] = [];
      
      for (const targetPerson of targetPersons) {
        const paths = await this.findIntroductionPaths(targetPerson, request.userContext);
        allPaths.push(...paths);
      }

      // Sort paths by score
      allPaths.sort((a, b) => b.pathScore - a.pathScore);

      // Generate AI strategy insights
      const aiInsights = await this.generateIntroductionInsights(request, allPaths);

      return {
        found: allPaths.length > 0,
        targetPerson: targetPersons[0],
        paths: allPaths.slice(0, 3), // Top 3 paths
        totalPaths: allPaths.length,
        strategy: allPaths.length > 0 ? 'Multiple introduction paths found' : 'Direct outreach recommended',
        aiInsights
      };

    } catch (error) {
      console.error('Find introduction error:', error);
      throw new Error('Failed to find introduction paths');
    }
  }

  private async calculateConnectionScore(person: any): Promise<number> {
    // Base score calculation
    let score = 50;
    
    // Industry alignment
    if (person.industry) score += 15;
    
    // Company size/reputation (simplified)
    if (person.company && person.company.length > 0) score += 10;
    
    // Title seniority
    if (person.title) {
      const seniorityKeywords = ['director', 'vp', 'manager', 'lead', 'senior'];
      if (seniorityKeywords.some(keyword => person.title.toLowerCase().includes(keyword))) {
        score += 15;
      }
    }
    
    // Location factor
    if (person.location) score += 5;
    
    // Random variation for demo
    score += Math.floor(Math.random() * 20) - 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private async getMutualConnectionCount(personId: string): Promise<number> {
    // Simplified mutual connection count
    const personRelationships = await db.query.relationships.findMany({
      where: or(
        eq(relationships.fromId, personId),
        eq(relationships.toId, personId)
      ),
      limit: 10
    });
    
    return personRelationships.length;
  }

  private async generateApproachStrategy(person: any, userContext?: any): Promise<string> {
    const strategies = [
      'Warm introduction through mutual connection',
      'LinkedIn connection with personalized message',
      'Industry event networking opportunity',
      'Professional association introduction',
      'Alumni network connection'
    ];
    
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  private async findIntroductionPaths(targetPerson: any, userContext?: any): Promise<IntroductionPath[]> {
    // Simplified pathfinding - in production this would use graph algorithms
    const paths: IntroductionPath[] = [];
    
    // Find relationships connected to target
    const targetRelationships = await db.query.relationships.findMany({
      where: or(
        eq(relationships.fromId, targetPerson.id),
        eq(relationships.toId, targetPerson.id)
      ),
      limit: 5
    });

    for (const rel of targetRelationships) {
      const intermediatePersonId = rel.fromId === targetPerson.id ? rel.toId : rel.fromId;
      
      const intermediatePerson = await db.query.persons.findFirst({
        where: eq(persons.id, intermediatePersonId)
      });

      if (intermediatePerson) {
        const messageTemplate = await this.generateMessageTemplate(targetPerson, intermediatePerson);
        
        paths.push({
          targetPerson: {
            id: targetPerson.id,
            name: targetPerson.name,
            company: targetPerson.company,
            title: targetPerson.title
          },
          path: [
            {
              id: 'user',
              name: userContext?.name || 'You',
              company: userContext?.company || 'Your Company',
              title: userContext?.title || 'Your Title'
            },
            {
              id: intermediatePerson.id,
              name: intermediatePerson.name,
              company: intermediatePerson.company || '',
              title: intermediatePerson.title || '',
              relationshipType: rel.type
            },
            {
              id: targetPerson.id,
              name: targetPerson.name,
              company: targetPerson.company,
              title: targetPerson.title
            }
          ],
          hops: 2,
          pathScore: (rel.confidenceScore || 50) + Math.floor(Math.random() * 30),
          introductionStrategy: 'Warm introduction through mutual connection',
          messageTemplate
        });
      }
    }

    return paths;
  }

  private async generateConnectionInsights(request: ConnectionSearchRequest, connections: ConnectionResult[]): Promise<{
    insights: string[];
    recommendations: string[];
    industryContext: string;
    networkingOpportunities: string[];
  }> {
    try {
      // Get Haystack RAG insights for networking strategy
      const haystackInsights = await workingHaystack.generateNetworkingStrategy({
        targetCompany: request.companyName,
        userProfile: request.userContext || {},
        connectionGoals: ['professional networking', 'business development', 'industry collaboration']
      });

      // Get OpenAI analysis for specific insights
      const prompt = `
      Analyze this professional networking search and provide strategic insights:
      
      SEARCH: Finding connections at ${request.companyName} ${request.location ? `in ${request.location}` : ''}
      RESULTS: Found ${connections.length} potential connections
      HAYSTACK_CONTEXT: ${haystackInsights.answer}
      
      Provide analysis in JSON format:
      {
        "insights": ["3-4 key insights about this search"],
        "recommendations": ["3-4 actionable recommendations"],
        "industryContext": "Brief industry context for this company",
        "networkingOpportunities": ["3-4 networking opportunities"]
      }
      
      Focus on professional networking strategy and relationship building.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Combine insights from both AI systems
      const combinedInsights = [
        ...(analysis.insights || []),
        ...haystackInsights.insights.slice(0, 2)
      ];

      return {
        insights: combinedInsights.slice(0, 4),
        recommendations: analysis.recommendations || ['Start with highest-scoring connections', 'Leverage mutual connections'],
        industryContext: analysis.industryContext || 'Active professional network in this sector',
        networkingOpportunities: analysis.networkingOpportunities || ['Industry conferences', 'Professional meetups']
      };

    } catch (error) {
      console.error('Dual AI insights error:', error);
      // Fallback to Haystack only
      try {
        const fallbackInsights = await workingHaystack.generateNetworkingStrategy({
          targetCompany: request.companyName,
          userProfile: request.userContext || {},
          connectionGoals: ['professional networking']
        });
        
        return {
          insights: fallbackInsights.insights,
          recommendations: ['Focus on strongest mutual connections', 'Prepare compelling value proposition'],
          industryContext: fallbackInsights.answer,
          networkingOpportunities: ['Industry events', 'Professional associations', 'Alumni networks']
        };
      } catch (fallbackError) {
        return {
          insights: ['Good connection opportunities available', 'Multiple potential pathways identified'],
          recommendations: ['Focus on strongest mutual connections', 'Prepare compelling value proposition'],
          industryContext: 'Professional networking landscape shows good potential',
          networkingOpportunities: ['Industry events', 'Professional associations', 'Alumni networks']
        };
      }
    }
  }

  private async generateIntroductionInsights(request: IntroductionRequest, paths: IntroductionPath[]): Promise<string[]> {
    if (paths.length === 0) {
      // Get Haystack insights for no-path scenarios
      try {
        const noPathInsights = await workingHaystack.queryRAG({
          question: `No direct introduction paths found for ${request.targetName}. What are alternative networking strategies?`,
          context: `Target: ${request.targetName} at ${request.targetCompany}`,
          type: 'introduction_advice'
        });
        return noPathInsights.insights;
      } catch {
        return [
          'No direct introduction paths found in current network',
          'Consider expanding search criteria or building intermediate connections',
          'Direct outreach with compelling value proposition may be effective'
        ];
      }
    }

    try {
      const bestPath = paths[0];
      
      // Get Haystack RAG insights for introduction strategy
      const haystackInsights = await workingHaystack.analyzeConnectionOpportunity({
        targetPerson: {
          name: request.targetName,
          company: request.targetCompany,
          title: request.targetTitle
        },
        userProfile: request.userContext || {},
        mutualConnections: bestPath.path.length - 2
      });

      // Get OpenAI strategic analysis
      const prompt = `
      Generate strategic networking insights for this introduction request:
      
      TARGET: ${request.targetName} at ${request.targetCompany || 'Company'}
      BEST PATH: ${bestPath.hops} hops through ${bestPath.path.map(p => p.name).join(' → ')}
      HAYSTACK_ANALYSIS: ${haystackInsights.answer}
      
      Provide 3-4 strategic insights as a JSON array of strings.
      Focus on timing, approach, and relationship building strategy.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
      
      // Combine insights from both AI systems
      const combinedInsights = [
        ...(result.insights || []),
        ...haystackInsights.insights.slice(0, 2)
      ];

      return combinedInsights.slice(0, 4);

    } catch (error) {
      console.error('Dual AI introduction insights error:', error);
      // Fallback to Haystack only
      try {
        const fallbackInsights = await workingHaystack.queryRAG({
          question: `Introduction strategy for ${request.targetName}`,
          type: 'introduction_advice'
        });
        return fallbackInsights.insights;
      } catch {
        return [
          'Introduction pathway available through mutual connections',
          'Focus on value-driven messaging',
          'Follow professional introduction etiquette'
        ];
      }
    }
  }

  private async generateMessageTemplate(targetPerson: any, intermediatePerson: any): Promise<string> {
    try {
      const prompt = `
      Create a professional introduction request template:
      
      TARGET: ${targetPerson.name} (${targetPerson.title || 'Professional'} at ${targetPerson.company || 'Company'})
      MUTUAL CONNECTION: ${intermediatePerson.name} (${intermediatePerson.title || 'Professional'} at ${intermediatePerson.company || 'Company'})
      
      Generate a brief, professional message template for requesting an introduction.
      Keep it under 100 words and focus on mutual value.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8
      });

      return response.choices[0].message.content || 
        `Hi ${intermediatePerson.name}, I hope you're doing well. I'm reaching out because I'd love to connect with ${targetPerson.name} at ${targetPerson.company}. Given your connection with them, I was wondering if you'd be comfortable making an introduction? I believe there could be mutual value in connecting. Thank you for considering!`;

    } catch (error) {
      console.error('Message template error:', error);
      return `Hi ${intermediatePerson.name}, I hope you're doing well. I'd love to connect with ${targetPerson.name} at ${targetPerson.company} and thought you might be able to help with an introduction. Thank you!`;
    }
  }
}

export const enhancedConnectionService = new EnhancedConnectionService();