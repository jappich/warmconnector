import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pipeline import WarmConnectorRAG
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="WarmConnector Haystack RAG API",
    description="Professional networking intelligence powered by Haystack RAG pipeline",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG pipeline
rag_pipeline = None

@app.on_event("startup")
async def startup_event():
    """Initialize the RAG pipeline on startup."""
    global rag_pipeline
    try:
        logger.info("Initializing Haystack RAG pipeline...")
        rag_pipeline = WarmConnectorRAG()
        logger.info("RAG pipeline initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize RAG pipeline: {e}")
        raise

# Pydantic models
class DocumentInput(BaseModel):
    content: str
    meta: Dict[str, Any] = {}

class QueryInput(BaseModel):
    question: str

class QueryResponse(BaseModel):
    question: str
    answer: str
    retrieved_documents: List[Dict[str, Any]]
    success: bool
    error: Optional[str] = None

class DocumentsInput(BaseModel):
    documents: List[DocumentInput]

class StatsResponse(BaseModel):
    total_documents: int
    document_store_type: str
    embedding_model: str
    llm_model: str

# API endpoints
@app.get("/", summary="Health check")
async def root():
    """Health check endpoint."""
    return {
        "message": "WarmConnector Haystack RAG API is running",
        "status": "healthy",
        "pipeline_ready": rag_pipeline is not None
    }

@app.get("/stats", response_model=StatsResponse, summary="Get pipeline statistics")
async def get_stats():
    """Get statistics about the RAG pipeline and document store."""
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        stats = rag_pipeline.get_stats()
        return StatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse, summary="Query the RAG pipeline")
async def query_rag(query: QueryInput):
    """
    Query the RAG pipeline with a networking-related question.
    Returns an AI-generated answer based on the indexed documents.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        result = rag_pipeline.query(query.question)
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        return QueryResponse(
            question=query.question,
            answer=f"Error processing query: {str(e)}",
            retrieved_documents=[],
            success=False,
            error=str(e)
        )

@app.post("/documents/add", summary="Add documents to the knowledge base")
async def add_documents(documents_input: DocumentsInput):
    """Add new documents to the RAG knowledge base."""
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    try:
        from haystack import Document
        
        # Convert input to Haystack Document objects
        haystack_docs = [
            Document(content=doc.content, meta=doc.meta)
            for doc in documents_input.documents
        ]
        
        result = rag_pipeline.add_documents(haystack_docs)
        return result
    except Exception as e:
        logger.error(f"Error adding documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/networking/analyze", summary="Analyze networking content")
async def analyze_networking_content(query: QueryInput):
    """
    Analyze networking-related content and provide strategic insights.
    Specialized endpoint for networking intelligence.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    # Enhance the question with networking context
    enhanced_question = f"""
    As a professional networking expert, analyze this query and provide strategic insights:
    
    {query.question}
    
    Please provide:
    1. Key networking opportunities or challenges identified
    2. Specific actionable recommendations
    3. Best practices that apply to this situation
    4. Potential risks or considerations to keep in mind
    """
    
    try:
        result = rag_pipeline.query(enhanced_question)
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"Error analyzing networking content: {e}")
        return QueryResponse(
            question=query.question,
            answer=f"Error analyzing content: {str(e)}",
            retrieved_documents=[],
            success=False,
            error=str(e)
        )

@app.post("/networking/introduction-help", summary="Get help with introductions")
async def introduction_help(query: QueryInput):
    """
    Get specialized help with making professional introductions.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    enhanced_question = f"""
    Help me with this professional introduction scenario:
    
    {query.question}
    
    Please provide:
    1. A template or structure for the introduction
    2. Key elements to include in the message
    3. Tips for making the introduction successful
    4. Follow-up recommendations
    """
    
    try:
        result = rag_pipeline.query(enhanced_question)
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"Error with introduction help: {e}")
        return QueryResponse(
            question=query.question,
            answer=f"Error providing introduction help: {str(e)}",
            retrieved_documents=[],
            success=False,
            error=str(e)
        )

@app.post("/networking/strategy", summary="Get networking strategy advice")
async def networking_strategy(query: QueryInput):
    """
    Get strategic networking advice based on the knowledge base.
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    
    enhanced_question = f"""
    Provide strategic networking advice for this situation:
    
    {query.question}
    
    Please include:
    1. Strategic approach and methodology
    2. Specific tactics and techniques
    3. Timeline and milestones
    4. Success metrics to track
    5. Common pitfalls to avoid
    """
    
    try:
        result = rag_pipeline.query(enhanced_question)
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"Error providing networking strategy: {e}")
        return QueryResponse(
            question=query.question,
            answer=f"Error providing strategy advice: {str(e)}",
            retrieved_documents=[],
            success=False,
            error=str(e)
        )

@app.get("/health", summary="Detailed health check")
async def health_check():
    """Detailed health check including pipeline status."""
    health_status = {
        "api_status": "healthy",
        "pipeline_initialized": rag_pipeline is not None,
        "openai_key_configured": bool(os.getenv("OPENAI_API_KEY"))
    }
    
    if rag_pipeline:
        try:
            stats = rag_pipeline.get_stats()
            health_status["document_count"] = stats["total_documents"]
            health_status["embedding_model"] = stats["embedding_model"]
            health_status["llm_model"] = stats["llm_model"]
        except Exception as e:
            health_status["pipeline_error"] = str(e)
    
    return health_status

if __name__ == "__main__":
    # Run the FastAPI server
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 Starting WarmConnector Haystack RAG API on {host}:{port}")
    print("📚 Available endpoints:")
    print("  - GET  /           : Health check")
    print("  - GET  /stats      : Pipeline statistics")
    print("  - POST /query      : Query the RAG pipeline")
    print("  - POST /documents/add : Add documents to knowledge base")
    print("  - POST /networking/analyze : Analyze networking content")
    print("  - POST /networking/introduction-help : Get introduction help")
    print("  - POST /networking/strategy : Get networking strategy advice")
    print("  - GET  /health     : Detailed health check")
    print()
    print("🔗 Interactive docs available at: http://localhost:8000/docs")
    
    uvicorn.run(
        "haystack_api:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )