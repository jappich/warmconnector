import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include authenticated user context
export interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;  // User ID
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
      iat?: number;
      exp?: number;
    };
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

// Authentication helper to get user ID from request
export function getUserId(req: AuthenticatedRequest): string {
  return req.user.claims.sub;
}

// Type guard to check if request is authenticated
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return !!(req.user && (req.user as any).claims && (req.user as any).claims.sub);
}

// Authentication middleware type
export type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

// Export types for better organization
export type UserClaims = AuthenticatedRequest['user']['claims'];
export type AuthenticatedUser = AuthenticatedRequest['user'];