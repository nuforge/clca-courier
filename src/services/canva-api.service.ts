/**
 * Canva API Service
 *
 * Service layer for interacting with Canva Connect API following
 * CLCA Courier architectural patterns and TypeScript standards.
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { Timestamp } from 'firebase/firestore';
import { logger } from '../utils/logger';
import type {
  CanvaDesign,
  CanvaConfig,
  CanvaCreateDesignResponse,
  CanvaExportResponse,
  CanvaGetDesignResponse,
  CanvaApiError
} from './canva/types';
import { isCanvaApiError } from './canva/types';

/**
 * Canva API Service Class
 *
 * Handles all interactions with the Canva Connect API including design creation,
 * export functionality, and design retrieval with comprehensive error handling.
 */
export class CanvaApiService {
  private readonly axiosInstance: AxiosInstance;
  private readonly config: CanvaConfig;

  constructor() {
    // Load configuration from environment variables following project patterns
    this.config = {
      apiBaseUrl: import.meta.env.VITE_CANVA_API_BASE_URL || 'https://api.canva.com/rest/v1',
      appId: import.meta.env.VITE_CANVA_APP_ID || '',
      redirectUri: import.meta.env.VITE_CANVA_API_REDIRECT_URI || ''
    };

    // Validate required configuration
    this.validateConfiguration();

    // Create dedicated Axios instance for Canva API
    this.axiosInstance = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: 30000, // 30 second timeout for API calls
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // TODO: Add OAuth token to headers when authentication is implemented
        // config.headers.Authorization = `Bearer ${accessToken}`;
        logger.debug('Canva API request:', {
          method: config.method,
          url: config.url,
          hasAuth: !!config.headers.Authorization
        });
        return config;
      },
      (error) => {
        logger.error('Canva API request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug('Canva API response:', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('Canva API response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );

    logger.info('Canva API Service initialized');
  }

