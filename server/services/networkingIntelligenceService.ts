import { enhancedConnectionService } from './enhancedConnectionService';
import { workingHaystack } from './workingHaystackService';
import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface NetworkingIntelligenceRequest {
  type: 'connection_discovery' | 'introduction_pathfinding' | 'networking_strategy' | 'dual_ai_test';
  data: {
    companyName?: string;
    targetName?: string;
    targetCompany?: string;
    userContext?: {
      name?: string;
      company?: string;
      title?: string;
    };
    query?: string;
  };
}

interface DualAIResponse {
  openai: {
    response: string;
    confidence: number;
    processingTime: number;
  };
  haystack: {
    response: string;
    insights: string[];
    confidence: number;
    processingTime: number;
  };
  combined: {
    recommendation: string;
    actionableInsights: string[];
    confidence: number;
  };
  systemStatus: {
    openaiAvailable: boolean;
    haystackAvailable: boolean;
    dualModeActive: boolean;
  };
}

export class NetworkingIntelligenceService {
  
  async processNetworkingQuery(request: NetworkingIntelligenceRequest): Promise<DualAIResponse> {
    const startTime = Date.now();
    
    let openaiResult = { response: '', confidence: 0, processingTime: 0 };
    let haystackResult = { response: '', insights: [], confidence: 0, processingTime: 0 };
    let systemStatus = { openaiAvailable: false, haystackAvailable: false, dualModeActive: false };

    // Test OpenAI
    try {
      const openaiStart = Date.now();
      const openaiResponse = await this.queryOpenAI(request);
      openaiResult = {
        response: openaiResponse.response,
        confidence: openaiResponse.confidence,
        processingTime: Date.now() - openaiStart
      };
      systemStatus.openaiAvailable = true;
    } catch (error) {
      console.error('OpenAI service error:', error);
      openaiResult.response = 'OpenAI service temporarily unavailable';
    }

    // Test Haystack
    try {
      const haystackStart = Date.now();
      const haystackResponse = await this.queryHaystack(request);
      haystackResult = {
        response: haystackResponse.answer,
        insights: haystackResponse.insights,
        confidence: haystackResponse.confidence,
        processingTime: Date.now() - haystackStart
      };
      systemStatus.haystackAvailable = true;
    } catch (error) {
      console.error('Haystack service error:', error);
      haystackResult.response = 'Haystack RAG service temporarily unavailable';
    }

    systemStatus.dualModeActive = systemStatus.openaiAvailable && systemStatus.haystackAvailable;

    // Generate combined recommendation
    const combined = await this.generateCombinedRecommendation(openaiResult, haystackResult, request);

    return {
      openai: openaiResult,
      haystack: haystackResult,
      combined,
      systemStatus
    };
  }

  private async queryOpenAI(request: NetworkingIntelligenceRequest): Promise<{ response: string; confidence: number }> {
    const prompt = this.buildOpenAIPrompt(request);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      response: result.response || 'No specific recommendation available',
      confidence: result.confidence || 0.8
    };
  }

  private async queryHaystack(request: NetworkingIntelligenceRequest): Promise<{ answer: string; insights: string[]; confidence: number }> {
    const query = this.buildHaystackQuery(request);
    return await workingHaystack.queryRAG(query);
  }

  private buildOpenAIPrompt(request: NetworkingIntelligenceRequest): string {
    switch (request.type) {
      case 'connection_discovery':
        return `
        Analyze this professional networking scenario for connection discovery:
        Company: ${request.data.companyName}
        User Context: ${JSON.stringify(request.data.userContext)}
        
        Provide strategic analysis in JSON format:
        {
          "response": "Detailed networking strategy for this company",
          "confidence": 0.85
        }
        
        Focus on professional relationship building and business development opportunities.
        `;
        
      case 'introduction_pathfinding':
        return `
        Analyze introduction pathfinding for professional networking:
        Target: ${request.data.targetName} at ${request.data.targetCompany}
        User Context: ${JSON.stringify(request.data.userContext)}
        
        Provide pathfinding analysis in JSON format:
        {
          "response": "Strategic approach for reaching this target contact",
          "confidence": 0.8
        }
        
        Focus on warm introduction strategies and relationship mapping.
        `;
        
      case 'networking_strategy':
        return `
        Generate comprehensive networking strategy:
        Query: ${request.data.query}
        Context: ${JSON.stringify(request.data.userContext)}
        
        Provide strategic guidance in JSON format:
        {
          "response": "Comprehensive networking strategy and recommendations",
          "confidence": 0.9
        }
        `;
        
      case 'dual_ai_test':
        return `
        This is a system test for dual AI networking intelligence.
        Query: ${request.data.query || 'Test professional networking capabilities'}
        
        Provide test response in JSON format:
        {
          "response": "OpenAI networking intelligence is operational and ready for professional networking analysis",
          "confidence": 0.95
        }
        `;
        
      default:
        return `
        General professional networking query:
        ${request.data.query || 'Provide networking guidance'}
        
        Respond in JSON format:
        {
          "response": "Professional networking guidance",
          "confidence": 0.8
        }
        `;
    }
  }

  private buildHaystackQuery(request: NetworkingIntelligenceRequest) {
    switch (request.type) {
      case 'connection_discovery':
        return {
          question: `How to discover and connect with professionals at ${request.data.companyName}?`,
          context: `User profile: ${JSON.stringify(request.data.userContext)}`,
          type: 'networking_strategy' as const
        };
        
      case 'introduction_pathfinding':
        return {
          question: `How to get introduced to ${request.data.targetName} at ${request.data.targetCompany}?`,
          context: `User seeking introduction`,
          type: 'introduction_advice' as const
        };
        
      case 'networking_strategy':
        return {
          question: request.data.query || 'General networking strategy advice',
          type: 'networking_strategy' as const
        };
        
      case 'dual_ai_test':
        return {
          question: 'Test Haystack RAG system for professional networking',
          type: 'networking_strategy' as const
        };
        
      default:
        return {
          question: request.data.query || 'Professional networking guidance',
          type: 'networking_strategy' as const
        };
    }
  }

  private async generateCombinedRecommendation(
    openaiResult: { response: string; confidence: number },
    haystackResult: { response: string; insights: string[]; confidence: number },
    request: NetworkingIntelligenceRequest
  ): Promise<{ recommendation: string; actionableInsights: string[]; confidence: number }> {
    
    // Combine insights from both systems
    const combinedInsights = [
      ...haystackResult.insights,
      'Leverage both strategic analysis and knowledge base insights',
      'Cross-reference recommendations from multiple AI perspectives'
    ];

    const avgConfidence = (openaiResult.confidence + haystackResult.confidence) / 2;

    let recommendation = '';
    if (openaiResult.response && haystackResult.response) {
      recommendation = `Dual AI Analysis: ${openaiResult.response} Additionally, ${haystackResult.response}`;
    } else if (openaiResult.response) {
      recommendation = `OpenAI Analysis: ${openaiResult.response}`;
    } else if (haystackResult.response) {
      recommendation = `Haystack Analysis: ${haystackResult.response}`;
    } else {
      recommendation = 'Both AI systems are currently experiencing issues. Please try again later.';
    }

    return {
      recommendation,
      actionableInsights: combinedInsights.slice(0, 5),
      confidence: avgConfidence
    };
  }

  async testDualAISystem(): Promise<DualAIResponse> {
    return this.processNetworkingQuery({
      type: 'dual_ai_test',
      data: {
        query: 'Test both OpenAI and Haystack systems for professional networking intelligence'
      }
    });
  }

  async findConnections(companyName: string, userContext?: any) {
    return enhancedConnectionService.findConnections({
      companyName,
      userContext
    });
  }

  async findIntroduction(targetName: string, targetCompany?: string, userContext?: any) {
    return enhancedConnectionService.findIntroduction({
      targetName,
      targetCompany,
      userContext
    });
  }
}

export const networkingIntelligence = new NetworkingIntelligenceService();