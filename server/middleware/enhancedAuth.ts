import { RequestHandler } from 'express';
import { AuthenticatedRequest, isAuthenticated, getUserId } from './authTypes';
import { storage } from '../storage';
import { isAuthenticated as baseAuth } from '../replitAuth';

// Enhanced authentication middleware that includes database user
export const enhancedAuth: RequestHandler = async (req, res, next) => {
  // First run base authentication
  baseAuth(req, res, async (err?: any) => {
    if (err) return next(err);
    
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!isAuthenticated(authReq)) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = getUserId(authReq);
      
      // Fetch the database user
      const dbUser = await storage.getUser(userId);
      if (dbUser) {
        authReq.dbUser = dbUser;
      }

      next();
    } catch (error) {
      console.error('Enhanced auth middleware error:', error);
      res.status(500).json({ message: "Authentication error" });
    }
  });
};

// Middleware that requires database user to exist
export const requireDbUser: RequestHandler = async (req, res, next) => {
  enhancedAuth(req, res, (err?: any) => {
    if (err) return next(err);
    
    const authReq = req as AuthenticatedRequest;
    if (!authReq.dbUser) {
      return res.status(404).json({ message: "User profile not found" });
    }
    
    next();
  });
};