import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { RequestWithAuth, JWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authMiddleware = (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: { status: 401, message: 'Token no proporcionado' }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      error: { status: 401, message: 'Token inválido' }
    });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: RequestWithAuth, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { status: 401, message: 'No autenticado' }
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: { status: 403, message: 'Acceso denegado' }
      });
    }

    return next();
  };
};

export const requireAuth = (req: RequestWithAuth, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: { status: 401, message: 'No autenticado' }
    });
  }
  return next();
};
