import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate a CSRF token for the current session
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware to generate and send CSRF token to the client
 */
export const csrfTokenGenerator = (req: Request, res: Response, next: NextFunction): void => {
  // Generate a new token if one doesn't exist
  if (!req.cookies['XSRF-TOKEN']) {
    const token = generateCsrfToken();
    
    // Set it as a cookie - NOT HttpOnly so frontend JS can read it
    res.cookie('XSRF-TOKEN', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
  
  next();
};

/**
 * Middleware to validate CSRF token on state-changing requests
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Only check POST, PUT, DELETE, PATCH requests
  const methodsToCheck = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!methodsToCheck.includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for certain routes like login, refresh token
  const skipRoutes = ['/api/auth/login', '/api/auth/refresh-token', '/api/auth/register'];
  if (skipRoutes.some(route => req.path.includes(route))) {
    return next();
  }
  
  // Get the token from the cookie
  const csrfCookie = req.cookies['XSRF-TOKEN'];
  
  // Get the token from the header
  const csrfHeader = req.headers['x-xsrf-token'];
  
  // Validate the token
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    res.status(403).json({
      message: 'CSRF token validation failed',
      error: 'Invalid or missing CSRF token'
    });
    return;
  }
  
  next();
};

// Export both middlewares
export const csrfMiddleware = [csrfTokenGenerator, csrfProtection];