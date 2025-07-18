#!/usr/bin/env python3
import os
import sys
import json
from haystack import Pipeline
from haystack.document_stores.in_memory.document_store import InMemoryDocumentStore
from haystack.components.retrievers.in_memory.embedding_retriever import InMemoryEmbeddingRetriever
from haystack.components.embedders.openai_document_embedder import OpenAIDocumentEmbedder
from haystack.components.embedders.openai_text_embedder import OpenAITextEmbedder
from haystack.components.writers.document_writer import DocumentWriter
from haystack.components.builders.chat_prompt_builder import ChatPromptBuilder
from haystack.components.generators.chat.openai import OpenAIChatGenerator
from haystack.dataclasses.chat_message import ChatMessage
from haystack.dataclasses.document import Document

class NetworkingRAGPipeline:
    def __init__(self):
        self.document_store = InMemoryDocumentStore()
        self.setup_pipeline()
        self.load_networking_knowledge()
    
    def setup_pipeline(self):
        # Setup embedders and components
        self.doc_embedder = OpenAIDocumentEmbedder()
        self.text_embedder = OpenAITextEmbedder()
        self.retriever = InMemoryEmbeddingRetriever(self.document_store)
        
        # Setup prompt template for networking advice
        prompt_template = [
            ChatMessage.from_user(
                """
                You are a professional networking strategist and career advisor. 
                Based on the following knowledge base and context, provide strategic networking advice.
                
                Knowledge Base:
                {% for doc in documents %}
                {{ doc.content }}
                {% endfor %}
                
                Question: {{query}}
                Context: {{context}}
                
                Provide a comprehensive response that includes:
                1. Strategic advice
                2. Actionable insights
                3. Best practices
                4. Specific recommendations
                
                Format your response as professional networking guidance.
                """
            )
        ]
        
        self.prompt_builder = ChatPromptBuilder(template=prompt_template)
        self.llm = OpenAIChatGenerator(model="gpt-4o")
        
        # Build the RAG pipeline
        self.rag_pipeline = Pipeline()
        self.rag_pipeline.add_component("text_embedder", self.text_embedder)
        self.rag_pipeline.add_component("retriever", self.retriever)
        self.rag_pipeline.add_component("prompt_builder", self.prompt_builder)
        self.rag_pipeline.add_component("llm", self.llm)
        
        self.rag_pipeline.connect("text_embedder.embedding", "retriever.query_embedding")
        self.rag_pipeline.connect("retriever.documents", "prompt_builder.documents")
        self.rag_pipeline.connect("prompt_builder", "llm")
    
    def load_networking_knowledge(self):
        # Professional networking knowledge base
        networking_docs = [
            Document(content="""
            Professional Networking Best Practices:
            
            1. Warm Introductions: Always prefer warm introductions through mutual connections over cold outreach
            2. Value First: Lead with how you can provide value, not what you need
            3. Authentic Relationships: Focus on building genuine relationships rather than transactional connections
            4. Follow-up Strategy: Consistent, meaningful follow-up is crucial for relationship maintenance
            5. Industry Events: Attend relevant industry conferences, meetups, and professional gatherings
            6. Digital Presence: Maintain a professional online presence on LinkedIn and industry platforms
            7. Mutual Benefit: Ensure networking is mutually beneficial for all parties involved
            """),
            
            Document(content="""
            Introduction Strategy Framework:
            
            1. Research Phase: Thoroughly research the target person and their background
            2. Connection Mapping: Identify the strongest mutual connections in your network
            3. Value Proposition: Clearly articulate the mutual value of the connection
            4. Timing: Choose appropriate timing for outreach (avoid holidays, busy periods)
            5. Communication: Craft personalized, concise, and professional messages
            6. Follow-through: Honor commitments and follow up on promised actions
            7. Relationship Building: Focus on long-term relationship building over immediate asks
            """),
            
            Document(content="""
            Industry-Specific Networking Approaches:
            
            Technology: Focus on innovation, technical expertise, and emerging trends
            Finance: Emphasize analytical skills, market insights, and regulatory knowledge
            Healthcare: Highlight patient outcomes, research, and industry compliance
            Consulting: Stress problem-solving abilities, industry expertise, and client success
            Startups: Emphasize agility, growth potential, and entrepreneurial spirit
            Enterprise: Focus on scale, process optimization, and organizational impact
            """),
            
            Document(content="""
            Connection Strength Analysis:
            
            Strong Connections (Score 80-100):
            - Direct colleagues or former colleagues
            - Close alumni from same program/year
            - Family friends or personal referrals
            - Shared significant experiences or projects
            
            Medium Connections (Score 60-79):
            - Industry peers with mutual connections
            - Alumni from same institution (different years)
            - Professional acquaintances from events
            - Second-degree connections through strong ties
            
            Weak Connections (Score 40-59):
            - LinkedIn connections without interaction
            - Distant alumni connections
            - Cold contacts from research
            - Third-degree network connections
            """),
            
            Document(content="""
            Communication Templates and Timing:
            
            Initial Outreach:
            - Tuesday-Thursday, 10 AM - 4 PM optimal
            - Keep initial message under 150 words
            - Include specific reason for connection
            - Mention mutual connection prominently
            
            Follow-up Strategy:
            - Wait 1 week for initial follow-up
            - Provide value in each communication
            - Limit to 2-3 follow-up attempts
            - Respect no-response as a decline
            
            Meeting Requests:
            - Suggest specific dates and times
            - Offer flexible meeting formats (coffee, video call, phone)
            - Prepare agenda and questions in advance
            - Send calendar invitation promptly
            """)
        ]
        
        # Index the documents
        indexing_pipeline = Pipeline()
        indexing_pipeline.add_component("embedder", self.doc_embedder)
        indexing_pipeline.add_component("writer", DocumentWriter(self.document_store))
        indexing_pipeline.connect("embedder.documents", "writer.documents")
        
        indexing_pipeline.run({"embedder": {"documents": networking_docs}})
    
    def query(self, question, context="", query_type="networking_strategy"):
        try:
            # Prepare query with context
            full_query = f"Type: {query_type}. Question: {question}"
            
            result = self.rag_pipeline.run({
                "text_embedder": {"text": full_query},
                "prompt_builder": {"query": question, "context": context}
            })
            
            response = result["llm"]["replies"][0].text
            
            # Extract insights from response
            insights = self.extract_insights(response, query_type)
            
            return {
                "answer": response,
                "confidence": 0.85,
                "sources": ["Professional networking knowledge base"],
                "insights": insights
            }
            
        except Exception as e:
            return {
                "answer": f"Error processing query: {str(e)}",
                "confidence": 0.0,
                "sources": [],
                "insights": []
            }
    
    def extract_insights(self, response, query_type):
        # Extract key insights based on query type
        insights = []
        
        if "warm introduction" in response.lower():
            insights.append("Leverage warm introductions")
        if "mutual" in response.lower():
            insights.append("Focus on mutual connections")
        if "value" in response.lower():
            insights.append("Lead with value proposition")
        if "follow up" in response.lower() or "follow-up" in response.lower():
            insights.append("Maintain consistent follow-up")
        if "authentic" in response.lower():
            insights.append("Build authentic relationships")
        if "industry" in response.lower():
            insights.append("Consider industry context")
        if "timing" in response.lower():
            insights.append("Optimize outreach timing")
        
        return insights[:5]  # Return top 5 insights

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        query_data = json.loads(input_data)
        
        # Initialize RAG pipeline
        rag = NetworkingRAGPipeline()
        
        # Process query
        result = rag.query(
            question=query_data.get("question", ""),
            context=query_data.get("context", ""),
            query_type=query_data.get("type", "networking_strategy")
        )
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_response = {
            "answer": "Error processing networking query",
            "confidence": 0.0,
            "sources": [],
            "insights": ["Professional networking guidance available"]
        }
        print(json.dumps(error_response))

if __name__ == "__main__":
    main()