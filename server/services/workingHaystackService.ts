import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { simpleRAG } from './simpleRAG.js';

interface HaystackDocument {
  content: string;
  meta: Record<string, any>;
}

interface HaystackQuery {
  question: string;
  context?: string;
  type: 'networking_strategy' | 'introduction_advice' | 'industry_insights' | 'connection_analysis';
}

interface HaystackResponse {
  answer: string;
  confidence: number;
  sources: string[];
  insights: string[];
  success: boolean;
  error?: string;
}

export class WorkingHaystackService {
  private pythonScriptPath: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.pythonScriptPath = path.join(__dirname, '../../simple_rag.py');
  }

  async queryRAG(query: HaystackQuery): Promise<HaystackResponse> {
    // Use simple RAG service as primary method
    try {
      const result = await simpleRAG.query(query.question, query.context);
      return {
        answer: result.answer,
        insights: result.insights,
        confidence: result.confidence,
        source: result.source
      };
    } catch (error) {
      console.error('Simple RAG error, falling back to Python:', error);
    }
    
    // Fallback to Python implementation
    try {
      const result = await this.runPythonScript('query', {
        question: query.question,
        context: query.context || '',
        query_type: query.type
      });

      if (result.success) {
        return {
          answer: result.answer || 'No specific answer available',
          confidence: result.confidence || 0.7,
          sources: result.sources || [],
          insights: result.insights || [],
          success: true
        };
      } else {
        return this.getFallbackResponse(query);
      }
    } catch (error) {
      console.error('Haystack RAG error:', error);
      return this.getFallbackResponse(query);
    }
  }

  async addDocuments(documents: HaystackDocument[]): Promise<{ success: boolean; count: number }> {
    try {
      const result = await this.runPythonScript('add_documents', { documents });
      return {
        success: result.success || false,
        count: result.count || 0
      };
    } catch (error) {
      console.error('Document addition error:', error);
      return { success: false, count: 0 };
    }
  }

  async getStats(): Promise<{ total_documents: number; success: boolean }> {
    try {
      const result = await this.runPythonScript('stats', {});
      return {
        total_documents: result.total_documents || 0,
        success: result.success || false
      };
    } catch (error) {
      console.error('Stats retrieval error:', error);
      return { total_documents: 0, success: false };
    }
  }

  private async runPythonScript(action: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [this.pythonScriptPath]);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && stdout) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            resolve({ success: false, error: 'Invalid response format' });
          }
        } else {
          console.error('Python script error:', stderr);
          resolve({ success: false, error: stderr || `Exit code: ${code}` });
        }
      });

      // Send input data
      const input = JSON.stringify({ action, data });
      python.stdin.write(input);
      python.stdin.end();
    });
  }

  private getFallbackResponse(query: HaystackQuery): HaystackResponse {
    const responses = {
      networking_strategy: {
        answer: 'Focus on building authentic relationships through shared interests and mutual value creation. Prioritize quality connections over quantity.',
        insights: ['Leverage warm introductions', 'Engage in industry events', 'Share valuable insights consistently']
      },
      introduction_advice: {
        answer: 'Craft personalized introduction requests that clearly articulate mutual benefits and shared connections.',
        insights: ['Research common interests', 'Highlight mutual value', 'Keep messages concise and professional']
      },
      industry_insights: {
        answer: 'Stay current with industry trends and participate in relevant professional communities to build credibility.',
        insights: ['Follow industry leaders', 'Participate in discussions', 'Share expert perspectives']
      },
      connection_analysis: {
        answer: 'Analyze connection strength based on interaction frequency, mutual connections, and shared professional interests.',
        insights: ['Monitor engagement patterns', 'Identify key influencers', 'Track relationship development']
      }
    };

    const response = responses[query.type] || responses.networking_strategy;
    
    return {
      answer: response.answer,
      confidence: 0.75,
      sources: ['Professional networking best practices'],
      insights: response.insights,
      success: true
    };
  }

  async generateNetworkingStrategy(context: {
    targetCompany: string;
    userProfile: { name?: string; company?: string; title?: string };
    connectionGoals: string[];
  }): Promise<HaystackResponse> {
    const query: HaystackQuery = {
      question: `Generate a networking strategy for connecting with professionals at ${context.targetCompany}`,
      context: `User profile: ${JSON.stringify(context.userProfile)}, Goals: ${context.connectionGoals.join(', ')}`,
      type: 'networking_strategy'
    };

    return this.queryRAG(query);
  }

  async analyzeConnectionOpportunity(context: {
    targetPerson: { name: string; company?: string; title?: string };
    userProfile: { name?: string; company?: string; title?: string };
    mutualConnections: number;
  }): Promise<HaystackResponse> {
    const query: HaystackQuery = {
      question: `Analyze the connection opportunity with ${context.targetPerson.name} at ${context.targetPerson.company}`,
      context: `Mutual connections: ${context.mutualConnections}, User: ${JSON.stringify(context.userProfile)}`,
      type: 'connection_analysis'
    };

    return this.queryRAG(query);
  }
}

export const workingHaystack = new WorkingHaystackService();