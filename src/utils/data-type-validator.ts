/**
 * SYSTEMATIC DATA TYPE VALIDATION UTILITY
 * Prevents the constant undefined/null/type mismatch issues
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  cleanedData?: unknown;
}

/**
 * Aggressively clean data for Firebase - removes ALL undefined/null values
 */
export function cleanForFirebase<T>(data: T): T {
  if (data === null || data === undefined) {
    return {} as T;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined && item !== null)
      .map((item) => (typeof item === 'object' ? cleanForFirebase(item) : item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          cleaned[key] = cleanForFirebase(value);
        } else {
          cleaned[key] = value;
        }
      }
    }

    return cleaned as T;
  }

  return data;
}

/**
 * Validate required fields exist
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[],
): ValidationResult {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanedData: cleanForFirebase(data),
  };
}

/**
 * Type-safe Firebase document saver
 */
export function prepareForFirebase<T>(data: T, requiredFields: string[] = []): ValidationResult {
  const cleaned = cleanForFirebase(data);

  if (requiredFields.length > 0) {
    return validateRequiredFields(cleaned as Record<string, unknown>, requiredFields);
  }

  return {
    isValid: true,
    errors: [],
    cleanedData: cleaned,
  };
}

/**
 * Newsletter-specific validation
 */
export const NEWSLETTER_REQUIRED_FIELDS = [
  'filename',
  'title',
  'isPublished',
  'createdAt',
  'updatedAt',
];

export function validateNewsletterData(data: unknown): ValidationResult {
  return prepareForFirebase(data, NEWSLETTER_REQUIRED_FIELDS);
}

/**
 * Versioning history validation
 */
export const VERSIONING_REQUIRED_FIELDS = [
  'id',
  'contentId',
  'version',
  'timestamp',
  'userId',
  'changeType',
];

export function validateVersioningData(data: unknown): ValidationResult {
  return prepareForFirebase(data, VERSIONING_REQUIRED_FIELDS);
}
