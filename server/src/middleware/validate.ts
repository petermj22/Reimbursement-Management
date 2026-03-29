// =============================================================
// VALIDATION MIDDLEWARE - Zod-powered request validation
// =============================================================
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../config/logger.js';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // Replace with parsed/sanitized data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        logger.warn('Validation failed', { errors, path: req.path });
        res.status(400).json({ error: 'Validation failed', details: errors });
        return;
      }
      next(error);
    }
  };
};

// Sanitize strings to prevent XSS
export const sanitize = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitizeValue = (val: unknown): unknown => {
    if (typeof val === 'string') {
      return val.replace(/[<>]/g, '').trim();
    }
    if (typeof val === 'object' && val !== null) {
      for (const [key, v] of Object.entries(val)) {
        (val as Record<string, unknown>)[key] = sanitizeValue(v);
      }
    }
    return val;
  };
  if (req.body) req.body = sanitizeValue(req.body);
  next();
};
