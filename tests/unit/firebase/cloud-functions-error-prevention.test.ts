/**
 * Cloud Functions Error Prevention Tests
 *
 * These tests follow Firebase's official Cloud Functions testing patterns
 * to prevent function-specific errors and ensure proper error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/utils/logger';

// Mock Firebase Functions following official testing patterns
const mockHttpsCallable = vi.fn();
const mockGetFunctions = vi.fn();

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => mockGetFunctions()),
  httpsCallable: vi.fn(() => mockHttpsCallable)
}));

// Mock logger
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('Cloud Functions Error Prevention Tests', () => {
  let mockLogger: typeof logger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = logger as any;
    mockHttpsCallable.mockClear();
    mockGetFunctions.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Function Call Error Prevention', () => {
    it('should handle the specific CORS error from getAvailableTemplatesList', async () => {
      // Mock the exact CORS error encountered in production
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');
      corsError.name = 'FirebaseError';
      (corsError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(corsError);

      // Test error categorization
      const categorizeError = (error: any) => {
        if (error.message.includes('CORS policy')) {
          return { type: 'cors-error', message: 'CORS policy blocked request' };
        }
        if (error?.code === 'internal') {
          return { type: 'internal-error', message: 'Internal server error' };
        }
        return { type: 'unknown-error', message: 'Unknown error' };
      };

      const errorCategory = categorizeError(corsError);
      expect(errorCategory).toEqual({
        type: 'cors-error',
        message: 'CORS policy blocked request'
      });

      // Test error handling pattern
      const handleCorsError = (error: any) => {
        if (error.message.includes('CORS policy')) {
          return {
            success: false,
            error: 'cors-blocked',
            message: 'Request blocked by CORS policy. Check Cloud Function CORS configuration.',
            retryable: false
          };
        }
        return {
          success: false,
          error: 'unknown',
          message: 'Unknown error occurred',
          retryable: true
        };
      };

      const errorResponse = handleCorsError(corsError);
      expect(errorResponse).toEqual({
        success: false,
        error: 'cors-blocked',
        message: 'Request blocked by CORS policy. Check Cloud Function CORS configuration.',
        retryable: false
      });
    });

    it('should handle CORS policy errors with proper error categorization', async () => {
      // Mock CORS error following Firebase patterns
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');
      corsError.name = 'FirebaseError';
      (corsError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(corsError);

      // Test error handling function
      const handleFunctionError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error: any) {
          const errorInfo = {
            code: error?.code || 'unknown',
            message: error?.message || 'Unknown error',
            isCorsError: error?.message?.includes('CORS policy'),
            isNetworkError: error?.message?.includes('net::ERR_'),
            isTimeoutError: error?.code === 'deadline-exceeded'
          };

          mockLogger.error('Cloud Function error:', errorInfo);

          // Return structured error response
          return {
            success: false,
            error: errorInfo.code,
            message: errorInfo.isCorsError ? 'CORS policy error - check function configuration' : errorInfo.message,
            retryable: errorInfo.isNetworkError || errorInfo.isTimeoutError
          };
        }
      };

      const result = await handleFunctionError(() => mockHttpsCallable());

      expect(result.success).toBe(false);
      expect(result.error).toBe('internal');
      expect(result.message).toBe('CORS policy error - check function configuration');
      expect(result.retryable).toBe(false);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cloud Function error:',
        expect.objectContaining({
          code: 'internal',
          isCorsError: true,
          isNetworkError: false,
          isTimeoutError: false
        })
      );
    });

    it('should handle network failures with retry logic', async () => {
      // Test network error handling with exponential backoff
      const executeWithRetry = async (operation: () => Promise<any>, maxRetries: number = 3) => {
        let lastError: any;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error: any) {
            lastError = error;

            // Only retry on retryable errors
            const isRetryable = error.code === 'unavailable' ||
                               error.code === 'deadline-exceeded' ||
                               error.message?.includes('net::ERR_');

            if (isRetryable && attempt < maxRetries) {
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
              mockLogger.warn(`Function call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`, {
                error: error.message,
                code: error.code
              });
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw error;
            }
          }
        }

        throw lastError;
      };

      // Mock network error followed by success
      const networkError = new Error('net::ERR_FAILED');
      networkError.name = 'FirebaseError';
      (networkError as any).code = 'unavailable';

      const successData = {
        data: {
          success: true,
          templates: [{ id: 'template1', name: 'Test Template' }]
        }
      };

      mockHttpsCallable
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successData);

      const result = await executeWithRetry(() => mockHttpsCallable(), 3);

      expect(result.data.success).toBe(true);
      expect(result.data.templates).toHaveLength(1);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2); // Two retry warnings
    });

    it('should handle function timeout errors gracefully', async () => {
      // Mock timeout error
      const timeoutError = new Error('Function execution timeout');
      timeoutError.name = 'FirebaseError';
      (timeoutError as any).code = 'deadline-exceeded';

      mockHttpsCallable.mockRejectedValueOnce(timeoutError);

      const handleTimeoutError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error: any) {
          if (error.code === 'deadline-exceeded') {
            mockLogger.error('Function timeout:', {
              error: error.message,
              suggestion: 'Function may be overloaded or taking too long to execute',
              retryable: true
            });

            return {
              success: false,
              error: 'timeout',
              message: 'Function execution timed out',
              retryable: true
            };
          }
          throw error;
        }
      };

      const result = await handleTimeoutError(() => mockHttpsCallable());

      expect(result.success).toBe(false);
      expect(result.error).toBe('timeout');
      expect(result.retryable).toBe(true);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Function timeout:',
        expect.objectContaining({
          error: 'Function execution timeout',
          suggestion: 'Function may be overloaded or taking too long to execute',
          retryable: true
        })
      );
    });
  });

  describe('Authentication and Authorization Error Prevention', () => {
    it('should handle authentication errors with proper user guidance', async () => {
      // Mock authentication error
      const authError = new Error('User not authenticated');
      authError.name = 'FirebaseError';
      (authError as any).code = 'unauthenticated';

      mockHttpsCallable.mockRejectedValueOnce(authError);

      const handleAuthError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error: any) {
          if (error.code === 'unauthenticated') {
            mockLogger.error('Authentication required:', {
              error: error.message,
              suggestion: 'User must be signed in to call this function',
              action: 'redirect_to_login'
            });

            return {
              success: false,
              error: 'unauthenticated',
              message: 'Authentication required',
              action: 'redirect_to_login'
            };
          }
          throw error;
        }
      };

      const result = await handleAuthError(() => mockHttpsCallable());

      expect(result.success).toBe(false);
      expect(result.error).toBe('unauthenticated');
      expect(result.action).toBe('redirect_to_login');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Authentication required:',
        expect.objectContaining({
          error: 'User not authenticated',
          suggestion: 'User must be signed in to call this function',
          action: 'redirect_to_login'
        })
      );
    });

    it('should handle permission errors with role-based guidance', async () => {
      // Mock permission error
      const permissionError = new Error('Insufficient permissions');
      permissionError.name = 'FirebaseError';
      (permissionError as any).code = 'permission-denied';

      mockHttpsCallable.mockRejectedValueOnce(permissionError);

      const handlePermissionError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            mockLogger.error('Permission denied:', {
              error: error.message,
              suggestion: 'User does not have required permissions for this operation',
              action: 'check_user_role'
            });

            return {
              success: false,
              error: 'permission-denied',
              message: 'Insufficient permissions',
              action: 'check_user_role'
            };
          }
          throw error;
        }
      };

      const result = await handlePermissionError(() => mockHttpsCallable());

      expect(result.success).toBe(false);
      expect(result.error).toBe('permission-denied');
      expect(result.action).toBe('check_user_role');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Permission denied:',
        expect.objectContaining({
          error: 'Insufficient permissions',
          suggestion: 'User does not have required permissions for this operation',
          action: 'check_user_role'
        })
      );
    });
  });

  describe('Function Not Found Error Prevention', () => {
    it('should handle function not found errors gracefully', async () => {
      // Mock function not found error
      const notFoundError = new Error('Function not found');
      notFoundError.name = 'FirebaseError';
      (notFoundError as any).code = 'not-found';

      mockHttpsCallable.mockRejectedValueOnce(notFoundError);

      const handleNotFoundError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error: any) {
          if (error.code === 'not-found') {
            mockLogger.error('Function not found:', {
              error: error.message,
              suggestion: 'Function may not be deployed or function name is incorrect',
              action: 'check_function_deployment'
            });

            return {
              success: false,
              error: 'not-found',
              message: 'Function not found',
              action: 'check_function_deployment'
            };
          }
          throw error;
        }
      };

      const result = await handleNotFoundError(() => mockHttpsCallable());

      expect(result.success).toBe(false);
      expect(result.error).toBe('not-found');
      expect(result.action).toBe('check_function_deployment');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Function not found:',
        expect.objectContaining({
          error: 'Function not found',
          suggestion: 'Function may not be deployed or function name is incorrect',
          action: 'check_function_deployment'
        })
      );
    });
  });

  describe('Data Validation and Processing', () => {
    it('should validate function input parameters', () => {
      // Test input validation for Cloud Functions
      const validateFunctionInput = (input: any, schema: Record<string, any>): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!input || typeof input !== 'object') {
          errors.push('Input must be an object');
          return { valid: false, errors };
        }

        // Check required fields
        for (const [field, rules] of Object.entries(schema)) {
          if (rules.required && !(field in input)) {
            errors.push(`Missing required field: ${field}`);
          }

          if (field in input) {
            const value = input[field];

            // Type validation
            if (rules.type && typeof value !== rules.type) {
              errors.push(`Field ${field} must be of type ${rules.type}`);
            }

            // Length validation
            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(`Field ${field} exceeds maximum length of ${rules.maxLength}`);
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
              errors.push(`Field ${field} does not match required pattern`);
            }
          }
        }

        return { valid: errors.length === 0, errors };
      };

      // Test schema
      const schema = {
        templateId: { required: true, type: 'string', maxLength: 100 },
        content: { required: true, type: 'string', maxLength: 10000 },
        options: { required: false, type: 'object' }
      };

      // Test valid input
      const validInput = {
        templateId: 'template-123',
        content: 'Test content',
        options: { theme: 'dark' }
      };

      const validResult = validateFunctionInput(validInput, schema);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Test invalid input
      const invalidInput = {
        templateId: 123, // Wrong type
        // content field is missing (required)
        options: 'invalid' // Wrong type
      };

      const invalidResult = validateFunctionInput(invalidInput, schema);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Field templateId must be of type string');
      expect(invalidResult.errors).toContain('Missing required field: content');
      expect(invalidResult.errors).toContain('Field options must be of type object');
    });

    it('should sanitize function output data', () => {
      // Test output sanitization
      const sanitizeFunctionOutput = (output: any): any => {
        if (output === null || output === undefined) {
          return null;
        }

        if (typeof output === 'string') {
          // Remove control characters and limit length
          return output.replace(/[\x00-\x1F\x7F]/g, '').substring(0, 1000000);
        }

        if (Array.isArray(output)) {
          return output.map(item => sanitizeFunctionOutput(item));
        }

        if (typeof output === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(output)) {
            // Skip sensitive fields
            if (key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('token')) {
              continue;
            }
            sanitized[key] = sanitizeFunctionOutput(value);
          }
          return sanitized;
        }

        return output;
      };

      // Test sanitization
      const testOutput = {
        success: true,
        data: 'Test data with \x00 control characters',
        password: 'should-be-removed',
        secret: 'should-be-removed',
        token: 'should-be-removed',
        nested: {
          value: 'nested value',
          password: 'should-be-removed'
        }
      };

      const sanitized = sanitizeFunctionOutput(testOutput);

      expect(sanitized.success).toBe(true);
      expect(sanitized.data).toBe('Test data with  control characters');
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.secret).toBeUndefined();
      expect(sanitized.token).toBeUndefined();
      expect(sanitized.nested.value).toBe('nested value');
      expect(sanitized.nested.password).toBeUndefined();
    });
  });

  describe('Error Monitoring and Analytics', () => {
    it('should track function call patterns for monitoring', () => {
      // Test function call tracking
      class FunctionCallTracker {
        private callCounts = new Map<string, number>();
        private errorCounts = new Map<string, number>();
        private callTimestamps = new Map<string, number[]>();

        recordCall(functionName: string, success: boolean, error?: any) {
          const now = Date.now();

          // Track call count
          this.callCounts.set(functionName, (this.callCounts.get(functionName) || 0) + 1);

          // Track error count
          if (!success) {
            const errorKey = `${functionName}:${error?.code || 'unknown'}`;
            this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
          }

          // Track timestamps
          if (!this.callTimestamps.has(functionName)) {
            this.callTimestamps.set(functionName, []);
          }
          this.callTimestamps.get(functionName)!.push(now);

          // Clean old timestamps (older than 1 hour)
          const oneHourAgo = now - 3600000;
          const timestamps = this.callTimestamps.get(functionName)!.filter(t => t > oneHourAgo);
          this.callTimestamps.set(functionName, timestamps);
        }

        getCallRate(functionName: string): number {
          const timestamps = this.callTimestamps.get(functionName) || [];
          return timestamps.length; // Calls per hour
        }

        getErrorRate(functionName: string, errorCode: string): number {
          const key = `${functionName}:${errorCode}`;
          return this.errorCounts.get(key) || 0;
        }

        getSuccessRate(functionName: string): number {
          const totalCalls = this.callCounts.get(functionName) || 0;
          const totalErrors = Array.from(this.errorCounts.keys())
            .filter(key => key.startsWith(`${functionName}:`))
            .reduce((sum, key) => sum + (this.errorCounts.get(key) || 0), 0);

          return totalCalls > 0 ? (totalCalls - totalErrors) / totalCalls : 0;
        }
      }

      const tracker = new FunctionCallTracker();

      // Record some calls
      tracker.recordCall('getTemplates', true);
      tracker.recordCall('getTemplates', true);
      tracker.recordCall('getTemplates', false, { code: 'internal' });
      tracker.recordCall('generatePDF', false, { code: 'timeout' });

      expect(tracker.getCallRate('getTemplates')).toBe(3);
      expect(tracker.getErrorRate('getTemplates', 'internal')).toBe(1);
      expect(tracker.getErrorRate('generatePDF', 'timeout')).toBe(1);
      expect(tracker.getSuccessRate('getTemplates')).toBe(2/3); // 2 out of 3 successful
    });
  });

  describe('Circuit Breaker and Rate Limiting', () => {
    it('should implement function call rate limiting', () => {
      // Test rate limiting implementation
      class FunctionRateLimiter {
        private callCounts = new Map<string, number[]>();

        constructor(
          private maxCalls: number = 100,
          private timeWindow: number = 60000 // 1 minute
        ) {}

        canMakeCall(functionName: string): boolean {
          const now = Date.now();
          const calls = this.callCounts.get(functionName) || [];

          // Remove old calls outside the time window
          const recentCalls = calls.filter(timestamp => now - timestamp < this.timeWindow);
          this.callCounts.set(functionName, recentCalls);

          // Check if under rate limit
          return recentCalls.length < this.maxCalls;
        }

        recordCall(functionName: string): void {
          const now = Date.now();
          const calls = this.callCounts.get(functionName) || [];
          calls.push(now);
          this.callCounts.set(functionName, calls);
        }

        getRemainingCalls(functionName: string): number {
          const now = Date.now();
          const calls = this.callCounts.get(functionName) || [];
          const recentCalls = calls.filter(timestamp => now - timestamp < this.timeWindow);
          return Math.max(0, this.maxCalls - recentCalls.length);
        }
      }

      const rateLimiter = new FunctionRateLimiter(3, 60000); // 3 calls per minute

      // Test rate limiting
      expect(rateLimiter.canMakeCall('getTemplates')).toBe(true);
      rateLimiter.recordCall('getTemplates');

      expect(rateLimiter.canMakeCall('getTemplates')).toBe(true);
      rateLimiter.recordCall('getTemplates');

      expect(rateLimiter.canMakeCall('getTemplates')).toBe(true);
      rateLimiter.recordCall('getTemplates');

      // Should be rate limited now
      expect(rateLimiter.canMakeCall('getTemplates')).toBe(false);
      expect(rateLimiter.getRemainingCalls('getTemplates')).toBe(0);
    });
  });
});
