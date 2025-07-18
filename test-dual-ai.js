#!/usr/bin/env node

// Test script for dual AI networking intelligence system
import { spawn } from 'child_process';

async function testHaystackDirectly() {
  console.log('🔍 Testing Haystack RAG system directly...');
  
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['server/services/simpleHaystackRAG.py']);
    
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
          console.log('✅ Haystack RAG Test Result:', result);
          resolve(result);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          reject(parseError);
        }
      } else {
        console.error('❌ Python script error:', stderr || `Exit code: ${code}`);
        reject(new Error(stderr || `Exit code: ${code}`));
      }
    });

    // Send test input
    const testInput = JSON.stringify({
      action: 'query',
      data: {
        question: 'How to build professional networking relationships?',
        context: 'Professional development',
        query_type: 'networking_strategy'
      }
    });
    
    python.stdin.write(testInput);
    python.stdin.end();
  });
}

async function testOpenAI() {
  console.log('🤖 Testing OpenAI integration...');
  
  try {
    // Import OpenAI and test
    const { default: OpenAI } = await import('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not found in environment');
      return { success: false, error: 'No API key' };
    }
    
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ 
        role: "user", 
        content: `Test OpenAI for professional networking. Respond in JSON format:
        {
          "response": "OpenAI is working for professional networking analysis",
          "confidence": 0.95
        }` 
      }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ OpenAI Test Result:', result);
    return { success: true, ...result };
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Dual AI Networking Intelligence System Test\n');
  
  const results = {
    haystack: null,
    openai: null,
    dualMode: false
  };
  
  // Test Haystack
  try {
    results.haystack = await testHaystackDirectly();
  } catch (error) {
    console.error('Haystack test failed:', error.message);
    results.haystack = { success: false, error: error.message };
  }
  
  // Test OpenAI
  results.openai = await testOpenAI();
  
  // Determine dual mode status
  results.dualMode = results.haystack?.success && results.openai?.success;
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log('Haystack RAG:', results.haystack?.success ? '✅ Working' : '❌ Failed');
  console.log('OpenAI GPT-4o:', results.openai?.success ? '✅ Working' : '❌ Failed');
  console.log('Dual AI Mode:', results.dualMode ? '✅ Active' : '❌ Inactive');
  
  if (results.dualMode) {
    console.log('\n🎉 Dual AI Networking Intelligence System is fully operational!');
    console.log('Both OpenAI and Haystack are working together for superior networking insights.');
  } else {
    console.log('\n⚠️ Dual AI system is partially operational:');
    if (!results.haystack?.success) {
      console.log('- Haystack RAG needs attention');
    }
    if (!results.openai?.success) {
      console.log('- OpenAI integration needs attention');
    }
  }
  
  return results;
}

// Load environment variables
import { config } from 'dotenv';
config();

main().catch(console.error);