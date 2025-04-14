import { Request, Response } from 'express';
import { logger } from './logger';

interface ErrorWithCode extends Error {
  code?: number;
  statusCode?: number;
  status?: number;
  error?: Error;
}

/**
 * Handles errors in controllers and sends appropriate response to client
 * 
 * @param error The error object thrown by the service layer
 * @param req Express request object
 * @param res Express response object
 * @param defaultMessage Default message to display if error doesn't have a message
 */
export function handleErrorController(
  error: ErrorWithCode | any,
  req: Request,
  res: Response,
  defaultMessage: string = 'An unexpected error occurred'
) {
  // Normalize the error object
  const normalizedError: ErrorWithCode = error.error ? error : { error };
  
  // Get the status code (look in various places)
  const statusCode = 
    normalizedError.code || 
    normalizedError.statusCode || 
    normalizedError.status || 
    (normalizedError.error && 'code' in normalizedError.error ? (normalizedError.error as any).code : null) || 
    500;
  
  // Get the error message
  const errorMessage = 
    normalizedError.message || 
    (normalizedError.error instanceof Error ? normalizedError.error.message : null) ||
    defaultMessage;
  
  // Map common error messages to user-friendly responses
  let userMessage = errorMessage;
  
  if (errorMessage.includes('not found')) {
    userMessage = errorMessage;
  } else if (errorMessage.includes('permission') || errorMessage.includes('authorized')) {
    userMessage = 'You do not have permission to perform this action';
  } else if (statusCode === 400) {
    userMessage = errorMessage || 'Invalid request parameters';
  } else if (statusCode === 401) {
    userMessage = 'Authentication required';
  } else if (statusCode === 403) {
    userMessage = 'Access forbidden';
  } else if (statusCode === 404) {
    userMessage = errorMessage || 'Resource not found';
  } else if (statusCode === 409) {
    userMessage = errorMessage || 'Conflict with existing resource';
  } else if (statusCode >= 500) {
    // For server errors, don't expose internal details
    userMessage = defaultMessage;
  }
  
  // Log the error (with full details for server errors)
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${errorMessage}`, {
      error: normalizedError,
      stack: normalizedError instanceof Error ? normalizedError.stack : undefined,
      body: req.body,
      params: req.params,
      query: req.query
    });
  } else {
    // For client errors, log less detail
    logger.warn(`[${req.method}] ${req.path} - ${errorMessage} (${statusCode})`, {
      params: req.params,
      query: req.query
    });
  }
  
  // Send response to client
  return res.status(statusCode).json({
    error: userMessage,
    status: statusCode,
    success: false
  });
}