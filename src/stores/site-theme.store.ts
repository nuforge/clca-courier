/**
 * Site Theme Store
 * Centralized state management for theme configuration with persistence
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  DEFAULT_SITE_THEME,
  type ThemeConfig,
  getContentTypeTheme,
  getCategoryTheme,
  getStatusTheme,
  resolveColor
} from '../config/site-theme.config';
import { logger } from '../utils/logger';

export const useSiteThemeStore = defineStore('siteTheme', () => {
  // State
  const currentTheme = ref<ThemeConfig>({ ...DEFAULT_SITE_THEME });
  const isDirty = ref(false); // Track if theme has unsaved changes
  const lastSaved = ref<Date | null>(null);

  // Computed
  const theme = computed(() => currentTheme.value);
  const colors = computed(() => currentTheme.value.colors);
  const contentTypes = computed(() => currentTheme.value.contentTypes);
  const categoryMappings = computed(() => currentTheme.value.categoryMappings);
  const statusMappings = computed(() => currentTheme.value.statusMappings);

  // Helper functions
  const getContentIcon = (type: string) => {
    return getContentTypeTheme(type, currentTheme.value);
  };

  const getCategoryIcon = (contentType: string, category: string) => {
    return getCategoryTheme(contentType, category, currentTheme.value);
  };

  const getStatusIcon = (status: string) => {
    return getStatusTheme(status, currentTheme.value);
  };

  const getAvailableCategories = (contentType: string): string[] => {
    return currentTheme.value.contentTypes[contentType]?.subcategories || [];
  };

  const getContentTypes = () => {
    return Object.keys(currentTheme.value.contentTypes);
  };

  const getColor = (colorRef: string): string => {
    return resolveColor(colorRef, currentTheme.value);
  };

  // Actions
  const updateTheme = (newTheme: Partial<ThemeConfig>) => {
    currentTheme.value = { ...currentTheme.value, ...newTheme };
    isDirty.value = true;
    logger.info('Theme updated in store', { isDirty: isDirty.value });
  };

  const updateContentType = (type: string, config: typeof currentTheme.value.contentTypes[string]) => {
    currentTheme.value.contentTypes[type] = config;
    isDirty.value = true;
    logger.info(`Content type '${type}' updated`);
  };

  const updateCategory = (contentType: string, category: string, config: typeof currentTheme.value.categoryMappings[string][string]) => {
    if (!currentTheme.value.categoryMappings[contentType]) {
      currentTheme.value.categoryMappings[contentType] = {};
    }
    currentTheme.value.categoryMappings[contentType][category] = config;
    isDirty.value = true;
    logger.info(`Category '${category}' for '${contentType}' updated`);
  };

  const updateColors = (newColors: Partial<typeof currentTheme.value.colors>) => {
    currentTheme.value.colors = { ...currentTheme.value.colors, ...newColors };
    isDirty.value = true;
    logger.info('Colors updated');
  };

  const updateStatus = (status: string, config: typeof currentTheme.value.statusMappings[string]) => {
    currentTheme.value.statusMappings[status] = config;
    isDirty.value = true;
    logger.info(`Status '${status}' updated`);
  };

  const resetTheme = () => {
    currentTheme.value = { ...DEFAULT_SITE_THEME };
    isDirty.value = false;
    logger.info('Theme reset to defaults');
  };

  const saveTheme = (): void => {
    try {
      // TODO: Implement persistence to Firebase/localStorage (will be async when implemented)
      // For now, just mark as saved
      isDirty.value = false;
      lastSaved.value = new Date();
      logger.success('Theme saved successfully', { timestamp: lastSaved.value });
    } catch (error) {
      logger.error('Failed to save theme', { error });
      throw error;
    }
  };

  const loadTheme = (): void => {
    try {
      // TODO: Implement loading from Firebase/localStorage (will be async when implemented)
      // For now, load from defaults
      currentTheme.value = { ...DEFAULT_SITE_THEME };
      isDirty.value = false;
      lastSaved.value = new Date();
      logger.info('Theme loaded successfully');
    } catch (error) {
      logger.error('Failed to load theme', { error });
      throw error;
    }
  };

  const getThemeForEditing = () => {
    return JSON.parse(JSON.stringify(currentTheme.value));
  };

  // Auto-save functionality (optional)
  const enableAutoSave = (intervalMs = 30000) => {
    setInterval(() => {
      if (isDirty.value) {
        void saveTheme();
      }
    }, intervalMs);
  };

  return {
    // State
    theme,
    colors,
    contentTypes,
    categoryMappings,
    statusMappings,
    isDirty,
    lastSaved,

    // Helper functions
    getContentIcon,
    getCategoryIcon,
    getStatusIcon,
    getAvailableCategories,
    getContentTypes,
    getColor,

    // Actions
    updateTheme,
    updateContentType,
    updateCategory,
    updateColors,
    updateStatus,
    resetTheme,
    saveTheme,
    loadTheme,
    getThemeForEditing,
    enableAutoSave,
  };
});
