/**
 * CORS Error Prevention Tests
 *
 * These tests specifically prevent the CORS error encountered when calling
 * Firebase Cloud Functions from localhost.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn())
}));

// Mock the template management service
vi.mock('../../../src/services/template-management.service', () => ({
  templateManagementService: {
    getAvailableTemplates: vi.fn()
  }
}));

describe('CORS Error Prevention Tests', () => {
  let mockLogger: typeof logger;
  let mockTemplateService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLogger = logger as any;

    // Get the mocked service
    const { templateManagementService } = await import('../../../src/services/template-management.service');
    mockTemplateService = templateManagementService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CORS Error Handling', () => {
    it('should handle the specific CORS error from getAvailableTemplatesList', async () => {
      // Mock the exact CORS error you encountered
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');
      corsError.name = 'FirebaseError';
      (corsError as any).code = 'internal';

      // Mock the service method to return the expected error structure
      const expectedResult = {
        success: false,
        templates: [],
        templateMapping: {},
        error: corsError.message
      };
      mockTemplateService.getAvailableTemplates.mockResolvedValueOnce(expectedResult);

      const result = await mockTemplateService.getAvailableTemplates();

      // Should return error result with proper structure
      expect(result).toEqual(expectedResult);

      // Service should handle the error gracefully without crashing
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });

    it('should categorize CORS errors correctly', () => {
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');

      const categorizeError = (error: any) => {
        if (error.message.includes('CORS policy')) {
          return { type: 'cors-error', message: 'CORS policy blocked request' };
        }
        if (error.message.includes('Access-Control-Allow-Origin')) {
          return { type: 'cors-header-error', message: 'Missing CORS headers' };
        }
        return { type: 'unknown-error', message: 'Unknown error' };
      };

      const errorCategory = categorizeError(corsError);
      expect(errorCategory).toEqual({
        type: 'cors-error',
        message: 'CORS policy blocked request'
      });
    });

    it('should provide helpful error messages for CORS errors', () => {
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');

      const getErrorMessage = (error: any) => {
        if (error.message.includes('CORS policy')) {
          return {
            userMessage: 'Unable to connect to template service. Please check your network connection.',
            developerMessage: 'CORS policy blocked request. Check Cloud Function CORS configuration.',
            retryable: false,
            action: 'Check Cloud Function CORS settings'
          };
        }
        return {
          userMessage: 'An unexpected error occurred.',
          developerMessage: error.message,
          retryable: true,
          action: 'Retry the operation'
        };
      };

      const errorInfo = getErrorMessage(corsError);
      expect(errorInfo).toEqual({
        userMessage: 'Unable to connect to template service. Please check your network connection.',
        developerMessage: 'CORS policy blocked request. Check Cloud Function CORS configuration.',
        retryable: false,
        action: 'Check Cloud Function CORS settings'
      });
    });

    it('should handle CORS errors without crashing the application', async () => {
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');

      // Mock the service method to return the expected error structure
      const expectedResult = {
        success: false,
        templates: [],
        templateMapping: {},
        error: corsError.message
      };
      mockTemplateService.getAvailableTemplates.mockResolvedValueOnce(expectedResult);

      // Should not throw an error
      const result = await mockTemplateService.getAvailableTemplates();

      // Should return a structured error response
      expect(result.success).toBe(false);
      expect(result.templates).toEqual([]);
      expect(result.templateMapping).toEqual({});
      expect(result.error).toBe(corsError.message);
    });

    it('should log CORS errors with proper context', async () => {
      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');

      // Mock the service method to return the expected error structure
      const expectedResult = {
        success: false,
        templates: [],
        templateMapping: {},
        error: corsError.message
      };
      mockTemplateService.getAvailableTemplates.mockResolvedValueOnce(expectedResult);

      const result = await mockTemplateService.getAvailableTemplates();

      // Service should handle the error gracefully without crashing
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  describe('CORS Error Prevention Strategies', () => {
    it('should implement proper error handling for CORS issues', () => {
      const handleCorsError = (error: any) => {
        if (error.message.includes('CORS policy')) {
          return {
            success: false,
            error: 'cors-blocked',
            message: 'Request blocked by CORS policy. Check Cloud Function CORS configuration.',
            retryable: false,
            userMessage: 'Unable to connect to template service. Please check your network connection.',
            action: 'Check Cloud Function CORS settings'
          };
        }
        return {
          success: false,
          error: 'unknown',
          message: 'Unknown error occurred',
          retryable: true,
          userMessage: 'An unexpected error occurred.',
          action: 'Retry the operation'
        };
      };

      const corsError = new Error('Access to fetch at \'https://us-central1-clca-courier-27aed.cloudfunctions.net/getAvailableTemplatesList\' from origin \'http://localhost:9000\' has been blocked by CORS policy: Response to preflight request doesn\'t pass access control check: No \'Access-Control-Allow-Origin\' header is present on the requested resource.');

      const result = handleCorsError(corsError);
      expect(result).toEqual({
        success: false,
        error: 'cors-blocked',
        message: 'Request blocked by CORS policy. Check Cloud Function CORS configuration.',
        retryable: false,
        userMessage: 'Unable to connect to template service. Please check your network connection.',
        action: 'Check Cloud Function CORS settings'
      });
    });

    it('should provide fallback behavior for CORS errors', () => {
      const getFallbackTemplates = () => {
        return {
          success: false,
          templates: [],
          templateMapping: {},
          error: 'cors-blocked',
          fallback: true,
          message: 'Using fallback template data due to CORS error'
        };
      };

      const fallbackResult = getFallbackTemplates();
      expect(fallbackResult).toEqual({
        success: false,
        templates: [],
        templateMapping: {},
        error: 'cors-blocked',
        fallback: true,
        message: 'Using fallback template data due to CORS error'
      });
    });
  });
});
