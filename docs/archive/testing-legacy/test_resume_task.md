// tests/unit/stores/site-theme.store.test.ts

// Mock localStorage and DOM APIs using established patterns
const mockLocalStorage = vi.hoisted(() => {
    const storage: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => storage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            storage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete storage[key];
        }),
        clear: vi.fn(() => {
            Object.keys(storage).forEach(key => delete storage[key]);
        }),
        length: 0,
        key: vi.fn()
    };
});

const mockDocument = vi.hoisted(() => ({
    documentElement: {
        style: {},
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(() => false),
            toggle: vi.fn()
        }
    },
    body: {
        style: {},
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(() => false),
            toggle: vi.fn()
        }
    }
}));

const mockQuasar = vi.hoisted(() => ({
    dark: {
        set: vi.fn(),
        toggle: vi.fn(),
        isActive: false
    },
    localStorage: mockLocalStorage,
    colors: {
        setPalette: vi.fn(),
        getBrand: vi.fn(() => '#1976d2')
    }
}));

const mockLogger = vi.hoisted(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    success: vi.fn()
}));

// Apply mocks
vi.mock('quasar', () => ({
    useQuasar: () => mockQuasar
}));

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

Object.defineProperty(global, 'document', {
    value: mockDocument
});

vi.mock('../../../src/utils/logger', () => ({
    logger: mockLogger
}));

import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSiteThemeStore } from '../../../src/stores/site-theme.store';
import type { ThemeConfig, ColorPalette, FontSettings, IconConfig } from '../../../src/types/core/theme.types';

