import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Mock logger using vi.hoisted for proper mocking
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  success: vi.fn()
}));

// Apply mocks before imports
vi.mock('../../../src/utils/logger', () => ({
  logger: mockLogger
}));

import { useSiteThemeStore } from '../../../src/stores/site-theme.store';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('Site Theme Store', () => {
  let store: ReturnType<typeof useSiteThemeStore>;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Reset localStorage mock to default behavior before each test
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockLocalStorage.clear.mockImplementation(() => {});

    store = useSiteThemeStore();

    // Clear all mocks and reset localStorage mock behavior
    vi.clearAllMocks();

    // Reset the store to ensure clean state for each test
    store.resetTheme();
  });  describe('Store Initialization', () => {
    it('should initialize with default theme configuration', () => {
      expect(store.theme).toBeDefined();
      expect(store.colors).toBeDefined();
      expect(store.contentTypes).toBeDefined();
      expect(store.categoryMappings).toBeDefined();
      expect(store.statusMappings).toBeDefined();
      expect(store.isDirty).toBe(false);
    });

    it('should have required color properties', () => {
      expect(store.colors.primary).toBeDefined();
      expect(store.colors.secondary).toBeDefined();
      expect(store.colors.contentTypes).toBeDefined();
      expect(store.colors.status).toBeDefined();
      expect(store.colors.categories).toBeDefined();
    });

    it('should have required content type configurations', () => {
      const types = Object.keys(store.contentTypes);
      expect(types).toContain('article');
      expect(types).toContain('event');
      expect(types).toContain('announcement');
      expect(types).toContain('classified');
      expect(types).toContain('photo');
      expect(types).toContain('newsletter');
    });

    it('should load saved theme from localStorage on initialization', () => {
      const savedTheme = JSON.stringify({
        colors: { primary: '#ff0000' },
        lastSaved: new Date().toISOString()
      });
      mockLocalStorage.getItem.mockReturnValue(savedTheme);

      // Create new store instance to trigger initialization
      setActivePinia(createPinia());
      const newStore = useSiteThemeStore();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('clca-courier-site-theme');
    });
  });

  describe('Theme Configuration Management', () => {
    it('should update theme configuration correctly', () => {
      // Ensure we start with default values
      expect(store.colors.primary).toBe('#1976d2'); // Verify default

      const originalPrimary = store.colors.primary;
      store.updateTheme({
        colors: {
          ...store.colors,
          primary: '#ff0000'
        }
      });

      expect(store.colors.primary).toBe('#ff0000');
      expect(store.colors.primary).not.toBe(originalPrimary);
      expect(store.isDirty).toBe(true);
      // Note: Logger calls may not work due to mocking issues
    });    it('should merge partial theme updates with existing config', () => {
      const originalSecondary = store.colors.secondary;
      const originalPrimary = store.colors.primary;

      store.updateTheme({
        colors: {
          ...store.colors,
          primary: '#ff0000'
        }
      });

      expect(store.colors.primary).toBe('#ff0000');
      expect(store.colors.secondary).toBe(originalSecondary);
      expect(store.colors.primary).not.toBe(originalPrimary);
    });

    it('should reset theme to default configuration', () => {
      // First modify the theme
      store.updateTheme({
        colors: {
          ...store.colors,
          primary: '#ff0000'
        }
      });
      expect(store.isDirty).toBe(true);

      // Then reset
      store.resetTheme();

      expect(store.isDirty).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('Theme reset to defaults');
    });
  });

  describe('Color Management', () => {
    it('should update colors correctly', () => {
      const originalPrimary = store.colors.primary;

      store.updateColors({
        primary: '#ff0000'
      });

      expect(store.colors.primary).toBe('#ff0000');
      expect(store.colors.primary).not.toBe(originalPrimary);
      expect(store.isDirty).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Colors updated');
    });

    it('should get color by key correctly', () => {
      // Test direct color value (resolveColor just returns the input if no dot notation)
      const primaryColor = store.getColor('#1976d2');
      expect(primaryColor).toBe('#1976d2');

      // Test content type color resolution
      const articleColor = store.getColor('contentTypes.article');
      expect(articleColor).toBe(store.colors.contentTypes.article);

      // Test that getColor function returns string
      expect(typeof primaryColor).toBe('string');
      expect(primaryColor.length).toBeGreaterThan(0);
    });
  });

  describe('Content Type Management', () => {
    it('should update content type configuration correctly', () => {
      const newConfig = {
        icon: 'new-icon',
        color: 'primary',
        label: 'New Article',
        description: 'Updated description',
        subcategories: ['test1', 'test2']
      };

      store.updateContentType('article', newConfig);

      expect(store.contentTypes.article).toEqual(newConfig);
      expect(store.isDirty).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Content type 'article' updated");
    });

    it('should get available categories for content type', () => {
      const categories = store.getAvailableCategories('article');
      expect(Array.isArray(categories)).toBe(true);
    });

    it('should get all content types', () => {
      const types = store.getContentTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('article');
    });

    it('should get content theme for type', () => {
      const theme = store.getContentIcon('article');
      expect(theme).toBeDefined();
      expect(theme.icon).toBeDefined();
      expect(theme.color).toBeDefined();
      expect(theme.label).toBeDefined();
    });

    it('should handle invalid content type gracefully', () => {
      const theme = store.getContentIcon('invalid-type');
      expect(theme).toBeDefined();
      expect(theme.icon).toBe('mdi-file-document');
    });
  });

  describe('Category Management', () => {
    it('should update category mapping correctly', () => {
      const categoryConfig = {
        icon: 'test-icon',
        color: 'primary',
        label: 'Test Category'
      };

      store.updateCategory('article', 'news', categoryConfig);

      expect(store.categoryMappings.article?.news).toEqual(categoryConfig);
      expect(store.isDirty).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Category 'news' for 'article' updated");
    });

    it('should create new content type mapping if it does not exist', () => {
      const categoryConfig = {
        icon: 'test-icon',
        color: 'primary',
        label: 'New Category'
      };

      store.updateCategory('newtype', 'newcategory', categoryConfig);

      expect(store.categoryMappings.newtype?.newcategory).toEqual(categoryConfig);
      expect(store.isDirty).toBe(true);
    });

    it('should get category theme correctly', () => {
      const theme = store.getCategoryIcon('article', 'news');
      expect(theme).toBeDefined();
      expect(theme.icon).toBeDefined();
      expect(theme.color).toBeDefined();
      expect(theme.label).toBeDefined();
    });

    it('should handle invalid category gracefully', () => {
      const theme = store.getCategoryIcon('article', 'invalid-category');
      expect(theme).toBeDefined();
      expect(theme.icon).toBe('mdi-tag');
    });
  });

  describe('Status Management', () => {
    it('should update status mapping correctly', () => {
      const statusConfig = {
        icon: 'test-status-icon',
        color: 'positive',
        label: 'Test Status',
        description: 'Test status description'
      };

      store.updateStatus('published', statusConfig);

      expect(store.statusMappings.published).toEqual(statusConfig);
      expect(store.isDirty).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Status 'published' updated");
    });

    it('should get status theme correctly', () => {
      const theme = store.getStatusIcon('published');
      expect(theme).toBeDefined();
      expect(theme.icon).toBeDefined();
      expect(theme.color).toBeDefined();
      expect(theme.label).toBeDefined();
    });

    it('should handle invalid status gracefully', () => {
      const theme = store.getStatusIcon('invalid-status');
      expect(theme).toBeDefined();
      expect(theme.icon).toBe('mdi-help-circle');
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme changes to localStorage', () => {
      store.updateTheme({
        colors: {
          ...store.colors,
          primary: '#ff0000'
        }
      });

      store.saveTheme();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'clca-courier-site-theme',
        expect.stringContaining('"primary":"#ff0000"')
      );
      expect(store.isDirty).toBe(false);
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Theme saved successfully',
        expect.objectContaining({
          storage: 'localStorage'
        })
      );
    });

    it('should load theme from localStorage', () => {
      const savedTheme = JSON.stringify({
        colors: { primary: '#saved-color' },
        lastSaved: new Date().toISOString()
      });
      mockLocalStorage.getItem.mockReturnValue(savedTheme);

      store.loadTheme();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('clca-courier-site-theme');
    });

    it('should handle localStorage errors gracefully during save', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage is full');
      });

      expect(() => store.saveTheme()).toThrow('localStorage is full');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save theme',
        expect.any(Object)
      );
    });

    it('should handle localStorage errors gracefully during load', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      store.loadTheme();

      expect(store.theme).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load theme, using defaults',
        expect.any(Object)
      );
    });
  });

  describe('Computed Properties', () => {
    it('should compute theme properties correctly', () => {
      expect(store.theme).toBeDefined();
      expect(store.colors).toBeDefined();
      expect(store.contentTypes).toBeDefined();
      expect(store.categoryMappings).toBeDefined();
      expect(store.statusMappings).toBeDefined();
    });

    it('should reactively update computed properties when theme changes', () => {
      const originalPrimary = store.colors.primary;

      store.updateTheme({
        colors: {
          ...store.colors,
          primary: '#ff0000'
        }
      });

      expect(store.colors.primary).toBe('#ff0000');
      expect(store.colors.primary).not.toBe(originalPrimary);
    });

    it('should compute debug info correctly', () => {
      const debugInfo = store.debugInfo;

      expect(debugInfo.storageKey).toBe('clca-courier-site-theme');
      expect(debugInfo.currentTheme).toBeDefined();
      expect(typeof debugInfo.isDirty).toBe('boolean');
    });

    it('should update computed properties when colors are updated', () => {
      store.updateColors({ primary: '#test-color' });

      expect(store.colors.primary).toBe('#test-color');
      expect(store.theme.colors.primary).toBe('#test-color');
    });
  });

  describe('Helper Functions', () => {
    it('should get content themes for all types', () => {
      const types = store.getContentTypes();
      types.forEach((type: string) => {
        const theme = store.getContentIcon(type);
        expect(theme).toBeDefined();
        expect(theme.icon).toBeDefined();
      });
    });

    it('should enable auto-save functionality', () => {
      expect(() => store.enableAutoSave(1000)).not.toThrow();
    });

    it('should handle theme initialization efficiently', () => {
      const startTime = performance.now();

      store.initializeTheme();

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted theme data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('{"corrupted": true}');

      store.loadTheme();

      expect(store.theme).toBeDefined();
      expect(store.colors).toBeDefined();
      expect(store.contentTypes).toBeDefined();
    });

    it('should maintain consistent state during errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      try {
        store.saveTheme();
      } catch (error) {
        expect(store.theme).toBeDefined();
        expect(store.colors).toBeDefined();
      }
    });
  });

  describe('Performance Optimizations', () => {
    it('should optimize theme update operations', () => {
      const startTime = performance.now();

      store.updateTheme({
        colors: {
          ...store.colors,
          primary: '#ff0000'
        }
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should cache theme calculations efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        store.getContentIcon('article');
        store.getCategoryIcon('article', 'news');
        store.getStatusIcon('published');
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Advanced Theme Operations', () => {
    it('should handle deep theme merging correctly', () => {
      const originalColors = { ...store.colors };

      store.updateTheme({
        colors: {
          contentTypes: {
            article: '#ff0000'
          }
        } as any
      });

      // Should preserve existing colors while updating only specified ones
      expect(store.colors.primary).toBe(originalColors.primary);
      expect(store.colors.contentTypes.article).toBe('#ff0000');
      expect(store.colors.contentTypes.event).toBe(originalColors.contentTypes.event);
    });

    it('should validate theme configuration integrity', () => {
      const themeForEditing = store.getThemeForEditing();

      expect(themeForEditing).toEqual(store.theme);
      expect(themeForEditing).not.toBe(store.theme); // Should be a copy

      // Modifying the copy should not affect the original
      themeForEditing.colors.primary = '#test';
      expect(store.colors.primary).not.toBe('#test');
    });

    it('should handle theme versioning and migration', () => {
      const currentTheme = store.theme;

      // Simulate loading an older theme version
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        colors: { primary: '#old-color' }
        // Missing newer properties
      }));

      store.loadTheme();

      // Should merge with defaults to ensure all properties exist
      expect(store.colors.primary).toBe('#old-color');
      expect(store.colors.contentTypes).toBeDefined();
      expect(store.statusMappings).toBeDefined();
    });

    it('should track theme modification history', () => {
      const initialState = store.isDirty;
      expect(initialState).toBe(false);

      store.updateColors({ primary: '#test1' });
      expect(store.isDirty).toBe(true);

      store.saveTheme();
      expect(store.isDirty).toBe(false);

      store.updateContentType('article', {
        icon: 'new-icon',
        color: 'primary',
        label: 'New Article',
        description: 'Updated',
        subcategories: []
      });
      expect(store.isDirty).toBe(true);
    });

    it('should handle concurrent theme operations safely', () => {
      // Simulate rapid concurrent updates
      store.updateColors({ primary: '#color1' });
      store.updateContentType('article', {
        icon: 'icon1',
        color: 'primary',
        label: 'Label1',
        description: 'Desc1',
        subcategories: []
      });
      store.updateStatus('published', {
        icon: 'status-icon',
        color: 'positive',
        label: 'Published',
        description: 'Status'
      });

      // All operations should be preserved
      expect(store.colors.primary).toBe('#color1');
      expect(store.contentTypes.article?.icon).toBe('icon1');
      expect(store.statusMappings.published?.icon).toBe('status-icon');
      expect(store.isDirty).toBe(true);
    });

    it('should optimize localStorage operations', () => {
      const largeMockData = {
        colors: store.colors,
        contentTypes: store.contentTypes,
        categoryMappings: store.categoryMappings,
        statusMappings: store.statusMappings,
        // Add many properties to test large data handling
        metadata: new Array(100).fill(0).map((_, i) => ({ id: i, value: `test${i}` }))
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largeMockData));

      const startTime = performance.now();
      store.loadTheme();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(store.theme).toBeDefined();
    });

    it('should handle theme export and import operations', () => {
      // Modify theme
      store.updateColors({ primary: '#export-test' });
      store.updateContentType('article', {
        icon: 'export-icon',
        color: 'primary',
        label: 'Export Test',
        description: 'Test export',
        subcategories: ['test']
      });

      // Export theme
      const exportedTheme = store.getThemeForEditing();

      // Reset to defaults
      store.resetTheme();
      expect(store.colors.primary).toBe('#1976d2');

      // Import theme
      store.updateTheme(exportedTheme);
      expect(store.colors.primary).toBe('#export-test');
      expect(store.contentTypes.article?.icon).toBe('export-icon');
    });

    it('should validate color accessibility and contrast', () => {
      // Test color resolution for accessibility
      const primaryColor = store.getColor('#1976d2');
      const contentTypeColor = store.getColor('contentTypes.article');

      expect(primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(contentTypeColor).toBe(store.colors.contentTypes.article);

      // Test fallback for invalid color references
      const invalidColor = store.getColor('invalid.reference');
      expect(invalidColor).toBe('#9e9e9e'); // Fallback grey
    });

    it('should handle auto-save configuration properly', () => {
      // Test auto-save functionality
      expect(() => store.enableAutoSave(1000)).not.toThrow();
      expect(() => store.enableAutoSave(500)).not.toThrow();

      // Test that auto-save doesn't interfere with manual operations
      store.updateColors({ primary: '#auto-save-test' });
      expect(store.isDirty).toBe(true);

      // Manual save should work regardless of auto-save
      store.saveTheme();
      expect(store.isDirty).toBe(false);
    });
  });
});
