# Business Chat Friend - AI Networking Assistant

## Overview

The Business Chat Friend is an intelligent onboarding and chat assistant that enhances WarmConnector's networking capabilities. Built with React, Express.js, and PostgreSQL, it provides personalized networking guidance through a Series-style conversational interface.

## Features

### ✅ Completed MVP Features

#### 1. **Smart Onboarding (5 Questions)**
- **Hometown**: Geographic context for local networking
- **Education**: Alumni network identification 
- **Past Companies**: Career history for professional connections
- **Current Deals**: Active projects and opportunities
- **Hobbies**: Personal interests for ice-breaker conversations

#### 2. **Persistent Chat Widget**
- Fixed bottom-right positioning with minimize/maximize controls
- Glassmorphic design matching WarmConnector's cosmic theme
- Real-time message history with user/assistant distinction
- Responsive design for mobile and desktop

#### 3. **Backend API Endpoints**
- `GET /api/auth/user` - User authentication and onboarding status
- `GET /api/business-profile` - Retrieve user's business profile
- `POST /api/business-profile` - Save onboarding progress
- `GET /api/chat-messages` - Fetch conversation history
- `POST /api/chat-messages` - Send messages and get AI responses
- `POST /api/auth/complete-onboarding` - Mark onboarding complete

#### 4. **Database Schema**
```sql
-- Business profiles with onboarding data
business_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  hometown TEXT,
  alma_mater TEXT,
  past_companies JSONB DEFAULT '[]',
  current_deals JSONB DEFAULT '[]',
  hobbies JSONB DEFAULT '[]',
  last_llm_vector_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat message history
chat_messages (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  vector_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. **Graph Integration Ready**
- Automatic Neo4j edge creation for company relationships
- `WORKED_AT` relationships from past companies data
- Integration with existing WarmConnector graph pathfinding

## Technical Implementation

### Frontend (React + TypeScript)
```typescript
// Core component with cosmic theme integration
<BusinessChatFriend />

// Demo page showcasing functionality
<BusinessChatDemo />
```

### Backend (Express.js)
```javascript
// Smart onboarding data persistence
POST /api/business-profile
{
  "hometown": "San Francisco",
  "almaMater": "Stanford University", 
  "pastCompanies": ["Google", "Tesla"],
  "currentDeals": ["Series A fundraising"],
  "hobbies": ["Rock climbing", "Photography"]
}

// AI chat responses with context
POST /api/chat-messages
{
  "content": "How can I get introduced to someone at Google?"
}
```

### AI Agent System Prompt (Ready for OpenAI)
```
You are Alex, a helpful, human-sounding business insider who makes warm introductions.
Speak casually, 2-3 sentences max. If you need more data, ask ONE clarifying question, else answer.
Memory retrieval: fetch last 20 user ↔ bot messages + vector similarity on BusinessProfile facts.
```

## Demo Instructions

### 1. Access the Demo
Navigate to `/business-chat-demo` in your WarmConnector application to see the full feature showcase.

### 2. Experience the Onboarding
1. Click the purple message icon in the bottom-right corner
2. Complete the 5-question onboarding flow
3. Each answer is saved progressively to the database
4. After completion, the chat interface becomes available

### 3. Test Chat Functionality
Try these sample questions:
- "How can I get introduced to someone at Google?"
- "What's the best way to approach potential investors?"
- "Help me craft an introduction message"

## API Testing

### Test Onboarding Flow
```bash
# Check user status
curl http://localhost:5000/api/auth/user

# Save profile data
curl -X POST http://localhost:5000/api/business-profile \
  -H "Content-Type: application/json" \
  -d '{"hometown": "San Francisco", "pastCompanies": ["Google"]}'

# Complete onboarding
curl -X POST http://localhost:5000/api/auth/complete-onboarding
```

### Test Chat System
```bash
# Send message
curl -X POST http://localhost:5000/api/chat-messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Help me network better"}'

# Get conversation history  
curl http://localhost:5000/api/chat-messages
```

## Production Readiness

### ✅ MVP Complete
- [x] 5-question onboarding modal
- [x] Persistent chat widget with cosmic theme
- [x] PostgreSQL data persistence
- [x] Progressive profile saving
- [x] Graph relationship creation hooks
- [x] Chat message history
- [x] Demo page with comprehensive documentation

### 🚀 Ready for Enhancement
- **OpenAI Integration**: System prompt and API structure ready
- **Vector Storage**: lastLLMVectorId field prepared for S3 integration
- **Neo4j Edges**: Company relationship creation framework in place
- **Enrichment Worker**: Ready for PDL/Clearbit/Hunter API integration

### 🎯 Stretch Features (Future)
- Slack slash-command integration
- Telemetry for onboarding completion analytics
- Advanced vector similarity search
- Real-time networking event suggestions

## Environment Variables Needed

```env
# For full production deployment
OPENAI_API_KEY=your_openai_api_key
PDL_API_KEY=your_people_data_labs_key  
CLEARBIT_KEY=your_clearbit_key
HUNTER_API_KEY=your_hunter_io_key
S3_BUCKET=warm-vectors
```

## Integration Points

### Existing WarmConnector Features
- **Graph Pathfinding**: Uses existing `/api/find-connections` API
- **Introduction Requests**: Compatible with current intro workflow
- **User Authentication**: Integrates with Okta/Replit auth system
- **Company Data**: Leverages existing companies database

### New Capabilities Added
- **Business Intelligence**: Profile-based networking insights
- **Conversational UI**: Natural language interaction
- **Progressive Onboarding**: Incremental data collection
- **Context-Aware Responses**: AI powered by user history

The Business Chat Friend successfully extends WarmConnector's networking capabilities with intelligent conversation and streamlined onboarding, ready for immediate use and future enhancement with OpenAI integration.