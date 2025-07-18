import os
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv

try:
    from haystack import Document, Pipeline
    from haystack.components.retrievers.in_memory import InMemoryBM25Retriever
    from haystack.components.generators import OpenAIGenerator
    from haystack.components.builders import PromptBuilder
    from haystack.document_stores.in_memory import InMemoryDocumentStore
    from haystack.components.writers import DocumentWriter
    from haystack.components.embedders import SentenceTransformersDocumentEmbedder, SentenceTransformersTextEmbedder
    from haystack.components.retrievers import InMemoryEmbeddingRetriever
    HAYSTACK_AVAILABLE = True
    print("Haystack AI components loaded successfully")
except ImportError as e:
    # Fallback imports for when Haystack components are not available
    HAYSTACK_AVAILABLE = False
    print(f"Haystack import failed: {e}")
    import json
    import openai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WarmConnectorRAG:
    """
    Haystack RAG pipeline for WarmConnector professional networking intelligence.
    Follows the official tutorial structure with networking-specific enhancements.
    """
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Initialize document store
        self.document_store = InMemoryDocumentStore()
        
        # Initialize components
        self._setup_components()
        self._setup_pipeline()
        self._load_sample_documents()
    
    def _setup_components(self):
        """Initialize all Haystack components for the RAG pipeline."""
        
        # Document embedder for ingestion
        self.doc_embedder = SentenceTransformersDocumentEmbedder(
            model="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Text embedder for queries
        self.text_embedder = SentenceTransformersTextEmbedder(
            model="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Document writer
        self.doc_writer = DocumentWriter(document_store=self.document_store)
        
        # Retriever for semantic search
        self.retriever = InMemoryEmbeddingRetriever(
            document_store=self.document_store,
            top_k=5
        )
        
        # OpenAI generator
        self.generator = OpenAIGenerator(
            api_key=self.openai_api_key,
            model="gpt-3.5-turbo",
            generation_kwargs={"max_tokens": 500, "temperature": 0.3}
        )
        
        # Prompt builder for RAG
        self.prompt_builder = PromptBuilder(
            template="""
            You are a professional networking expert assistant for WarmConnector.
            Use the provided context to answer questions about professional networking, connections, and introductions.
            
            Context:
            {% for document in documents %}
                {{ document.content }}
            {% endfor %}
            
            Question: {{ question }}
            
            Based on the context above, provide a helpful and accurate answer focused on professional networking insights.
            If the information isn't available in the context, clearly state that and provide general networking advice.
            
            Answer:
            """
        )
    
    def _setup_pipeline(self):
        """Create the indexing and querying pipelines."""
        
        # Indexing pipeline
        self.indexing_pipeline = Pipeline()
        self.indexing_pipeline.add_component("doc_embedder", self.doc_embedder)
        self.indexing_pipeline.add_component("doc_writer", self.doc_writer)
        self.indexing_pipeline.connect("doc_embedder", "doc_writer")
        
        # Querying pipeline (RAG)
        self.query_pipeline = Pipeline()
        self.query_pipeline.add_component("text_embedder", self.text_embedder)
        self.query_pipeline.add_component("retriever", self.retriever)
        self.query_pipeline.add_component("prompt_builder", self.prompt_builder)
        self.query_pipeline.add_component("llm", self.generator)
        
        # Connect components
        self.query_pipeline.connect("text_embedder.embedding", "retriever.query_embedding")
        self.query_pipeline.connect("retriever", "prompt_builder.documents")
        self.query_pipeline.connect("prompt_builder", "llm")
    
    def _load_sample_documents(self):
        """Load sample professional networking documents into the document store."""
        
        sample_docs = [
            Document(
                content="""
                LinkedIn is the premier professional networking platform with over 900 million users worldwide.
                Best practices for LinkedIn networking include:
                - Optimizing your profile with a professional headshot and compelling headline
                - Writing personalized connection requests instead of generic messages
                - Engaging with your network's content through meaningful comments
                - Sharing valuable industry insights and thought leadership content
                - Using LinkedIn's messaging features for warm introductions
                """,
                meta={"source": "linkedin_guide", "type": "networking_guide"}
            ),
            Document(
                content="""
                Warm introductions are the most effective way to build professional relationships.
                A successful warm introduction typically includes:
                - Clear context about why you're making the introduction
                - Brief background on both parties being introduced
                - Specific suggestions for how they might collaborate or help each other
                - A clear next step or call to action
                - Follow-up to ensure the connection was valuable
                Research shows warm introductions have a 70% higher success rate than cold outreach.
                """,
                meta={"source": "introduction_best_practices", "type": "networking_strategy"}
            ),
            Document(
                content="""
                Building a strong professional network requires strategic thinking and consistent effort.
                Key networking strategies include:
                - Attending industry conferences and meetups regularly
                - Joining professional associations in your field
                - Volunteering for causes aligned with your industry
                - Maintaining relationships through regular check-ins
                - Offering value before asking for help
                - Leveraging mutual connections for introductions
                - Following up promptly on new connections
                The average professional should aim to make 2-3 new meaningful connections per month.
                """,
                meta={"source": "networking_strategy", "type": "professional_advice"}
            ),
            Document(
                content="""
                Social media platforms each serve different networking purposes:
                - LinkedIn: Professional connections and industry discussions
                - Twitter: Thought leadership and real-time industry conversations
                - GitHub: Technical collaboration and showcasing development skills
                - Instagram: Personal branding and behind-the-scenes content
                - Facebook: Community building and local professional groups
                The key is to maintain consistent branding across platforms while adapting content to each platform's unique culture.
                """,
                meta={"source": "social_media_networking", "type": "platform_guide"}
            ),
            Document(
                content="""
                Effective networking emails should be concise, personalized, and value-focused.
                Email structure for networking:
                1. Subject line: Clear and specific (e.g., "Introduction request - [Mutual connection] suggested we connect")
                2. Opening: Brief personal connection or mutual contact reference
                3. Body: Specific reason for reaching out and potential mutual value
                4. Call to action: Clear next step (coffee meeting, phone call, etc.)
                5. Closing: Professional signature with contact information
                Keep emails under 150 words and always include a clear value proposition.
                """,
                meta={"source": "email_networking", "type": "communication_guide"}
            ),
            Document(
                content="""
                Professional relationship building is about creating mutual value over time.
                Key principles include:
                - Listen actively to understand others' needs and challenges
                - Share resources, insights, and opportunities freely
                - Be authentic and genuine in your interactions
                - Follow through on commitments and promises
                - Remember personal details about your connections
                - Celebrate others' successes publicly
                - Maintain relationships even when you don't need anything
                Strong professional relationships are built on trust, consistency, and mutual benefit.
                """,
                meta={"source": "relationship_building", "type": "networking_fundamentals"}
            )
        ]
        
        logger.info(f"Indexing {len(sample_docs)} sample documents...")
        
        # Run indexing pipeline
        self.indexing_pipeline.run({"doc_embedder": {"documents": sample_docs}})
        
        logger.info("Document indexing completed successfully")
    
    def add_documents(self, documents: List[Document]) -> Dict[str, Any]:
        """Add new documents to the knowledge base."""
        try:
            result = self.indexing_pipeline.run({"doc_embedder": {"documents": documents}})
            logger.info(f"Successfully indexed {len(documents)} new documents")
            return {"success": True, "indexed_count": len(documents)}
        except Exception as e:
            logger.error(f"Error indexing documents: {e}")
            return {"success": False, "error": str(e)}
    
    def query(self, question: str) -> Dict[str, Any]:
        """Query the RAG pipeline with a networking-related question."""
        try:
            logger.info(f"Processing query: {question}")
            
            result = self.query_pipeline.run({
                "text_embedder": {"text": question},
                "prompt_builder": {"question": question}
            })
            
            answer = result["llm"]["replies"][0]
            retrieved_docs = result["retriever"]["documents"]
            
            return {
                "question": question,
                "answer": answer,
                "retrieved_documents": [
                    {
                        "content": doc.content,
                        "meta": doc.meta,
                        "score": doc.score if hasattr(doc, 'score') else None
                    }
                    for doc in retrieved_docs
                ],
                "success": True
            }
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "question": question,
                "answer": f"I apologize, but I encountered an error processing your question: {str(e)}",
                "success": False,
                "error": str(e)
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the document store."""
        doc_count = self.document_store.count_documents()
        return {
            "total_documents": doc_count,
            "document_store_type": "InMemoryDocumentStore",
            "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
            "llm_model": "gpt-3.5-turbo"
        }

def main():
    """CLI interface for testing the RAG pipeline."""
    print("🔗 WarmConnector RAG Pipeline")
    print("=" * 40)
    
    try:
        # Initialize RAG system
        print("Initializing Haystack RAG pipeline...")
        rag = WarmConnectorRAG()
        
        # Display stats
        stats = rag.get_stats()
        print(f"✅ Pipeline ready with {stats['total_documents']} documents")
        print(f"📊 Using {stats['embedding_model']} for embeddings")
        print(f"🤖 Using {stats['llm_model']} for generation")
        print()
        
        # Interactive query loop
        print("Ask questions about professional networking (type 'quit' to exit):")
        print("=" * 40)
        
        while True:
            question = input("\n🤔 Your question: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if not question:
                continue
            
            print("🔍 Searching knowledge base...")
            result = rag.query(question)
            
            if result["success"]:
                print(f"\n💡 Answer:\n{result['answer']}")
                print(f"\n📚 Based on {len(result['retrieved_documents'])} relevant documents")
            else:
                print(f"\n❌ Error: {result.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"❌ Failed to initialize RAG pipeline: {e}")
        print("Make sure your OPENAI_API_KEY is set correctly in your environment or .env file")

if __name__ == "__main__":
    main()