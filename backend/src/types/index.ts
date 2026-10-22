import { UserRole } from '@prisma/client';

export interface AuthPayload {
  id: string;
  email: string;
  rol: UserRole;
}

export interface JWTPayload {
  id: string;
  email: string;
  rol: UserRole;
  iat?: number;
  exp?: number;
}

export interface RequestWithAuth extends Express.Request {
  user?: AuthPayload;
}

export interface APIError {
  status: number;
  message: string;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  message?: string;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
