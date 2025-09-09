/**
 * Theme Composable
 * Provides reactive access to site theme configuration
 */

import { ref, computed } from 'vue';
import {
  DEFAULT_SITE_THEME,
  type ThemeConfig,
  getContentTypeTheme,
  getCategoryTheme,
  getStatusTheme,
  resolveColor
} from '../config/site-theme.config';

// Global theme state - can be updated through admin interface
const currentTheme = ref<ThemeConfig>(DEFAULT_SITE_THEME);

export function useSiteTheme() {

  /**
   * Get icon and color for content type
   */
  const getContentIcon = (type: string) => {
    return getContentTypeTheme(type, currentTheme.value);
  };

  /**
   * Get icon and color for category within content type
   */
  const getCategoryIcon = (contentType: string, category: string) => {
    return getCategoryTheme(contentType, category, currentTheme.value);
  };

  /**
   * Get icon and color for status
   */
  const getStatusIcon = (status: string) => {
    return getStatusTheme(status, currentTheme.value);
  };

  /**
   * Get available categories for a content type
   */
  const getAvailableCategories = (contentType: string): string[] => {
    return currentTheme.value.contentTypes[contentType]?.subcategories || [];
  };

  /**
   * Get all content types
   */
  const getContentTypes = () => {
    return Object.keys(currentTheme.value.contentTypes);
  };

  /**
   * Get color value (resolves references)
   */
  const getColor = (colorRef: string): string => {
    return resolveColor(colorRef, currentTheme.value);
  };

  /**
   * Update theme configuration (for admin interface)
   */
  const updateTheme = (newTheme: Partial<ThemeConfig>) => {
    currentTheme.value = { ...currentTheme.value, ...newTheme };
  };

  /**
   * Reset theme to defaults
   */
  const resetTheme = () => {
    currentTheme.value = DEFAULT_SITE_THEME;
  };

  /**
   * Get theme data for editing
   */
  const getThemeForEditing = () => {
    return JSON.parse(JSON.stringify(currentTheme.value));
  };

  // Computed properties for common theme values
  const theme = computed(() => currentTheme.value);
  const colors = computed(() => currentTheme.value.colors);
  const contentTypes = computed(() => currentTheme.value.contentTypes);

  return {
    // Theme state
    theme,
    colors,
    contentTypes,

    // Helper functions
    getContentIcon,
    getCategoryIcon,
    getStatusIcon,
    getAvailableCategories,
    getContentTypes,
    getColor,

    // Admin functions
    updateTheme,
    resetTheme,
    getThemeForEditing,
  };
}
