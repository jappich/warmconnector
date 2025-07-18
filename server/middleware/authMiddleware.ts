import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, getUserId, isAuthenticatedRequest } from '../types/auth';
import logger from '../utils/logger';

// Enhanced authentication middleware with proper typing
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated using the existing isAuthenticated middleware
    if (!isAuthenticatedRequest(req)) {
      logger.warn('Unauthorized access attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    const authenticatedReq = req as AuthenticatedRequest;
    const userId = getUserId(authenticatedReq);
    
    logger.debug('Authenticated request', {
      userId,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication check failed' 
    });
  }
};

// Helper function to get user ID from authenticated request
export const getAuthenticatedUserId = (req: Request): string => {
  if (!isAuthenticatedRequest(req)) {
    throw new Error('Request is not authenticated');
  }
  return getUserId(req as AuthenticatedRequest);
};

// Helper function to get full user context
export const getAuthenticatedUser = (req: Request): AuthenticatedRequest['user'] => {
  if (!isAuthenticatedRequest(req)) {
    throw new Error('Request is not authenticated');
  }
  return (req as AuthenticatedRequest).user;
};

// Helper to safely extract user ID with null check
export const safeGetUserId = (req: Request): string | null => {
  try {
    return getAuthenticatedUserId(req);
  } catch {
    return null;
  }
};

export default authMiddleware;