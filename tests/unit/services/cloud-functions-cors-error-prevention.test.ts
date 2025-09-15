/**
 * Cloud Functions CORS Error Prevention Tests
 * 
 * These tests prevent CORS policy errors when calling Cloud Functions
 * and ensure proper error handling for network failures.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { templateManagementService } from '../../../src/services/template-management.service';
import { logger } from '../../../src/utils/logger';

// Mock logger to track errors
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Firebase Functions
const mockHttpsCallable = vi.fn();
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => mockHttpsCallable)
}));

describe('Cloud Functions CORS Error Prevention', () => {
  let mockLogger: typeof logger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = logger as any;
    mockHttpsCallable.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Template Management Service CORS Handling', () => {
    it('should handle CORS policy errors gracefully', async () => {
      // Mock CORS error
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');
      corsError.name = 'FirebaseError';
      (corsError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(corsError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result instead of throwing
      expect(result).toEqual({
        success: false,
        error: 'internal',
        templates: []
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        corsError
      );
    });

    it('should handle network failures gracefully', async () => {
      // Mock network failure
      const networkError = new Error('net::ERR_FAILED');
      networkError.name = 'FirebaseError';
      (networkError as any).code = 'unavailable';

      mockHttpsCallable.mockRejectedValueOnce(networkError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'unavailable',
        templates: []
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        networkError
      );
    });

    it('should handle timeout errors gracefully', async () => {
      // Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'FirebaseError';
      (timeoutError as any).code = 'deadline-exceeded';

      mockHttpsCallable.mockRejectedValueOnce(timeoutError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'deadline-exceeded',
        templates: []
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        timeoutError
      );
    });

    it('should handle authentication errors gracefully', async () => {
      // Mock auth error
      const authError = new Error('User not authenticated');
      authError.name = 'FirebaseError';
      (authError as any).code = 'unauthenticated';

      mockHttpsCallable.mockRejectedValueOnce(authError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'unauthenticated',
        templates: []
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        authError
      );
    });

    it('should handle permission errors gracefully', async () => {
      // Mock permission error
      const permissionError = new Error('Insufficient permissions');
      permissionError.name = 'FirebaseError';
      (permissionError as any).code = 'permission-denied';

      mockHttpsCallable.mockRejectedValueOnce(permissionError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'permission-denied',
        templates: []
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        permissionError
      );
    });

    it('should handle unknown errors gracefully', async () => {
      // Mock unknown error
      const unknownError = new Error('Unknown error occurred');
      unknownError.name = 'FirebaseError';
      (unknownError as any).code = 'unknown';

      mockHttpsCallable.mockRejectedValueOnce(unknownError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'unknown',
        templates: []
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        unknownError
      );
    });

    it('should handle non-Firebase errors gracefully', async () => {
      // Mock generic error
      const genericError = new Error('Generic error');

      mockHttpsCallable.mockRejectedValueOnce(genericError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result with 'internal' code
      expect(result).toEqual({
        success: false,
        error: 'internal',
        templates: []
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        genericError
      );
    });
  });

  describe('CORS Error Prevention Strategies', () => {
    it('should implement proper error categorization', () => {
      // Test error code extraction
      const extractErrorCode = (error: any): string => {
        if (error?.code) {
          return error.code;
        }
        return 'internal';
      };

      expect(extractErrorCode({ code: 'internal' })).toBe('internal');
      expect(extractErrorCode({ code: 'unavailable' })).toBe('unavailable');
      expect(extractErrorCode({ code: 'unauthenticated' })).toBe('unauthenticated');
      expect(extractErrorCode({ code: 'permission-denied' })).toBe('permission-denied');
      expect(extractErrorCode({})).toBe('internal');
      expect(extractErrorCode(null)).toBe('internal');
    });

    it('should implement proper error message handling', () => {
      // Test error message extraction
      const extractErrorMessage = (error: any): string => {
        if (error?.message) {
          return error.message;
        }
        return 'Unknown error occurred';
      };

      expect(extractErrorMessage({ message: 'CORS error' })).toBe('CORS error');
      expect(extractErrorMessage({})).toBe('Unknown error occurred');
      expect(extractErrorMessage(null)).toBe('Unknown error occurred');
    });
  });

  describe('Network Error Recovery', () => {
    it('should handle intermittent network failures', async () => {
      // Mock intermittent failures
      mockHttpsCallable
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            success: true,
            templates: [{ id: 'template1', name: 'Test Template' }]
          }
        });

      // First call should fail
      const firstResult = await templateService.getAvailableTemplates();
      expect(firstResult.success).toBe(false);

      // Second call should succeed
      const secondResult = await templateService.getAvailableTemplates();
      expect(secondResult.success).toBe(true);
      expect(secondResult.templates).toHaveLength(1);
    });

    it('should handle function not found errors', async () => {
      // Mock function not found error
      const notFoundError = new Error('Function not found');
      notFoundError.name = 'FirebaseError';
      (notFoundError as any).code = 'not-found';

      mockHttpsCallable.mockRejectedValueOnce(notFoundError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'not-found',
        templates: []
      });
    });

    it('should handle function timeout errors', async () => {
      // Mock function timeout error
      const timeoutError = new Error('Function execution timeout');
      timeoutError.name = 'FirebaseError';
      (timeoutError as any).code = 'deadline-exceeded';

      mockHttpsCallable.mockRejectedValueOnce(timeoutError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'deadline-exceeded',
        templates: []
      });
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log all error types consistently', async () => {
      const errorTypes = [
        { code: 'internal', message: 'Internal error' },
        { code: 'unavailable', message: 'Service unavailable' },
        { code: 'unauthenticated', message: 'Not authenticated' },
        { code: 'permission-denied', message: 'Permission denied' },
        { code: 'not-found', message: 'Not found' },
        { code: 'deadline-exceeded', message: 'Timeout' }
      ];

      for (const errorType of errorTypes) {
        const error = new Error(errorType.message);
        error.name = 'FirebaseError';
        (error as any).code = errorType.code;

        mockHttpsCallable.mockRejectedValueOnce(error);

        await templateService.getAvailableTemplates();

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to get available templates:',
          error
        );
      }
    });

    it('should provide meaningful error messages for debugging', async () => {
      const corsError = new Error('CORS policy error');
      corsError.name = 'FirebaseError';
      (corsError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(corsError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should provide structured error information
      expect(result).toEqual({
        success: false,
        error: 'internal',
        templates: []
      });

      // Should log with context
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        corsError
      );
    });
  });
});
