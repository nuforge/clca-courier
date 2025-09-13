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
  CanvaAutofillDesignResponse,
  CanvaExportResponse,
  CanvaGetDesignResponse
} from './canva/types';
import { isCanvaApiError } from './canva/types';

/**
 * Canva API Service Class
 *
 * Handles all interactions with the Canva Connect API including design creation,
 * export functionality, and design retrieval with comprehensive error handling,
 * retry logic, and rate limiting.
 */
export class CanvaApiService {
  private readonly axiosInstance: AxiosInstance;
  private readonly config: CanvaConfig;
  private readonly rateLimitState: {
    requestCount: number;
    windowStart: number;
    maxRequestsPerMinute: number;
  };
  private readonly retryConfig: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  private accessToken: string | null = null;

  constructor() {
    // Load configuration from environment variables following project patterns
    this.config = {
      apiBaseUrl: import.meta.env.VITE_CANVA_API_BASE_URL || 'https://api.canva.com/rest/v1',
      clientId: import.meta.env.VITE_CANVA_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_CANVA_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_CANVA_API_REDIRECT_URI || ''
    };

    // Initialize rate limiting state
    this.rateLimitState = {
      requestCount: 0,
      windowStart: Date.now(),
      maxRequestsPerMinute: 100 // Conservative limit for Canva API
    };

    // Configure retry behavior
    this.retryConfig = {
      maxRetries: 3,
      baseDelayMs: 1000, // 1 second base delay
      maxDelayMs: 30000  // 30 second max delay
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

    // Add request interceptor for authentication and rate limiting
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Apply rate limiting
        await this.checkRateLimit();

        // Add OAuth token if available
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        logger.debug('Canva API request:', {
          method: config.method,
          url: config.url,
          hasAuth: !!config.headers.Authorization
        });
        return config;
      },
      (error) => {
        logger.error('Canva API request error:', error);
        throw error instanceof Error ? error : new Error(String(error));
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
        throw error instanceof Error ? error : new Error(String(error));
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
    if (!this.config.clientId) {
      missingConfig.push('VITE_CANVA_CLIENT_ID');
    }
    // clientSecret is not required in browser when using PKCE
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
   * Check and enforce rate limits
   * @private
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute window

    // Reset window if needed
    if (now - this.rateLimitState.windowStart >= windowDuration) {
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.windowStart = now;
    }

    // Check if we're at the limit
    if (this.rateLimitState.requestCount >= this.rateLimitState.maxRequestsPerMinute) {
      const waitTime = windowDuration - (now - this.rateLimitState.windowStart);
      logger.warn('Rate limit exceeded, waiting:', { waitTimeMs: waitTime });

      // Wait until the window resets
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Reset for new window
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.windowStart = Date.now();
    }

    // Increment request count
    this.rateLimitState.requestCount++;
  }

  /**
   * Execute API request with retry logic
   * @private
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            this.retryConfig.baseDelayMs * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelayMs
          );
          logger.info(`Retrying ${operationName} (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}) after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        return await operation();

      } catch (error) {
        lastError = error;

        // Don't retry on certain error types
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          // Don't retry on client errors (4xx) except rate limit (429)
          if (status && status >= 400 && status < 500 && status !== 429) {
            logger.error(`${operationName} failed with non-retryable error:`, { status, attempt: attempt + 1 });
            throw error;
          }

          // Don't retry on authentication errors
          if (status === 401 || status === 403) {
            logger.error(`${operationName} failed with authentication error:`, { status, attempt: attempt + 1 });
            throw error;
          }
        }

        logger.warn(`${operationName} attempt ${attempt + 1} failed:`, {
          error: error instanceof Error ? error.message : String(error),
          willRetry: attempt < this.retryConfig.maxRetries
        });
      }
    }

    // All retries exhausted
    logger.error(`${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts`);
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
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

    return this.executeWithRetry(async () => {
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

    }, `createDesignFromTemplate(${templateId})`).catch((error) => {
      const errorMessage = `Failed to create design from template ${templateId}`;

      if (axios.isAxiosError(error)) {
        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data;
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
    });
  }

  /**
   * Create a new design from a template with autofill data
   *
   * @param templateId - The ID of the Canva Brand Template to use
   * @param autofillData - Key-value pairs for autofilling template placeholders
   * @returns Promise resolving to design ID and edit URL
   * @throws Error if the API call fails or returns invalid data
   */
  async createDesignWithAutofill(
    templateId: string,
    autofillData: Record<string, unknown>
  ): Promise<{ designId: string; editUrl: string }> {
    if (!templateId || typeof templateId !== 'string') {
      const error = new Error('Template ID is required and must be a string');
      logger.error('Invalid template ID provided for autofill:', { templateId });
      throw error;
    }

    if (!autofillData || typeof autofillData !== 'object') {
      const error = new Error('Autofill data is required and must be an object');
      logger.error('Invalid autofill data provided:', { autofillData });
      throw error;
    }

    // Validate and sanitize autofill data for security
    const sanitizedAutofillData = this.sanitizeAutofillData(autofillData);

    logger.info('Creating Canva design with autofill:', {
      templateId,
      autofillKeys: Object.keys(sanitizedAutofillData)
    });

    return this.executeWithRetry(async () => {
      // Structure request according to Canva's Autofill API documentation
      const requestBody = {
        design_type: 'presentation', // Default to presentation type
        template_id: templateId,
        autofill: sanitizedAutofillData
      };

      const response: AxiosResponse<CanvaAutofillDesignResponse> = await this.axiosInstance.post(
        '/designs?autofill=true',
        requestBody
      );

      // Validate response structure
      if (!response.data?.design?.id || !response.data?.design?.urls?.edit_url) {
        logger.error('Invalid response from Canva Autofill API:', { response: response.data });
        throw new Error('Invalid response from Canva API: missing required fields');
      }

      const design = response.data.design;

      logger.success('Canva design created with autofill successfully:', {
        designId: design.id,
        templateId,
        editUrl: design.urls.edit_url
      });

      return {
        designId: design.id,
        editUrl: design.urls.edit_url
      };

    }, `createDesignWithAutofill(${templateId})`).catch((error) => {
      const errorMessage = `Failed to create design with autofill from template ${templateId}`;

      if (axios.isAxiosError(error)) {
        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data;
          logger.error('Canva API error with autofill:', {
            templateId,
            autofillKeys: Object.keys(sanitizedAutofillData),
            code: canvaError.error.code,
            message: canvaError.error.message,
            details: canvaError.error.details
          });
          throw new Error(`${errorMessage}: ${canvaError.error.message}`);
        } else {
          logger.error('HTTP error creating design with autofill:', {
            templateId,
            autofillKeys: Object.keys(sanitizedAutofillData),
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          throw new Error(`${errorMessage}: HTTP ${error.response?.status}`);
        }
      } else {
        logger.error('Unexpected error creating design with autofill:', {
          templateId,
          autofillKeys: Object.keys(sanitizedAutofillData),
          error
        });
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Sanitize autofill data to prevent injection attacks
   * @private
   */
  private sanitizeAutofillData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Validate key
      if (typeof key !== 'string' || key.length === 0 || key.length > 100) {
        logger.warn('Invalid autofill key skipped:', { key });
        continue;
      }

      // Sanitize value based on type
      if (typeof value === 'string') {
        // Remove potentially harmful content
        const sanitizedValue = value
          .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocols
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();

        if (sanitizedValue.length <= 10000) { // Reasonable length limit
          sanitized[key] = sanitizedValue;
        } else {
          logger.warn('Autofill value too long, truncated:', { key, originalLength: value.length });
          sanitized[key] = sanitizedValue.substring(0, 10000);
        }
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        sanitized[key] = '';
      } else {
        // For other types, convert to string and sanitize
        logger.info('Converting autofill value to string:', { key, type: typeof value });
        let stringValue: string;

        if (typeof value === 'object' && value !== null) {
          // Handle objects by converting to JSON
          stringValue = JSON.stringify(value);
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          // Handle primitives that have reliable toString()
          stringValue = String(value);
        } else {
          // Handle edge cases (functions, symbols, etc.) safely
          stringValue = `[${typeof value}]`;
        }

        sanitized[key] = stringValue.substring(0, 1000); // Shorter limit for converted values
      }
    }

    return sanitized;
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

    return this.executeWithRetry(async () => {
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

    }, `exportDesign(${designId})`).catch((error) => {
      const errorMessage = `Failed to export design ${designId}`;

      if (axios.isAxiosError(error)) {
        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data;
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
    });
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

    return this.executeWithRetry(async () => {
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

    }, `getDesign(${designId})`).catch((error) => {
      const errorMessage = `Failed to retrieve design ${designId}`;

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.warn('Design not found:', { designId });
          throw new Error(`Design ${designId} not found`);
        }

        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data;
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
    });
  }

  /**
   * Get user's designs from Canva
   * @returns Array of user's designs
   */
  async getTemplates(): Promise<Array<{ id: string; title: string; thumbnailUrl?: string }>> {
    logger.info('Fetching user designs from Canva');

    return this.executeWithRetry(async () => {
      // Use the correct Canva API endpoint for listing designs
      const response = await this.axiosInstance.get('/designs');
      logger.info('Designs endpoint response:', { data: response.data });

      // Handle the actual Canva API response structure
      let designs: Record<string, unknown>[] = [];

      if (response.data.items) {
        designs = response.data.items;
      } else if (response.data.designs) {
        designs = response.data.designs;
      } else if (response.data.data) {
        designs = response.data.data;
      } else if (Array.isArray(response.data)) {
        designs = response.data;
      } else {
        logger.warn('Unexpected response structure:', response.data);
        designs = [];
      }

      logger.info('Designs fetched successfully', { count: designs.length });

      // Transform designs to match expected template format
      return designs.map((design: Record<string, unknown>) => {
        const result: { id: string; title: string; thumbnailUrl?: string } = {
          id: design.id as string,
          title: (design.title as string) || 'Untitled Design'
        };

        // Handle thumbnail from Canva API structure
        if (design.thumbnail && typeof design.thumbnail === 'object' && design.thumbnail !== null) {
          const thumbnail = design.thumbnail as Record<string, unknown>;
          if (thumbnail.url) {
            result.thumbnailUrl = thumbnail.url as string;
          }
        }

        return result;
      });
    }, 'getTemplates()').catch((error) => {
      const errorMessage = 'Failed to fetch designs';

      if (axios.isAxiosError(error)) {
        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data;
          logger.error('Canva API error fetching designs:', {
            code: canvaError.error.code,
            message: canvaError.error.message,
            details: canvaError.error.details
          });
          throw new Error(`${errorMessage}: ${canvaError.error.message}`);
        } else {
          logger.error('HTTP error fetching designs:', {
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          throw new Error(`${errorMessage}: HTTP ${error.response?.status}`);
        }
      } else {
        logger.error('Unexpected error fetching designs:', { error });
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Create a simple test design to verify API connectivity
   * @returns Design creation result
   */
  async createTestDesign(): Promise<{ id: string; editUrl: string }> {
    logger.info('Creating test design to verify API connectivity');

    return this.executeWithRetry(async () => {
      const response: AxiosResponse<CanvaCreateDesignResponse> = await this.axiosInstance.post(
        '/designs',
        {
          design_type: 'presentation',
          // Don't specify template_id to create a blank design
        }
      );

      logger.info('Test design created successfully', { designId: response.data.design.id });

      return {
        id: response.data.design.id,
        editUrl: response.data.design.urls.edit_url
      };
    }, 'createTestDesign()').catch((error) => {
      const errorMessage = 'Failed to create test design';

      if (axios.isAxiosError(error)) {
        if (isCanvaApiError(error.response?.data)) {
          const canvaError = error.response.data;
          logger.error('Canva API error creating test design:', {
            code: canvaError.error.code,
            message: canvaError.error.message,
            details: canvaError.error.details
          });
          throw new Error(`${errorMessage}: ${canvaError.error.message}`);
        } else {
          logger.error('HTTP error creating test design:', {
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          throw new Error(`${errorMessage}: HTTP ${error.response?.status}`);
        }
      } else {
        logger.error('Unexpected error creating test design:', { error });
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Set the access token for API authentication
   * @param token The OAuth access token
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
    logger.info('Canva API access token updated', { hasToken: !!token });
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
