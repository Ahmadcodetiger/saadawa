// middleware/error.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { config, logger } from '../config/bootstrap.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const isProduction = config.nodeEnv === 'production';

  // Detailed error logging
  logger.error('❌ Error Occurred:', {
    error: {
      name: err.name || 'Error',
      message: message,
      stack: !isProduction ? err.stack : undefined,
      code: err.code
    },
    context: {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      body: req.method !== 'GET' ? 'Capture body in detailedRequestLogger' : undefined
    }
  });

  // Log to console for immediate visibility in development
  if (!isProduction) {
    console.error('\n🔴 ERROR DETAILS:');
    console.error('Message:', message);
    if (err.stack) console.error('Stack:', err.stack);
    console.error('\n');
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'Internal Server Error' : message,
    ...( !isProduction && { stack: err.stack, details: err.details })
  });
};
