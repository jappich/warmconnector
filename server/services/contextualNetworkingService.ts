import OpenAI from 'openai';
import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, and, or, sql } from 'drizzle-orm';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface NetworkingSuggestion {
  id: string;
  type: 'introduction' | 'reconnect' | 'follow_up' | 'strategic_connect' | 'event_opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  actionItems: string[];
  targetPerson?: {
    id: string;
    name: string;
    company?: string;
    title?: string;
  };
  connectorPerson?: {
    id: string;
    name: string;
    company?: string;
    title?: string;
  };
  context: {
    relationshipType?: string;
    mutualConnections?: number;
    recentActivity?: string;
    industry?: string;
    location?: string;
  };
  estimatedValue: number; // 1-10 scale
  confidence: number; // 0-1 scale
  createdAt: Date;
}

export interface UserContext {
  userId: string;
  currentGoals?: string[];
  industry?: string;
  role?: string;
  company?: string;
  interests?: string[];
  recentActivity?: string;
  networkingHistory?: any[];
}

class ContextualNetworkingService {
  
  /**
   * Generate personalized networking suggestions for a user
   */
  async generateSuggestions(
    userId: string, 
    context: UserContext,
    maxSuggestions: number = 5
  ): Promise<NetworkingSuggestion[]> {
    try {
      // Get user's profile and connections
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Analyze user's network
      const networkAnalysis = await this.analyzeUserNetwork(userId);
      
      // Get potential targets for networking
      const potentialTargets = await this.identifyNetworkingTargets(userId, context);
      
      // Generate AI-powered suggestions
      const suggestions = await this.generateAISuggestions(
        userProfile,
        networkAnalysis,
        potentialTargets,
        context,
        maxSuggestions
      );

      return suggestions;
    } catch (error) {
      console.error('Error generating networking suggestions:', error);
      throw error;
    }
  }

  /**
   * Get user profile and connection data
   */
  private async getUserProfile(userId: string) {
    const [user] = await db
      .select()
      .from(persons)
      .where(eq(persons.id, userId));
    
    if (!user) return null;

    // Get user's direct connections
    const connections = await db
      .select({
        person: persons,
        relationshipType: relationships.type,
        strength: relationships.strength
      })
      .from(relationships)
      .innerJoin(persons, eq(relationships.toPersonId, persons.id))
      .where(eq(relationships.fromPersonId, userId));

    return {
      ...user,
      connections: connections.map(c => ({
        ...c.person,
        relationshipType: c.relationshipType,
        strength: c.strength
      }))
    };
  }

  /**
   * Analyze user's network patterns and strengths
   */
  private async analyzeUserNetwork(userId: string) {
    // Get relationship type distribution
    const relationshipTypes = await db
      .select({
        type: relationships.type,
        count: sql<number>`count(*)`.as('count'),
        avgStrength: sql<number>`avg(${relationships.strength})`.as('avgStrength')
      })
      .from(relationships)
      .where(eq(relationships.fromPersonId, userId))
      .groupBy(relationships.type);

    // Get industry/company diversity
    const industryDistribution = await db
      .select({
        company: persons.company,
        count: sql<number>`count(*)`.as('count')
      })
      .from(relationships)
      .innerJoin(persons, eq(relationships.toPersonId, persons.id))
      .where(eq(relationships.fromPersonId, userId))
      .groupBy(persons.company);

    // Calculate network metrics
    const totalConnections = relationshipTypes.reduce((sum, rt) => sum + rt.count, 0);
    const networkStrength = relationshipTypes.reduce((sum, rt) => sum + (rt.avgStrength * rt.count), 0) / totalConnections;

    return {
      totalConnections,
      networkStrength,
      relationshipTypes,
      industryDistribution,
      diversityScore: industryDistribution.length / Math.max(totalConnections, 1)
    };
  }

