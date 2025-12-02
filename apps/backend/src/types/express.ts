/**
 * Express Type Extensions
 * 
 * Custom types for authenticated requests.
 */

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}
