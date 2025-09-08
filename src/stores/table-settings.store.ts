/**
 * Table Settings Store
 * Persistent storage for table configurations across the application
 */

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { logger } from '../utils/logger';

// Table pagination configuration
export interface TablePagination {
  sortBy: string;
  descending: boolean;
  page: number;
  rowsPerPage: number;
}

// Table settings for different components
export interface TableSettings {
  pagination: TablePagination;
  columnsOrder?: string[];
  hiddenColumns?: string[];
  lastUpdated: string;
}

// Default table configurations
const DEFAULT_NEWSLETTER_MANAGEMENT_TABLE: TableSettings = {
  pagination: {
    sortBy: 'date',
    descending: true, // Newest first
    page: 1,
    rowsPerPage: 25,
  },
  columnsOrder: [],
  hiddenColumns: [],
  lastUpdated: new Date().toISOString(),
};

const STORAGE_KEY_PREFIX = 'clca-table-settings';

export const useTableSettingsStore = defineStore('table-settings', () => {
  // Newsletter Management Table Settings
  const newsletterManagementTable = ref<TableSettings>({ ...DEFAULT_NEWSLETTER_MANAGEMENT_TABLE });

  // Load settings from localStorage
  const loadTableSettings = (tableKey: string): TableSettings => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}-${tableKey}`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const parsed = JSON.parse(saved) as TableSettings;
        logger.info(`Loaded table settings for ${tableKey}:`, parsed);
        return {
          ...DEFAULT_NEWSLETTER_MANAGEMENT_TABLE,
          ...parsed,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    } catch (error) {
      logger.warn(`Failed to load table settings for ${tableKey}:`, error);
    }

    return { ...DEFAULT_NEWSLETTER_MANAGEMENT_TABLE };
  };

  // Save settings to localStorage
  const saveTableSettings = (tableKey: string, settings: TableSettings) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}-${tableKey}`;
      const toSave = {
        ...settings,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(toSave));
      logger.info(`Saved table settings for ${tableKey}:`, toSave);
    } catch (error) {
      logger.error(`Failed to save table settings for ${tableKey}:`, error);
    }
  };

  // Initialize settings from localStorage
  const initializeSettings = () => {
    newsletterManagementTable.value = loadTableSettings('newsletter-management');
    logger.info('Table settings store initialized');
  };

  // Update newsletter management table pagination
  const updateNewsletterManagementPagination = (pagination: Partial<TablePagination>) => {
    newsletterManagementTable.value.pagination = {
      ...newsletterManagementTable.value.pagination,
      ...pagination,
    };

    saveTableSettings('newsletter-management', newsletterManagementTable.value);
    logger.debug('Updated newsletter management table pagination:', pagination);
  };

  // Update newsletter management table column configuration
  const updateNewsletterManagementColumns = (config: {
    columnsOrder?: string[];
    hiddenColumns?: string[];
  }) => {
    if (config.columnsOrder !== undefined) {
      newsletterManagementTable.value.columnsOrder = config.columnsOrder;
    }
    if (config.hiddenColumns !== undefined) {
      newsletterManagementTable.value.hiddenColumns = config.hiddenColumns;
    }

    saveTableSettings('newsletter-management', newsletterManagementTable.value);
    logger.debug('Updated newsletter management table columns:', config);
  };

  // Reset table settings to defaults
  const resetNewsletterManagementTable = () => {
    newsletterManagementTable.value = { ...DEFAULT_NEWSLETTER_MANAGEMENT_TABLE };
    saveTableSettings('newsletter-management', newsletterManagementTable.value);
    logger.info('Reset newsletter management table settings to defaults');
  };

  // Generic method to get any table settings
  const getTableSettings = (tableKey: string): TableSettings => {
    switch (tableKey) {
      case 'newsletter-management':
        return newsletterManagementTable.value;
      default:
        logger.warn(`Unknown table key: ${tableKey}`);
        return { ...DEFAULT_NEWSLETTER_MANAGEMENT_TABLE };
    }
  };

  // Generic method to update any table settings
  const updateTableSettings = (tableKey: string, settings: Partial<TableSettings>) => {
    switch (tableKey) {
      case 'newsletter-management':
        newsletterManagementTable.value = {
          ...newsletterManagementTable.value,
          ...settings,
        };
        saveTableSettings(tableKey, newsletterManagementTable.value);
        break;
      default:
        logger.warn(`Unknown table key: ${tableKey}`);
    }
  };

  // Watch for changes and auto-save (debounced)
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  watch(
    () => newsletterManagementTable.value,
    (newSettings) => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Debounce saves by 500ms to avoid excessive localStorage writes
      saveTimeout = setTimeout(() => {
        saveTableSettings('newsletter-management', newSettings);
      }, 500);
    },
    { deep: true },
  );

  // Initialize on store creation
  initializeSettings();

  return {
    // State
    newsletterManagementTable,

    // Actions
    updateNewsletterManagementPagination,
    updateNewsletterManagementColumns,
    resetNewsletterManagementTable,
    getTableSettings,
    updateTableSettings,
    initializeSettings,
  };
});