  /**
   * Identify potential networking targets
   */
  private async identifyNetworkingTargets(userId: string, context: UserContext) {
    // Find second-degree connections (friends of friends)
    const secondDegreeConnections = await db
      .select({
        target: persons,
        connector: {
          id: sql<string>`connector.id`,
          name: sql<string>`connector.name`,
          company: sql<string>`connector.company`
        },
        relationshipType: relationships.type,
        strength: relationships.strength
      })
      .from(relationships)
      .innerJoin(
        sql`${persons} as connector`, 
        eq(relationships.toPersonId, sql`connector.id`)
      )
      .innerJoin(
        sql`${relationships} as second_rel`,
        eq(sql`connector.id`, sql`second_rel.from_person_id`)
      )
      .innerJoin(persons, eq(sql`second_rel.to_person_id`, persons.id))
      .where(
        and(
          eq(relationships.fromPersonId, userId),
          sql`${persons.id} != ${userId}`,
          // Exclude direct connections
          sql`${persons.id} NOT IN (
            SELECT to_person_id FROM ${relationships} 
            WHERE from_person_id = ${userId}
          )`
        )
      )
      .limit(20);

    // Find people in similar industries/roles
    const industryTargets = await db
      .select()
      .from(persons)
      .where(
        and(
          persons.company ? eq(persons.company, context.company || '') : sql`1=0`,
          sql`${persons.id} != ${userId}`,
          // Exclude existing connections
          sql`${persons.id} NOT IN (
            SELECT to_person_id FROM ${relationships} 
            WHERE from_person_id = ${userId}
          )`
        )
      )
      .limit(10);

    return {
      secondDegreeConnections,
      industryTargets
    };
  }

