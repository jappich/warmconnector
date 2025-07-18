import OpenAI from 'openai';

export class AINetworkingService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for AI networking features');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Semantic profile analysis similar to Haystack's document processing
  async analyzeProfileSemantically(profileData: any) {
    try {
      const prompt = `
        Analyze this professional profile and extract key networking insights:
        
        Profile: ${JSON.stringify(profileData)}
        
        Please provide:
        1. Core expertise areas
        2. Industry connections potential
        3. Collaboration opportunities
        4. Networking personality type
        5. Best introduction approach
        
        Format as structured JSON.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Profile analysis error:', error);
      throw new Error('Failed to analyze profile semantically');
    }
  }

  // Document-based connection discovery (Haystack-style RAG)
  async findConnectionsFromDocuments(documents: string[], targetPerson: string) {
    try {
      const prompt = `
        Based on these professional documents, find potential connection paths to ${targetPerson}:
        
        Documents: ${documents.join('\n\n')}
        
        Identify:
        1. Mutual connections mentioned
        2. Shared experiences or projects
        3. Common interests or expertise
        4. Introduction opportunities
        5. Conversation starters
        
        Provide actionable networking insights.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error('Failed to analyze documents for connections');
    }
  }

  // Generate contextual introduction messages
  async generateIntroductionMessage(fromProfile: any, toProfile: any, context: string) {
    try {
      const prompt = `
        Generate a warm, professional introduction message:
        
        From: ${JSON.stringify(fromProfile)}
        To: ${JSON.stringify(toProfile)}
        Context: ${context}
        
        Create a personalized message that:
        1. Establishes credibility
        2. Shows genuine interest
        3. Provides clear value proposition
        4. Suggests specific next steps
        
        Keep it concise and authentic.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Introduction generation error:', error);
      throw new Error('Failed to generate introduction message');
    }
  }

  // Semantic search across professional network (Haystack-inspired)
  async semanticNetworkSearch(query: string, networkData: any[]) {
    try {
      const prompt = `
        Perform semantic search across this professional network for: "${query}"
        
        Network Data: ${JSON.stringify(networkData.slice(0, 10))} // Limit for API
        
        Find relevant:
        1. People with matching expertise
        2. Companies with relevant focus
        3. Projects or experiences
        4. Potential collaboration opportunities
        
        Rank by relevance and explain reasoning.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Semantic search error:', error);
      throw new Error('Failed to perform semantic network search');
    }
  }

  // Extract networking insights from unstructured text
  async extractNetworkingInsights(text: string) {
    try {
      const prompt = `
        Extract networking insights from this text:
        
        "${text}"
        
        Identify:
        1. People mentioned (names, roles, companies)
        2. Relationship indicators
        3. Contact information
        4. Networking opportunities
        5. Professional events or connections
        
        Structure as actionable networking data.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Insight extraction error:', error);
      throw new Error('Failed to extract networking insights');
    }
  }

  // Generate networking strategy recommendations
  async generateNetworkingStrategy(userProfile: any, goals: string[]) {
    try {
      const prompt = `
        Create a personalized networking strategy:
        
        User Profile: ${JSON.stringify(userProfile)}
        Goals: ${goals.join(', ')}
        
        Provide:
        1. Target connection types
        2. Optimal networking channels
        3. Conversation starters
        4. Follow-up strategies
        5. Relationship building tactics
        
        Make it actionable and specific.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Strategy generation error:', error);
      throw new Error('Failed to generate networking strategy');
    }
  }

  // Generate networking suggestions for a user
  async generateNetworkingSuggestionsLegacy(userId: string, userGoals: string, industryFocus: string) {
    try {
      const prompt = `
        Generate personalized networking suggestions for a professional:
        
        User ID: ${userId}
        Goals: ${userGoals}
        Industry Focus: ${industryFocus}
        
        Provide:
        1. Target industries and roles to connect with
        2. Networking events and opportunities
        3. Strategic connection approaches
        4. Personal branding recommendations
        5. Follow-up strategies
        
        Format as structured JSON.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Networking suggestions error:', error);
      throw new Error('Failed to generate networking suggestions');
    }
  }

  // Analyze connection potential with target person
  async analyzeConnectionPotential(userId: string, targetPersonId: string, userGoals: string) {
    try {
      const prompt = `
        Analyze the connection potential between two professionals:
        
        User ID: ${userId}
        Target Person ID: ${targetPersonId}
        User Goals: ${userGoals}
        
        Analyze:
        1. Mutual benefit potential
        2. Collaboration opportunities
        3. Introduction approach strategy
        4. Expected connection strength
        5. Best timing for outreach
        
        Format as structured JSON with scores and recommendations.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Connection analysis error:', error);
      throw new Error('Failed to analyze connection potential');
    }
  }

  // Enhanced networking suggestions with context awareness
  async generateNetworkingSuggestionsEnhanced(
    userId: string,
    userGoals: string[],
    industryFocus?: string
  ): Promise<{
    prioritySuggestions: Array<{
      type: string;
      title: string;
      description: string;
      actionable: boolean;
      estimatedValue: number;
      timeToComplete: string;
    }>;
    industryInsights: string;
    strategicOpportunities: string[];
    nextSteps: string[];
  }> {
    try {
      const prompt = `
        Generate intelligent networking suggestions for a professional:
        
        User ID: ${userId}
        Goals: ${userGoals.join(', ')}
        Industry Focus: ${industryFocus || 'General Professional'}
        
        Provide comprehensive suggestions in JSON format:
        {
          "prioritySuggestions": [
            {
              "type": "connection|event|content|platform",
              "title": "specific suggestion title",
              "description": "detailed description",
              "actionable": true,
              "estimatedValue": 85,
              "timeToComplete": "2-3 weeks"
            }
          ],
          "industryInsights": "relevant industry networking trends",
          "strategicOpportunities": ["opportunity1", "opportunity2"],
          "nextSteps": ["action1", "action2", "action3"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: "You are a senior networking strategist who provides actionable, data-driven networking recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Networking suggestions generation error:', error);
      return {
        prioritySuggestions: [],
        industryInsights: 'Focus on building meaningful professional relationships in your target industry.',
        strategicOpportunities: ['Industry conferences', 'Professional associations', 'Alumni networks'],
        nextSteps: ['Update LinkedIn profile', 'Join relevant groups', 'Attend networking events']
      };
    }
  }

  // Advanced connection opportunity scoring
  async analyzeConnectionOpportunity(
    userProfile: any, 
    targetProfile: any, 
    context: string = 'professional networking'
  ): Promise<{
    opportunityScore: number;
    recommendedApproach: string;
    sharedInterests: string[];
    valueProposition: string;
    riskFactors: string[];
    optimalTiming: string;
    followUpStrategy: string[];
  }> {
    try {
      const prompt = `
        Analyze this networking opportunity between two professionals:
        
        User Profile: ${JSON.stringify(userProfile)}
        Target Profile: ${JSON.stringify(targetProfile)}
        Context: ${context}
        
        Provide detailed analysis in JSON format:
        {
          "opportunityScore": 85,
          "recommendedApproach": "specific approach strategy",
          "sharedInterests": ["interest1", "interest2"],
          "valueProposition": "what user can offer target",
          "riskFactors": ["potential concerns"],
          "optimalTiming": "when to reach out",
          "followUpStrategy": ["step1", "step2", "step3"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: "You are an expert networking strategist who analyzes professional connection opportunities with precision."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        opportunityScore: result.opportunityScore || 75,
        recommendedApproach: result.recommendedApproach || 'Professional introduction through mutual connections',
        sharedInterests: result.sharedInterests || [],
        valueProposition: result.valueProposition || 'Mutual professional growth opportunities',
        riskFactors: result.riskFactors || [],
        optimalTiming: result.optimalTiming || 'Within 1-2 weeks',
        followUpStrategy: result.followUpStrategy || ['Send connection request', 'Schedule coffee meeting', 'Follow up quarterly']
      };
    } catch (error) {
      console.error('Connection opportunity analysis error:', error);
      return {
        opportunityScore: 70,
        recommendedApproach: 'Professional introduction through mutual connections',
        sharedInterests: [],
        valueProposition: 'Mutual professional growth opportunities',
        riskFactors: [],
        optimalTiming: 'Within 1-2 weeks',
        followUpStrategy: ['Send connection request', 'Schedule coffee meeting', 'Follow up quarterly']
      };
    }
  }
}

// Export instance for direct use
export const aiNetworkingService = new AINetworkingService();