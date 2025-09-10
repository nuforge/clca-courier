/**
 * Theme Composable
 * Provides reactive access to site theme configuration via Pinia store
 */

import { useSiteThemeStore } from '../stores/site-theme.store';

export function useSiteTheme() {
  const store = useSiteThemeStore();

  return {
    // State (reactive from store)
    theme: store.theme,
    colors: store.colors,
    contentTypes: store.contentTypes,
    categoryMappings: store.categoryMappings,
    statusMappings: store.statusMappings,
    isDirty: store.isDirty,
    lastSaved: store.lastSaved,
    debugInfo: store.debugInfo,

    // Helper functions
    getContentIcon: store.getContentIcon,
    getCategoryIcon: store.getCategoryIcon,
    getStatusIcon: store.getStatusIcon,
    getAvailableCategories: store.getAvailableCategories,
    getContentTypes: store.getContentTypes,
    getColor: store.getColor,

    // Actions
    updateTheme: store.updateTheme,
    updateContentType: store.updateContentType,
    updateCategory: store.updateCategory,
    updateColors: store.updateColors,
    updateStatus: store.updateStatus,
    resetTheme: store.resetTheme,
    saveTheme: store.saveTheme,
    loadTheme: store.loadTheme,
    getThemeForEditing: store.getThemeForEditing,
    enableAutoSave: store.enableAutoSave,
  };
}
