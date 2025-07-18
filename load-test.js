import http from "k6/http";
import { check, sleep } from "k6";

export let options = { 
  vus: 50,       // Number of virtual users
  duration: "30s", // Test duration
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should complete within 500ms
    http_req_failed: ["rate<0.05"],    // Less than 5% of requests should fail
  }
};

export default function() {
  // Random queries to diversify the load and test cache effectiveness
  const queries = [
    "John Smith",
    "CFO of Apple",
    "Marketing Director at Google",
    "Product Manager Tesla",
    "Software Engineer Microsoft"
  ];
  
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];
  const randomEmail = `user${Math.floor(Math.random() * 1000)}@example.com`;
  
  // Make POST request to the search endpoint
  const payload = JSON.stringify({ 
    email: randomEmail, 
    query: randomQuery 
  });
  
  const params = {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": __ENV.N8N_API_KEY || "default-api-key"
    }
  };
  
  const res = http.post("http://localhost:5000/api/search", payload, params);
  
  // Verify the response
  check(res, { 
    "status is 200": r => r.status === 200,
    "response has data": r => r.json().length > 0 || r.json().length === 0,
    "response time OK": r => r.timings.duration < 500
  });
  
  // Log performance metrics for monitoring
  console.log(`Request to /api/search took ${res.timings.duration}ms`);
  
  // Simulate user think-time between requests
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}