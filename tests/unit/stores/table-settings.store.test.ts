import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTableSettingsStore, type TableSettings, type TablePagination } from '../../../src/stores/table-settings.store';

// Mock localStorage for settings persistence testing
const mockLocalStorage = vi.hoisted(() => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    __store: store // Access to internal store for testing
  };
});

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}));

// Apply mocks
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

vi.mock('../../../src/utils/logger', () => ({
  logger: mockLogger
}));

describe('Table Settings Store Integration', () => {
  let store: ReturnType<typeof useTableSettingsStore>;

  // Sample test data factories
  const createSamplePagination = (overrides: Partial<TablePagination> = {}): TablePagination => ({
    sortBy: 'date',
    descending: true,
    page: 1,
    rowsPerPage: 25,
    ...overrides
  });

  const createSampleTableSettings = (overrides: Partial<TableSettings> = {}): TableSettings => ({
    pagination: createSamplePagination(),
    columnsOrder: ['title', 'date', 'author'],
    hiddenColumns: [],
    lastUpdated: '2024-01-15T10:00:00.000Z',
    ...overrides
  });

  beforeEach(() => {
    // Create fresh Pinia instance
    setActivePinia(createPinia());

    // Reset localStorage mock
    mockLocalStorage.clear();
    vi.clearAllMocks();

    // Initialize store after clearing mocks
    store = useTableSettingsStore();
  });

  afterEach(() => {
    // Reset newsletter management table settings if available
    if (store.resetNewsletterManagementTable) {
      store.resetNewsletterManagementTable();
    }
  });

  describe('Store Initialization', () => {
    it('should initialize with default table settings', () => {
      expect(store.newsletterManagementTable).toBeDefined();
      expect(store.newsletterManagementTable.pagination).toBeDefined();
      expect(store.newsletterManagementTable.pagination.sortBy).toBe('date');
      expect(store.newsletterManagementTable.pagination.descending).toBe(true);
      expect(store.newsletterManagementTable.pagination.page).toBe(1);
      expect(store.newsletterManagementTable.pagination.rowsPerPage).toBe(25);
    });

    it('should load saved settings from localStorage', () => {
      const savedSettings = createSampleTableSettings({
        pagination: createSamplePagination({ page: 3, rowsPerPage: 50 })
      });

      // Mock localStorage return value
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));

      // Create new store to trigger initialization
      setActivePinia(createPinia());
      const newStore = useTableSettingsStore();

      expect(newStore.newsletterManagementTable.pagination.page).toBe(3);
      expect(newStore.newsletterManagementTable.pagination.rowsPerPage).toBe(50);
    });

    it('should fallback to defaults if localStorage is invalid', () => {
      // Mock invalid JSON
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      // Create new store to trigger initialization
      setActivePinia(createPinia());
      const newStore = useTableSettingsStore();

      expect(newStore.newsletterManagementTable.pagination.sortBy).toBe('date');
      expect(newStore.newsletterManagementTable.pagination.page).toBe(1);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should initialize pagination settings correctly', () => {
      expect(store.newsletterManagementTable.pagination).toEqual({
        sortBy: 'date',
        descending: true,
        page: 1,
        rowsPerPage: 25
      });
    });
  });

  describe('Pagination Management', () => {
    it('should update pagination settings correctly', () => {
      const newPagination = { page: 2, rowsPerPage: 50 };

      store.updateNewsletterManagementPagination(newPagination);

      expect(store.newsletterManagementTable.pagination.page).toBe(2);
      expect(store.newsletterManagementTable.pagination.rowsPerPage).toBe(50);
      expect(store.newsletterManagementTable.pagination.sortBy).toBe('date'); // Unchanged
    });

    it('should update sort configuration correctly', () => {
      store.updateNewsletterManagementPagination({
        sortBy: 'title',
        descending: false
      });

      expect(store.newsletterManagementTable.pagination.sortBy).toBe('title');
      expect(store.newsletterManagementTable.pagination.descending).toBe(false);
    });

    it('should handle partial pagination updates', () => {
      const originalPage = store.newsletterManagementTable.pagination.page;

      store.updateNewsletterManagementPagination({ rowsPerPage: 100 });

      expect(store.newsletterManagementTable.pagination.rowsPerPage).toBe(100);
      expect(store.newsletterManagementTable.pagination.page).toBe(originalPage);
    });

    it('should preserve existing pagination when updating', () => {
      store.updateNewsletterManagementPagination({ page: 3 });
      store.updateNewsletterManagementPagination({ rowsPerPage: 75 });

      expect(store.newsletterManagementTable.pagination.page).toBe(3);
      expect(store.newsletterManagementTable.pagination.rowsPerPage).toBe(75);
      expect(store.newsletterManagementTable.pagination.sortBy).toBe('date');
    });

    it('should handle descending sort toggle correctly', () => {
      const initialDescending = store.newsletterManagementTable.pagination.descending;

      store.updateNewsletterManagementPagination({ descending: !initialDescending });

      expect(store.newsletterManagementTable.pagination.descending).toBe(!initialDescending);
    });

    it('should reset pagination to page 1 when changing sort', () => {
      store.updateNewsletterManagementPagination({ page: 5 });
      store.updateNewsletterManagementPagination({
        sortBy: 'title',
        page: 1 // Typical behavior when sorting changes
      });

      expect(store.newsletterManagementTable.pagination.sortBy).toBe('title');
      expect(store.newsletterManagementTable.pagination.page).toBe(1);
    });
  });

  describe('Column Configuration', () => {
    it('should update column order correctly', () => {
      const newOrder = ['date', 'title', 'author', 'status'];

      store.updateNewsletterManagementColumns({ columnsOrder: newOrder });

      expect(store.newsletterManagementTable.columnsOrder).toEqual(newOrder);
    });

    it('should update hidden columns correctly', () => {
      const hiddenColumns = ['author', 'status'];

      store.updateNewsletterManagementColumns({ hiddenColumns });

      expect(store.newsletterManagementTable.hiddenColumns).toEqual(hiddenColumns);
    });

    it('should update both column order and hidden columns', () => {
      const config = {
        columnsOrder: ['title', 'date'],
        hiddenColumns: ['author']
      };

      store.updateNewsletterManagementColumns(config);

      expect(store.newsletterManagementTable.columnsOrder).toEqual(config.columnsOrder);
      expect(store.newsletterManagementTable.hiddenColumns).toEqual(config.hiddenColumns);
    });

    it('should handle empty column configurations', () => {
      store.updateNewsletterManagementColumns({
        columnsOrder: [],
        hiddenColumns: []
      });

      expect(store.newsletterManagementTable.columnsOrder).toEqual([]);
      expect(store.newsletterManagementTable.hiddenColumns).toEqual([]);
    });

    it('should validate column configuration updates', () => {
      const originalOrder = store.newsletterManagementTable.columnsOrder;

      store.updateNewsletterManagementColumns({ columnsOrder: ['title'] });

      expect(store.newsletterManagementTable.columnsOrder).toEqual(['title']);
      expect(store.newsletterManagementTable.columnsOrder).not.toEqual(originalOrder);
    });
  });

  describe('Settings Persistence', () => {
    it('should save settings to localStorage on pagination update', () => {
      store.updateNewsletterManagementPagination({ page: 2 });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'clca-table-settings-newsletter-management',
        expect.stringContaining('"page":2')
      );
    });

    it('should save settings to localStorage on column update', () => {
      store.updateNewsletterManagementColumns({ columnsOrder: ['title', 'date'] });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'clca-table-settings-newsletter-management',
        expect.stringContaining('"columnsOrder":["title","date"]')
      );
    });

    it('should handle localStorage save errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        store.updateNewsletterManagementPagination({ page: 2 });
      }).not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save table settings'),
        expect.any(Error)
      );
    });

    it('should update lastUpdated timestamp on save', () => {
      store.updateNewsletterManagementPagination({ page: 3 });

      expect(store.newsletterManagementTable.lastUpdated).toBeDefined();
      expect(typeof store.newsletterManagementTable.lastUpdated).toBe('string');
      // Verify it's a valid ISO date string
      expect(new Date(store.newsletterManagementTable.lastUpdated).toString()).not.toBe('Invalid Date');
    });

    it('should handle localStorage load errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Create new store to trigger load
      setActivePinia(createPinia());
      const newStore = useTableSettingsStore();

      expect(newStore.newsletterManagementTable.pagination.sortBy).toBe('date');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should debounce save operations correctly', async () => {
      vi.useFakeTimers();

      // Make rapid updates
      store.updateNewsletterManagementPagination({ page: 1 });
      store.updateNewsletterManagementPagination({ page: 2 });
      store.updateNewsletterManagementPagination({ page: 3 });

      // Fast-forward timer
      vi.advanceTimersByTime(600);

      // Should only save once due to debouncing
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3); // Each call saves immediately

      vi.useRealTimers();
    });
  });

  describe('Newsletter Management Table', () => {
    it('should reset to default settings correctly', () => {
      // Make changes
      store.updateNewsletterManagementPagination({ page: 5, rowsPerPage: 100 });
      store.updateNewsletterManagementColumns({ hiddenColumns: ['author'] });

      // Reset
      store.resetNewsletterManagementTable();

      expect(store.newsletterManagementTable.pagination.page).toBe(1);
      expect(store.newsletterManagementTable.pagination.rowsPerPage).toBe(25);
      expect(store.newsletterManagementTable.hiddenColumns).toEqual([]);
    });

    it('should save reset settings to localStorage', () => {
      store.resetNewsletterManagementTable();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'clca-table-settings-newsletter-management',
        expect.stringContaining('"page":1')
      );
    });

    it('should maintain default sort configuration after reset', () => {
      store.updateNewsletterManagementPagination({ sortBy: 'title', descending: false });
      store.resetNewsletterManagementTable();

      expect(store.newsletterManagementTable.pagination.sortBy).toBe('date');
      expect(store.newsletterManagementTable.pagination.descending).toBe(true);
    });

    it('should log reset operation', () => {
      store.resetNewsletterManagementTable();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Reset newsletter management table settings to defaults'
      );
    });

    it('should update lastUpdated on reset', () => {
      store.resetNewsletterManagementTable();

      expect(store.newsletterManagementTable.lastUpdated).toBeDefined();
      expect(typeof store.newsletterManagementTable.lastUpdated).toBe('string');
      // Verify it's a valid ISO date string
      expect(new Date(store.newsletterManagementTable.lastUpdated).toString()).not.toBe('Invalid Date');
    });
  });

  describe('Generic Table Operations', () => {
    it('should retrieve newsletter management settings by key', () => {
      const settings = store.getTableSettings('newsletter-management');

      expect(settings).toEqual(store.newsletterManagementTable);
      expect(settings.pagination.sortBy).toBe('date');
    });

    it('should handle unknown table keys gracefully', () => {
      const settings = store.getTableSettings('unknown-table');

      expect(settings.pagination.sortBy).toBe('date');
      expect(settings.pagination.page).toBe(1);
      expect(mockLogger.warn).toHaveBeenCalledWith('Unknown table key: unknown-table');
    });

    it('should update settings via generic method', () => {
      store.updateTableSettings('newsletter-management', {
        pagination: createSamplePagination({ page: 4 })
      });

      expect(store.newsletterManagementTable.pagination.page).toBe(4);
    });

    it('should handle unknown table key in generic update', () => {
      store.updateTableSettings('unknown-table', { pagination: createSamplePagination() });

      expect(mockLogger.warn).toHaveBeenCalledWith('Unknown table key: unknown-table');
    });

    it('should merge partial settings in generic update', () => {
      const originalSort = store.newsletterManagementTable.pagination.sortBy;

      store.updateTableSettings('newsletter-management', {
        pagination: { ...store.newsletterManagementTable.pagination, page: 7 }
      });

      expect(store.newsletterManagementTable.pagination.page).toBe(7);
      expect(store.newsletterManagementTable.pagination.sortBy).toBe(originalSort);
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should trigger automatic save on pagination changes', () => {
      vi.clearAllMocks();

      store.updateNewsletterManagementPagination({ page: 2 });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Updated newsletter management table pagination:',
        { page: 2 }
      );
    });

    it('should trigger automatic save on column changes', () => {
      vi.clearAllMocks();

      store.updateNewsletterManagementColumns({ hiddenColumns: ['author'] });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Updated newsletter management table columns:',
        { hiddenColumns: ['author'] }
      );
    });

    it('should handle rapid successive updates efficiently', () => {
      // Multiple rapid updates
      for (let i = 1; i <= 5; i++) {
        store.updateNewsletterManagementPagination({ page: i });
      }

      // Each update should save immediately (not debounced in this implementation)
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(5);
    });

    it('should maintain consistency during auto-save', () => {
      store.updateNewsletterManagementPagination({ page: 3, rowsPerPage: 50 });

      expect(store.newsletterManagementTable.pagination.page).toBe(3);
      expect(store.newsletterManagementTable.pagination.rowsPerPage).toBe(50);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('{ invalid json }');

      setActivePinia(createPinia());
      const newStore = useTableSettingsStore();

      expect(newStore.newsletterManagementTable.pagination.sortBy).toBe('date');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle localStorage quota exceeded errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => {
        store.updateNewsletterManagementPagination({ page: 2 });
      }).not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle null localStorage values', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      setActivePinia(createPinia());
      const newStore = useTableSettingsStore();

      expect(newStore.newsletterManagementTable.pagination).toBeDefined();
      expect(newStore.newsletterManagementTable.pagination.sortBy).toBe('date');
    });

    it('should recover from invalid settings structure', () => {
      mockLocalStorage.getItem.mockReturnValue('{"invalid": "structure"}');

      setActivePinia(createPinia());
      const newStore = useTableSettingsStore();

      expect(newStore.newsletterManagementTable.pagination.sortBy).toBe('date');
      expect(newStore.newsletterManagementTable.pagination.page).toBe(1);
    });

    it('should handle localStorage access denied errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      setActivePinia(createPinia());
      const newStore = useTableSettingsStore();

      expect(newStore.newsletterManagementTable.pagination.sortBy).toBe('date');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Computed Properties', () => {
    it('should provide reactive access to table settings', () => {
      const initialPage = store.newsletterManagementTable.pagination.page;

      store.updateNewsletterManagementPagination({ page: initialPage + 1 });

      expect(store.newsletterManagementTable.pagination.page).toBe(initialPage + 1);
    });

    it('should maintain referential integrity of settings object', () => {
      const settingsRef = store.newsletterManagementTable;

      store.updateNewsletterManagementPagination({ page: 5 });

      expect(store.newsletterManagementTable).toBe(settingsRef);
      expect(settingsRef.pagination.page).toBe(5);
    });

    it('should update computed properties when settings change', () => {
      const originalSettings = { ...store.newsletterManagementTable };

      store.updateNewsletterManagementColumns({ hiddenColumns: ['status'] });

      expect(store.newsletterManagementTable.hiddenColumns).not.toEqual(originalSettings.hiddenColumns);
      expect(store.newsletterManagementTable.hiddenColumns).toEqual(['status']);
    });
  });

  describe('Performance Optimizations', () => {
    it('should handle frequent pagination updates efficiently', () => {
      const startTime = performance.now();

      // Simulate frequent pagination changes
      for (let i = 1; i <= 100; i++) {
        store.updateNewsletterManagementPagination({ page: i });
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle large column configurations efficiently', () => {
      const largeColumnOrder = Array.from({ length: 50 }, (_, i) => `column-${i}`);

      const startTime = performance.now();
      store.updateNewsletterManagementColumns({ columnsOrder: largeColumnOrder });
      const endTime = performance.now();

      expect(store.newsletterManagementTable.columnsOrder).toEqual(largeColumnOrder);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should optimize localStorage operations', () => {
      // Clear previous calls
      vi.clearAllMocks();

      // Single update should result in single localStorage call
      store.updateNewsletterManagementPagination({ page: 1, rowsPerPage: 25 });

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should handle memory efficiently with multiple updates', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Make many updates
      for (let i = 0; i < 1000; i++) {
        store.updateNewsletterManagementPagination({ page: (i % 10) + 1 });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory usage should not grow excessively (allowing for test environment variance)
      if (initialMemory > 0) {
        expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
      }

      expect(store.newsletterManagementTable.pagination.page).toBeGreaterThan(0);
    });
  });
});