describe('Site Theme Store Implementation', () => {
    let store: ReturnType<typeof useSiteThemeStore>;

    // Sample test data factories
    const createSampleThemeConfig = (overrides: Partial<ThemeConfig> = {}): ThemeConfig => ({
        id: 'custom-theme',
        name: 'Custom Theme',
        isDark: false,
        colors: {
            primary: '#1976d2',
            secondary: '#424242',
            accent: '#82b1ff',
            dark: '#1d1d1d',
            positive: '#21ba45',
            negative: '#c10015',
            info: '#31ccec',
            warning: '#f2c037'
        },
        fonts: {
            primary: 'Roboto',
            secondary: 'Arial',
            size: {
                small: '12px',
                medium: '14px',
                large: '16px',
                xlarge: '18px'
            }
        },
        icons: {
            newsletter: 'description',
            community: 'people',
            events: 'event',
            classifieds: 'store',
            admin: 'admin_panel_settings'
        },
        customCSS: '',
        ...overrides
    });

    const createSampleColorPalette = (overrides: Partial<ColorPalette> = {}): ColorPalette => ({
        primary: '#1976d2',
        secondary: '#424242',
        accent: '#82b1ff',
        dark: '#1d1d1d',
        positive: '#21ba45',
        negative: '#c10015',
        info: '#31ccec',
        warning: '#f2c037',
        ...overrides
    });

    const createSampleFontSettings = (overrides: Partial<FontSettings> = {}): FontSettings => ({
        primary: 'Roboto',
        secondary: 'Arial',
        size: {
            small: '12px',
            medium: '14px',
            large: '16px',
            xlarge: '18px'
        },
        ...overrides
    });

    beforeEach(() => {
        // Create fresh Pinia instance
        setActivePinia(createPinia());
        store = useSiteThemeStore();

        // Reset all mocks
        vi.clearAllMocks();
        
        // Reset localStorage mock storage
        mockLocalStorage.clear();
        
        // Reset DOM mock states
        mockDocument.documentElement.classList.contains.mockReturnValue(false);
        mockDocument.body.classList.contains.mockReturnValue(false);
        mockQuasar.dark.isActive = false;
    });

    afterEach(() => {
        // Cleanup any DOM modifications
        if (store.cleanup) {
            store.cleanup();
        }
    });

    describe('Store Initialization', () => {
        it('should initialize with default theme configuration', () => {
            expect(store.currentTheme).toBeDefined();
            expect(store.currentTheme.name).toBe('Default Theme');
            expect(store.isDarkMode).toBe(false);
            expect(store.customThemes).toEqual([]);
            expect(store.isThemeEditorOpen).toBe(false);
        });

        it('should load saved theme from localStorage on initialization', () => {
            const savedTheme = createSampleThemeConfig({ name: 'Saved Theme' });
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedTheme));
            
            // Re-initialize store to trigger localStorage loading
            setActivePinia(createPinia());
            store = useSiteThemeStore();
            
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('site-theme-config');
            expect(store.currentTheme.name).toBe('Saved Theme');
        });

        it('should handle corrupted localStorage data gracefully', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid-json');
            
            // Re-initialize store
            setActivePinia(createPinia());
            store = useSiteThemeStore();
            
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Failed to load theme from localStorage, using default'
            );
            expect(store.currentTheme.name).toBe('Default Theme');
        });

        it('should initialize with system dark mode preference', () => {
            // Mock system dark mode
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: vi.fn().mockImplementation(query => ({
                    matches: query === '(prefers-color-scheme: dark)',
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                })),
            });

            setActivePinia(createPinia());
            store = useSiteThemeStore();
            
            expect(store.systemPrefersDark).toBe(true);
        });

        it('should set up theme change listeners on initialization', () => {
            expect(store.isInitialized).toBe(true);
            expect(mockLogger.debug).toHaveBeenCalledWith('Theme store initialized');
        });

        it('should validate theme configuration on initialization', () => {
            const invalidTheme = { name: 'Invalid', colors: { primary: 'not-a-color' } };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidTheme));
            
            setActivePinia(createPinia());
            store = useSiteThemeStore();
            
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Invalid theme configuration loaded, falling back to default'
            );
            expect(store.currentTheme.name).toBe('Default Theme');
        });
    });

    describe('Theme Management Operations', () => {
        it('should apply theme configuration to DOM', async () => {
            const theme = createSampleThemeConfig({ isDark: true });
            
            await store.applyTheme(theme);
            
            expect(mockQuasar.dark.set).toHaveBeenCalledWith(true);
            expect(mockQuasar.colors.setPalette).toHaveBeenCalledWith(theme.colors);
            expect(store.currentTheme).toEqual(theme);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'site-theme-config',
                JSON.stringify(theme)
            );
        });

        it('should toggle dark mode correctly', async () => {
            store.currentTheme.isDark = false;
            
            await store.toggleDarkMode();
            
            expect(store.isDarkMode).toBe(true);
            expect(mockQuasar.dark.toggle).toHaveBeenCalled();
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('should create and save custom theme', async () => {
            const customTheme = createSampleThemeConfig({ name: 'My Custom Theme' });
            
            await store.saveCustomTheme(customTheme);
            
            expect(store.customThemes).toContain(customTheme);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'custom-themes',
                JSON.stringify([customTheme])
            );
            expect(mockLogger.success).toHaveBeenCalledWith('Custom theme saved successfully');
        });

        it('should delete custom theme', async () => {
            const customTheme = createSampleThemeConfig({ id: 'theme-to-delete' });
            store.customThemes = [customTheme];
            
            await store.deleteCustomTheme('theme-to-delete');
            
            expect(store.customThemes).not.toContain(customTheme);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('custom-themes', JSON.stringify([]));
        });

        it('should reset to default theme', async () => {
            const customTheme = createSampleThemeConfig({ name: 'Custom' });
            store.currentTheme = customTheme;
            
            await store.resetToDefaultTheme();
            
            expect(store.currentTheme.name).toBe('Default Theme');
            expect(mockQuasar.dark.set).toHaveBeenCalledWith(false);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('site-theme-config');
        });

        it('should export theme configuration', () => {
            const theme = createSampleThemeConfig();
            store.currentTheme = theme;
            
            const exported = store.exportTheme();
            
            expect(exported).toEqual(JSON.stringify(theme, null, 2));
            expect(mockLogger.info).toHaveBeenCalledWith('Theme configuration exported');
        });

        it('should import theme configuration', async () => {
            const theme = createSampleThemeConfig({ name: 'Imported Theme' });
            const themeJson = JSON.stringify(theme);
            
            const result = await store.importTheme(themeJson);
            
            expect(result).toBe(true);
            expect(store.currentTheme).toEqual(theme);
            expect(mockLogger.success).toHaveBeenCalledWith('Theme imported successfully');
        });
    });

    describe('Color Palette Management', () => {
        it('should update color palette', async () => {
            const newColors = createSampleColorPalette({ primary: '#ff5722' });
            
            await store.updateColorPalette(newColors);
            
            expect(store.currentTheme.colors).toEqual(newColors);
            expect(mockQuasar.colors.setPalette).toHaveBeenCalledWith(newColors);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('should validate color values before updating', async () => {
            const invalidColors = { primary: 'not-a-color' } as ColorPalette;
            
            const result = await store.updateColorPalette(invalidColors);
            
            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Invalid color palette provided');
        });

        it('should generate color variations automatically', () => {
            const baseColor = '#1976d2';
            
            const variations = store.generateColorVariations(baseColor);
            
            expect(variations).toHaveProperty('light');
            expect(variations).toHaveProperty('dark');
            expect(variations.light).not.toBe(baseColor);
            expect(variations.dark).not.toBe(baseColor);
        });

        it('should apply accessibility contrast checks', () => {
            const backgroundColor = '#ffffff';
            const textColor = '#000000';
            
            const isAccessible = store.checkColorContrast(backgroundColor, textColor);
            
            expect(isAccessible).toBe(true);
        });

        it('should suggest accessible color combinations', () => {
            const baseColor = '#1976d2';
            
            const suggestions = store.getAccessibleColorSuggestions(baseColor);
            
            expect(suggestions).toHaveProperty('lightText');
            expect(suggestions).toHaveProperty('darkText');
            expect(Array.isArray(suggestions.complementary)).toBe(true);
        });
    });

    describe('Font Settings Management', () => {
        it('should update font settings', async () => {
            const newFonts = createSampleFontSettings({ primary: 'Inter' });
            
            await store.updateFontSettings(newFonts);
            
            expect(store.currentTheme.fonts).toEqual(newFonts);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('should apply font settings to DOM', async () => {
            const fonts = createSampleFontSettings({ primary: 'Inter' });
            
            await store.applyFontSettings(fonts);
            
            expect(mockDocument.documentElement.style).toHaveProperty('--font-primary', 'Inter');
            expect(mockLogger.debug).toHaveBeenCalledWith('Font settings applied to DOM');
        });

        it('should validate font availability', () => {
            const fontName = 'Roboto';
            
            const isAvailable = store.isFontAvailable(fontName);
            
            expect(typeof isAvailable).toBe('boolean');
        });

        it('should load custom fonts dynamically', async () => {
            const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter';
            
            await store.loadCustomFont(fontUrl);
            
            expect(mockLogger.info).toHaveBeenCalledWith('Custom font loaded successfully');
        });
    });

    describe('Icon Configuration', () => {
        it('should update icon configuration', async () => {
            const newIcons: IconConfig = {
                newsletter: 'article',
                community: 'group',
                events: 'calendar_today',
                classifieds: 'shopping_cart',
                admin: 'settings'
            };
            
            await store.updateIconConfig(newIcons);
            
            expect(store.currentTheme.icons).toEqual(newIcons);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('should validate icon names', () => {
            const iconName = 'invalid_icon_name';
            
            const isValid = store.isValidIcon(iconName);
            
            expect(isValid).toBe(false);
        });

        it('should get icon suggestions based on category', () => {
            const category = 'navigation';
            
            const suggestions = store.getIconSuggestions(category);
            
            expect(Array.isArray(suggestions)).toBe(true);
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });

    describe('Theme Editor Integration', () => {
        it('should open theme editor', () => {
            store.openThemeEditor();
            
            expect(store.isThemeEditorOpen).toBe(true);
            expect(mockLogger.debug).toHaveBeenCalledWith('Theme editor opened');
        });

        it('should close theme editor', () => {
            store.isThemeEditorOpen = true;
            
            store.closeThemeEditor();
            
            expect(store.isThemeEditorOpen).toBe(false);
        });

        it('should preview theme changes without applying', () => {
            const previewTheme = createSampleThemeConfig({ name: 'Preview Theme' });
            
            store.previewTheme(previewTheme);
            
            expect(store.previewTheme).toBeDefined();
            expect(mockQuasar.colors.setPalette).toHaveBeenCalledWith(previewTheme.colors);
            // Should not save to localStorage during preview
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });

        it('should cancel theme preview and restore original', () => {
            const originalTheme = store.currentTheme;
            const previewTheme = createSampleThemeConfig({ name: 'Preview' });
            
            store.previewTheme(previewTheme);
            store.cancelThemePreview();
            
            expect(store.currentTheme).toEqual(originalTheme);
            expect(mockQuasar.colors.setPalette).toHaveBeenCalledWith(originalTheme.colors);
        });

        it('should apply previewed theme changes', async () => {
            const previewTheme = createSampleThemeConfig({ name: 'Preview Theme' });
            store.previewTheme(previewTheme);
            
            await store.applyPreviewedTheme();
            
            expect(store.currentTheme).toEqual(previewTheme);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            expect(store.previewTheme).toBeNull();
        });
    });

    describe('Error Handling', () => {
        it('should handle localStorage errors gracefully', async () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('localStorage full');
            });
            
            const theme = createSampleThemeConfig();
            await store.applyTheme(theme);
            
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to save theme configuration:',
                expect.any(Error)
            );
            expect(store.currentTheme).toEqual(theme); // Should still apply in memory
        });

        it('should handle invalid theme import', async () => {
            const invalidJson = 'invalid json';
            
            const result = await store.importTheme(invalidJson);
            
            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to import theme: Invalid JSON');
        });

        it('should handle font loading failures', async () => {
            const invalidFontUrl = 'invalid-url';
            
            await store.loadCustomFont(invalidFontUrl);
            
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to load custom font:',
                expect.any(Error)
            );
        });

        it('should recover from DOM manipulation errors', async () => {
            mockDocument.documentElement.style = null as any;
            
            const fonts = createSampleFontSettings();
            await store.applyFontSettings(fonts);
            
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to apply font settings to DOM:',
                expect.any(Error)
            );
        });
    });

    describe('Computed Properties', () => {
        it('should compute available themes correctly', () => {
            const customTheme = createSampleThemeConfig({ name: 'Custom' });
            store.customThemes = [customTheme];
            
            const availableThemes = store.availableThemes;
            
            expect(availableThemes).toContain(store.defaultTheme);
            expect(availableThemes).toContain(customTheme);
            expect(availableThemes.length).toBe(2);
        });

        it('should compute theme validation status', () => {
            store.currentTheme = createSampleThemeConfig();
            
            const isValid = store.isCurrentThemeValid;
            
            expect(isValid).toBe(true);
        });

        it('should compute theme changes status', () => {
            const originalTheme = store.currentTheme;
            store.currentTheme = createSampleThemeConfig({ name: 'Modified' });
            
            const hasChanges = store.hasUnsavedChanges;
            
            expect(hasChanges).toBe(true);
        });

        it('should compute contrast ratios for accessibility', () => {
            store.currentTheme.colors.primary = '#1976d2';
            
            const contrastRatios = store.accessibilityMetrics;
            
            expect(contrastRatios).toHaveProperty('primaryContrast');
            expect(typeof contrastRatios.primaryContrast).toBe('number');
        });

        it('should compute theme preview availability', () => {
            const canPreview = store.canPreviewTheme;
            
            expect(typeof canPreview).toBe('boolean');
        });
    });

    describe('Performance Optimizations', () => {
        it('should debounce theme updates during rapid changes', async () => {
            const theme1 = createSampleThemeConfig({ name: 'Theme 1' });
            const theme2 = createSampleThemeConfig({ name: 'Theme 2' });
            
            // Rapid successive calls
            store.applyTheme(theme1);
            store.applyTheme(theme2);
            
            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Should only save the final theme
            expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
        });

        it('should cache font availability checks', () => {
            const fontName = 'Roboto';
            
            // First call
            const result1 = store.isFontAvailable(fontName);
            // Second call (should use cache)
            const result2 = store.isFontAvailable(fontName);
            
            expect(result1).toBe(result2);
            expect(mockLogger.debug).toHaveBeenCalledWith('Font availability cached for:', fontName);
        });

        it('should optimize DOM updates during theme application', async () => {
            const theme = createSampleThemeConfig();
            
            await store.applyTheme(theme);
            
            // Should batch DOM updates
            expect(mockLogger.debug).toHaveBeenCalledWith('DOM updates batched for performance');
        });
    });
});