  /**
   * Generate AI-powered networking suggestions
   */
  private async generateAISuggestions(
    userProfile: any,
    networkAnalysis: any,
    potentialTargets: any,
    context: UserContext,
    maxSuggestions: number
  ): Promise<NetworkingSuggestion[]> {
    
    const prompt = `You are an expert networking strategist. Analyze this professional's network and generate personalized networking suggestions.

USER PROFILE:
- Name: ${userProfile.name}
- Company: ${userProfile.company || 'Unknown'}
- Title: ${userProfile.title || 'Unknown'}
- Current Goals: ${context.currentGoals?.join(', ') || 'Not specified'}
- Industry: ${context.industry || 'Unknown'}

NETWORK ANALYSIS:
- Total Connections: ${networkAnalysis.totalConnections}
- Network Strength: ${networkAnalysis.networkStrength.toFixed(2)}
- Relationship Types: ${networkAnalysis.relationshipTypes.map(rt => `${rt.type}: ${rt.count}`).join(', ')}
- Industry Diversity Score: ${networkAnalysis.diversityScore.toFixed(2)}

POTENTIAL TARGETS:
Second-degree connections: ${potentialTargets.secondDegreeConnections.length}
Industry targets: ${potentialTargets.industryTargets.length}

Generate ${maxSuggestions} high-value networking suggestions. For each suggestion, provide:
1. Type (introduction/reconnect/follow_up/strategic_connect/event_opportunity)
2. Priority (high/medium/low)
3. Title (concise action-oriented title)
4. Description (2-3 sentences explaining the opportunity)
5. Reasoning (why this suggestion makes strategic sense)
6. Action items (3-4 specific steps to take)
7. Estimated value (1-10 scale)
8. Confidence (0-1 scale)

Focus on:
- Quality over quantity connections
- Strategic career advancement
- Industry knowledge expansion
- Mutual value creation
- Authentic relationship building

Respond in JSON format with an array of suggestions.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.7
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      const suggestions: NetworkingSuggestion[] = [];

      for (let i = 0; i < Math.min(aiResponse.suggestions?.length || 0, maxSuggestions); i++) {
        const suggestion = aiResponse.suggestions[i];
        
        // Find matching target person if suggestion involves introduction
        let targetPerson, connectorPerson;
        if (suggestion.type === 'introduction' && potentialTargets.secondDegreeConnections.length > 0) {
          const target = potentialTargets.secondDegreeConnections[i % potentialTargets.secondDegreeConnections.length];
          targetPerson = {
            id: target.target.id,
            name: target.target.name,
            company: target.target.company,
            title: target.target.title
          };
          connectorPerson = {
            id: target.connector.id,
            name: target.connector.name,
            company: target.connector.company,
            title: null
          };
        }

        suggestions.push({
          id: `suggestion_${Date.now()}_${i}`,
          type: suggestion.type || 'strategic_connect',
          priority: suggestion.priority || 'medium',
          title: suggestion.title || 'Networking Opportunity',
          description: suggestion.description || 'Strategic networking opportunity identified',
          reasoning: suggestion.reasoning || 'AI-identified networking opportunity',
          actionItems: suggestion.actionItems || ['Research target', 'Plan approach', 'Initiate contact'],
          targetPerson,
          connectorPerson,
          context: {
            relationshipType: targetPerson ? 'second_degree' : undefined,
            mutualConnections: targetPerson ? 1 : undefined,
            industry: context.industry,
            location: context.location
          },
          estimatedValue: Math.min(Math.max(suggestion.estimatedValue || 5, 1), 10),
          confidence: Math.min(Math.max(suggestion.confidence || 0.5, 0), 1),
          createdAt: new Date()
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      
      // Fallback: Generate basic suggestions without AI
      return this.generateFallbackSuggestions(userProfile, networkAnalysis, potentialTargets);
    }
  }

  /**
   * Generate fallback suggestions when AI is unavailable
   */
  private generateFallbackSuggestions(
    userProfile: any,
    networkAnalysis: any,
    potentialTargets: any
  ): NetworkingSuggestion[] {
    const suggestions: NetworkingSuggestion[] = [];

    // Introduction suggestions from second-degree connections
    potentialTargets.secondDegreeConnections.slice(0, 3).forEach((target: any, index: number) => {
      suggestions.push({
        id: `fallback_intro_${index}`,
        type: 'introduction',
        priority: 'medium',
        title: `Introduction to ${target.target.name}`,
        description: `Connect with ${target.target.name} at ${target.target.company} through your mutual connection ${target.connector.name}.`,
        reasoning: 'Expanding your network through trusted connections increases success rates.',
        actionItems: [
          `Research ${target.target.name}'s background and interests`,
          `Reach out to ${target.connector.name} about making an introduction`,
          'Prepare a compelling reason for the connection',
          'Follow up professionally after introduction'
        ],
        targetPerson: {
          id: target.target.id,
          name: target.target.name,
          company: target.target.company,
          title: target.target.title
        },
        connectorPerson: {
          id: target.connector.id,
          name: target.connector.name,
          company: target.connector.company,
          title: null
        },
        context: {
          relationshipType: 'second_degree',
          mutualConnections: 1
        },
        estimatedValue: 7,
        confidence: 0.8,
        createdAt: new Date()
      });
    });

    // Industry networking suggestion
    if (potentialTargets.industryTargets.length > 0) {
      const industryTarget = potentialTargets.industryTargets[0];
      suggestions.push({
        id: 'fallback_industry',
        type: 'strategic_connect',
        priority: 'high',
        title: `Connect with industry peer at ${industryTarget.company}`,
        description: `Build relationships within your industry by connecting with ${industryTarget.name}.`,
        reasoning: 'Industry connections provide valuable insights and potential collaboration opportunities.',
        actionItems: [
          'Research their recent work and achievements',
          'Find common interests or mutual connections',
          'Reach out with a personalized message',
          'Suggest a brief coffee chat or virtual meeting'
        ],
        targetPerson: {
          id: industryTarget.id,
          name: industryTarget.name,
          company: industryTarget.company,
          title: industryTarget.title
        },
        context: {
          industry: industryTarget.company
        },
        estimatedValue: 6,
        confidence: 0.7,
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  /**
   * Track networking action taken by user
   */
  async trackNetworkingAction(
    userId: string,
    suggestionId: string,
    action: 'viewed' | 'initiated' | 'completed' | 'dismissed',
    metadata?: any
  ) {
    // This would typically be stored in a database
    console.log(`Networking action tracked: ${userId} ${action} ${suggestionId}`, metadata);
    
    // In a real implementation, you'd store this for learning and improvement
    // await db.insert(networkingActions).values({
    //   userId,
    //   suggestionId,
    //   action,
    //   metadata: JSON.stringify(metadata),
    //   createdAt: new Date()
    // });
  }

  /**
   * Get networking suggestions history for a user
   */
  async getSuggestionsHistory(userId: string, limit: number = 20) {
    // This would fetch from database in real implementation
    // For now, return empty array as we don't have persistence
    return [];
  }
}

export const contextualNetworkingService = new ContextualNetworkingService();