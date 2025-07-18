#!/usr/bin/env python3
import json
import sys
import os

def simple_rag_query(question):
    """Simple RAG implementation using OpenAI directly"""
    try:
        import openai
        
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        knowledge_base = """
        Professional Networking Knowledge Base:
        
        1. Build authentic relationships through genuine value exchange, active listening, and consistent follow-up.
        2. LinkedIn outreach: personalize requests, engage with content first, use specific value propositions.
        3. Networking events: prepare elevator pitch, research attendees, focus on quality over quantity.
        4. Introduction requests: research mutual connections, provide clear context, make it easy for introducer.
        5. Relationship maintenance: quarterly check-ins, share relevant content, celebrate achievements.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are a professional networking expert. Use this knowledge: {knowledge_base}"},
                {"role": "user", "content": question}
            ],
            temperature=0.3
        )
        
        return {
            "answer": response.choices[0].message.content,
            "insights": [
                "Focus on authentic relationship building",
                "Provide value before asking for favors",
                "Maintain consistent professional follow-up"
            ],
            "confidence": 0.9,
            "success": True
        }
    except Exception as e:
        return {
            "answer": "Unable to process networking query at this time",
            "insights": ["Focus on building genuine professional relationships"],
            "confidence": 0.5,
            "success": False,
            "error": str(e)
        }

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        result = simple_rag_query("How to build effective professional networks?")
        print(json.dumps(result, indent=2))
    else:
        for line in sys.stdin:
            try:
                request = json.loads(line.strip())
                if request.get("action") == "query":
                    result = simple_rag_query(request["data"]["question"])
                    print(json.dumps(result))
                    break
            except:
                break

if __name__ == "__main__":
    main()