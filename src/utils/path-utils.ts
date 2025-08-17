/**
 * Utility functions for handling paths in production and development
 */

/**
 * Get the correct base path for assets based on environment
 */
export const getBasePath = (): string => {
  if (typeof window !== 'undefined') {
    const isProduction = import.meta.env.PROD;
    return isProduction ? '/clca-courier' : '';
  }
  return '';
};

/**
 * Get the correct path for public assets
 * @param path - The path relative to the public directory
 */
export const getPublicPath = (path: string): string => {
  const basePath = getBasePath();
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${basePath}/${cleanPath}`;
};

/**
 * Get the correct path for data files
 * Data files should be moved from src/data to public/data for production builds
 * @param filename - The data file name
 */
export const getDataPath = (filename: string): string => {
  return getPublicPath(`data/${filename}`);
};
