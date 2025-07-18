#!/usr/bin/env python3
import json
import sys
import os
from typing import Dict, List, Any, Optional

# Simple RAG implementation without complex Haystack dependencies
class SimpleNetworkingRAG:
    def __init__(self):
        self.documents = []
        self.knowledge_base = {
            'networking_strategies': [
                "Focus on building authentic, mutually beneficial relationships rather than transactional connections.",
                "Leverage warm introductions through mutual connections for higher success rates.",
                "Participate actively in industry events and professional communities.",
                "Share valuable insights and expertise to establish thought leadership.",
                "Follow up consistently but respectfully with new connections."
            ],
            'introduction_techniques': [
                "Research common interests and mutual connections before reaching out.",
                "Craft personalized messages that clearly articulate mutual value.",
                "Keep initial contact messages concise and professional.",
                "Suggest specific ways you can provide value to the target contact.",
                "Always thank the introducer and keep them informed of outcomes."
            ],
            'industry_insights': [
                "Technology sector values innovation and rapid adaptation.",
                "Finance industry prioritizes trust and regulatory compliance.",
                "Healthcare focuses on patient outcomes and regulatory standards.",
                "Consulting emphasizes problem-solving and client relationships."
            ],
            'connection_analysis': [
                "Strong connections show regular interaction patterns and mutual engagement.",
                "Weak ties can be valuable for accessing new information and opportunities.",
                "Connection strength correlates with response rates and collaboration success.",
                "Geographic proximity often enhances professional relationship development."
            ]
        }
        
    def add_documents(self, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Add documents to the knowledge base"""
        try:
            for doc in docs:
                self.documents.append({
                    'content': doc.get('content', ''),
                    'meta': doc.get('meta', {})
                })
            return {
                'success': True,
                'count': len(docs),
                'total_documents': len(self.documents)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'count': 0
            }
    
    def query(self, question: str, context: str = "", query_type: str = "networking_strategy") -> Dict[str, Any]:
        """Process a networking-related query"""
        try:
            # Get relevant knowledge based on query type
            relevant_knowledge = self.knowledge_base.get(query_type, 
                                                       self.knowledge_base['networking_strategies'])
            
            # Find most relevant documents
            relevant_docs = self._find_relevant_documents(question, context)
            
            # Generate response based on query type and context
            answer = self._generate_answer(question, context, query_type, relevant_knowledge)
            
            # Extract insights
            insights = self._extract_insights(question, query_type, relevant_knowledge)
            
            return {
                'success': True,
                'answer': answer,
                'confidence': 0.85,
                'sources': [f"Networking knowledge base - {query_type}"],
                'insights': insights,
                'retrieved_documents': relevant_docs[:3]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'answer': '',
                'confidence': 0.0,
                'sources': [],
                'insights': []
            }
    
    def _find_relevant_documents(self, question: str, context: str) -> List[Dict[str, Any]]:
        """Find documents relevant to the query"""
        relevant = []
        search_terms = question.lower().split()
        
        for doc in self.documents:
            content = doc['content'].lower()
            relevance_score = sum(1 for term in search_terms if term in content)
            if relevance_score > 0:
                relevant.append({
                    'content': doc['content'][:200] + '...' if len(doc['content']) > 200 else doc['content'],
                    'relevance_score': relevance_score,
                    'meta': doc.get('meta', {})
                })
        
        return sorted(relevant, key=lambda x: x['relevance_score'], reverse=True)
    
    def _generate_answer(self, question: str, context: str, query_type: str, knowledge: List[str]) -> str:
        """Generate a contextual answer"""
        
        if query_type == "networking_strategy":
            if "company" in question.lower():
                return f"When networking within a specific company, focus on identifying key decision-makers and building relationships through shared professional interests. {knowledge[0]} Research the company culture and recent developments to find relevant conversation starters."
            else:
                return f"{knowledge[0]} {knowledge[1]} Consider your specific goals and target audience when developing your approach."
                
        elif query_type == "introduction_advice":
            return f"For effective introductions, {knowledge[0]} {knowledge[1]} Remember that successful introductions create value for all parties involved."
            
        elif query_type == "industry_insights":
            industry_context = self._extract_industry_context(question, context)
            relevant_insight = next((insight for insight in knowledge if industry_context.lower() in insight.lower()), knowledge[0])
            return f"Based on industry analysis: {relevant_insight} Consider how this applies to your specific networking objectives."
            
        elif query_type == "connection_analysis":
            return f"Connection analysis shows: {knowledge[0]} {knowledge[2]} Use these insights to prioritize your outreach efforts."
            
        return f"Based on professional networking best practices: {knowledge[0]}"
    
    def _extract_industry_context(self, question: str, context: str) -> str:
        """Extract industry information from query"""
        industries = ["technology", "finance", "healthcare", "consulting", "tech", "fintech"]
        text = f"{question} {context}".lower()
        
        for industry in industries:
            if industry in text:
                return industry
        return "general"
    
    def _extract_insights(self, question: str, query_type: str, knowledge: List[str]) -> List[str]:
        """Extract actionable insights"""
        base_insights = {
            'networking_strategy': [
                "Prioritize quality over quantity in professional relationships",
                "Leverage existing connections for warm introductions",
                "Engage consistently with your professional network"
            ],
            'introduction_advice': [
                "Research thoroughly before making contact",
                "Clearly articulate mutual value propositions",
                "Follow professional introduction etiquette"
            ],
            'industry_insights': [
                "Stay current with industry trends and developments",
                "Identify key influencers and thought leaders",
                "Participate in relevant professional communities"
            ],
            'connection_analysis': [
                "Monitor relationship strength indicators",
                "Track engagement patterns over time",
                "Focus on connections with highest potential value"
            ]
        }
        
        return base_insights.get(query_type, base_insights['networking_strategy'])
    
    def get_stats(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
        return {
            'success': True,
            'total_documents': len(self.documents),
            'knowledge_categories': len(self.knowledge_base),
            'document_store_type': 'Simple In-Memory Store',
            'embedding_model': 'Text-based similarity matching',
            'llm_model': 'Rule-based response generation'
        }

def main():
    try:
        # Initialize RAG system
        rag = SimpleNetworkingRAG()
        
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        action = input_data.get('action', 'query')
        data = input_data.get('data', {})
        
        if action == 'query':
            result = rag.query(
                question=data.get('question', ''),
                context=data.get('context', ''),
                query_type=data.get('query_type', 'networking_strategy')
            )
        elif action == 'add_documents':
            result = rag.add_documents(data.get('documents', []))
        elif action == 'stats':
            result = rag.get_stats()
        else:
            result = {'success': False, 'error': f'Unknown action: {action}'}
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'answer': '',
            'confidence': 0.0
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()