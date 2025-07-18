import OpenAI from 'openai';

interface Document {
  content: string;
  metadata: Record<string, any>;
}

interface RAGResponse {
  answer: string;
  insights: string[];
  confidence: number;
  source: string;
}

class SimpleRAGService {
  private openai: OpenAI;
  private documents: Document[] = [];

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Professional networking knowledge base
    this.documents = [
      {
        content: "Effective networking requires authentic relationship building, not transactional exchanges. Focus on providing value first, understanding others' needs, and maintaining consistent follow-up communication.",
        metadata: { category: "networking_fundamentals", topic: "relationship_building" }
      },
      {
        content: "When seeking introductions, research the mutual connection thoroughly, craft a specific ask with clear value proposition, and make it easy for the introducer by providing context and suggested messaging.",
        metadata: { category: "introductions", topic: "best_practices" }
      },
      {
        content: "LinkedIn strategies: personalize connection requests, engage meaningfully with content before reaching out, use industry-specific keywords, and leverage alumni networks for warm introductions.",
        metadata: { category: "linkedin", topic: "outreach_strategy" }
      },
      {
        content: "Industry events and conferences offer high-value networking opportunities. Prepare elevator pitches, research attendees beforehand, follow up within 48 hours, and focus on quality over quantity of connections.",
        metadata: { category: "events", topic: "conference_networking" }
      },
      {
        content: "Professional relationship maintenance requires systematic follow-up: quarterly check-ins, sharing relevant articles, congratulating on achievements, and offering assistance without expecting immediate returns.",
        metadata: { category: "relationship_management", topic: "long_term_strategy" }
      }
    ];
  }

  async query(question: string, context?: string): Promise<RAGResponse> {
    try {
      // Simple semantic search using keyword matching
      const relevantDocs = this.searchDocuments(question);
      const contextualContent = relevantDocs.map(doc => doc.content).join('\n\n');

      const prompt = `
        Based on the following professional networking knowledge:
        
        ${contextualContent}
        
        ${context ? `Additional context: ${context}` : ''}
        
        Question: ${question}
        
        Provide a comprehensive answer with specific insights and actionable recommendations.
        
        Format your response as JSON with:
        - answer: detailed response
        - insights: array of 3-5 key insights
        - confidence: score from 0-1
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from OpenAI');

      const parsed = JSON.parse(content);
      
      return {
        answer: parsed.answer || 'No specific guidance available',
        insights: parsed.insights || ['Focus on authentic relationship building'],
        confidence: parsed.confidence || 0.8,
        source: 'Professional Networking Knowledge Base'
      };

    } catch (error) {
      console.error('RAG query error:', error);
      return {
        answer: 'Unable to process networking query at this time',
        insights: ['Focus on building authentic professional relationships'],
        confidence: 0.5,
        source: 'Fallback response'
      };
    }
  }

  private searchDocuments(query: string): Document[] {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(word => word.length > 3);
    
    return this.documents
      .map(doc => ({
        doc,
        score: this.calculateRelevanceScore(doc.content.toLowerCase(), keywords)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.doc);
  }

  private calculateRelevanceScore(content: string, keywords: string[]): number {
    return keywords.reduce((score, keyword) => {
      return score + (content.includes(keyword) ? 1 : 0);
    }, 0);
  }

  addDocument(content: string, metadata: Record<string, any>) {
    this.documents.push({ content, metadata });
  }

  getStats() {
    return {
      totalDocuments: this.documents.length,
      categories: [...new Set(this.documents.map(d => d.metadata.category))]
    };
  }
}

export const simpleRAG = new SimpleRAGService();