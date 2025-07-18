import OpenAI from 'openai';
import { db } from '../db';
import { persons, relationships } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    type: 'resume' | 'linkedin' | 'email' | 'company_report' | 'social_post';
    personId?: string;
    timestamp: Date;
  };
  embedding?: number[];
}

interface SearchResult {
  document: DocumentChunk;
  score: number;
  reasoning: string;
}

export class DocumentProcessingService {
  private openai: OpenAI;
  private documentStore: Map<string, DocumentChunk> = new Map();

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key required for document processing');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Document ingestion and chunking (Haystack-style)
  async ingestDocument(content: string, metadata: DocumentChunk['metadata']): Promise<string> {
    try {
      // Chunk the document into meaningful segments
      const chunks = await this.chunkDocument(content);
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${documentId}_chunk_${i}`;
        const chunk: DocumentChunk = {
          id: chunkId,
          content: chunks[i],
          metadata: {
            ...metadata,
            timestamp: new Date()
          }
        };

        // Generate embeddings for semantic search
        chunk.embedding = await this.generateEmbedding(chunks[i]);
        this.documentStore.set(chunkId, chunk);
      }

      // Extract networking insights from the document
      await this.extractNetworkingInsights(content, metadata);

      return documentId;
    } catch (error) {
      console.error('Document ingestion error:', error);
      throw new Error('Failed to ingest document');
    }
  }

  // Smart document chunking
  private async chunkDocument(content: string): Promise<string[]> {
    try {
      const prompt = `
        Split this document into meaningful chunks for networking analysis:
        
        "${content}"
        
        Create chunks that:
        1. Keep related professional information together
        2. Maintain context around people, companies, and relationships
        3. Preserve project descriptions and achievements
        4. Keep contact information with relevant context
        
        Return as JSON array of strings.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      const chunks = JSON.parse(response.choices[0].message.content || '[]');
      return Array.isArray(chunks) ? chunks : [content];
    } catch (error) {
      // Fallback to simple chunking
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const chunks = [];
      for (let i = 0; i < sentences.length; i += 3) {
        chunks.push(sentences.slice(i, i + 3).join('. ').trim());
      }
      return chunks.length > 0 ? chunks : [content];
    }
  }

  // Generate embeddings for semantic search
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

  // Semantic search across documents
  async semanticSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Calculate similarity scores
      const results: SearchResult[] = [];
      
      for (const [id, doc] of this.documentStore) {
        if (!doc.embedding || doc.embedding.length === 0) continue;
        
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        
        if (similarity > 0.7) { // Threshold for relevance
          results.push({
            document: doc,
            score: similarity,
            reasoning: await this.explainRelevance(query, doc.content)
          });
        }
      }

      // Sort by similarity score and limit results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  // Calculate cosine similarity between embeddings
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Explain why a document is relevant to the query
  private async explainRelevance(query: string, document: string): Promise<string> {
    try {
      const prompt = `
        Why is this document relevant to the query "${query}"?
        
        Document: "${document.substring(0, 500)}"
        
        Provide a brief explanation of the relevance for networking purposes.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100,
      });

      return response.choices[0].message.content || 'Relevant content found';
    } catch (error) {
      return 'Content matches query criteria';
    }
  }

  // Extract and store networking insights from documents
  private async extractNetworkingInsights(content: string, metadata: DocumentChunk['metadata']) {
    try {
      const prompt = `
        Extract networking data from this document:
        
        "${content}"
        
        Identify and structure:
        1. People mentioned (names, titles, companies)
        2. Companies and organizations
        3. Relationships and connections
        4. Contact information
        5. Professional achievements
        6. Shared experiences or projects
        
        Return as structured JSON.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      const insights = JSON.parse(response.choices[0].message.content || '{}');
      
      // Store extracted people and relationships in database
      if (insights.people) {
        for (const person of insights.people) {
          await this.createOrUpdatePerson(person, metadata);
        }
      }

      if (insights.relationships) {
        for (const relationship of insights.relationships) {
          await this.createRelationship(relationship, metadata);
        }
      }

      return insights;
    } catch (error) {
      console.error('Insight extraction error:', error);
      return {};
    }
  }

  // Create or update person in database
  private async createOrUpdatePerson(personData: any, metadata: DocumentChunk['metadata']) {
    try {
      const personId = `${personData.name?.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      
      await db.insert(persons).values({
        id: personId,
        name: personData.name || '',
        email: personData.email || null,
        company: personData.company || null,
        title: personData.title || null,
        linkedinUrl: personData.linkedin || null,
        bio: personData.bio || null,
        metadata: JSON.stringify({
          source: metadata.source,
          extractedFrom: metadata.type,
          ...personData
        })
      }).onConflictDoNothing();

      return personId;
    } catch (error) {
      console.error('Person creation error:', error);
      return null;
    }
  }

  // Create relationship in database
  private async createRelationship(relationshipData: any, metadata: DocumentChunk['metadata']) {
    try {
      if (!relationshipData.from || !relationshipData.to) return;

      const fromPersonId = await this.findOrCreatePersonId(relationshipData.from);
      const toPersonId = await this.findOrCreatePersonId(relationshipData.to);

      if (fromPersonId && toPersonId) {
        await db.insert(relationships).values({
          fromPersonId,
          toPersonId,
          relationshipType: relationshipData.type || 'PROFESSIONAL',
          strength: relationshipData.strength || 50,
          metadata: JSON.stringify({
            source: metadata.source,
            context: relationshipData.context,
            extractedFrom: metadata.type
          })
        }).onConflictDoNothing();
      }
    } catch (error) {
      console.error('Relationship creation error:', error);
    }
  }

  // Find or create person ID
  private async findOrCreatePersonId(personName: string): Promise<string | null> {
    try {
      // Try to find existing person
      const existing = await db.select()
        .from(persons)
        .where(eq(persons.name, personName))
        .limit(1);

      if (existing.length > 0) {
        return existing[0].id;
      }

      // Create new person
      const personId = `${personName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      await db.insert(persons).values({
        id: personId,
        name: personName,
        metadata: JSON.stringify({ autoCreated: true })
      });

      return personId;
    } catch (error) {
      console.error('Person ID resolution error:', error);
      return null;
    }
  }

  // Question answering over documents (RAG-style)
  async answerQuestion(question: string): Promise<string> {
    try {
      // Find relevant documents
      const relevantDocs = await this.semanticSearch(question, 5);
      
      const context = relevantDocs
        .map(result => result.document.content)
        .join('\n\n');

      const prompt = `
        Based on the following professional documents, answer this question: "${question}"
        
        Context:
        ${context}
        
        Provide a comprehensive answer focused on networking and professional connections.
        If the information isn't available in the documents, say so clearly.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      return response.choices[0].message.content || 'Unable to find relevant information.';
    } catch (error) {
      console.error('Question answering error:', error);
      throw new Error('Failed to answer question');
    }
  }

  // Get document statistics
  getDocumentStats() {
    const stats = {
      totalDocuments: this.documentStore.size,
      documentTypes: new Map<string, number>(),
      sources: new Map<string, number>()
    };

    for (const [, doc] of this.documentStore) {
      const type = doc.metadata.type;
      const source = doc.metadata.source;
      
      stats.documentTypes.set(type, (stats.documentTypes.get(type) || 0) + 1);
      stats.sources.set(source, (stats.sources.get(source) || 0) + 1);
    }

    return {
      ...stats,
      documentTypes: Object.fromEntries(stats.documentTypes),
      sources: Object.fromEntries(stats.sources)
    };
  }

  // Clear document store
  clearDocuments() {
    this.documentStore.clear();
  }
}