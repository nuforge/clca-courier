import { computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';

export const useTheme = () => {
  const siteStore = useSiteStore();

  // Common theme-based class computations
  const cardClasses = computed(() => {
    if (siteStore.isDarkMode) {
      return 'bg-dark text-white q-dark';
    } else {
      return 'bg-white text-dark';
    }
  });

  const textClasses = computed(() => ({
    primary: siteStore.isDarkMode ? 'text-white' : 'text-dark',
    secondary: siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7',
    muted: siteStore.isDarkMode ? 'text-grey-6' : 'text-grey-5',
  }));

  const backgroundClasses = computed(() => ({
    page: siteStore.isDarkMode ? 'bg-dark-page' : 'bg-white',
    card: siteStore.isDarkMode ? 'bg-dark' : 'bg-white',
    surface: siteStore.isDarkMode ? 'bg-grey-9' : 'bg-grey-1',
  }));

  const borderClasses = computed(() => ({
    light: siteStore.isDarkMode ? 'border-grey-8' : 'border-grey-3',
    medium: siteStore.isDarkMode ? 'border-grey-7' : 'border-grey-4',
    dark: siteStore.isDarkMode ? 'border-grey-6' : 'border-grey-6',
  }));

  return {
    isDarkMode: computed(() => siteStore.isDarkMode),
    cardClasses,
    textClasses,
    backgroundClasses,
    borderClasses,
    toggleDarkMode: siteStore.toggleDarkMode,
    setDarkMode: siteStore.setDarkMode,
  };
};
