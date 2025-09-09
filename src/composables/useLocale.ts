/**
 * Locale Management Composable
 *
 * Provides reactive locale switching, persistence, and utility functions
 * following the established architectural patterns.
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type SupportedLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  storeLocale,
  getLocaleDisplayName,
  getLocaleNativeName,
  getLocaleFlag,
  formatDateForLocale,
  formatNumberForLocale
} from 'src/i18n/utils/locale-detector';
import { logger } from 'src/utils/logger';

/**
 * Locale management composable
 *
 * @returns {object} Locale management interface
 */
export function useLocale() {
  const { locale: i18nLocale } = useI18n();

  // Current locale state
  const currentLocale = computed<SupportedLocale>({
    get: () => i18nLocale.value as SupportedLocale,
    set: (value: SupportedLocale) => {
      i18nLocale.value = value;
    }
  });

  // Available locales for selection
  const locales = computed(() =>
    SUPPORTED_LOCALES.map(locale => ({
      value: locale,
      label: getLocaleDisplayName(locale),
      nativeLabel: getLocaleNativeName(locale),
      flag: getLocaleFlag(locale)
    }))
  );

  // Watch for locale changes and persist them
  watch(currentLocale, (newLocale) => {
    storeLocale(newLocale);
    logger.info('Locale changed to:', newLocale);
  });

  /**
   * Switch to a new locale
   *
   * @param {SupportedLocale} newLocale - The locale to switch to
   */
  const switchLocale = (newLocale: SupportedLocale) => {
    try {
      if (SUPPORTED_LOCALES.includes(newLocale)) {
        currentLocale.value = newLocale;
        logger.info('Successfully switched locale to:', newLocale);
      } else {
        logger.warn('Attempted to switch to unsupported locale:', newLocale);
      }
    } catch (error) {
      logger.error('Error switching locale:', error);
    }
  };

  /**
   * Toggle between available locales
   */
  const toggleLocale = () => {
    const currentIndex = SUPPORTED_LOCALES.indexOf(currentLocale.value);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LOCALES.length;
    const nextLocale = SUPPORTED_LOCALES[nextIndex];
    if (nextLocale) {
      switchLocale(nextLocale);
    }
  };

  /**
   * Check if current locale is specific language
   */
  const isEnglish = computed(() => currentLocale.value === 'en-US');
  const isSpanish = computed(() => currentLocale.value === 'es-ES');

  /**
   * Get current locale display information
   */
  const currentLocaleInfo = computed(() => ({
    code: currentLocale.value,
    displayName: getLocaleDisplayName(currentLocale.value),
    nativeName: getLocaleNativeName(currentLocale.value),
    flag: getLocaleFlag(currentLocale.value)
  }));

  /**
   * Format date according to current locale
   *
   * @param {Date | string} date - The date to format
   * @param {Intl.DateTimeFormatOptions} options - Formatting options
   * @returns {string} Formatted date string
   */
  const formatDate = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    return formatDateForLocale(date, currentLocale.value, options);
  };

  /**
   * Format number according to current locale
   *
   * @param {number} number - The number to format
   * @param {Intl.NumberFormatOptions} options - Formatting options
   * @returns {string} Formatted number string
   */
  const formatNumber = (
    number: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    return formatNumberForLocale(number, currentLocale.value, options);
  };

  /**
   * Get direction for current locale (future RTL support)
   */
  const direction = computed(() => {
    // All current locales are LTR, but this prepares for RTL languages
    return 'ltr';
  });

  /**
   * Get HTML lang attribute value
   */
  const htmlLang = computed(() => currentLocale.value.toLowerCase());

  return {
    // Current state
    currentLocale,
    currentLocaleInfo,

    // Available options
    locales,
    availableLocales: SUPPORTED_LOCALES,

    // Actions
    switchLocale,
    toggleLocale,

    // Utilities
    isEnglish,
    isSpanish,
    direction,
    htmlLang,

    // Formatting
    formatDate,
    formatNumber,

    // Constants
    DEFAULT_LOCALE
  };
}
