/**
 * Locale Detection and Management Utilities
 *
 * Provides browser language detection, locale persistence, and locale switching
 * following the established architectural patterns.
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

import { logger } from 'src/utils/logger';

// Supported locales
export const SUPPORTED_LOCALES = ['en-US', 'es-ES'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Default fallback locale
export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

// Local storage key for persistence
const LOCALE_STORAGE_KEY = 'clca-courier-locale';

/**
 * Detects the user's preferred locale from browser settings
 *
 * @returns {SupportedLocale} The detected locale or default fallback
 */
export function detectBrowserLocale(): SupportedLocale {
  try {
    // Get browser languages in order of preference
    const browserLanguages = navigator.languages || [navigator.language];

    logger.debug('Browser languages detected:', browserLanguages);

    // Check each browser language against supported locales
    for (const browserLang of browserLanguages) {
      // Exact match (e.g., 'en-US')
      if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
        logger.info('Exact locale match found:', browserLang);
        return browserLang as SupportedLocale;
      }

      // Language code match (e.g., 'en' -> 'en-US', 'es' -> 'es-ES')
      const languageCode = browserLang.split('-')[0];
      if (languageCode) {
        const matchingLocale = SUPPORTED_LOCALES.find(locale =>
          locale.startsWith(languageCode)
        );

        if (matchingLocale) {
          logger.info('Language code match found:', `${languageCode} -> ${matchingLocale}`);
          return matchingLocale;
        }
      }
    }

    logger.info('No browser language match found, using default:', DEFAULT_LOCALE);
    return DEFAULT_LOCALE;
  } catch (error) {
    logger.error('Error detecting browser locale:', error);
    return DEFAULT_LOCALE;
  }
}

/**
 * Gets the stored locale from localStorage
 *
 * @returns {SupportedLocale | null} The stored locale or null if not found
 */
export function getStoredLocale(): SupportedLocale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);

    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      logger.debug('Retrieved stored locale:', stored);
      return stored as SupportedLocale;
    }

    logger.debug('No valid stored locale found');
    return null;
  } catch (error) {
    logger.error('Error retrieving stored locale:', error);
    return null;
  }
}

/**
 * Stores the locale in localStorage
 *
 * @param {SupportedLocale} locale - The locale to store
 */
export function storeLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    logger.debug('Stored locale preference:', locale);
  } catch (error) {
    logger.error('Error storing locale preference:', error);
  }
}

/**
 * Determines the initial locale to use on app startup
 * Priority: stored locale > browser detection > default
 *
 * @returns {SupportedLocale} The locale to use
 */
export function getInitialLocale(): SupportedLocale {
  // First check for stored preference
  const stored = getStoredLocale();
  if (stored) {
    logger.info('Using stored locale preference:', stored);
    return stored;
  }

  // Fall back to browser detection
  const detected = detectBrowserLocale();
  logger.info('Using detected browser locale:', detected);

  // Store the detected locale for future use
  storeLocale(detected);

  return detected;
}

/**
 * Validates if a locale is supported
 *
 * @param {string} locale - The locale to validate
 * @returns {boolean} True if the locale is supported
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Gets the display name for a locale
 *
 * @param {SupportedLocale} locale - The locale
 * @returns {string} The display name
 */
export function getLocaleDisplayName(locale: SupportedLocale): string {
  const displayNames: Record<SupportedLocale, string> = {
    'en-US': 'English',
    'es-ES': 'Español'
  };

  return displayNames[locale] || locale;
}

/**
 * Gets the native display name for a locale (in its own language)
 *
 * @param {SupportedLocale} locale - The locale
 * @returns {string} The native display name
 */
export function getLocaleNativeName(locale: SupportedLocale): string {
  const nativeNames: Record<SupportedLocale, string> = {
    'en-US': 'English',
    'es-ES': 'Español'
  };

  return nativeNames[locale] || locale;
}

/**
 * Gets the flag emoji for a locale (for UI display)
 *
 * @param {SupportedLocale} locale - The locale
 * @returns {string} The flag emoji
 */
export function getLocaleFlag(locale: SupportedLocale): string {
  const flags: Record<SupportedLocale, string> = {
    'en-US': '🇺🇸',
    'es-ES': '🇪🇸'
  };

  return flags[locale] || '🌐';
}

/**
 * Formats a date according to the given locale
 *
 * @param {Date | string} date - The date to format
 * @param {SupportedLocale} locale - The locale to use
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} The formatted date string
 */
export function formatDateForLocale(
  date: Date | string,
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Default formatting options
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const formatOptions = { ...defaultOptions, ...options };

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    logger.error('Error formatting date for locale:', error);
    return date.toString();
  }
}

/**
 * Formats a number according to the given locale
 *
 * @param {number} number - The number to format
 * @param {SupportedLocale} locale - The locale to use
 * @param {Intl.NumberFormatOptions} options - Formatting options
 * @returns {string} The formatted number string
 */
export function formatNumberForLocale(
  number: number,
  locale: SupportedLocale,
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    logger.error('Error formatting number for locale:', error);
    return number.toString();
  }
}
