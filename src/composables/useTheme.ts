import { computed } from 'vue';
import { useUserSettings } from './useUserSettings';

export const useTheme = () => {
  const userSettings = useUserSettings();

  // Common theme-based class computations
  const cardClasses = computed(() => {
    if (userSettings.isDarkMode.value) {
      return 'bg-dark text-white q-dark';
    } else {
      return 'bg-white text-dark';
    }
  });

  const textClasses = computed(() => ({
    primary: userSettings.isDarkMode.value ? 'text-white' : 'text-dark',
    secondary: userSettings.isDarkMode.value ? 'text-grey-4' : 'text-grey-7',
    muted: userSettings.isDarkMode.value ? 'text-grey-6' : 'text-grey-5',
  }));

  const backgroundClasses = computed(() => ({
    page: userSettings.isDarkMode.value ? 'bg-dark-page' : 'bg-white',
    card: userSettings.isDarkMode.value ? 'bg-dark' : 'bg-white',
    surface: userSettings.isDarkMode.value ? 'bg-grey-9' : 'bg-grey-1',
  }));

  const borderClasses = computed(() => ({
    light: userSettings.isDarkMode.value ? 'border-grey-8' : 'border-grey-3',
    medium: userSettings.isDarkMode.value ? 'border-grey-7' : 'border-grey-4',
    dark: userSettings.isDarkMode.value ? 'border-grey-6' : 'border-grey-6',
  }));

  return {
    isDarkMode: userSettings.isDarkMode,
    currentTheme: userSettings.currentTheme,
    cardClasses,
    textClasses,
    backgroundClasses,
    borderClasses,
    toggleDarkMode: userSettings.toggleDarkMode,
    setTheme: userSettings.setTheme,
    // Legacy compatibility
    setDarkMode: (value: boolean) => userSettings.setTheme(value ? 'dark' : 'light'),
  };
};
