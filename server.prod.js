import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

console.log('🚀 Production WarmConnector Server Starting...');
console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`Port: ${PORT}`);

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'WarmConnector',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Basic API endpoints
app.get('/api/companies', (req, res) => {
  res.json([
    { name: 'JLL', employee_count: 120 },
    { name: 'Deloitte', employee_count: 85 },
    { name: 'McKinsey', employee_count: 95 }
  ]);
});

app.get('/api/find-connections', (req, res) => {
  const { query } = req.query;
  res.json({
    query: query || 'test',
    status: 'success',
    message: 'Connection search endpoint is operational',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from client/dist (production build)
try {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  console.log('✅ Serving static files from client/dist');
} catch (error) {
  console.log('⚠️ client/dist not found, serving from client');
  app.use(express.static(path.join(__dirname, 'client')));
}

// Fallback route for SPA (React Router)
app.get('*', (req, res) => {
  // Don't serve HTML for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  try {
    const indexPath = path.join(__dirname, 'client/dist/index.html');
    res.sendFile(indexPath);
  } catch (error) {
    // Fallback HTML if built version not available
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>WarmConnector - Professional Networking Platform</title>
          <style>
              body {
                  margin: 0; padding: 2rem; 
                  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                  color: white; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  min-height: 100vh; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  text-align: center;
              }
              .container { max-width: 600px; }
              h1 { 
                  font-size: 3rem; 
                  margin-bottom: 1rem; 
                  background: linear-gradient(45deg, #00d4ff, #9c40ff);
                  -webkit-background-clip: text; 
                  -webkit-text-fill-color: transparent; 
                  background-clip: text; 
              }
              p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
              .api-link { 
                  display: inline-block; 
                  padding: 12px 24px; 
                  margin: 0.5rem;
                  background: linear-gradient(45deg, #00d4ff, #9c40ff); 
                  color: white; 
                  text-decoration: none;
                  border-radius: 25px; 
                  font-weight: 600; 
                  transition: transform 0.2s; 
              }
              .api-link:hover { transform: translateY(-2px); }
              .status { 
                  padding: 1rem; 
                  border-radius: 8px; 
                  background: rgba(0, 212, 255, 0.1);
                  border: 1px solid rgba(0, 212, 255, 0.3); 
                  margin-bottom: 2rem; 
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🔗 WarmConnector</h1>
              <p>AI-Powered Professional Networking Platform</p>
              <div class="status">
                  <p>✅ Production Server Running</p>
                  <p>🔧 Building React Frontend...</p>
              </div>
              <div>
                  <a href="/api/health" class="api-link">API Health</a>
                  <a href="/api/companies" class="api-link">Companies</a>
                  <a href="/api/find-connections?query=test" class="api-link">Test Search</a>
              </div>
          </div>
      </body>
      </html>
    `);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Server encountered an error',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).send('Server Error');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WarmConnector production server running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://localhost:${PORT}`);
});

export default app;