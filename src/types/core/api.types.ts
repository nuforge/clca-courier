/**
 * API and Service Types
 * Common interfaces for API requests, responses, and service configurations
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  status: 'success' | 'error' | 'loading';
  timestamp: number;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string | number;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
  retries?: number;
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search parameters for API requests
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  pagination?: PaginationParams;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = unknown> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Service configuration base
 */
export interface ServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  enableCaching?: boolean;
  cacheTimeout?: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number;
  strategy: 'memory' | 'localStorage' | 'indexedDB';
}

/**
 * Service health status
 */
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: number;
  responseTime: number;
  errors: number;
  uptime: number;
}

/**
 * Authentication token
 */
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope?: string[];
}

/**
 * Authentication state
 * Note: UserProfile is imported from firebase-firestore.service.ts to avoid duplication
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: import('../services/firebase-firestore.service').UserProfile;
  token?: AuthToken;
  permissions?: string[];
}

/**
 * File upload configuration
 */
export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  multiple: boolean;
  destination: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (response: unknown) => void;
  onError?: (error: ApiError) => void;
}

/**
 * File upload status
 */
export interface UploadStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  response?: unknown;
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
  signature?: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  requests: number;
  window: number; // Time window in milliseconds
  strategy: 'fixed' | 'sliding';
}

/**
 * Service metrics
 */
export interface ServiceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    recent: ApiError[];
  };
}
