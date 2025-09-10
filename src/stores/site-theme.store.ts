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
  // Constants
  const STORAGE_KEY = 'clca-courier-site-theme';

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
    // Deep merge to preserve nested objects properly
    currentTheme.value = {
      ...currentTheme.value,
      ...newTheme,
      colors: {
        ...currentTheme.value.colors,
        ...(newTheme.colors || {}),
        contentTypes: {
          ...currentTheme.value.colors.contentTypes,
          ...(newTheme.colors?.contentTypes || {})
        },
        status: {
          ...currentTheme.value.colors.status,
          ...(newTheme.colors?.status || {})
        },
        categories: {
          ...currentTheme.value.colors.categories,
          ...(newTheme.colors?.categories || {})
        }
      },
      contentTypes: {
        ...currentTheme.value.contentTypes,
        ...(newTheme.contentTypes || {})
      },
      categoryMappings: {
        ...currentTheme.value.categoryMappings,
        ...(newTheme.categoryMappings || {})
      },
      statusMappings: {
        ...currentTheme.value.statusMappings,
        ...(newTheme.statusMappings || {})
      }
    };
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
      // Save to localStorage for immediate persistence
      const themeData = {
        ...currentTheme.value,
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(themeData));

      // TODO: Also save to Firebase for cloud sync when user is authenticated
      // await firestoreService.saveUserTheme(themeData);

      isDirty.value = false;
      lastSaved.value = new Date();
      logger.success('Theme saved successfully', {
        timestamp: lastSaved.value,
        storage: 'localStorage'
      });
    } catch (error) {
      logger.error('Failed to save theme', { error });
      throw error;
    }
  };

  const loadTheme = (): void => {
    try {
      // Load from localStorage first
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsedTheme = JSON.parse(saved);

        // Validate and merge with defaults to ensure all properties exist
        currentTheme.value = {
          ...DEFAULT_SITE_THEME,
          ...parsedTheme,
          colors: {
            ...DEFAULT_SITE_THEME.colors,
            ...(parsedTheme.colors || {}),
            contentTypes: {
              ...DEFAULT_SITE_THEME.colors.contentTypes,
              ...(parsedTheme.colors?.contentTypes || {})
            },
            status: {
              ...DEFAULT_SITE_THEME.colors.status,
              ...(parsedTheme.colors?.status || {})
            },
            categories: {
              ...DEFAULT_SITE_THEME.colors.categories,
              ...(parsedTheme.colors?.categories || {})
            }
          },
          contentTypes: {
            ...DEFAULT_SITE_THEME.contentTypes,
            ...(parsedTheme.contentTypes || {})
          },
          categoryMappings: {
            ...DEFAULT_SITE_THEME.categoryMappings,
            ...(parsedTheme.categoryMappings || {})
          },
          statusMappings: {
            ...DEFAULT_SITE_THEME.statusMappings,
            ...(parsedTheme.statusMappings || {})
          }
        };

        isDirty.value = false;
        lastSaved.value = parsedTheme.lastSaved ? new Date(parsedTheme.lastSaved) : new Date();

        logger.info('Theme loaded successfully from localStorage', {
          timestamp: lastSaved.value
        });
      } else {
        // No saved theme, use defaults
        currentTheme.value = { ...DEFAULT_SITE_THEME };
        isDirty.value = false;
        lastSaved.value = null;
        logger.info('No saved theme found, using defaults');
      }

      // TODO: Also try to load from Firebase for cloud sync when user is authenticated
      // const cloudTheme = await firestoreService.getUserTheme();
      // if (cloudTheme && cloudTheme.lastSaved > localTheme.lastSaved) {
      //   currentTheme.value = cloudTheme;
      // }

    } catch (error) {
      logger.error('Failed to load theme, using defaults', { error });
      currentTheme.value = { ...DEFAULT_SITE_THEME };
      isDirty.value = false;
      lastSaved.value = null;
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

  // Initialize theme from storage on store creation
  const initializeTheme = () => {
    loadTheme();
    logger.info('Site theme store initialized');
  };

  // Auto-initialize when store is created
  initializeTheme();

  // Debug helper - expose storage key for console debugging
  const debugInfo = computed(() => ({
    storageKey: STORAGE_KEY,
    currentTheme: currentTheme.value,
    isDirty: isDirty.value,
    lastSaved: lastSaved.value,
    localStorage: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
  }));

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
    initializeTheme,
    debugInfo,
  };
});
