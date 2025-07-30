import OpenAI from 'openai';
import { db } from '../db';
import { persons, relationshipEdges } from '../../shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { aiNetworkingService } from './aiNetworkingService';

// Advanced networking intelligence service that combines AI analysis with graph data
export class AdvancedNetworkingIntelligence {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for advanced networking features');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Comprehensive networking opportunity analysis
  async analyzeNetworkingLandscape(
    userId: string,
    targetIndustry?: string,
    goals: string[] = []
  ): Promise<{
    networkMap: any[];
    opportunityScore: number;
    keyInfluencers: any[];
    strategicPaths: any[];
    recommendedActions: string[];
    industryInsights: string;
    competitiveAdvantage: string[];
  }> {
    try {
      // Get user's current network
      const userConnections = await db
        .select()
        .from(relationshipEdges)
        .where(or(
          eq(relationshipEdges.fromId, userId),
          eq(relationshipEdges.toId, userId)
        ));

      // Get industry professionals if specified
      let industryProfessionals: any[] = [];
      if (targetIndustry) {
        industryProfessionals = await db
          .select()
          .from(persons)
          .where(eq(persons.industry, targetIndustry));
      }

      // Analyze networking landscape with AI
      const prompt = `
        Analyze this networking landscape for strategic opportunities:
        
        User ID: ${userId}
        Current Connections: ${userConnections.length} professional relationships
        Target Industry: ${targetIndustry || 'Cross-industry'}
        Goals: ${goals.join(', ')}
        Industry Professionals Available: ${industryProfessionals.length}
        
        Provide comprehensive analysis in JSON format:
        {
          "opportunityScore": (1-100),
          "keyInsights": {
            "networkDensity": "analysis of current network strength",
            "gapAnalysis": "identified networking gaps",
            "strategicValue": "highest value opportunities"
          },
          "recommendedActions": [
            "prioritized action items"
          ],
          "industryInsights": "relevant industry networking trends",
          "competitiveAdvantage": [
            "unique positioning opportunities"
          ],
          "nextSteps": {
            "immediate": ["actions for this week"],
            "shortTerm": ["actions for next month"],
            "longTerm": ["strategic initiatives"]
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: "You are an elite networking strategist who analyzes professional landscapes to identify high-value connection opportunities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        networkMap: userConnections.map(conn => ({
          connectionId: conn.fromId === userId ? conn.toId : conn.fromId,
          relationshipType: conn.type,
          strength: conn.confidenceScore || 50
        })),
        opportunityScore: analysis.opportunityScore || 75,
        keyInfluencers: industryProfessionals.slice(0, 10),
        strategicPaths: [],
        recommendedActions: analysis.recommendedActions || [
          'Strengthen existing connections',
          'Identify key industry influencers',
          'Attend relevant networking events'
        ],
        industryInsights: analysis.industryInsights || 'Focus on building meaningful professional relationships',
        competitiveAdvantage: analysis.competitiveAdvantage || [
          'Leverage unique professional background',
          'Focus on mutual value creation'
        ]
      };

    } catch (error) {
      console.error('Networking landscape analysis error:', error);
      throw new Error('Failed to analyze networking landscape');
    }
  }

  // AI-powered connection path optimization
  async optimizeConnectionStrategy(
    fromPersonId: string,
    toPersonId: string,
    context: string = 'professional networking'
  ): Promise<{
    optimalPath: any[];
    alternativePaths: any[];
    strategyRecommendations: string[];
    riskAssessment: any;
    successProbability: number;
    timeEstimate: string;
  }> {
    try {
      // Find potential paths in the database
      const directConnection = await db
        .select()
        .from(relationshipEdges)
        .where(
          and(
            or(
              and(eq(relationshipEdges.fromId, fromPersonId), eq(relationshipEdges.toId, toPersonId)),
              and(eq(relationshipEdges.fromId, toPersonId), eq(relationshipEdges.toId, fromPersonId))
            )
          )
        );

      // Get mutual connections (2-hop paths)
      const mutualConnections = await db.execute(`
        SELECT DISTINCT r2."toId" as mutual_connection
        FROM relationship_edges r1
        JOIN relationship_edges r2 ON r1."toId" = r2."fromId"
        WHERE r1."fromId" = $1 AND r2."toId" = $2
        UNION
        SELECT DISTINCT r2."fromId" as mutual_connection
        FROM relationship_edges r1
        JOIN relationship_edges r2 ON r1."toId" = r2."toId"
        WHERE r1."fromId" = $1 AND r2."fromId" = $2
      `);

      // AI analysis of optimal connection strategy
      const prompt = `
        Optimize connection strategy between two professionals:
        
        From Person: ${fromPersonId}
        To Person: ${toPersonId}
        Context: ${context}
        Direct Connection Exists: ${directConnection.length > 0}
        Mutual Connections Available: ${mutualConnections.length}
        
        Provide strategy optimization in JSON format:
        {
          "successProbability": (1-100),
          "strategyRecommendations": [
            "specific strategic recommendations"
          ],
          "riskAssessment": {
            "lowRisk": ["factors that support connection"],
            "mediumRisk": ["considerations to address"],
            "highRisk": ["potential challenges"]
          },
          "timeEstimate": "realistic timeline",
          "valueProposition": "mutual benefits",
          "approachTiming": "optimal timing strategy"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: "You are a strategic networking consultant specializing in optimizing professional connection pathways."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const strategy = JSON.parse(response.choices[0].message.content || '{}');

      return {
        optimalPath: directConnection.length > 0 ? [{
          type: 'direct',
          strength: directConnection[0].confidenceScore || 50,
          relationship: directConnection[0].type
        }] : [],
        alternativePaths: mutualConnections.rows.slice(0, 5).map((conn: any) => ({
          type: '2-hop',
          mutualConnection: conn.mutual_connection,
          estimatedStrength: 40
        })),
        strategyRecommendations: strategy.strategyRecommendations || [
          'Research mutual interests and connections',
          'Prepare compelling value proposition',
          'Choose appropriate introduction method'
        ],
        riskAssessment: strategy.riskAssessment || {
          lowRisk: ['Professional context', 'Mutual interests'],
          mediumRisk: ['Time investment required'],
          highRisk: []
        },
        successProbability: strategy.successProbability || 70,
        timeEstimate: strategy.timeEstimate || '2-4 weeks'
      };

    } catch (error) {
      console.error('Connection strategy optimization error:', error);
      throw new Error('Failed to optimize connection strategy');
    }
  }

  // Industry-specific networking intelligence
  async generateIndustryNetworkingInsights(
    industry: string,
    userRole?: string
  ): Promise<{
    industryTrends: string[];
    keyPlayers: any[];
    networkingOpportunities: string[];
    bestPractices: string[];
    competitiveIntelligence: any;
    seasonalFactors: string[];
  }> {
    try {
      const prompt = `
        Generate comprehensive networking insights for the ${industry} industry:
        
        Industry: ${industry}
        User Role: ${userRole || 'Professional'}
        Current Date: ${new Date().toISOString().split('T')[0]}
        
        Provide industry-specific insights in JSON format:
        {
          "industryTrends": [
            "current networking trends in this industry"
          ],
          "keyInfluencers": [
            "types of influential roles to target"
          ],
          "networkingOpportunities": [
            "specific events, platforms, and venues"
          ],
          "bestPractices": [
            "proven networking strategies for this industry"
          ],
          "competitiveIntelligence": {
            "commonChallenges": ["industry networking challenges"],
            "successFactors": ["what drives networking success"],
            "differentiators": ["ways to stand out"]
          },
          "seasonalFactors": [
            "timing considerations and industry cycles"
          ]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: "You are an industry networking expert with deep knowledge of professional landscapes across various sectors."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const insights = JSON.parse(response.choices[0].message.content || '{}');

      // Get actual key players from database
      const industryProfessionals = await db
        .select()
        .from(persons)
        .where(eq(persons.industry, industry))
        .limit(20);

      return {
        industryTrends: insights.industryTrends || [],
        keyPlayers: industryProfessionals.map(person => ({
          id: person.id,
          name: person.name,
          title: person.title,
          company: person.company,
          influence: Math.floor(Math.random() * 50) + 50 // Mock influence score
        })),
        networkingOpportunities: insights.networkingOpportunities || [],
        bestPractices: insights.bestPractices || [],
        competitiveIntelligence: insights.competitiveIntelligence || {},
        seasonalFactors: insights.seasonalFactors || []
      };

    } catch (error) {
      console.error('Industry networking insights error:', error);
      throw new Error('Failed to generate industry networking insights');
    }
  }
}

// Export singleton instance
export const advancedNetworkingIntelligence = new AdvancedNetworkingIntelligence();