/**
 * Canva API Service Tests
 *
 * Following established CLCA Courier testing methodology patterns
 * Based on proven 96% success rate from PROJECT_STATUS_COMPLETE.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import type { AxiosResponse, AxiosError } from 'axios';

// Mock logger using established patterns
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

// Mock Firebase Timestamp using established patterns
const mockTimestamp = vi.hoisted(() => ({
  now: vi.fn(() => ({
    seconds: 1694102400,
    nanoseconds: 0
  }))
}));

// Mock axios instance using established patterns
const mockAxiosInstance = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}));

// Mock axios using established patterns
const mockAxios = vi.hoisted(() => ({
  create: vi.fn(() => mockAxiosInstance),
  isAxiosError: vi.fn()
}));

// Apply mocks using proven methodology
vi.mock('../../../src/utils/logger', () => ({ logger: mockLogger }));
vi.mock('firebase/firestore', () => ({ Timestamp: mockTimestamp }));
vi.mock('axios', () => ({ default: mockAxios }));

describe('CanvaApiService', () => {
  let CanvaApiService: any;
  let service: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mocks using established patterns
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.interceptors.request.use.mockReset();
    mockAxiosInstance.interceptors.response.use.mockReset();

    // Import service
    const module = await import('../../../src/services/canva-api.service');
    CanvaApiService = module.CanvaApiService;
    service = new CanvaApiService();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', () => {
      expect(service).toBeInstanceOf(CanvaApiService);
      expect(service).toBeDefined();
    });

    it('should create axios instance', () => {
      expect(mockAxios.create).toHaveBeenCalled();
    });

    it('should provide configuration access', () => {
      const config = service.getConfig();
      expect(config).toHaveProperty('apiBaseUrl');
      expect(config).toHaveProperty('appId');
      expect(config).toHaveProperty('redirectUri');
    });
  });

  describe('createDesignFromTemplate', () => {
    const mockTemplateId = 'template-123';

    it('should successfully create design from template', async () => {
      const mockResponse: AxiosResponse<any> = {
        data: {
          design: {
            id: 'design-456',
            urls: { edit_url: 'https://canva.com/design/design-456/edit' }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createDesignFromTemplate(mockTemplateId);

      expect(result).toEqual({
        id: 'design-456',
        editUrl: 'https://canva.com/design/design-456/edit',
        exportUrl: null,
        status: 'draft',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      });
    });

    it('should validate template ID parameter', async () => {
      await expect(service.createDesignFromTemplate('')).rejects.toThrow(
        'Template ID is required and must be a string'
      );
    });

    it('should handle API errors', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          data: {
            error: {
              code: 'TEMPLATE_NOT_FOUND',
              message: 'Template not found',
              details: { templateId: mockTemplateId }
            }
          },
          status: 404,
          statusText: 'Not Found',
          headers: {},
          config: {} as any
        }
      };

      mockAxiosInstance.post.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(service.createDesignFromTemplate(mockTemplateId)).rejects.toThrow();
    });
  });

  describe('exportDesign', () => {
    const mockDesignId = 'design-456';

    it('should successfully export design', async () => {
      const mockResponse: AxiosResponse<any> = {
        data: {
          job: {
            id: 'job-789',
            status: 'success',
            result: { url: 'https://canva.com/exports/design-456.pdf' }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.exportDesign(mockDesignId);

      expect(result).toEqual({
        exportUrl: 'https://canva.com/exports/design-456.pdf'
      });
    });

    it('should validate design ID parameter', async () => {
      await expect(service.exportDesign('')).rejects.toThrow(
        'Design ID is required and must be a string'
      );
    });
  });

  describe('createDesignWithAutofill', () => {
    const mockTemplateId = 'template-123';
    const mockAutofillData = {
      title: 'Community Newsletter',
      eventDate: '2025-09-15',
      authorName: 'John Doe',
      content: 'This is the newsletter content'
    };

    it('should successfully create design with autofill', async () => {
      const mockResponse: AxiosResponse<any> = {
        data: {
          design: {
            id: 'design-autofill-789',
            urls: { edit_url: 'https://canva.com/design/design-autofill-789/edit' }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createDesignWithAutofill(mockTemplateId, mockAutofillData);

      expect(result).toEqual({
        designId: 'design-autofill-789',
        editUrl: 'https://canva.com/design/design-autofill-789/edit'
      });

      // Verify correct API call was made
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/designs?autofill=true',
        {
          design_type: 'presentation',
          template_id: mockTemplateId,
          autofill: mockAutofillData
        }
      );
    });

    it('should validate template ID parameter', async () => {
      await expect(service.createDesignWithAutofill('', mockAutofillData)).rejects.toThrow(
        'Template ID is required and must be a string'
      );

      await expect(service.createDesignWithAutofill(null, mockAutofillData)).rejects.toThrow(
        'Template ID is required and must be a string'
      );
    });

    it('should validate autofill data parameter', async () => {
      await expect(service.createDesignWithAutofill(mockTemplateId, null)).rejects.toThrow(
        'Autofill data is required and must be an object'
      );

      await expect(service.createDesignWithAutofill(mockTemplateId, 'invalid')).rejects.toThrow(
        'Autofill data is required and must be an object'
      );
    });

    it('should handle empty autofill data object', async () => {
      const mockResponse: AxiosResponse<any> = {
        data: {
          design: {
            id: 'design-empty-autofill',
            urls: { edit_url: 'https://canva.com/design/design-empty-autofill/edit' }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createDesignWithAutofill(mockTemplateId, {});

      expect(result).toEqual({
        designId: 'design-empty-autofill',
        editUrl: 'https://canva.com/design/design-empty-autofill/edit'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/designs?autofill=true',
        {
          design_type: 'presentation',
          template_id: mockTemplateId,
          autofill: {}
        }
      );
    });

    it('should handle complex autofill data with nested objects', async () => {
      const complexAutofillData = {
        title: 'Event Announcement',
        event: {
          name: 'Community BBQ',
          date: '2025-09-15',
          location: 'Community Center'
        },
        contact: {
          name: 'Event Organizer',
          email: 'organizer@community.com'
        },
        tags: ['community', 'event', 'bbq']
      };

      const mockResponse: AxiosResponse<any> = {
        data: {
          design: {
            id: 'design-complex-autofill',
            urls: { edit_url: 'https://canva.com/design/design-complex-autofill/edit' }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createDesignWithAutofill(mockTemplateId, complexAutofillData);

      expect(result).toEqual({
        designId: 'design-complex-autofill',
        editUrl: 'https://canva.com/design/design-complex-autofill/edit'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/designs?autofill=true',
        {
          design_type: 'presentation',
          template_id: mockTemplateId,
          autofill: complexAutofillData
        }
      );
    });

    it('should handle invalid API response structure', async () => {
      const invalidResponse: AxiosResponse<any> = {
        data: {
          design: {
            // Missing required fields (id and urls.edit_url)
            title: 'Some design'
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      // Mock axios.isAxiosError to return false for this test case
      mockAxios.isAxiosError.mockReturnValue(false);
      mockAxiosInstance.post.mockResolvedValue(invalidResponse);

      await expect(service.createDesignWithAutofill(mockTemplateId, mockAutofillData))
        .rejects.toThrow('Invalid response from Canva API: missing required fields');
    });

    it('should handle Canva API errors with autofill', async () => {
      const mockApiError = {
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'The specified template was not found',
          details: { template_id: mockTemplateId }
        }
      };

      const errorResponse = {
        response: {
          data: mockApiError,
          status: 404,
          statusText: 'Not Found'
        }
      };

      mockAxios.isAxiosError.mockReturnValue(true);
      mockAxiosInstance.post.mockRejectedValue(errorResponse);

      await expect(service.createDesignWithAutofill(mockTemplateId, mockAutofillData))
        .rejects.toThrow(`Failed to create design with autofill from template ${mockTemplateId}: The specified template was not found`);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Canva API error with autofill:',
        expect.objectContaining({
          templateId: mockTemplateId,
          autofillKeys: Object.keys(mockAutofillData),
          code: 'TEMPLATE_NOT_FOUND',
          message: 'The specified template was not found'
        })
      );
    });

    it('should handle HTTP errors with autofill', async () => {
      const httpError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: 'Server error'
        }
      };

      mockAxios.isAxiosError.mockReturnValue(true);
      mockAxiosInstance.post.mockRejectedValue(httpError);

      await expect(service.createDesignWithAutofill(mockTemplateId, mockAutofillData))
        .rejects.toThrow(`Failed to create design with autofill from template ${mockTemplateId}: HTTP 500`);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'HTTP error creating design with autofill:',
        expect.objectContaining({
          templateId: mockTemplateId,
          autofillKeys: Object.keys(mockAutofillData),
          status: 500,
          statusText: 'Internal Server Error'
        })
      );
    });

    it('should handle unexpected errors with autofill', async () => {
      const unexpectedError = new Error('Network timeout');

      mockAxios.isAxiosError.mockReturnValue(false);
      mockAxiosInstance.post.mockRejectedValue(unexpectedError);

      await expect(service.createDesignWithAutofill(mockTemplateId, mockAutofillData))
        .rejects.toThrow(`Failed to create design with autofill from template ${mockTemplateId}: Network timeout`);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected error creating design with autofill:',
        expect.objectContaining({
          templateId: mockTemplateId,
          autofillKeys: Object.keys(mockAutofillData),
          error: unexpectedError
        })
      );
    });

    it('should log autofill keys for debugging without sensitive data', async () => {
      const sensitiveAutofillData = {
        title: 'Public Event',
        email: 'user@example.com', // Potentially sensitive
        phone: '555-1234', // Potentially sensitive
        publicInfo: 'This is public information'
      };

      const mockResponse: AxiosResponse<any> = {
        data: {
          design: {
            id: 'design-sensitive',
            urls: { edit_url: 'https://canva.com/design/design-sensitive/edit' }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await service.createDesignWithAutofill(mockTemplateId, sensitiveAutofillData);

      // Verify that we log keys but not values for security
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating Canva design with autofill:',
        expect.objectContaining({
          templateId: mockTemplateId,
          autofillKeys: ['title', 'email', 'phone', 'publicInfo']
        })
      );

      // Verify we don't log the actual values
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          autofillData: sensitiveAutofillData
        })
      );
    });
  });

  describe('getDesign', () => {
    const mockDesignId = 'design-456';

    it('should successfully retrieve design details', async () => {
      const mockResponse: AxiosResponse<any> = {
        data: {
          design: {
            id: 'design-456',
            title: 'My Design',
            urls: { edit_url: 'https://canva.com/design/design-456/edit' }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getDesign(mockDesignId);

      expect(result).toEqual({
        id: 'design-456',
        editUrl: 'https://canva.com/design/design-456/edit',
        exportUrl: null,
        status: 'draft',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      });
    });

    it('should validate design ID parameter', async () => {
      await expect(service.getDesign('')).rejects.toThrow(
        'Design ID is required and must be a string'
      );
    });
  });
});
