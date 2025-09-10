import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the environment check function BEFORE importing logger
vi.mock('../../../src/utils/logger', async () => {
  const actual = await vi.importActual('../../../src/utils/logger') as any;
  return {
    ...actual,
    isDev: vi.fn(() => true), // Mock as development environment
    createLogger: actual.createLogger,
  };
});

// Don't import at top level - use dynamic imports in tests
// import { createLogger, isDev } from '../../../src/utils/logger';

describe('Logger Utility', () => {
  // Spy on console methods
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let logger: any;
  let createLogger: any;
  let isDev: any;

  beforeEach(async () => {
    // Import the mocked module AFTER mock setup - this is key for proper mocking
    const loggerModule = await import('../../../src/utils/logger');
    createLogger = loggerModule.createLogger;
    isDev = loggerModule.isDev;

    // Create fresh spies for each test
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    // Reset the isDev mock to default behavior for each test
    vi.mocked(isDev).mockReturnValue(true); // Default to development mode

    // Create logger instance for testing
    logger = createLogger();

    // Clear all spy call histories
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
      expect(typeof logger.pdf).toBe('function');
      expect(typeof logger.cache).toBe('function');
      expect(typeof logger.auth).toBe('function');
    });

    it('should call console.warn for warnings', () => {
      logger.warn('Test warning', { data: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ [WARN] Test warning', { data: 'test' });
    });

    it('should call console.log for success messages in development', async () => {
      // Import fresh module instance
      const loggerModule = await import('../../../src/utils/logger');

      // Mock isDev to return true for this test
      vi.mocked(loggerModule.isDev).mockReturnValue(true);
      const devLogger = loggerModule.createLogger();

      devLogger.success('Test success', { data: 'test' });
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ [SUCCESS] Test success', { data: 'test' });
    });

    it('should call console.log for drive messages in development', async () => {
      // Import fresh module instance
      const loggerModule = await import('../../../src/utils/logger');

      // Mock isDev to return true for this test
      vi.mocked(loggerModule.isDev).mockReturnValue(true);
      const devLogger = loggerModule.createLogger();

      devLogger.drive('Test drive operation', { file: 'test.pdf' });
      expect(consoleLogSpy).toHaveBeenCalledWith('🔄 [DRIVE] Test drive operation', { file: 'test.pdf' });
    });

    it('should call console.error for errors', () => {
      const error = new Error('Test error');
      logger.error('Test message', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [ERROR] Test message:',
        'Test error',
        error.stack
      );
    });

    it('should handle error logging without error object', () => {
      logger.error('Simple error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ [ERROR] Simple error message');
    });

    it('should handle error logging with non-Error objects', () => {
      logger.error('Error with object', { message: 'custom error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ [ERROR] Error with object:',
        { message: 'custom error' }
      );
    });
  });

  describe('Environment-based Logging', () => {
    it('should format messages with proper prefixes', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ [WARN] Warning message');
    });

    it('should handle multiple arguments', () => {
      logger.warn('Message', 'arg1', 'arg2', { data: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ [WARN] Message',
        'arg1',
        'arg2',
        { data: 'test' }
      );
    });

    it('should not call console methods for development-only functions in production environment', () => {
      // Create a mock environment checker that returns false (production)
      const mockEnvChecker = vi.fn(() => false);

      // Create logger with production environment dependency injection
      const prodLogger = createLogger(mockEnvChecker);

      // Clear ONLY console spies
      consoleLogSpy.mockClear();
      consoleWarnSpy.mockClear();
      consoleErrorSpy.mockClear();

      // Test that development-only methods don't log in production environment
      prodLogger.debug('Debug message');
      prodLogger.success('Success message');
      prodLogger.drive('Drive message');
      prodLogger.pdf('PDF message');
      prodLogger.cache('Cache message');
      prodLogger.auth('Auth message');

      // Verify the environment checker was called
      expect(mockEnvChecker).toHaveBeenCalledTimes(6);

      // None of these should have called console.log since envChecker returns false
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });    it('should call console methods for development-only functions in development environment', async () => {
      // Import fresh module instance
      const loggerModule = await import('../../../src/utils/logger');

      // Create a mock environment checker that returns true (development)
      const mockEnvChecker = vi.fn(() => true);

      // Create logger with development environment dependency injection
      const devLogger = createLogger(mockEnvChecker);

      // Clear previous calls AFTER creating the logger
      vi.clearAllMocks();

      devLogger.debug('Debug message');
      devLogger.success('Success message');
      devLogger.drive('Drive message');
      devLogger.pdf('PDF message');
      devLogger.cache('Cache message');
      devLogger.auth('Auth message');

      // All of these should have called console.log since DEV=true
      expect(consoleLogSpy).toHaveBeenCalledTimes(6);
      expect(consoleLogSpy).toHaveBeenCalledWith('🐛 [DEBUG] Debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ [SUCCESS] Success message');
      expect(consoleLogSpy).toHaveBeenCalledWith('🔄 [DRIVE] Drive message');
      expect(consoleLogSpy).toHaveBeenCalledWith('📄 [PDF] PDF message');
      expect(consoleLogSpy).toHaveBeenCalledWith('🗄️ [CACHE] Cache message');
      expect(consoleLogSpy).toHaveBeenCalledWith('🔐 [AUTH] Auth message');
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
