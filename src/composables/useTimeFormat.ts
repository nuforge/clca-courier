/**
 * Time Format Composable
 *
 * Provides centralized time format management with user preferences,
 * browser detection, and consistent formatting across the application.
 */

import { computed } from 'vue';
import { useUserSettings } from './useUserSettings';
import { logger } from '../utils/logger';

export type TimeFormatPreference = 'auto' | '12hour' | '24hour';

export const useTimeFormat = () => {
  const { timeFormatSettings, updateTimeFormatSettings } = useUserSettings();

  /**
   * Detect browser's default time format preference
   */
  const detectBrowserTimeFormat = (): boolean => {
    try {
      // Create a test date and format it to see if browser uses 12h or 24h
      const testDate = new Date(2024, 0, 1, 13, 0, 0); // 1 PM
      const formatted = testDate.toLocaleTimeString([], {
        hour: 'numeric',
        hour12: undefined // Let browser decide
      });

      // If it contains 'PM' or 'AM', it's 12-hour format
      return formatted.includes('PM') || formatted.includes('AM');
    } catch (error) {
      logger.warn('Failed to detect browser time format, defaulting to 24-hour:', error);
      return false; // Default to 24-hour
    }
  };

  /**
   * Get the effective time format setting
   */
  const effectiveTimeFormat = computed((): boolean => {
    const preference = timeFormatSettings.value.use24Hour;

    switch (preference) {
      case '12hour':
        return false; // 12-hour format
      case '24hour':
        return true; // 24-hour format
      case 'auto':
      default:
        return !detectBrowserTimeFormat(); // Browser default (inverted because we want use24Hour boolean)
    }
  });

  /**
   * Get time format preference as string for display
   */
  const timeFormatPreference = computed(() => timeFormatSettings.value.use24Hour);

  /**
   * Update time format preference
   */
  const setTimeFormatPreference = async (preference: TimeFormatPreference) => {
    await updateTimeFormatSettings({ use24Hour: preference });
    logger.debug('Time format preference updated:', preference);
  };

  /**
   * Get example time string for current format
   */
  const getTimeFormatExample = computed((): string => {
    const testDate = new Date(2024, 0, 1, 20, 30, 0); // 8:30 PM
    return testDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !effectiveTimeFormat.value
    });
  });

  /**
   * Format time string according to user preference
   */
  const formatTime = (timeString: string): string => {
    try {
      // If it's already in HH:MM format, convert to Date and reformat
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date(2024, 0, 1, hours, minutes, 0);
        return date.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: !effectiveTimeFormat.value
        });
      }

      // If it's already formatted, return as-is
      return timeString;
    } catch (error) {
      logger.warn('Failed to format time string:', { timeString, error });
      return timeString;
    }
  };

  /**
   * Get time format options for settings UI
   */
  const timeFormatOptions = computed(() => [
    {
      label: 'Auto (Browser Default)',
      value: 'auto' as TimeFormatPreference,
      description: `Uses your browser's default format (${getTimeFormatExample.value})`
    },
    {
      label: '12-Hour Format (AM/PM)',
      value: '12hour' as TimeFormatPreference,
      description: '8:30 PM, 12:00 AM, 1:15 PM'
    },
    {
      label: '24-Hour Format',
      value: '24hour' as TimeFormatPreference,
      description: '20:30, 00:00, 13:15'
    }
  ]);

  return {
    // State
    timeFormatPreference,
    effectiveTimeFormat,
    timeFormatOptions,
    getTimeFormatExample,

    // Actions
    setTimeFormatPreference,
    formatTime,

    // Utilities
    detectBrowserTimeFormat
  };
};
