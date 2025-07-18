import OpenAI from 'openai';
import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, and, or } from 'drizzle-orm';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ConnectionIntelligence {
  connectionScore: number;
  introductionPath: string[];
  recommendedApproach: string;
  conversationStarters: string[];
  mutualInterests: string[];
  strengthFactors: string[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
}

export interface SemanticSearchResult {
  personId: string;
  name: string;
  company: string;
  title: string;
  relevanceScore: number;
  matchingFactors: string[];
}

export class AIConnectionIntelligence {
  
  async analyzeConnectionOpportunity(
    fromPersonId: string,
    toPersonId: string,
    context?: string
  ): Promise<ConnectionIntelligence> {
    try {
      // Get detailed person information
      const [fromPerson] = await db.select().from(persons).where(eq(persons.id, fromPersonId));
      const [toPerson] = await db.select().from(persons).where(eq(persons.id, toPersonId));

      if (!fromPerson || !toPerson) {
        throw new Error('Person not found');
      }

      // Find existing path
      const path = await this.findOptimalIntroductionPath(fromPersonId, toPersonId);

      // Generate AI analysis
      const prompt = `
        Analyze this professional networking connection opportunity:

        From: ${fromPerson.name} (${fromPerson.title} at ${fromPerson.company})
        To: ${toPerson.name} (${toPerson.title} at ${toPerson.company})
        
        From Person Details:
        - Industry: ${fromPerson.industry}
        - Location: ${fromPerson.location}
        - Skills: ${fromPerson.skills}
        - Interests: ${fromPerson.interests}

        To Person Details:
        - Industry: ${toPerson.industry}
        - Location: ${toPerson.location}
        - Skills: ${toPerson.skills}
        - Interests: ${toPerson.interests}

        Introduction Path: ${path.join(' → ')}
        Context: ${context || 'General networking'}

        Provide analysis in JSON format with:
        - connectionScore (0-100)
        - recommendedApproach (string)
        - conversationStarters (array of 3-5 strings)
        - mutualInterests (array of strings)
        - strengthFactors (array of strings explaining connection strength)
        - riskAssessment with level (LOW/MEDIUM/HIGH) and factors (array)
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert networking strategist and relationship analyst. Provide actionable insights for professional connections."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        connectionScore: analysis.connectionScore || 50,
        introductionPath: path,
        recommendedApproach: analysis.recommendedApproach || 'Professional introduction',
        conversationStarters: analysis.conversationStarters || [],
        mutualInterests: analysis.mutualInterests || [],
        strengthFactors: analysis.strengthFactors || [],
        riskAssessment: analysis.riskAssessment || { level: 'MEDIUM', factors: [] }
      };

    } catch (error) {
      console.error('AI connection analysis error:', error);
      throw new Error('Failed to analyze connection opportunity');
    }
  }

  async semanticSearch(
    query: string,
    userContext?: {
      industry?: string;
      location?: string;
      interests?: string[];
    }
  ): Promise<SemanticSearchResult[]> {
    try {
      // Get all persons from database
      const allPersons = await db.select().from(persons);

      // Generate embeddings and semantic analysis using AI
      const prompt = `
        Find the most relevant professional connections for this search query: "${query}"
        
        User Context:
        - Industry: ${userContext?.industry || 'Any'}
        - Location: ${userContext?.location || 'Any'}
        - Interests: ${userContext?.interests?.join(', ') || 'Any'}

        Available people: ${JSON.stringify(allPersons.map(p => ({
          id: p.id,
          name: p.name,
          company: p.company,
          title: p.title,
          industry: p.industry,
          location: p.location,
          skills: p.skills,
          interests: p.interests
        })))}

        Rank and return the top 10 most relevant matches in JSON format:
        {
          "results": [
            {
              "personId": "string",
              "relevanceScore": number (0-100),
              "matchingFactors": ["factor1", "factor2"]
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at semantic matching and professional networking. Analyze professional profiles for relevance to search queries."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{"results": []}');

      return analysis.results.map((result: any) => {
        const person = allPersons.find(p => p.id === result.personId);
        return {
          personId: result.personId,
          name: person?.name || 'Unknown',
          company: person?.company || 'Unknown',
          title: person?.title || 'Unknown',
          relevanceScore: result.relevanceScore,
          matchingFactors: result.matchingFactors || []
        };
      }).filter(result => result.name !== 'Unknown');

    } catch (error) {
      console.error('Semantic search error:', error);
      throw new Error('Failed to perform semantic search');
    }
  }

  async generateNetworkingStrategy(
    personId: string,
    goals: string[],
    timeframe: string
  ): Promise<{
    strategy: string;
    actionItems: string[];
    prioritizedConnections: Array<{
      personId: string;
      name: string;
      company: string;
      priority: number;
      reasoning: string;
    }>;
  }> {
    try {
      const [person] = await db.select().from(persons).where(eq(persons.id, personId));
      if (!person) throw new Error('Person not found');

      // Get all available connections
      const allPersons = await db.select().from(persons);
      
      const prompt = `
        Create a comprehensive networking strategy for:
        
        Person: ${person.name} (${person.title} at ${person.company})
        Industry: ${person.industry}
        Location: ${person.location}
        Current Skills: ${person.skills}
        Interests: ${person.interests}

        Goals: ${goals.join(', ')}
        Timeframe: ${timeframe}

        Available network: ${JSON.stringify(allPersons.map(p => ({
          id: p.id,
          name: p.name,
          company: p.company,
          title: p.title,
          industry: p.industry
        })))}

        Provide a strategic networking plan in JSON format:
        {
          "strategy": "overall strategy description",
          "actionItems": ["action1", "action2", "action3"],
          "prioritizedConnections": [
            {
              "personId": "string",
              "priority": number (1-10),
              "reasoning": "why this connection is valuable"
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior networking strategist and career advisor. Create actionable networking strategies based on professional goals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const strategy = JSON.parse(response.choices[0].message.content || '{}');

      return {
        strategy: strategy.strategy || 'Focus on building meaningful professional relationships',
        actionItems: strategy.actionItems || [],
        prioritizedConnections: strategy.prioritizedConnections?.map((conn: any) => {
          const person = allPersons.find(p => p.id === conn.personId);
          return {
            personId: conn.personId,
            name: person?.name || 'Unknown',
            company: person?.company || 'Unknown',
            priority: conn.priority,
            reasoning: conn.reasoning
          };
        }).filter((conn: any) => conn.name !== 'Unknown') || []
      };

    } catch (error) {
      console.error('Networking strategy generation error:', error);
      throw new Error('Failed to generate networking strategy');
    }
  }

  private async findOptimalIntroductionPath(fromPersonId: string, toPersonId: string): Promise<string[]> {
    // Simple BFS path finding
    const visited = new Set<string>();
    const queue: Array<{personId: string, path: string[]}> = [{personId: fromPersonId, path: [fromPersonId]}];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.personId === toPersonId) {
        // Convert person IDs to names
        const personNames = await Promise.all(
          current.path.map(async id => {
            const [person] = await db.select().from(persons).where(eq(persons.id, id));
            return person?.name || id;
          })
        );
        return personNames;
      }
      
      if (visited.has(current.personId) || current.path.length > 4) continue;
      visited.add(current.personId);
      
      // Find connections
      const connections = await db.select()
        .from(relationships)
        .where(
          or(
            eq(relationships.fromPersonId, current.personId),
            eq(relationships.toPersonId, current.personId)
          )
        );
      
      for (const conn of connections) {
        const nextPersonId = conn.fromPersonId === current.personId ? conn.toPersonId : conn.fromPersonId;
        if (!visited.has(nextPersonId)) {
          queue.push({
            personId: nextPersonId,
            path: [...current.path, nextPersonId]
          });
        }
      }
    }
    
    return []; // No path found
  }
}

export const aiConnectionIntelligence = new AIConnectionIntelligence();