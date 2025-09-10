import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the environment variable BEFORE importing the logger
vi.stubGlobal('import.meta', {
  env: {
    DEV: true // Set to true so logger methods actually execute
  }
});

import { logger } from '../../../src/utils/logger';

// Mock console methods to test logging behavior
const originalConsole = { ...console };

describe('Logger Utility', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    vi.restoreAllMocks();
  });

  describe('Logger Methods', () => {
    it('should have all required logger methods', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.success).toBe('function');
      expect(typeof logger.drive).toBe('function');
    });

    it('should call console.warn for warnings', () => {
      logger.warn('Test warning', { data: 'test' });
      expect(console.warn).toHaveBeenCalledWith('⚠️ [WARN] Test warning', { data: 'test' });
    });

    it('should call console.error for errors', () => {
      const error = new Error('Test error');
      logger.error('Test message', error);
      expect(console.error).toHaveBeenCalledWith(
        '❌ [ERROR] Test message:',
        'Test error',
        expect.any(String), // stack trace
      );
    });

    it('should handle error logging without error object', () => {
      logger.error('Simple error message');
      expect(console.error).toHaveBeenCalledWith('❌ [ERROR] Simple error message');
    });

    it('should handle error logging with non-Error objects', () => {
      logger.error('Error with object', { message: 'custom error' });
      expect(console.error).toHaveBeenCalledWith(
        '❌ [ERROR] Error with object:',
        { message: 'custom error' }
      );
    });
  });

  describe('Environment-based Logging', () => {
    it('should format messages with proper prefixes', () => {
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalledWith('⚠️ [WARN] Warning message');
    });

    it('should handle multiple arguments', () => {
      logger.warn('Message', 'arg1', 'arg2', { data: 'test' });
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ [WARN] Message',
        'arg1',
        'arg2',
        { data: 'test' }
      );
    });
  });

  describe('Critical Logger Requirements', () => {
    it('should never throw errors when called', () => {
      // These should all work without throwing
      expect(() => logger.debug('test')).not.toThrow();
      expect(() => logger.info('test')).not.toThrow();
      expect(() => logger.warn('test')).not.toThrow();
      expect(() => logger.error('test')).not.toThrow();
      expect(() => logger.success('test')).not.toThrow();
      expect(() => logger.drive('test')).not.toThrow();
    });

    it('should handle null and undefined arguments safely', () => {
      expect(() => logger.error('test', null)).not.toThrow();
      expect(() => logger.error('test', undefined)).not.toThrow();
      expect(() => logger.warn('test', null, undefined)).not.toThrow();
    });

    it('should handle circular references in objects', () => {
      const circularObj: Record<string, unknown> = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => logger.warn('Circular test', circularObj)).not.toThrow();
    });
  });
});
