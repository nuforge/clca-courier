// Debug logging utility for environment-conditional logging
// Use this instead of direct console.log statements

const isDevelopment = import.meta.env.DEV;

export const logger = {
  // Debug messages - only show in development
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  },

  // Info messages - show in development, reduced in production
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
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
    if (isDevelopment) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  },

  // Google Drive specific logging - development only
  drive: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🔄 [DRIVE] ${message}`, ...args);
    }
  },

  // PDF processing logging - development only
  pdf: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`📄 [PDF] ${message}`, ...args);
    }
  },

  // Cache operations - development only
  cache: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🗄️ [CACHE] ${message}`, ...args);
    }
  },

  // Authentication logging - development only
  auth: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🔐 [AUTH] ${message}`, ...args);
    }
  },
};

// Legacy function names for easy replacement
export const logDebug = logger.debug;
export const logInfo = logger.info;
export const logWarn = logger.warn;
export const logError = logger.error;
export const logSuccess = logger.success;

export default logger;
