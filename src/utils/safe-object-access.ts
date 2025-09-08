/**
 * SAFE OBJECT ACCESS UTILITIES
 * Prevents runtime errors from undefined object access
 */

/**
 * Safely access the id property with fallback
 */
export function getSafeId(
  obj: { id?: string | number } | null | undefined,
  fallback: string = 'unknown',
): string {
  if (!obj) return fallback;
  if (obj.id === undefined || obj.id === null) return fallback;
  return String(obj.id);
}

/**
 * Safely access nested properties
 */
export function getSafeProp<T>(
  obj: Record<string, unknown> | null | undefined,
  prop: string,
  fallback: T,
): T {
  if (!obj || typeof obj !== 'object') return fallback;
  const value = obj[prop];
  return value !== undefined && value !== null ? (value as T) : fallback;
}

/**
 * Check if object has valid id
 */
export function hasValidId(
  obj: { id?: string | number } | null | undefined,
): obj is { id: string | number } {
  return (
    obj !== null && obj !== undefined && obj.id !== undefined && obj.id !== null && obj.id !== ''
  );
}

/**
 * Safe array access with bounds checking
 */
export function getSafeArrayItem<T>(arr: T[] | null | undefined, index: number, fallback: T): T {
  if (!arr || !Array.isArray(arr) || index < 0 || index >= arr.length) return fallback;
  const item = arr[index];
  return item !== undefined ? item : fallback;
}
