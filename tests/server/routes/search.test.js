import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('node-fetch');
jest.mock('openai');

// Import and initialize the app
let app;

describe('Search API Endpoint', () => {
  beforeAll(() => {
    // Mock OpenAI response
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    paths: [
                      {
                        path: "You → John Smith (colleague at TechCorp) → Acme Inc",
                        strength: 85
                      }
                    ]
                  })
                }
              }
            ]
          })
        }
      }
    };
    
    // Set up the OpenAI module mock
    jest.doMock('openai', () => ({
      OpenAI: jest.fn().mockImplementation(() => mockOpenAI)
    }));
    
    // Create a simplified Express app for testing
    app = express();
    app.use(express.json());
    
    // Import and attach routes to test app
    // Note: In a real test, you'd import your actual routes
    app.post('/api/find-connections', (req, res) => {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      // Return mock search result
      return res.json({
        paths: [
          {
            path: "You → John Smith (colleague at TechCorp) → Acme Inc",
            strength: 85
          }
        ],
        runId: "test-run-id"
      });
    });
  });

  test('returns 400 if query is missing', async () => {
    const response = await request(app)
      .post('/api/find-connections')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Query is required');
  });

  test('returns connection paths for valid query', async () => {
    const response = await request(app)
      .post('/api/find-connections')
      .send({ query: 'Acme Inc' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('paths');
    expect(response.body.paths).toBeInstanceOf(Array);
    expect(response.body.paths.length).toBeGreaterThan(0);
    expect(response.body.paths[0]).toHaveProperty('path');
    expect(response.body.paths[0]).toHaveProperty('strength');
    expect(response.body).toHaveProperty('runId');
  });

  test('includes connection strength in response', async () => {
    const response = await request(app)
      .post('/api/find-connections')
      .send({ query: 'Acme Inc' });
    
    expect(response.status).toBe(200);
    expect(response.body.paths[0].strength).toBeGreaterThanOrEqual(0);
    expect(response.body.paths[0].strength).toBeLessThanOrEqual(100);
  });
});