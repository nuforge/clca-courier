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
