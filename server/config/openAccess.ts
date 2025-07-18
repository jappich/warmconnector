// Open Access Configuration for WarmConnector
// This configuration removes all authentication and security restrictions

export const OPEN_ACCESS_CONFIG = {
  // Authentication disabled
  authenticationRequired: false,
  
  // Rate limiting disabled  
  rateLimitingEnabled: false,
  
  // CSRF protection disabled
  csrfProtectionEnabled: false,
  
  // reCAPTCHA disabled
  recaptchaEnabled: false,
  
  // Default mock user for all requests
  mockUser: {
    id: 'open-access-user',
    email: 'public@warmconnector.com',
    firstName: 'Public',
    lastName: 'User',
    company: 'Open Access Demo',
    title: 'Demo User',
    onboardingComplete: true
  },
  
  // Public API access
  publicApiAccess: true,
  
  // Development mode features
  enableDevelopmentFeatures: true,
  
  // Bypass all security middleware
  bypassSecurityMiddleware: true
};

// No-op middleware functions for open access
export const noOpMiddleware = (req: any, res: any, next: any) => {
  // Add mock user to request for compatibility
  req.user = OPEN_ACCESS_CONFIG.mockUser;
  next();
};

export const disabledRateLimit = (req: any, res: any, next: any) => next();
export const disabledAuth = (req: any, res: any, next: any) => next();
export const disabledCSRF = (req: any, res: any, next: any) => next();

console.log('🌐 OPEN ACCESS MODE ENABLED');
console.log('📖 All API endpoints are publicly accessible');
console.log('🔓 Authentication and security restrictions disabled');