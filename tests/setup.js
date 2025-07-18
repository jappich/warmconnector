// Import Jest DOM extensions for DOM testing
import '@testing-library/jest-dom';

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.N8N_ONBOARD_URL = 'http://localhost:5001/test-webhook/onboard';
process.env.N8N_SEARCH_URL = 'http://localhost:5001/test-webhook/search';
process.env.N8N_API_KEY = 'test-api-key';
process.env.OPENAI_API_KEY = 'test-openai-key';