  /**
   * Validate required configuration values
   * @private
   */
  private validateConfiguration(): void {
    const missingConfig: string[] = [];

    if (!this.config.apiBaseUrl) {
      missingConfig.push('VITE_CANVA_API_BASE_URL');
    }
    if (!this.config.appId) {
      missingConfig.push('VITE_CANVA_APP_ID');
    }
    if (!this.config.redirectUri) {
      missingConfig.push('VITE_CANVA_API_REDIRECT_URI');
    }

    if (missingConfig.length > 0) {
      const errorMessage = `Missing required Canva API configuration: ${missingConfig.join(', ')}`;
      logger.error('Canva API configuration error:', { missingConfig });
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new design from a template
   *
   * @param templateId - The ID of the Canva template to use
   * @returns Promise resolving to a CanvaDesign object
   * @throws Error if the API call fails or returns invalid data
   */
  async createDesignFromTemplate(templateId: string): Promise<CanvaDesign> {
    if (!templateId || typeof templateId !== 'string') {
      const error = new Error('Template ID is required and must be a string');
      logger.error('Invalid template ID provided:', { templateId });
      throw error;
    }

    logger.info('Creating Canva design from template:', { templateId });

    try {
      const response: AxiosResponse<CanvaCreateDesignResponse> = await this.axiosInstance.post(
        '/designs',
        {
          design_type: 'presentation', // Default to presentation type
          template_id: templateId
        }
      );

      // Validate response structure
      if (!response.data?.design?.id || !response.data?.design?.urls?.edit_url) {
        logger.error('Invalid response from Canva API:', { response: response.data });
        throw new Error('Invalid response from Canva API: missing required fields');
      }

      const apiDesign = response.data.design;
      const now = Timestamp.now();

      // Transform API response to our CanvaDesign interface
      const canvaDesign: CanvaDesign = {
        id: apiDesign.id,
        editUrl: apiDesign.urls.edit_url,
        exportUrl: null, // Will be set when exported
        status: 'draft',
        createdAt: now,
        updatedAt: now
      };

      logger.success('Canva design created successfully:', {
        designId: canvaDesign.id,
        templateId
      });

      return canvaDesign;

    } catch (error) {
      const errorMessage = `Failed to create design from template ${templateId}`;

      if (axios.isAxiosError(error)) {
        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data as CanvaApiError;
          logger.error('Canva API error:', {
            templateId,
            code: canvaError.error.code,
            message: canvaError.error.message,
            details: canvaError.error.details
          });
          throw new Error(`${errorMessage}: ${canvaError.error.message}`);
        } else {
          logger.error('HTTP error creating design:', {
            templateId,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          throw new Error(`${errorMessage}: HTTP ${error.response?.status}`);
        }
      } else {
        logger.error('Unexpected error creating design:', { templateId, error });
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Export a design for download
   *
   * @param designId - The ID of the design to export
   * @returns Promise resolving to an object containing the export URL
   * @throws Error if the API call fails or export is not ready
   */
  async exportDesign(designId: string): Promise<{ exportUrl: string }> {
    if (!designId || typeof designId !== 'string') {
      const error = new Error('Design ID is required and must be a string');
      logger.error('Invalid design ID provided:', { designId });
      throw error;
    }

    logger.info('Exporting Canva design:', { designId });

    try {
      const response: AxiosResponse<CanvaExportResponse> = await this.axiosInstance.post(
        `/designs/${designId}/export`,
        {
          format: 'pdf',
          quality: 'standard'
        }
      );

      // Validate response structure
      if (!response.data?.job?.id) {
        logger.error('Invalid export response from Canva API:', { response: response.data });
        throw new Error('Invalid response from Canva API: missing job ID');
      }

      const job = response.data.job;

      // Check if export is immediately ready
      if (job.status === 'success' && job.result?.url) {
        logger.success('Canva design export ready immediately:', {
          designId,
          exportUrl: job.result.url
        });
        return { exportUrl: job.result.url };
      }

      // Handle in-progress exports
      if (job.status === 'in_progress') {
        logger.info('Canva design export in progress:', { designId, jobId: job.id });
        throw new Error('Export is still in progress. Please check back later.');
      }

      // Handle failed exports
      if (job.status === 'failed') {
        logger.error('Canva design export failed:', { designId, jobId: job.id });
        throw new Error('Design export failed. Please try again.');
      }

      // Fallback for unexpected status
      logger.warn('Unexpected export status:', { designId, status: job.status });
      throw new Error(`Export status: ${job.status}. Please try again later.`);

    } catch (error) {
      const errorMessage = `Failed to export design ${designId}`;

      if (axios.isAxiosError(error)) {
        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data as CanvaApiError;
          logger.error('Canva API error during export:', {
            designId,
            code: canvaError.error.code,
            message: canvaError.error.message,
            details: canvaError.error.details
          });
          throw new Error(`${errorMessage}: ${canvaError.error.message}`);
        } else {
          logger.error('HTTP error exporting design:', {
            designId,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          throw new Error(`${errorMessage}: HTTP ${error.response?.status}`);
        }
      } else {
        logger.error('Unexpected error exporting design:', { designId, error });
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Get design details and metadata
   *
   * @param designId - The ID of the design to retrieve
   * @returns Promise resolving to a CanvaDesign object with current data
   * @throws Error if the API call fails or design is not found
   */
  async getDesign(designId: string): Promise<CanvaDesign> {
    if (!designId || typeof designId !== 'string') {
      const error = new Error('Design ID is required and must be a string');
      logger.error('Invalid design ID provided:', { designId });
      throw error;
    }

    logger.info('Retrieving Canva design:', { designId });

    try {
      const response: AxiosResponse<CanvaGetDesignResponse> = await this.axiosInstance.get(
        `/designs/${designId}`
      );

      // Validate response structure
      if (!response.data?.design?.id || !response.data?.design?.urls?.edit_url) {
        logger.error('Invalid design response from Canva API:', { response: response.data });
        throw new Error('Invalid response from Canva API: missing required fields');
      }

      const apiDesign = response.data.design;
      const now = Timestamp.now();

      // Transform API response to our CanvaDesign interface
      const canvaDesign: CanvaDesign = {
        id: apiDesign.id,
        editUrl: apiDesign.urls.edit_url,
        exportUrl: null, // Not provided in design details
        status: 'draft', // Default status, would need separate call to get export status
        createdAt: now, // Would need to be stored elsewhere for real creation time
        updatedAt: now
      };

      logger.success('Canva design retrieved successfully:', { designId });

      return canvaDesign;

    } catch (error) {
      const errorMessage = `Failed to retrieve design ${designId}`;

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.warn('Design not found:', { designId });
          throw new Error(`Design ${designId} not found`);
        }

        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data as CanvaApiError;
          logger.error('Canva API error retrieving design:', {
            designId,
            code: canvaError.error.code,
            message: canvaError.error.message,
            details: canvaError.error.details
          });
          throw new Error(`${errorMessage}: ${canvaError.error.message}`);
        } else {
          logger.error('HTTP error retrieving design:', {
            designId,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          throw new Error(`${errorMessage}: HTTP ${error.response?.status}`);
        }
      } else {
        logger.error('Unexpected error retrieving design:', { designId, error });
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Get the current configuration
   * @returns The current Canva API configuration
   */
  getConfig(): CanvaConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const canvaApiService = new CanvaApiService();
export default canvaApiService;
