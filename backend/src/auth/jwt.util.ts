import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

export const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

export function signToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET);
}

export function getUserFromRequest(req: Request): any | null {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
