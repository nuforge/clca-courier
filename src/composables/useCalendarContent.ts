/**
 * Calendar Content Composable - New Architecture
 * Provides reactive calendar state and event management using ContentDoc system
 *
 * This composable replaces useCalendar.ts and integrates with the new
 * composable content architecture using ContentDoc and features.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { calendarContentService, type CalendarEvent, type CalendarEventFilters } from '../services/calendar-content.service';
import { logger } from '../utils/logger';
import { getCurrentYear, getCurrentMonth } from '../utils/date-formatter';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
import { useTimeFormat } from './useTimeFormat';
import type { Unsubscribe } from 'firebase/firestore';

export interface CalendarState {
  currentMonth: number;
  currentYear: number;
  selectedDate: string | null;
  viewMode: 'month' | 'week' | 'day';
}

export const useCalendarContent = () => {
  const { t } = useI18n();
  const { effectiveTimeFormat } = useTimeFormat();

  // Reactive state
  const events = ref<CalendarEvent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Calendar state - initialize to current date
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0] ?? '';

  const calendarState = ref<CalendarState>({
    currentMonth: getCurrentMonth(), // 1-12
    currentYear: getCurrentYear(),
    selectedDate: todayISO, // Set default to today
    viewMode: 'month',
  });

  // Filters
  const filters = ref<CalendarEventFilters>({});

  // Subscription management
  let eventsSubscription: Unsubscribe | null = null;

  // Computed properties
  const currentDate = computed(() =>
    new Date(calendarState.value.currentYear, calendarState.value.currentMonth - 1)
  );

  const monthName = computed(() =>
    currentDate.value.toLocaleDateString('en-US', { month: 'long' })
  );

  const yearMonthKey = computed(() =>
    `${calendarState.value.currentYear}-${calendarState.value.currentMonth.toString().padStart(2, '0')}`
  );

  // Get events for current view with filters applied
  const currentViewEvents = computed(() => {
    let viewEvents: CalendarEvent[] = [];

    if (calendarState.value.viewMode === 'month') {
      viewEvents = getEventsForMonth(calendarState.value.currentYear, calendarState.value.currentMonth);
    } else if (calendarState.value.viewMode === 'day' && calendarState.value.selectedDate) {
      viewEvents = getEventsForDate(calendarState.value.selectedDate);
    } else {
      viewEvents = events.value;
    }

    // Apply filters
    return applyFiltersToEvents(viewEvents);
  });

  // Group events by date for calendar display (using filtered events)
  const eventsByDate = computed(() => {
    const grouped: Record<string, CalendarEvent[]> = {};

    currentViewEvents.value.forEach(event => {
      const dateKey = event.eventDate;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  });

  // Featured events for highlighting
  const featuredEvents = computed(() =>
    events.value.filter(event => event.featured)
  );

  // Upcoming events (next 7 days) - using filtered events
  const upcomingEvents = computed(() => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';

    const upcoming = events.value
      .filter(event => event.eventDate >= today && event.eventDate <= nextWeek)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

    // Apply filters to upcoming events
    return applyFiltersToEvents(upcoming);
  });

  // Event type options for filter (using translation keys)
  const eventTypeOptions = computed(() => [
    {
      label: t(TRANSLATION_KEYS.CONTENT.TYPES.EVENT),
      value: 'event'
    },
    {
      label: t(TRANSLATION_KEYS.CONTENT.TYPES.ANNOUNCEMENT),
      value: 'announcement'
    },
    {
      label: t(TRANSLATION_KEYS.CONTENT.TYPES.NEWS),
      value: 'article'
    },
    {
      label: t(TRANSLATION_KEYS.CONTENT.TYPES.CLASSIFIED),
      value: 'classified'
    },
    {
      label: t('content.types.photo'),
      value: 'photo'
    },
  ]);

  // Methods
  const loadEvents = async (loadFilters: CalendarEventFilters = {}) => {
    isLoading.value = true;
    error.value = null;

    try {
      const loadedEvents = await calendarContentService.getCalendarEvents({
        ...filters.value,
        ...loadFilters,
      }, effectiveTimeFormat.value);

      events.value = loadedEvents;
      logger.success(`Loaded ${loadedEvents.length} calendar events`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calendar events';
      error.value = errorMessage;
      logger.error('Failed to load calendar events', { error: err });
    } finally {
      isLoading.value = false;
    }
  };

  const loadEventsForMonth = async (year: number, month: number) => {
    isLoading.value = true;
    error.value = null;

    try {
      const monthEvents = await calendarContentService.getEventsForMonth(year, month, effectiveTimeFormat.value);
      events.value = monthEvents;
      logger.success(`Loaded ${monthEvents.length} events for ${month}/${year}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load month events';
      error.value = errorMessage;
      logger.error('Failed to load month events', { error: err, year, month });
    } finally {
      isLoading.value = false;
    }
  };

  const subscribeToEvents = (subscriptionFilters: CalendarEventFilters = {}) => {
    // Clean up existing subscription
    if (eventsSubscription) {
      eventsSubscription();
    }

    try {
      eventsSubscription = calendarContentService.subscribeToCalendarEvents(
        { ...filters.value, ...subscriptionFilters },
        (updatedEvents) => {
          events.value = updatedEvents;
          logger.info(`Real-time update: ${updatedEvents.length} calendar events`);
        },
        effectiveTimeFormat.value
      );
    } catch (err) {
      logger.error('Failed to subscribe to calendar events', { error: err });
    }
  };

  // Navigation methods
  const goToMonth = (year: number, month: number) => {
    calendarState.value.currentYear = year;
    calendarState.value.currentMonth = month;

    // Load events for the new month
    void loadEventsForMonth(year, month);
  };

  const goToNextMonth = () => {
    let { currentYear, currentMonth } = calendarState.value;

    if (currentMonth === 12) {
      currentYear += 1;
      currentMonth = 1;
    } else {
      currentMonth += 1;
    }

    goToMonth(currentYear, currentMonth);
  };

  const goToPreviousMonth = () => {
    let { currentYear, currentMonth } = calendarState.value;

    if (currentMonth === 1) {
      currentYear -= 1;
      currentMonth = 12;
    } else {
      currentMonth -= 1;
    }

    goToMonth(currentYear, currentMonth);
  };

  const goToToday = () => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0] ?? '';

    calendarState.value.currentYear = today.getFullYear();
    calendarState.value.currentMonth = today.getMonth() + 1;
    calendarState.value.selectedDate = todayISO;

    // Load events for current month
    void loadEventsForMonth(today.getFullYear(), today.getMonth() + 1);
  };

  const selectDate = (date: string) => {
    calendarState.value.selectedDate = date;
    calendarState.value.viewMode = 'day';
  };

  const setViewMode = (mode: CalendarState['viewMode']) => {
    calendarState.value.viewMode = mode;
  };

  // Filter methods
  const setFilters = (newFilters: Partial<CalendarEventFilters>) => {
    // Update filters with new values
    filters.value = { ...filters.value, ...newFilters };
    void loadEvents();
  };

  const clearFilter = (filterKey: keyof CalendarEventFilters) => {
    const updatedFilters = { ...filters.value };
    delete updatedFilters[filterKey];
    filters.value = updatedFilters;
    void loadEvents();
  };

  const clearFilters = () => {
    filters.value = {};
    void loadEvents();
  };

  // Helper methods
  const applyFiltersToEvents = (eventsToFilter: CalendarEvent[]): CalendarEvent[] => {
    let filteredEvents = [...eventsToFilter];

    // Filter by content types
    if (filters.value.contentTypes && filters.value.contentTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => {
        const eventContentType = calendarContentService.getEventContentType(event);
        return eventContentType && filters.value.contentTypes?.includes(eventContentType);
      });
    }

    // Filter by featured status
    if (filters.value.featured !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.featured === filters.value.featured);
    }

    return filteredEvents;
  };

  const getEventsForDate = (date: string): CalendarEvent[] => {
    return events.value.filter(event => event.eventDate === date);
  };

  const getFilteredEventsForDate = (date: string): CalendarEvent[] => {
    const dateEvents = getEventsForDate(date);
    return applyFiltersToEvents(dateEvents);
  };

  const getEventsForMonth = (year: number, month: number): CalendarEvent[] => {
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    return events.value.filter(event => event.eventDate.startsWith(prefix));
  };

  const hasEventsOnDate = (date: string): boolean => {
    return events.value.some(event => event.eventDate === date);
  };

  const getEventCountForDate = (date: string): number => {
    return events.value.filter(event => event.eventDate === date).length;
  };

  // Format utilities
  const formatEventTime = (event: CalendarEvent): string => {
    return calendarContentService.formatEventTime(event, effectiveTimeFormat.value);
  };

  const getEventIcon = (event: CalendarEvent): string => {
    const contentType = calendarContentService.getEventContentType(event);
    return calendarContentService.getEventTypeIcon(contentType || 'event');
  };

  const getEventColor = (event: CalendarEvent): string => {
    const contentType = calendarContentService.getEventContentType(event);
    return calendarContentService.getEventTypeColor(contentType || 'event');
  };

  // Lifecycle
  onMounted(() => {
    // Load events for current month
    void loadEventsForMonth(calendarState.value.currentYear, calendarState.value.currentMonth);
  });

  onUnmounted(() => {
    if (eventsSubscription) {
      eventsSubscription();
    }
  });

  return {
    // State
    events,
    isLoading,
    error,
    calendarState,
    filters,

    // Computed
    currentDate,
    monthName,
    yearMonthKey,
    currentViewEvents,
    eventsByDate,
    featuredEvents,
    upcomingEvents,
    eventTypeOptions,

    // Methods
    loadEvents,
    loadEventsForMonth,
    subscribeToEvents,

    // Navigation
    goToMonth,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    selectDate,
    setViewMode,

    // Filtering
    setFilters,
    clearFilter,
    clearFilters,

    // Utilities
    getEventsForDate,
    getFilteredEventsForDate,
    getEventsForMonth,
    hasEventsOnDate,
    getEventCountForDate,
    formatEventTime,
    getEventIcon,
    getEventColor,
  };
};
