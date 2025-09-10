/**
 * NEWSLETTER BUSINESS RULE VALIDATION UTILITY
 * Enforces strict business rules and prevents invalid data from entering the system
 */

import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate newsletter date format and business rules
 */
export function validateNewsletterDate(dateString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dateString) {
    errors.push('Publication date is required');
    return { isValid: false, errors, warnings };
  }

  // Check ISO format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    errors.push('Date must be in YYYY-MM-DD format');
    return { isValid: false, errors, warnings };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    errors.push('Invalid date value');
    return { isValid: false, errors, warnings };
  }

  // Business rules: reasonable date range
  const minDate = new Date('2000-01-01');
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1); // Allow 1 year in future

  if (date < minDate) {
    errors.push('Publication date cannot be before year 2000');
  }

  if (date > maxDate) {
    errors.push('Publication date cannot be more than 1 year in the future');
  }

  // Warning for dates more than 6 months in future
  const warningDate = new Date();
  warningDate.setMonth(warningDate.getMonth() + 6);
  if (date > warningDate) {
    warnings.push('Publication date is more than 6 months in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate PDF file format and constraints
 */
export function validatePdfFile(filename: string, fileSize?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!filename) {
    errors.push('Filename is required');
    return { isValid: false, errors, warnings };
  }

  // Must be PDF file
  if (!filename.toLowerCase().endsWith('.pdf')) {
    errors.push('File must be a PDF document (.pdf extension required)');
  }

  // Filename pattern validation (should follow naming conventions)
  const validFilenameRegex = /^[a-zA-Z0-9_-]+\.pdf$/;
  if (!validFilenameRegex.test(filename)) {
    warnings.push('Filename should only contain letters, numbers, hyphens, and underscores');
  }

  // File size validation if provided
  if (fileSize !== undefined) {
    const minSize = 1024; // 1KB minimum
    const maxSize = 100 * 1024 * 1024; // 100MB maximum
    const warningSize = 50 * 1024 * 1024; // 50MB warning threshold

    if (fileSize < minSize) {
      errors.push('File size must be at least 1KB');
    }

    if (fileSize > maxSize) {
      errors.push('File size cannot exceed 100MB');
    }

    if (fileSize > warningSize && fileSize <= maxSize) {
      warnings.push('Large file size (>50MB) may cause performance issues');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate page count constraints
 */
export function validatePageCount(pageCount: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (pageCount === undefined || pageCount === null) {
    errors.push('Page count is required');
    return { isValid: false, errors, warnings };
  }

  if (!Number.isInteger(pageCount)) {
    errors.push('Page count must be a whole number');
  }

  if (pageCount < 1) {
    errors.push('Page count must be at least 1');
  }

  if (pageCount > 500) {
    errors.push('Page count cannot exceed 500 pages');
  }

  // Warning for unusually high page counts
  if (pageCount > 100) {
    warnings.push('High page count (>100) may indicate processing issues');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate newsletter title and content constraints
 */
export function validateNewsletterContent(title: string, description?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (!title || !title.trim()) {
    errors.push('Title is required and cannot be empty');
  } else {
    if (title.length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if (title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    // Check for reasonable title content
    const suspiciousPatterns = [
      /^[^a-zA-Z]*$/, // No letters at all
      /^(test|temp|untitled|draft)$/i, // Common placeholder titles
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(title.trim())) {
        warnings.push('Title appears to be a placeholder or test value');
        break;
      }
    }
  }

  // Description validation (optional but if provided should be reasonable)
  if (description !== undefined) {
    if (description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    if (description.trim().length > 0 && description.trim().length < 10) {
      warnings.push('Description is very short (less than 10 characters)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive newsletter validation
 */
export function validateNewsletter(newsletterData: Record<string, unknown>): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Extract fields with proper type checking
  const title = typeof newsletterData.title === 'string' ? newsletterData.title : '';
  const filename = typeof newsletterData.filename === 'string' ? newsletterData.filename : '';
  const publicationDate = typeof newsletterData.publicationDate === 'string' ? newsletterData.publicationDate : '';
  const pageCount = typeof newsletterData.pageCount === 'number' ? newsletterData.pageCount : undefined;
  const fileSize = typeof newsletterData.fileSize === 'number' ? newsletterData.fileSize :
                   typeof newsletterData.fileSizeBytes === 'number' ? newsletterData.fileSizeBytes : undefined;
  const description = typeof newsletterData.description === 'string' ? newsletterData.description : undefined;

  // Validate each component
  const contentValidation = validateNewsletterContent(title, description);
  allErrors.push(...contentValidation.errors);
  allWarnings.push(...contentValidation.warnings);

  const dateValidation = validateNewsletterDate(publicationDate);
  allErrors.push(...dateValidation.errors);
  allWarnings.push(...dateValidation.warnings);

  const fileValidation = validatePdfFile(filename, fileSize);
  allErrors.push(...fileValidation.errors);
  allWarnings.push(...fileValidation.warnings);

  if (pageCount !== undefined) {
    const pageValidation = validatePageCount(pageCount);
    allErrors.push(...pageValidation.errors);
    allWarnings.push(...pageValidation.warnings);
  }

  // Required field validation
  const requiredFields = ['id', 'filename', 'title', 'publicationDate'];
  for (const field of requiredFields) {
    if (!(field in newsletterData) || newsletterData[field] === undefined || newsletterData[field] === null || newsletterData[field] === '') {
      allErrors.push(`Required field '${field}' is missing or empty`);
    }
  }

  // Log validation results for debugging
  if (allErrors.length > 0) {
    logger.warn('Newsletter validation failed', {
      errors: allErrors,
      warnings: allWarnings,
      newsletterData: { title, filename, publicationDate }
    });
  } else if (allWarnings.length > 0) {
    logger.info('Newsletter validation passed with warnings', {
      warnings: allWarnings,
      newsletterData: { title, filename, publicationDate }
    });
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Validate batch operation constraints
 */
export function validateBatchOperation(newsletters: unknown[], maxBatchSize = 50): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(newsletters)) {
    errors.push('Newsletters must be provided as an array');
    return { isValid: false, errors, warnings };
  }

  if (newsletters.length === 0) {
    errors.push('At least one newsletter must be provided for batch operation');
  }

  if (newsletters.length > maxBatchSize) {
    errors.push(`Batch size cannot exceed ${maxBatchSize} items`);
  }

  // Warning for large batch sizes
  if (newsletters.length > 20) {
    warnings.push('Large batch operations may take significant time to complete');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Race condition detection for concurrent operations
 */
export function validateConcurrentOperation(
  operationId: string,
  activeOperations: Set<string>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (activeOperations.has(operationId)) {
    errors.push(`Operation '${operationId}' is already in progress`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
