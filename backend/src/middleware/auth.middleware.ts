// middleware/auth.middleware.ts
import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/bootstrap.js';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // If user is already authenticated (e.g. via API key), skip token check
  if (req.user) {
    return next();
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return ApiResponse.error(res, 'No token provided', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role?: string };
    req.user = decoded;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid token', 401);
  }
};

// Alias for compatibility
export const authenticate = authMiddleware;

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    // Normalize role string (e.g. "Super Admin" -> "super_admin")
    const userRole = req.user.role.toLowerCase().replace(/\s+/g, '_');

    // super_admin gets access to everything
    if (userRole === 'super_admin') {
      return next();
    }

    if (!roles.includes(userRole)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }
    next();
  };
};