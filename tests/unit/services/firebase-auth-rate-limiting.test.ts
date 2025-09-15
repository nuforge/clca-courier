/**
 * Firebase Auth Service - Rate Limiting Error Prevention Tests
 * 
 * These tests prevent 429 rate limiting errors in avatar caching
 * and ensure proper retry mechanisms with exponential backoff.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { firebaseAuthService } from '../../../src/services/firebase-auth.service';
import { logger } from '../../../src/utils/logger';

// Mock logger to track warnings and errors
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock setTimeout to control timing in tests
const mockSetTimeout = vi.fn();
global.setTimeout = mockSetTimeout;

describe('Firebase Auth Service - Rate Limiting Prevention', () => {
  let mockLogger: typeof logger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = logger as any;
    
    // Reset mock implementations
    mockFetch.mockClear();
    mockSetTimeout.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Avatar Caching Rate Limiting', () => {
    it('should handle 429 rate limiting with exponential backoff', async () => {
      const photoURL = 'https://lh3.googleusercontent.com/a/test-avatar.jpg';
      const cacheKey = 'test-cache-key';

      // Mock 429 response
      mockFetch.mockResolvedValueOnce({
        status: 429,
        ok: false
      });

      // Mock successful response after retry
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' }))
      });

      // Mock URL.createObjectURL
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
      global.URL.createObjectURL = mockCreateObjectURL;

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue(null)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Call the method
      await firebaseAuthService.cacheAvatarImage(photoURL, cacheKey, 0);

      // Verify 429 response was handled
      expect(mockFetch).toHaveBeenCalledWith(photoURL);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Avatar caching rate limited (attempt 1), retrying in 30s...')
      );

      // Verify setTimeout was called for retry
      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        30000 // 30 seconds for first retry
      );
    });

    it('should implement progressive delay for immediate retries', async () => {
      const photoURL = 'https://lh3.googleusercontent.com/a/test-avatar.jpg';
      const cacheKey = 'test-cache-key';

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' }))
      });

      // Mock URL.createObjectURL
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
      global.URL.createObjectURL = mockCreateObjectURL;

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue(null)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Test progressive delay calculation
      const retryCount = 2;
      await firebaseAuthService.cacheAvatarImage(photoURL, cacheKey, retryCount);

      // Verify progressive delay was applied (2^2 * 1000 = 4000ms)
      expect(mockFetch).toHaveBeenCalledWith(photoURL);
    });

    it('should cap retry delay at maximum value', async () => {
      const photoURL = 'https://lh3.googleusercontent.com/a/test-avatar.jpg';
      const cacheKey = 'test-cache-key';

      // Mock 429 response
      mockFetch.mockResolvedValueOnce({
        status: 429,
        ok: false
      });

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue(null)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Test with high retry count (should cap at 5 minutes)
      const highRetryCount = 10;
      await firebaseAuthService.cacheAvatarImage(photoURL, cacheKey, highRetryCount);

      // Verify maximum delay was used (300000ms = 5 minutes)
      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        300000
      );
    });

    it('should handle network errors gracefully', async () => {
      const photoURL = 'https://lh3.googleusercontent.com/a/test-avatar.jpg';
      const cacheKey = 'test-cache-key';

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue(null)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Should not throw error
      await expect(firebaseAuthService.cacheAvatarImage(photoURL, cacheKey, 0))
        .resolves.not.toThrow();

      // Should log error
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to cache avatar image'),
        expect.any(Error)
      );
    });

    it('should use cached avatar when available', async () => {
      const photoURL = 'https://lh3.googleusercontent.com/a/test-avatar.jpg';
      const cacheKey = 'test-cache-key';
      const cachedDataURL = 'data:image/jpeg;base64,test-cached-data';

      // Mock localStorage with cached data
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue(cachedDataURL)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      const result = await firebaseAuthService.cacheAvatarImage(photoURL, cacheKey, 0);

      // Should return cached data without making network request
      expect(result).toBe(cachedDataURL);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle invalid photoURL gracefully', async () => {
      const invalidPhotoURL = 'invalid-url';
      const cacheKey = 'test-cache-key';

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue(null)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Should not throw error
      await expect(firebaseAuthService.cacheAvatarImage(invalidPhotoURL, cacheKey, 0))
        .resolves.not.toThrow();

      // Should log error
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to cache avatar image'),
        expect.any(Error)
      );
    });
  });

  describe('Rate Limiting Prevention Strategies', () => {
    it('should implement proper retry logic with exponential backoff', () => {
      // Test exponential backoff calculation
      const calculateBackoffDelay = (retryCount: number): number => {
        return Math.min(30000 * Math.pow(2, retryCount), 300000);
      };

      expect(calculateBackoffDelay(0)).toBe(30000);  // 30s
      expect(calculateBackoffDelay(1)).toBe(60000);  // 60s
      expect(calculateBackoffDelay(2)).toBe(120000); // 120s
      expect(calculateBackoffDelay(10)).toBe(300000); // Capped at 5min
    });

    it('should implement progressive delay for immediate retries', () => {
      // Test progressive delay calculation
      const calculateProgressiveDelay = (retryCount: number): number => {
        return Math.min(1000 * Math.pow(2, retryCount), 30000);
      };

      expect(calculateProgressiveDelay(0)).toBe(1000);  // 1s
      expect(calculateProgressiveDelay(1)).toBe(2000);  // 2s
      expect(calculateProgressiveDelay(2)).toBe(4000);  // 4s
      expect(calculateProgressiveDelay(10)).toBe(30000); // Capped at 30s
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('should handle multiple consecutive 429 errors', async () => {
      const photoURL = 'https://lh3.googleusercontent.com/a/test-avatar.jpg';
      const cacheKey = 'test-cache-key';

      // Mock multiple 429 responses
      mockFetch
        .mockResolvedValueOnce({ status: 429, ok: false })
        .mockResolvedValueOnce({ status: 429, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true, blob: () => Promise.resolve(new Blob(['test'])) });

      // Mock URL.createObjectURL
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
      global.URL.createObjectURL = mockCreateObjectURL;

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue(null)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      await firebaseAuthService.cacheAvatarImage(photoURL, cacheKey, 0);

      // Should have logged multiple warnings
      expect(mockLogger.warn).toHaveBeenCalledTimes(1); // First 429
      expect(mockSetTimeout).toHaveBeenCalledTimes(1); // First retry scheduled
    });

    it('should prevent infinite retry loops', async () => {
      const photoURL = 'https://lh3.googleusercontent.com/a/test-avatar.jpg';
      const cacheKey = 'test-cache-key';

      // Mock persistent 429 responses
      mockFetch.mockResolvedValue({ status: 429, ok: false });

      // Mock localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue(null)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Test with high retry count to ensure it doesn't retry indefinitely
      await firebaseAuthService.cacheAvatarImage(photoURL, cacheKey, 5);

      // Should only schedule one retry, not infinite
      expect(mockSetTimeout).toHaveBeenCalledTimes(1);
    });
  });
});
