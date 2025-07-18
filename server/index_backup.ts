import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';

// Import services and routes
import { registerAuthRoutes } from './authRoutes';
import { db } from './db';
import './services/graphDatabaseService';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔍 Deployment Mode Detection:');
console.log(`  app.get("env"): ${app.get('env')}`);
console.log(`  process.env.NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  REPL_ID: ${!!process.env.REPL_ID}`);
console.log(`  REPLIT_ENVIRONMENT: ${process.env.REPLIT_ENVIRONMENT}`);
console.log(`  REPLIT_DOMAINS: ${!!process.env.REPLIT_DOMAINS}`);
console.log(`  isReplitDeployment: ${process.env.REPL_ID}`);
console.log(`  shouldUseDevelopmentMode: ${app.get('env') === 'development' || !process.env.NODE_ENV}`);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'WarmConnector',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root path handling for Replit deployments
app.use((req: Request, res: Response, next: NextFunction) => {
  const isReplitDeployment = !!(
    process.env.REPL_ID || 
    process.env.REPLIT_ENVIRONMENT || 
    process.env.REPLIT_DOMAINS ||
    process.env.REPLIT_DB_URL ||
    process.env.REPLIT_SLUG
  );
  
  if (req.path === '/' && req.method === 'GET' && isReplitDeployment) {
    console.log('📄 Serving HTML interface for Replit deployment');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    const htmlContent = `<!DOCTYPE html>
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
        .loading { 
            display: inline-block; 
            width: 20px; 
            height: 20px; 
            border: 3px solid rgba(0, 212, 255, 0.3);
            border-radius: 50%; 
            border-top-color: #00d4ff; 
            animation: spin 1s ease-in-out infinite; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>WarmConnector</h1>
        <p>AI-powered professional networking platform</p>
        <div class="status">
            <p>🚀 System Status: <span id="status"><div class="loading"></div> Connecting...</span></p>
            <p id="message">Checking backend health and loading system information...</p>
        </div>
        <div>
            <a href="/api/health" class="api-link">API Health</a>
            <a href="/api/companies" class="api-link">Companies</a>
            <a href="/api/find-connections?query=test" class="api-link">Test Search</a>
        </div>
    </div>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').innerHTML = '<strong>' + data.status.toUpperCase() + '</strong>';
                document.getElementById('message').textContent = 
                    'Environment: ' + data.environment + ' | Uptime: ' + Math.round(data.uptime) + 's | Database: ' + (data.database || 'unknown');
            })
            .catch(error => {
                document.getElementById('status').innerHTML = '<strong style="color: #ff4444;">ERROR</strong>';
                document.getElementById('message').textContent = 'Unable to connect to backend: ' + error.message;
            });
    </script>
</body>
</html>`;
    
    return res.send(htmlContent);
  }
  
  next();
});

// Register authentication routes
registerAuthRoutes(app);

// Companies endpoint
app.get('/api/companies', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(`
      SELECT DISTINCT company as name, COUNT(*) as employee_count
      FROM users 
      WHERE company IS NOT NULL 
      GROUP BY company 
      ORDER BY employee_count DESC
    `);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

const shouldUseDevelopmentMode = app.get('env') === 'development' || !process.env.NODE_ENV;

if (shouldUseDevelopmentMode) {
  console.log('🔧 Setting up Vite development server...');
  import('./vite').then((viteServer) => {
    app.use(viteServer.default);
  });
} else {
  console.log('📦 Serving static production build...');
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[express] serving on port ${PORT}`);
  
  // Schedule hourly graph rebuild
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Running scheduled graph rebuild...');
    import('./services/graphDatabaseService').then(({ rebuildGraph }) => {
      rebuildGraph().catch(console.error);
    });
  });
  console.log('⏰ Hourly graph rebuild cron job scheduled (runs at :00 every hour)');
});

export default app;