import { User } from "@shared/schema";
import { Request } from "express";

// Extended Express Request with proper authentication context
export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string; // User ID
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
  // Database user entity (populated by middleware)
  dbUser?: User;
}

// Type guard for authenticated requests
export function isAuthenticated(req: Express.Request): req is AuthenticatedRequest {
  return req.isAuthenticated() && !!(req.user as any)?.claims?.sub;
}

// Helper to get user ID from request
export function getUserId(req: AuthenticatedRequest): string {
  return req.user!.claims.sub;
}

// Helper to get user email from request
export function getUserEmail(req: AuthenticatedRequest): string | undefined {
  return req.user?.claims.email;
}