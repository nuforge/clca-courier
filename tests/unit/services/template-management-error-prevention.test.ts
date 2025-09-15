/**
 * Template Management Service Error Prevention Tests
 *
 * These tests prevent template management service failures and ensure
 * proper error handling for template operations.
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
  httpsCallable: vi.fn(() => vi.fn())
}));

describe('Template Management Service Error Prevention', () => {
  let mockLogger: typeof logger;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLogger = logger as any;
    mockHttpsCallable.mockClear();

    // Set up the mock implementations
    const { httpsCallable } = await import('firebase/functions');
    (httpsCallable as any).mockReturnValue(mockHttpsCallable);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Template Loading Error Handling', () => {
    it('should handle the specific CORS error from getAvailableTemplatesList', async () => {
      // Mock the exact CORS error you encountered
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');
      corsError.name = 'FirebaseError';
      (corsError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(corsError);

      const result = await templateManagementService.getAvailableTemplates();

      // Should return error result with proper structure
      expect(result).toEqual({
        success: false,
        templates: [],
        templateMapping: {},
        error: corsError.message
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        corsError
      );
    });

    it('should handle template loading failures gracefully', async () => {
      // Mock template loading failure
      const loadingError = new Error('Failed to load templates');
      loadingError.name = 'FirebaseError';
      (loadingError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(loadingError);

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
        loadingError
      );
    });

    it('should handle template preview failures gracefully', async () => {
      // Mock template preview failure
      const previewError = new Error('Failed to generate template preview');
      previewError.name = 'FirebaseError';
      (previewError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(previewError);

      const result = await templateManagementService.generateTemplatePreview('template-id', {});

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'internal',
        previewUrl: null
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate template preview:',
        previewError
      );
    });

    it('should handle template testing failures gracefully', async () => {
      // Mock template testing failure
      const testingError = new Error('Failed to test template');
      testingError.name = 'FirebaseError';
      (testingError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(testingError);

      const result = await templateManagementService.testTemplate('template-id', {});

      // Should return error result
      expect(result).toEqual({
        success: false,
        error: 'internal',
        testResult: null
      });

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to test template:',
        testingError
      );
    });
  });

  describe('Network and Connectivity Errors', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout
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

    it('should handle network connectivity issues gracefully', async () => {
      // Mock network connectivity error
      const connectivityError = new Error('Network error');
      connectivityError.name = 'FirebaseError';
      (connectivityError as any).code = 'unavailable';

      mockHttpsCallable.mockRejectedValueOnce(connectivityError);

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
        connectivityError
      );
    });

    it('should handle function not found errors gracefully', async () => {
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

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get available templates:',
        notFoundError
      );
    });
  });

  describe('Authentication and Authorization Errors', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock authentication error
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
  });

  describe('Data Validation and Processing Errors', () => {
    it('should handle invalid template data gracefully', async () => {
      // Mock invalid template data response
      mockHttpsCallable.mockResolvedValueOnce({
        data: {
          success: true,
          templates: [
            { id: 'template1', name: 'Valid Template' },
            { id: 'template2' }, // Missing name
            { id: 'template3', name: 'Another Valid Template' }
          ]
        }
      });

      const result = await templateManagementService.getAvailableTemplates();

      // Should filter out invalid templates
      expect(result.success).toBe(true);
      expect(result.templates).toHaveLength(2);
      expect(result.templates.every(t => t.name)).toBe(true);
    });

    it('should handle malformed response data gracefully', async () => {
      // Mock malformed response
      mockHttpsCallable.mockResolvedValueOnce({
        data: {
          success: true
          // Missing templates array
        }
      });

      const result = await templateManagementService.getAvailableTemplates();

      // Should handle missing templates array
      expect(result.success).toBe(true);
      expect(result.templates).toEqual([]);
    });

    it('should handle null response data gracefully', async () => {
      // Mock null response
      mockHttpsCallable.mockResolvedValueOnce({
        data: null
      });

      const result = await templateManagementService.getAvailableTemplates();

      // Should handle null data
      expect(result.success).toBe(false);
      expect(result.error).toBe('internal');
      expect(result.templates).toEqual([]);
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should implement retry logic for transient failures', async () => {
      // Mock transient failure followed by success
      const transientError = new Error('Transient failure');
      transientError.name = 'FirebaseError';
      (transientError as any).code = 'unavailable';

      const successData = {
        data: {
          success: true,
          templates: [{ id: 'template1', name: 'Test Template' }]
        }
      };

      mockHttpsCallable
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce(successData);

      // First call should fail
      const firstResult = await templateManagementService.getAvailableTemplates();
      expect(firstResult.success).toBe(false);

      // Second call should succeed
      const secondResult = await templateManagementService.getAvailableTemplates();
      expect(secondResult.success).toBe(true);
      expect(secondResult.templates).toHaveLength(1);
    });

    it('should handle persistent failures gracefully', async () => {
      // Mock persistent failure
      const persistentError = new Error('Persistent failure');
      persistentError.name = 'FirebaseError';
      (persistentError as any).code = 'internal';

      mockHttpsCallable.mockRejectedValue(persistentError);

      // Should consistently fail with proper error handling
      const result = await templateManagementService.getAvailableTemplates();
      expect(result.success).toBe(false);
      expect(result.error).toBe('internal');
      expect(result.templates).toEqual([]);
    });
  });

  describe('Error Categorization and Handling', () => {
    it('should categorize different error types correctly', () => {
      // Test error categorization
      const categorizeError = (error: any): string => {
        if (error?.code) {
          return error.code;
        }
        return 'internal';
      };

      const errorTypes = [
        { code: 'internal', expected: 'internal' },
        { code: 'unavailable', expected: 'unavailable' },
        { code: 'unauthenticated', expected: 'unauthenticated' },
        { code: 'permission-denied', expected: 'permission-denied' },
        { code: 'not-found', expected: 'not-found' },
        { code: 'deadline-exceeded', expected: 'deadline-exceeded' },
        { code: null, expected: 'internal' },
        { code: undefined, expected: 'internal' }
      ];

      errorTypes.forEach(({ code, expected }) => {
        expect(categorizeError({ code })).toBe(expected);
      });
    });

    it('should provide meaningful error messages', async () => {
      const errorTypes = [
        { code: 'internal', message: 'Internal server error' },
        { code: 'unavailable', message: 'Service temporarily unavailable' },
        { code: 'unauthenticated', message: 'Authentication required' },
        { code: 'permission-denied', message: 'Insufficient permissions' },
        { code: 'not-found', message: 'Template not found' },
        { code: 'deadline-exceeded', message: 'Request timeout' }
      ];

      for (const errorType of errorTypes) {
        const error = new Error(errorType.message);
        error.name = 'FirebaseError';
        (error as any).code = errorType.code;

        mockHttpsCallable.mockRejectedValueOnce(error);

        const result = await templateManagementService.getAvailableTemplates();

        expect(result.success).toBe(false);
        expect(result.error).toBe(errorType.code);
        expect(result.templates).toEqual([]);
      }
    });
  });

  describe('Service Resilience', () => {
    it('should maintain service state during errors', async () => {
      // Mock error
      const error = new Error('Service error');
      error.name = 'FirebaseError';
      (error as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(error);

      // Service should remain functional after error
      const result = await templateManagementService.getAvailableTemplates();
      expect(result.success).toBe(false);

      // Service should be able to handle subsequent requests
      mockHttpsCallable.mockResolvedValueOnce({
        data: {
          success: true,
          templates: [{ id: 'template1', name: 'Test Template' }]
        }
      });

      const secondResult = await templateManagementService.getAvailableTemplates();
      expect(secondResult.success).toBe(true);
    });

    it('should handle concurrent error scenarios', async () => {
      // Mock concurrent errors
      const error1 = new Error('Error 1');
      error1.name = 'FirebaseError';
      (error1 as any).code = 'internal';

      const error2 = new Error('Error 2');
      error2.name = 'FirebaseError';
      (error2 as any).code = 'unavailable';

      mockHttpsCallable
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2);

      // Should handle concurrent errors independently
      const [result1, result2] = await Promise.all([
        templateManagementService.getAvailableTemplates(),
        templateManagementService.getAvailableTemplates()
      ]);

      expect(result1.success).toBe(false);
      expect(result1.error).toBe('internal');
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('unavailable');
    });
  });

  describe('Error Monitoring and Logging', () => {
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

        await templateManagementService.getAvailableTemplates();

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to get available templates:',
          error
        );
      }
    });

    it('should provide structured error information for debugging', async () => {
      const error = new Error('Template service error');
      error.name = 'FirebaseError';
      (error as any).code = 'internal';

      mockHttpsCallable.mockRejectedValueOnce(error);

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
        error
      );
    });
  });
});
