// Composable for managing user settings with reactive state
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storageService, type UserSettings, DEFAULT_SETTINGS } from '../services/storage-service';
import type { SupportedLocale } from '../i18n/utils/locale-detector';

// Helper function to convert reactive objects to plain objects for storage
function toPlainObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Global reactive state for settings
const userSettings = ref<UserSettings>(DEFAULT_SETTINGS);
const isSettingsLoaded = ref(false);
const isSettingsLoading = ref(false);

// Initialize settings on first use
let initPromise: Promise<void> | null = null;

async function initializeSettings(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      isSettingsLoading.value = true;
      const settings = await storageService.getUserSettings();
      userSettings.value = settings;
      isSettingsLoaded.value = true;
    } catch (error) {
      console.error('Failed to load user settings:', error);
      userSettings.value = DEFAULT_SETTINGS;
      isSettingsLoaded.value = true;
    } finally {
      isSettingsLoading.value = false;
    }
  })();

  return initPromise;
}

export const useUserSettings = () => {
  const $q = useQuasar();

  // Ensure settings are loaded
  if (!isSettingsLoaded.value && !isSettingsLoading.value) {
    void initializeSettings();
  }

  // Theme management
  const isDarkMode = computed(() => {
    if (userSettings.value.theme === 'auto') {
      // Use system preference or default
      return $q.dark.isActive;
    }
    return userSettings.value.theme === 'dark';
  });

  const currentTheme = computed(() => userSettings.value.theme);

  // Watch for theme changes and update Quasar
  watch(
    () => userSettings.value.theme,
    (newTheme) => {
      if (newTheme === 'auto') {
        $q.dark.set('auto');
      } else {
        $q.dark.set(newTheme === 'dark');
      }
    },
    { immediate: true },
  );

  // Theme actions
  async function setTheme(theme: 'light' | 'dark' | 'auto') {
    userSettings.value.theme = theme;
    await storageService.setTheme(theme);
  }

  async function toggleDarkMode() {
    const currentIsDark = isDarkMode.value;
    const newTheme = currentIsDark ? 'light' : 'dark';
    await setTheme(newTheme);
  }

  // Notification settings
  const notificationSettings = computed(() => userSettings.value.notifications);

  async function updateNotificationSettings(updates: Partial<UserSettings['notifications']>) {
    userSettings.value.notifications = { ...userSettings.value.notifications, ...updates };
    await storageService.setNotificationSettings(updates);
  }

  // Display settings
  const displaySettings = computed(() => userSettings.value.display);

  async function updateDisplaySettings(updates: Partial<UserSettings['display']>) {
    userSettings.value.display = { ...userSettings.value.display, ...updates };
    await storageService.setDisplaySettings(updates);
  }

  // Side menu collapsed state
  const sideMenuCollapsed = computed(() => userSettings.value.display.sideMenuCollapsed);

  async function setSideMenuCollapsed(collapsed: boolean) {
    userSettings.value.display.sideMenuCollapsed = collapsed;
    await storageService.setDisplaySettings({ sideMenuCollapsed: collapsed });
  }

  // PDF settings
  const pdfSettings = computed(() => userSettings.value.pdf);

  async function updatePdfSettings(updates: Partial<UserSettings['pdf']>) {
    userSettings.value.pdf = { ...userSettings.value.pdf, ...updates };
    await storageService.setPdfSettings(updates);
  }

  // Language setting
  const currentLanguage = computed(() => userSettings.value.language as SupportedLocale);

  async function setLanguage(language: SupportedLocale) {
    userSettings.value.language = language;
    await storageService.saveUserSettings({ language });
  }

  // Generic setting updater
  async function updateSettings(updates: Partial<UserSettings>) {
    // Update local state
    Object.assign(userSettings.value, updates);

    // Persist to storage
    await storageService.saveUserSettings(updates);
  }

  // Reset to defaults
  async function resetSettings() {
    userSettings.value = { ...DEFAULT_SETTINGS };
    // Convert reactive object to plain object to avoid DataCloneError
    const plainSettings = toPlainObject(userSettings.value);
    await storageService.saveUserSettings(plainSettings);
  }

  // Export/Import
  async function exportSettings(): Promise<string> {
    return storageService.exportSettings();
  }

  async function importSettings(settingsJson: string) {
    await storageService.importSettings(settingsJson);
    // Reload settings after import
    const newSettings = await storageService.getUserSettings();
    userSettings.value = newSettings;
  }

  return {
    // State
    userSettings: computed(() => userSettings.value),
    isSettingsLoaded: computed(() => isSettingsLoaded.value),
    isSettingsLoading: computed(() => isSettingsLoading.value),

    // Theme
    isDarkMode,
    currentTheme,
    setTheme,
    toggleDarkMode,

    // Notifications
    notificationSettings,
    updateNotificationSettings,

    // Display
    displaySettings,
    updateDisplaySettings,
    sideMenuCollapsed,
    setSideMenuCollapsed,

    // PDF
    pdfSettings,
    updatePdfSettings,

    // Language
    currentLanguage,
    setLanguage,

    // Generic
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,

    // Initialization
    initializeSettings,
  };
};
