// Debug logging utility for environment-conditional logging
// Use this instead of direct console.log statements

// Environment check function that can be mocked in tests
export const isDev = () => import.meta.env.DEV;

// Factory function to create logger instance with dependency injection
export const createLogger = (envChecker = isDev) => {
  return {
    // Debug messages - only show in development
    debug: (message: string, ...args: unknown[]) => {
      if (envChecker()) {
        console.log(`🐛 [DEBUG] ${message}`, ...args);
      }
    },

    // Info messages - show in development, reduced in production
    info: (message: string, ...args: unknown[]) => {
      if (envChecker()) {
        console.log(`ℹ️ [INFO] ${message}`, ...args);
      } else {
        // In production, only log important info
        console.info(`[INFO] ${message}`, ...args);
      }
    },

    // Warning messages - always show but formatted
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    },

    // Error messages - always show with full context
    error: (message: string, error?: unknown, ...args: unknown[]) => {
      if (error instanceof Error) {
        console.error(`❌ [ERROR] ${message}:`, error.message, error.stack, ...args);
      } else if (error) {
        console.error(`❌ [ERROR] ${message}:`, error, ...args);
      } else {
        console.error(`❌ [ERROR] ${message}`, ...args);
      }
    },

    // Success messages - development only unless critical
    success: (message: string, ...args: unknown[]) => {
      if (envChecker()) {
        console.log(`✅ [SUCCESS] ${message}`, ...args);
      }
      // In production/test environment, this is a no-op but method exists
    },

    // Google Drive specific logging - development only
    drive: (message: string, ...args: unknown[]) => {
      if (envChecker()) {
        console.log(`🔄 [DRIVE] ${message}`, ...args);
      }
      // In production/test environment, this is a no-op but method exists
    },

    // PDF processing logging - development only
    pdf: (message: string, ...args: unknown[]) => {
      if (envChecker()) {
        console.log(`📄 [PDF] ${message}`, ...args);
      }
      // In production/test environment, this is a no-op but method exists
    },

    // Cache operations - development only
    cache: (message: string, ...args: unknown[]) => {
      if (envChecker()) {
        console.log(`🗄️ [CACHE] ${message}`, ...args);
      }
      // In production/test environment, this is a no-op but method exists
    },

    // Authentication logging - development only
    auth: (message: string, ...args: unknown[]) => {
      if (envChecker()) {
        console.log(`🔐 [AUTH] ${message}`, ...args);
      }
      // In production/test environment, this is a no-op but method exists
    },
  };
};

// Default logger instance for backwards compatibility
export const logger = createLogger();

// Legacy function names for easy replacement
export const logDebug = logger.debug;
export const logInfo = logger.info;
export const logWarn = logger.warn;
export const logError = logger.error;
export const logSuccess = logger.success;

export default logger;
