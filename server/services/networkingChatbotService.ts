import { OpenAI } from 'openai';
import { db } from '../db';
import { persons, relationships } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface NetworkingContext {
  userProfile?: {
    name: string;
    company: string;
    title: string;
    industry?: string;
  };
  targetPerson?: {
    name: string;
    company: string;
    title: string;
  };
  connectionPath?: string[];
  relationshipType?: string;
  connectionStrength?: number;
  userConnections?: number;
  industryContext?: string;
}

export class NetworkingChatbotService {
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  /**
   * Get contextual networking advice based on user query and current context
   */
  async getNetworkingAdvice(
    userId: string,
    userMessage: string,
    context?: NetworkingContext
  ): Promise<string> {
    try {
      // Get conversation history for this user
      const history = this.conversationHistory.get(userId) || [];
      
      // Build system prompt with networking expertise and context
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Prepare messages for OpenAI
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })), // Keep last 10 messages for context
        { role: 'user' as const, content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: 800,
        temperature: 0.7
      });

      const assistantResponse = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";

      // Update conversation history
      const updatedHistory = [
        ...history,
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'assistant', content: assistantResponse, timestamp: new Date() }
      ];
      
      this.conversationHistory.set(userId, updatedHistory);

      return assistantResponse;

    } catch (error) {
      console.error('Error getting networking advice:', error);
      throw new Error('Failed to get networking advice');
    }
  }

  /**
   * Build contextual system prompt for networking advice
   */
  private buildSystemPrompt(context?: NetworkingContext): string {
    const basePrompt = `You are an expert networking advisor and professional relationship strategist. Your role is to provide actionable, personalized advice on:

1. Connection strategies and relationship building
2. Professional introduction messaging and etiquette
3. Networking event preparation and follow-up
4. Building authentic professional relationships
5. Industry-specific networking approaches
6. LinkedIn and social media networking best practices
7. Warm introduction requests and facilitation

Guidelines:
- Provide specific, actionable advice
- Be professional yet approachable
- Consider industry context and relationship dynamics
- Suggest concrete next steps
- Emphasize authenticity and mutual value
- Keep responses concise but comprehensive
- Include specific message templates when helpful`;

    if (!context) return basePrompt;

    let contextualInfo = '\n\nCurrent Context:\n';

    if (context.userProfile) {
      contextualInfo += `- User: ${context.userProfile.name}, ${context.userProfile.title} at ${context.userProfile.company}\n`;
      if (context.userProfile.industry) {
        contextualInfo += `- Industry: ${context.userProfile.industry}\n`;
      }
    }

    if (context.targetPerson) {
      contextualInfo += `- Target Connection: ${context.targetPerson.name}, ${context.targetPerson.title} at ${context.targetPerson.company}\n`;
    }

    if (context.connectionPath && context.connectionPath.length > 0) {
      contextualInfo += `- Connection Path: ${context.connectionPath.join(' → ')}\n`;
    }

    if (context.relationshipType) {
      contextualInfo += `- Relationship Type: ${context.relationshipType}\n`;
    }

    if (context.connectionStrength) {
      contextualInfo += `- Connection Strength: ${context.connectionStrength}/10\n`;
    }

    if (context.userConnections) {
      contextualInfo += `- User's Network Size: ${context.userConnections} connections\n`;
    }

    return basePrompt + contextualInfo;
  }

  /**
   * Generate introduction message template
   */
  async generateIntroductionMessage(
    requesterName: string,
    connectorName: string,
    targetName: string,
    targetCompany: string,
    purpose: string,
    context?: {
      relationshipType?: string;
      mutualInterests?: string[];
      industry?: string;
    }
  ): Promise<string> {
    try {
      const prompt = `Generate a professional introduction email template for:

Requester: ${requesterName}
Connector: ${connectorName}  
Target: ${targetName} at ${targetCompany}
Purpose: ${purpose}

${context?.relationshipType ? `Relationship context: ${context.relationshipType}` : ''}
${context?.mutualInterests ? `Mutual interests: ${context.mutualInterests.join(', ')}` : ''}
${context?.industry ? `Industry: ${context.industry}` : ''}

Requirements:
- Professional but warm tone
- Clear value proposition for both parties
- Specific ask with easy next steps
- Graceful exit option for the connector
- 150-200 words
- Include subject line

Format as a complete email template.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert at crafting professional introduction emails that result in meaningful connections.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.8
      });

      return response.choices[0].message.content || "Unable to generate introduction message.";

    } catch (error) {
      console.error('Error generating introduction message:', error);
      throw new Error('Failed to generate introduction message');
    }
  }

  /**
   * Analyze networking opportunity and provide strategic advice
   */
  async analyzeNetworkingOpportunity(
    userProfile: NetworkingContext['userProfile'],
    opportunity: {
      type: 'event' | 'introduction' | 'cold_outreach' | 'follow_up';
      description: string;
      targets?: string[];
      goals?: string[];
    }
  ): Promise<{
    strategy: string;
    tactics: string[];
    messageTemplates?: string[];
    followUpPlan: string;
  }> {
    try {
      const prompt = `Analyze this networking opportunity and provide strategic advice:

User Profile:
- Name: ${userProfile?.name}
- Title: ${userProfile?.title}
- Company: ${userProfile?.company}
- Industry: ${userProfile?.industry || 'Not specified'}

Opportunity:
- Type: ${opportunity.type}
- Description: ${opportunity.description}
- Targets: ${opportunity.targets?.join(', ') || 'Not specified'}
- Goals: ${opportunity.goals?.join(', ') || 'Not specified'}

Provide a comprehensive networking strategy including:
1. Overall strategy (2-3 sentences)
2. Specific tactics (3-5 bullet points)
3. Follow-up plan (timeline and actions)

Format as JSON with keys: strategy, tactics (array), followUpPlan (string)`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a strategic networking consultant. Provide actionable, specific advice in JSON format.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        strategy: result.strategy || 'Strategy analysis unavailable',
        tactics: result.tactics || [],
        followUpPlan: result.followUpPlan || 'Follow-up plan unavailable'
      };

    } catch (error) {
      console.error('Error analyzing networking opportunity:', error);
      throw new Error('Failed to analyze networking opportunity');
    }
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(userId: string): ChatMessage[] {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Clear conversation history for a user
   */
  clearConversationHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  /**
   * Get networking statistics and insights for user context
   */
  async getUserNetworkingContext(userId: string): Promise<NetworkingContext> {
    try {
      // Get user's connections count
      const userConnections = await db
        .select()
        .from(relationships)
        .where(eq(relationships.fromPersonId, userId));

      // Get user profile if available
      const [userProfile] = await db
        .select()
        .from(persons)
        .where(eq(persons.id, userId))
        .limit(1);

      return {
        userProfile: userProfile ? {
          name: userProfile.name,
          company: userProfile.company || 'Not specified',
          title: userProfile.title || 'Not specified'
        } : undefined,
        userConnections: userConnections.length
      };

    } catch (error) {
      console.error('Error getting user networking context:', error);
      return { userConnections: 0 };
    }
  }
}

export const networkingChatbotService = new NetworkingChatbotService();