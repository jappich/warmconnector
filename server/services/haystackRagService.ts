import OpenAI from 'openai';
import { DocumentProcessingService } from './documentProcessingService';

interface RagDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    type: 'resume' | 'linkedin' | 'email' | 'company_report' | 'social_post' | 'networking_guide';
    personId?: string;
    timestamp: Date;
  };
  embedding?: number[];
}

interface RagQueryResult {
  question: string;
  answer: string;
  retrievedDocuments: Array<{
    content: string;
    metadata: any;
    score: number;
    reasoning: string;
  }>;
  success: boolean;
  error?: string;
}

export class HaystackRagService {
  private static instance: HaystackRagService;
  private openai: OpenAI;
  private documentProcessor: DocumentProcessingService;
  private knowledgeBase: Map<string, RagDocument> = new Map();
  private isInitialized = false;

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key required for RAG pipeline');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.documentProcessor = new DocumentProcessingService();
  }

  public static getInstance(): HaystackRagService {
    if (!HaystackRagService.instance) {
      HaystackRagService.instance = new HaystackRagService();
      // Initialize knowledge base for the singleton instance
      HaystackRagService.instance.initializeKnowledgeBase();
    }
    return HaystackRagService.instance;
  }

  private async initializeKnowledgeBase() {
    if (this.isInitialized) return;
    
    try {
      await this.loadNetworkingKnowledgeBase();
      this.isInitialized = true;
      console.log('Knowledge base initialized with', this.knowledgeBase.size, 'documents');
    } catch (error) {
      console.error('Failed to initialize knowledge base:', error);
    }
  }

  private async loadNetworkingKnowledgeBase() {
    const networkingDocs = [
      {
        id: 'linkedin_best_practices',
        content: `
          LinkedIn Networking Best Practices:
          - Optimize your profile with a professional headshot and compelling headline
          - Write personalized connection requests instead of generic messages
          - Engage with your network's content through meaningful comments
          - Share valuable industry insights and thought leadership content
          - Use LinkedIn's messaging features for warm introductions
          - Join relevant professional groups and participate in discussions
          - Publish articles to establish thought leadership
          - Use LinkedIn Sales Navigator for advanced prospecting
          - Maintain consistent activity with 2-3 posts per week
          - Follow up on connections within 48 hours of connecting
        `,
        metadata: {
          source: 'linkedin_guide',
          type: 'networking_guide' as const,
          timestamp: new Date()
        }
      },
      {
        id: 'warm_introductions',
        content: `
          Warm Introduction Best Practices:
          - Research both parties thoroughly before making the introduction
          - Clearly explain why you're connecting them and the mutual value
          - Provide brief, relevant context about each person's background
          - Suggest specific ways they might collaborate or help each other
          - Include a clear call to action or next step
          - Follow up to ensure the connection was valuable
          - Always ask permission before making introductions
          - Keep the initial introduction email concise (under 150 words)
          - Include both parties' contact information and LinkedIn profiles
          - Schedule introductory calls or meetings when appropriate
          Research shows warm introductions have a 70% higher success rate than cold outreach.
        `,
        metadata: {
          source: 'introduction_best_practices',
          type: 'networking_guide' as const,
          timestamp: new Date()
        }
      },
      {
        id: 'professional_networking_strategy',
        content: `
          Strategic Professional Networking:
          - Set specific networking goals (e.g., 5 new connections per month)
          - Attend industry conferences, meetups, and professional events
          - Join professional associations relevant to your field
          - Volunteer for causes aligned with your industry interests
          - Maintain relationships through regular check-ins and updates
          - Offer value before asking for help or favors
          - Leverage mutual connections for warm introductions
          - Follow up promptly on all new connections within 24-48 hours
          - Create a networking CRM to track relationships and interactions
          - Focus on quality over quantity in relationship building
          - Share others' content and celebrate their achievements publicly
          - Host or organize networking events in your area of expertise
        `,
        metadata: {
          source: 'networking_strategy',
          type: 'networking_guide' as const,
          timestamp: new Date()
        }
      },
      {
        id: 'social_media_networking',
        content: `
          Multi-Platform Social Media Networking:
          - LinkedIn: Professional connections, industry discussions, thought leadership
          - Twitter: Real-time industry conversations, quick networking, hashtag engagement
          - GitHub: Technical collaboration, open source contributions, developer networking
          - Instagram: Personal branding, behind-the-scenes content, visual storytelling
          - Facebook: Community building, local professional groups, event networking
          - TikTok: Creative content, younger demographic engagement, trend participation
          - YouTube: Educational content, tutorial creation, expertise demonstration
          
          Cross-platform strategy:
          - Maintain consistent personal branding across all platforms
          - Adapt content style to each platform's unique culture and audience
          - Cross-promote content strategically without being repetitive
          - Use platform-specific features (LinkedIn articles, Twitter threads, etc.)
          - Monitor analytics to understand which platforms drive best engagement
        `,
        metadata: {
          source: 'social_media_networking',
          type: 'networking_guide' as const,
          timestamp: new Date()
        }
      },
      {
        id: 'networking_email_templates',
        content: `
          Effective Networking Email Structure:
          
          1. Subject Line Examples:
          - "Introduction request - [Mutual connection] suggested we connect"
          - "Following up from [Event name] - potential collaboration"
          - "Quick question about [specific topic] from a fellow [industry] professional"
          
          2. Email Template Structure:
          - Opening: Brief personal connection or mutual contact reference
          - Context: Specific reason for reaching out and background
          - Value Proposition: What you can offer or mutual benefit opportunity
          - Call to Action: Clear next step (coffee, call, meeting)
          - Professional Closing: Contact information and availability
          
          3. Best Practices:
          - Keep emails under 150 words for better response rates
          - Personalize every message with specific details
          - Include a clear value proposition for the recipient
          - Suggest specific meeting times and formats
          - Follow up after 1 week if no response
          - Always proofread for grammar and spelling errors
        `,
        metadata: {
          source: 'email_networking',
          type: 'networking_guide' as const,
          timestamp: new Date()
        }
      },
      {
        id: 'relationship_building_fundamentals',
        content: `
          Professional Relationship Building Principles:
          
          Core Fundamentals:
          - Listen actively to understand others' needs, challenges, and goals
          - Share resources, insights, and opportunities freely without expecting immediate returns
          - Be authentic and genuine in all professional interactions
          - Follow through consistently on commitments and promises made
          - Remember and reference personal details from previous conversations
          - Celebrate others' successes publicly through social media and direct communication
          - Maintain relationships proactively even when you don't need anything
          
          Advanced Strategies:
          - Create value through introductions between your connections
          - Share industry insights and market intelligence regularly
          - Offer expertise and advice in your areas of specialization
          - Invite valuable connections to exclusive events or opportunities
          - Collaborate on projects, content, or business initiatives
          - Provide testimonials and recommendations for trusted contacts
          
          Strong professional relationships are built on trust, consistency, mutual benefit, and long-term thinking.
        `,
        metadata: {
          source: 'relationship_building',
          type: 'networking_guide' as const,
          timestamp: new Date()
        }
      }
    ];

    // Process documents with embeddings
    for (const doc of networkingDocs) {
      try {
        const embedding = await this.generateEmbedding(doc.content);
        const ragDoc: RagDocument = {
          ...doc,
          embedding
        };
        this.knowledgeBase.set(doc.id, ragDoc);
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        // Store without embedding as fallback
        this.knowledgeBase.set(doc.id, doc as RagDocument);
      }
    }
  }

  async ingestDocument(content: string, metadata: RagDocument['metadata']): Promise<string> {
    try {
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate embeddings for semantic search
      const embedding = await this.generateEmbedding(content);
      
      const document: RagDocument = {
        id: documentId,
        content,
        metadata: {
          ...metadata,
          timestamp: new Date()
        },
        embedding
      };

      this.knowledgeBase.set(documentId, document);

      // Also process through the document processor for database integration
      await this.documentProcessor.ingestDocument(content, metadata);

      return documentId;
    } catch (error) {
      console.error('Document ingestion error:', error);
      throw new Error('Failed to ingest document');
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async semanticSearch(query: string, limit: number = 5): Promise<Array<{document: RagDocument, score: number, reasoning: string}>> {
    try {
      // Ensure knowledge base is loaded
      if (this.knowledgeBase.size === 0) {
        console.log('Knowledge base empty, initializing...');
        await this.loadNetworkingKnowledgeBase();
      }

      const queryEmbedding = await this.generateEmbedding(query);
      const results = [];

      console.log(`Searching ${this.knowledgeBase.size} documents for: "${query}"`);

      for (const [id, doc] of this.knowledgeBase) {
        if (!doc.embedding || doc.embedding.length === 0) {
          console.log(`Document ${id} missing embedding, skipping`);
          continue;
        }
        
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        console.log(`Document ${id} similarity: ${similarity.toFixed(3)}`);
        
        if (similarity > 0.5) { // Lower threshold for better recall
          const reasoning = await this.explainRelevance(query, doc.content);
          results.push({
            document: doc,
            score: similarity,
            reasoning
          });
        }
      }

      console.log(`Found ${results.length} relevant documents`);
      
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  private async explainRelevance(query: string, document: string): Promise<string> {
    try {
      const prompt = `
        Briefly explain why this document excerpt is relevant to the query "${query}":
        
        Document: "${document.substring(0, 300)}..."
        
        Provide a concise explanation focused on networking value.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100,
      });

      return response.choices[0].message.content || 'Contains relevant networking insights';
    } catch (error) {
      return 'Matches query criteria for professional networking';
    }
  }

  async query(question: string): Promise<RagQueryResult> {
    try {
      // Retrieve relevant documents
      const relevantDocs = await this.semanticSearch(question, 5);
      
      if (relevantDocs.length === 0) {
        return {
          question,
          answer: "I don't have specific information about that topic in my networking knowledge base. However, I'd recommend focusing on building authentic relationships, providing value to others, and maintaining consistent engagement across your professional networks.",
          retrievedDocuments: [],
          success: true
        };
      }

      // Build context from retrieved documents
      const context = relevantDocs
        .map(result => result.document.content)
        .join('\n\n---\n\n');

      // Generate RAG response
      const prompt = `
        You are an expert professional networking advisor for WarmConnector, a platform that helps professionals find warm introduction paths and build meaningful business relationships.

        Based on the following networking knowledge base, provide a comprehensive and actionable answer to the user's question.

        Context from knowledge base:
        ${context}

        Question: ${question}

        Instructions:
        1. Provide specific, actionable advice based on the context
        2. Include best practices and proven strategies
        3. Reference specific techniques or approaches from the knowledge base
        4. If suggesting introductions or outreach, provide template language
        5. Focus on practical steps the user can implement immediately
        6. Maintain a professional, helpful tone

        Answer:
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      });

      const answer = response.choices[0].message.content || 'Unable to generate response';

      return {
        question,
        answer,
        retrievedDocuments: relevantDocs.map(result => ({
          content: result.document.content.substring(0, 500) + '...',
          metadata: result.document.metadata,
          score: result.score,
          reasoning: result.reasoning
        })),
        success: true
      };

    } catch (error) {
      console.error('RAG query error:', error);
      return {
        question,
        answer: `I encountered an error processing your question: ${error.message}. Please try rephrasing your question or contact support if the issue persists.`,
        retrievedDocuments: [],
        success: false,
        error: error.message
      };
    }
  }

  getStats() {
    return {
      totalDocuments: this.knowledgeBase.size,
      documentTypes: Array.from(this.knowledgeBase.values()).reduce((acc, doc) => {
        acc[doc.metadata.type] = (acc[doc.metadata.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      haystackVersion: '2.0-compatible',
      embeddingModel: 'text-embedding-3-small',
      llmModel: 'gpt-4'
    };
  }

  clearDocuments() {
    this.knowledgeBase.clear();
    this.loadNetworkingKnowledgeBase(); // Reload base knowledge
  }
}