/**
 * Content Sanitization Utility
 * XSS prevention and input validation for user-generated content
 */

import DOMPurify from 'dompurify';
import { logger } from './logger';

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  allowedTags?: readonly string[];
  allowedAttributes?: readonly string[];
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

/**
 * Default sanitization configuration for different content types
 */
export const SANITIZATION_CONFIGS = {
  // For titles - no HTML allowed
  TITLE: {
    allowHtml: false,
    maxLength: 200,
    allowedTags: [],
    allowedAttributes: []
  } as SanitizationOptions,

  // For general content - safe HTML only
  CONTENT: {
    allowHtml: true,
    maxLength: 50000,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: ['href', 'title', 'target']
  } as SanitizationOptions,

  // For metadata fields - no HTML
  METADATA: {
    allowHtml: false,
    maxLength: 1000,
    allowedTags: [],
    allowedAttributes: []
  } as SanitizationOptions,

  // For location fields - no HTML
  LOCATION: {
    allowHtml: false,
    maxLength: 500,
    allowedTags: [],
    allowedAttributes: []
  } as SanitizationOptions
} as const;

/**
 * Sanitize and validate user input to prevent XSS attacks
 */
export function sanitizeAndValidate(
  input: string | undefined | null,
  options: SanitizationOptions = SANITIZATION_CONFIGS.CONTENT
): ValidationResult {
  const errors: string[] = [];

  // Handle null/undefined input
  if (input === null || input === undefined) {
    return {
      isValid: true,
      sanitizedValue: '',
      errors: []
    };
  }

  // Convert to string if not already
  const stringInput = String(input);

  // Check length before sanitization
  if (options.maxLength && stringInput.length > options.maxLength) {
    errors.push(`Input exceeds maximum length of ${options.maxLength} characters`);
  }

  let sanitizedValue: string;

  if (options.allowHtml) {
    // Configure DOMPurify for HTML content
    const purifyConfig: { [key: string]: unknown } = {};

    if (options.allowedTags && options.allowedTags.length > 0) {
      purifyConfig.ALLOWED_TAGS = [...options.allowedTags];
    }

    if (options.allowedAttributes && options.allowedAttributes.length > 0) {
      purifyConfig.ALLOWED_ATTR = [...options.allowedAttributes];
    }

    // Sanitize HTML content
    sanitizedValue = DOMPurify.sanitize(stringInput, purifyConfig);

    logger.debug('HTML content sanitized:', {
      original: stringInput.substring(0, 100) + (stringInput.length > 100 ? '...' : ''),
      sanitized: sanitizedValue.substring(0, 100) + (sanitizedValue.length > 100 ? '...' : ''),
      removed: stringInput.length - sanitizedValue.length > 0
    });
  } else {
    // Strip all HTML tags for non-HTML fields
    sanitizedValue = DOMPurify.sanitize(stringInput, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    // Also remove any remaining HTML entities
    sanitizedValue = sanitizedValue
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  }

  // Trim whitespace
  sanitizedValue = sanitizedValue.trim();

  // Check if sanitization removed malicious content
  if (stringInput !== sanitizedValue) {
    logger.warn('Potentially malicious content detected and sanitized:', {
      originalLength: stringInput.length,
      sanitizedLength: sanitizedValue.length,
      contentType: options.allowHtml ? 'HTML' : 'text'
    });
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue,
    errors
  };
}

/**
 * Sanitize content title (no HTML allowed)
 */
export function sanitizeTitle(title: string | undefined | null): ValidationResult {
  return sanitizeAndValidate(title, SANITIZATION_CONFIGS.TITLE);
}

/**
 * Sanitize HTML content (safe HTML tags allowed)
 */
export function sanitizeContent(content: string | undefined | null): ValidationResult {
  return sanitizeAndValidate(content, SANITIZATION_CONFIGS.CONTENT);
}

/**
 * Sanitize metadata fields (no HTML allowed)
 */
export function sanitizeMetadata(metadata: string | undefined | null): ValidationResult {
  return sanitizeAndValidate(metadata, SANITIZATION_CONFIGS.METADATA);
}

/**
 * Sanitize location field (no HTML allowed)
 */
export function sanitizeLocation(location: string | undefined | null): ValidationResult {
  return sanitizeAndValidate(location, SANITIZATION_CONFIGS.LOCATION);
}

/**
 * Validate and sanitize an entire object's string properties
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldConfigs: Partial<Record<keyof T, SanitizationOptions>> = {}
): { sanitizedObject: T; errors: Record<string, string[]> } {
  const sanitizedObject = { ...obj };
  const errors: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const config = fieldConfigs[key as keyof T] || SANITIZATION_CONFIGS.METADATA;
      const result = sanitizeAndValidate(value, config);

      sanitizedObject[key as keyof T] = result.sanitizedValue as T[keyof T];

      if (result.errors.length > 0) {
        errors[key] = result.errors;
      }
    }
  }

  return { sanitizedObject, errors };
}

/**
 * Check if a string contains potentially dangerous content
 */
export function containsMaliciousContent(input: string): boolean {
  // Common XSS patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<form\b/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Security utility to detect and log suspicious input attempts
 */
export function logSecurityEvent(
  event: 'xss_attempt' | 'injection_attempt' | 'malicious_upload',
  details: Record<string, unknown>
): void {
  logger.warn(`Security event detected: ${event}`, {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    ...details
  });

  // In a production environment, you might want to send this to a security monitoring service
  // Example: securityMonitoringService.reportEvent(event, details);
}
