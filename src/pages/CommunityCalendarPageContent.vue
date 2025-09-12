<!--
  Community Calendar Page - New Architecture
  Displays community events using the unified ContentDoc system
-->
<template>
  <q-page padding>
    <div class="calendar-page">
      <!-- Page Header -->
      <div class="row items-center justify-between q-mb-lg">
        <div class="col">
          <h1 class="text-h4 q-ma-none text-weight-light">
            <q-icon name="mdi-calendar-month" class="q-mr-sm" />
            {{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.TITLE) }}
          </h1>
          <p class="text-subtitle1 text-grey-6 q-ma-none q-mt-xs">
            {{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.SUBTITLE) }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            round
            icon="mdi-calendar-today"
            @click="goToToday"
            :loading="isLoading"
            :aria-label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.NAVIGATION.GO_TO_TODAY)"
            color="primary"
          >
            <q-tooltip>{{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.TODAY) }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Calendar Toolbar -->
      <q-card flat class="q-mb-md">
        <q-card-section class="q-pa-md">
          <div class="row items-center justify-between">
            <!-- Page Title and Info -->
            <div class="row items-center q-gutter-sm">
              <div class="text-h6">
                {{ monthName }} {{ calendarState.currentYear }}
              </div>
              <q-chip
                v-if="filteredEventsCount > 0"
                color="primary"
                text-color="white"
                :label="`${filteredEventsCount} ${$t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENTS_ON_DATE).split(' ')[0]}`"
                size="sm"
              />
            </div>

            <!-- Filters and Actions -->
            <div class="row items-center q-gutter-sm">
              <!-- Event Type Filter -->
              <q-select
                v-model="filters.contentTypes"
                multiple
                dense
                outlined
                :label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.FILTERS.EVENT_TYPES)"
                :options="eventTypeOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                clearable
                style="min-width: 200px"
                @update:model-value="applyFilters"
                :aria-label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.FILTERS.EVENT_TYPES)"
              >
                <template v-slot:option="{ itemProps, opt }">
                  <q-item v-bind="itemProps">
                    <q-item-section avatar>
                      <q-icon :name="getEventIcon({ tags: [`content-type:${opt.value}`] } as any)" :color="getEventColor({ tags: [`content-type:${opt.value}`] } as any)" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <!-- Featured Events Filter -->
              <q-toggle
                v-model="showFeaturedOnly"
                :label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.FILTERS.FEATURED_ONLY)"
                @update:model-value="applyFilters"
                color="amber"
                :aria-label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.FILTERS.FEATURED_ONLY)"
              />

              <!-- Refresh Button -->
              <q-btn
                flat
                round
                icon="mdi-refresh"
                @click="refreshEvents"
                :loading="isLoading"
                :aria-label="$t(TRANSLATION_KEYS.COMMON.REFRESH)"
                color="primary"
              >
                <q-tooltip>{{ $t(TRANSLATION_KEYS.COMMON.REFRESH) }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading State -->
      <q-inner-loading :showing="isLoading && events.length === 0">
        <q-spinner-dots size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error State -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        <template v-slot:avatar>
          <q-icon name="mdi-alert-circle" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat :label="$t(TRANSLATION_KEYS.COMMON.RETRY)" @click="refreshEvents" />
        </template>
      </q-banner>

      <!-- Two Column Layout -->
      <div class="row q-col-gutter-lg">
        <!-- Left Column: Calendar and Events List -->
        <div class="col-12 col-lg-8">
          <!-- Calendar Grid -->
          <q-card flat class="calendar-grid shadow-1 q-mb-md">
            <q-card-section class="q-pa-none">
              <!-- Calendar Component -->
              <q-date
                :key="calendarKey"
                v-model="calendarModel"
                :events="calendarEvents"
                :event-color="getEventColorForDate"
                today-btn
                class="full-width"
                @update:model-value="onDateSelect"
                @navigation="onCalendarNavigation"
                landscape
                :default-year-month="defaultYearMonth"
                :navigation-min-year-month="`2020/01`"
                :navigation-max-year-month="`2030/12`"
                flat
                emit-immediately
                :aria-label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.TITLE)"
                ref="calendarRef"
              />
            </q-card-section>
          </q-card>

          <!-- Monthly Events List -->
          <q-card flat class="shadow-1">
            <q-card-section>
              <div class="text-h6 q-mb-md text-weight-light">
                <q-icon name="mdi-calendar-month" class="q-mr-sm" color="primary" />
                {{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENTS_FOR_MONTH, { month: monthName, year: calendarState.currentYear }) }}
              </div>

              <!-- Events grouped by day -->
              <div v-if="monthlyEventsGrouped.length > 0" class="q-gutter-sm">
                <q-expansion-item
                  v-for="dayGroup in monthlyEventsGrouped"
                  :key="dayGroup.date"
                  :label="formatDayGroupLabel(dayGroup)"
                  :caption="`${dayGroup.events.length} ${dayGroup.events.length === 1 ? $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENT) : $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENTS)}`"
                  :model-value="isExpansionOpen(dayGroup.date)"
                  @update:model-value="(isOpen) => onExpansionChange(dayGroup.date, isOpen)"
                  header-class="text-weight-medium"
                  class="monthly-events-group"
                >
                  <template v-slot:header>
                    <div class="row items-center full-width">
                      <div class="col">
                        <div class="text-subtitle2">{{ formatDayGroupLabel(dayGroup) }}</div>
                        <div class="text-caption text-grey-6">
                          {{ dayGroup.events.length }} {{ dayGroup.events.length === 1 ? $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENT) : $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENTS) }}
                        </div>
                      </div>
                      <div class="col-auto">
                        <q-chip
                          v-for="event in dayGroup.events.slice(0, 3)"
                          :key="event.id"
                          dense
                          square
                          :color="getEventColor(event)"
                          text-color="white"
                          size="xs"
                          :icon="getEventIcon(event)"
                          class="q-mr-xs"
                        />
                        <q-chip
                          v-if="dayGroup.events.length > 3"
                          dense
                          square
                          color="grey-4"
                          text-color="grey-8"
                          size="xs"
                          :label="`+${dayGroup.events.length - 3}`"
                        />
                      </div>
                    </div>
                  </template>

                  <div class="q-gutter-sm q-pt-sm">
                    <CalendarEventCardContent
                      v-for="event in dayGroup.events"
                      :key="event.id"
                      :event="event"
                      compact
                      @click="onEventClick(event)"
                    />
                  </div>
                </q-expansion-item>
              </div>

              <!-- No events message -->
              <div v-else class="text-center q-pa-lg text-grey-6">
                <q-icon name="mdi-calendar-blank" size="48px" class="q-mb-md" />
                <div class="text-subtitle1">{{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.NO_EVENTS_THIS_MONTH) }}</div>
                <div class="text-caption">{{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.NO_EVENTS_THIS_MONTH_DESC) }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Right Column: Event Details Pane -->
        <div class="col-12 col-lg-4">
          <q-card flat class="shadow-1 sticky-details-pane">
            <q-card-section>
              <div class="text-h6 q-mb-md text-weight-light">
                <q-icon name="mdi-information-outline" class="q-mr-sm" color="primary" />
                {{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENT_DETAILS) }}
              </div>

              <!-- Event Details Content -->
              <div v-if="selectedEvent" class="event-details-content">
                <!-- Event Category -->
                <div class="text-overline q-mb-sm" :class="`text-${getEventColor(selectedEvent)}`">
                  <q-icon :name="getEventIcon(selectedEvent)" size="sm" class="q-mr-xs" />
                  {{ formatCategoryName(selectedEvent) }}
                </div>

                <!-- Event Title -->
                <div class="text-h6 q-mb-md text-weight-medium">
                  {{ selectedEvent.title }}
                  <q-icon
                    v-if="selectedEvent.featured"
                    name="mdi-star"
                    color="amber"
                    size="sm"
                    class="q-ml-sm"
                  />
                </div>

                <!-- Event Date & Time -->
                <div class="q-mb-md">
                  <div class="text-subtitle2 q-mb-xs">
                    <q-icon name="mdi-calendar" class="q-mr-xs" />
                    {{ formatSelectedDate(selectedEvent.eventDate) }}
                  </div>
                  <div v-if="selectedEvent.eventTime || selectedEvent.eventEndTime" class="text-body2">
                    <q-icon name="mdi-clock" class="q-mr-xs" />
                    <span v-if="selectedEvent.allDay">{{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.ALL_DAY) }}</span>
                    <span v-else>
                      {{ selectedEvent.eventTime || 'TBD' }}
                      <span v-if="selectedEvent.eventEndTime"> - {{ selectedEvent.eventEndTime }}</span>
                    </span>
                  </div>
                </div>

                <!-- Event Location -->
                <div v-if="selectedEvent.eventLocation" class="q-mb-md">
                  <div class="text-subtitle2 q-mb-xs">
                    <q-icon name="mdi-map-marker" class="q-mr-xs" />
                    {{ $t(TRANSLATION_KEYS.FORMS.LOCATION) }}
                  </div>
                  <div class="text-body2">{{ selectedEvent.eventLocation }}</div>
                </div>

                <!-- Event Content -->
                <div class="q-mb-md">
                  <div class="text-subtitle2 q-mb-xs">
                    <q-icon name="mdi-text" class="q-mr-xs" />
                    {{ $t(TRANSLATION_KEYS.FORMS.DESCRIPTION) }}
                  </div>
                  <div class="text-body1" style="white-space: pre-line;">
                    {{ selectedEvent.description }}
                  </div>
                </div>

                <!-- Event Tags -->
                <div v-if="selectedEvent.tags.length > 0" class="q-mb-md">
                  <div class="text-subtitle2 q-mb-xs">
                    <q-icon name="mdi-tag" class="q-mr-xs" />
                    {{ $t(TRANSLATION_KEYS.CONTENT.TAGS) }}
                  </div>
                  <div class="q-gutter-xs">
                    <q-chip
                      v-for="tag in getDisplayTags(selectedEvent)"
                      :key="tag"
                      dense
                      square
                      color="grey-3"
                      text-color="grey-8"
                      size="sm"
                      :label="tag"
                    />
                  </div>
                </div>

                <!-- Event Author -->
                <div class="q-mb-md">
                  <div class="text-caption text-grey-6">
                    {{ $t(TRANSLATION_KEYS.COMMON.BY) }} {{ selectedEvent.authorName }}
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="q-gutter-sm">
                  <q-btn
                    color="primary"
                    :label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.EXPORT_TO_CALENDAR)"
                    icon="mdi-calendar-export"
                    @click="exportToCalendar(selectedEvent)"
                    class="full-width"
                  />
                  <q-btn
                    color="secondary"
                    :label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.SHARE_EVENT)"
                    icon="mdi-share"
                    @click="shareEvent(selectedEvent)"
                    class="full-width"
                  />
                </div>
              </div>

              <!-- No Event Selected -->
              <div v-else class="text-center q-pa-lg text-grey-6">
                <q-icon name="mdi-cursor-default-click" size="48px" class="q-mb-md" />
                <div class="text-subtitle1">{{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.SELECT_EVENT_FOR_DETAILS) }}</div>
                <div class="text-caption">{{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.SELECT_EVENT_FOR_DETAILS_DESC) }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useCalendarContent } from '../composables/useCalendarContent';
import type { CalendarEvent } from '../services/calendar-content.service';
import CalendarEventCardContent from '../components/calendar/CalendarEventCardContent.vue';
import { logger } from '../utils/logger';
import { formatDate, getCurrentYear, getCurrentMonth, parseDateOnly } from '../utils/date-formatter';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

const { t } = useI18n();
const $q = useQuasar();

// Helper function for formatting category names
const formatCategoryName = (event: CalendarEvent): string => {
  const contentType = event.tags.find(tag => tag.startsWith('content-type:'))?.split(':')[1];
  if (contentType) {
    return t(`content.types.${contentType}`);
  }
  return t(TRANSLATION_KEYS.CONTENT.TYPES.EVENT);
};

// Use calendar composable
const {
  events,
  isLoading,
  error,
  calendarState,
  filters,
  monthName,
  eventsByDate,
  eventTypeOptions,
  goToToday,
  loadEventsForMonth,
  getEventsForDate,
  getEventIcon,
  getEventColor,
  setFilters,
  clearFilter,
} = useCalendarContent();

// Local state - initialize with today's date
const today = new Date();
const todayFormatted = `${getCurrentYear()}/${getCurrentMonth().toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
const selectedDateModel = ref<string | null>(todayFormatted);
const showFeaturedOnly = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);
const calendarRef = ref();
const isNavigating = ref(false); // Flag to track when we're navigating months

// Expansion panel state management
const expansionState = ref<Record<string, boolean>>({}); // Track which days are manually closed
const autoOpenedDays = ref<Set<string>>(new Set()); // Track days opened by calendar selection

// Computed properties
const calendarEvents = computed(() => {
  // q-date expects an array of date strings in YYYY/MM/DD format
  return Object.keys(eventsByDate.value).map(date => {
    // Convert from YYYY-MM-DD to YYYY/MM/DD
    return date.replace(/-/g, '/');
  });
});

// Computed for filtered events count
const filteredEventsCount = computed(() => {
  return Object.values(eventsByDate.value).flat().length;
});

// Computed for monthly events grouped by day
const monthlyEventsGrouped = computed(() => {
  const grouped: Array<{ date: string; events: CalendarEvent[] }> = [];

  // Get all events for the current month
  const allEvents = Object.values(eventsByDate.value).flat();

  // Group events by date
  const eventsByDateMap = new Map<string, CalendarEvent[]>();

  allEvents.forEach(event => {
    const dateKey = event.eventDate; // Already in YYYY-MM-DD format
    if (!eventsByDateMap.has(dateKey)) {
      eventsByDateMap.set(dateKey, []);
    }
    eventsByDateMap.get(dateKey)!.push(event);
  });

  // Convert to array and sort by date
  eventsByDateMap.forEach((events, date) => {
    grouped.push({
      date,
      events: events.sort((a, b) => {
        // Sort by time if available, otherwise by title
        if (a.eventTime && b.eventTime) {
          return a.eventTime.localeCompare(b.eventTime);
        }
        return a.title.localeCompare(b.title);
      })
    });
  });

  // Sort groups by date
  return grouped.sort((a, b) => a.date.localeCompare(b.date));
});

// Computed to determine if an expansion item should be open
const isExpansionOpen = (date: string): boolean => {
  // If user manually closed this day, respect that
  if (expansionState.value[date] === false) {
    return false;
  }

  // If user manually opened this day, respect that
  if (expansionState.value[date] === true) {
    return true;
  }

  // Default to open for all days (unless manually closed)
  return true;
};

// Reactive state to force calendar updates
const calendarUpdateTrigger = ref(0);

// Computed for calendar view to force updates when month/year changes
const calendarKey = computed(() => {
  // Force complete re-render when month/year changes
  const monthYear = `${calendarState.value.currentYear}-${calendarState.value.currentMonth}`;
  return `calendar-${monthYear}-${calendarUpdateTrigger.value}`;
});

const defaultYearMonth = computed(() =>
  `${calendarState.value.currentYear}/${calendarState.value.currentMonth.toString().padStart(2, '0')}`
);

// Force calendar to update when month/year changes
const calendarModel = computed({
  get: () => selectedDateModel.value,
  set: (value) => {
    // Only update the selected date model if we're not navigating months
    // This prevents the calendar from changing the selected date during navigation
    if (!isNavigating.value) {
      selectedDateModel.value = value;
      logger.debug('🗓️ Updated selectedDateModel from user selection:', value);
    } else {
      logger.debug('🗓️ Ignored selectedDateModel update during navigation:', value);
    }
  }
});


// Methods
const onCalendarNavigation = (view: { year: number; month: number }) => {
  logger.debug('🗓️ Calendar navigation triggered:', view);
  logger.debug('🗓️ Current calendar state before update:', {
    currentYear: calendarState.value.currentYear,
    currentMonth: calendarState.value.currentMonth
  });

  // Set navigation flag to prevent model updates during navigation
  isNavigating.value = true;

  // Store the current selected date to preserve it
  const currentSelectedDate = selectedDateModel.value;

  // Update calendar state when user navigates in the q-date component
  calendarState.value.currentYear = view.year;
  calendarState.value.currentMonth = view.month;

  logger.debug('🗓️ Calendar state after update:', {
    currentYear: calendarState.value.currentYear,
    currentMonth: calendarState.value.currentMonth
  });

  // Load events for the new month
  void loadEventsForMonth(view.year, view.month);

  // Don't clear expansion state - let user preferences persist across months
  // This allows users to close a day and have it stay closed when navigating back

  // Clear navigation flag after a short delay to allow calendar to update
  void nextTick(() => {
    isNavigating.value = false;
    logger.debug('🗓️ Navigation flag cleared, selected date preserved:', currentSelectedDate);
  });
};

// Method to force calendar to update its view
const forceCalendarUpdate = () => {
  logger.debug('🗓️ Forcing calendar update for month:', calendarState.value.currentMonth);

  // Force complete re-render by incrementing the trigger
  calendarUpdateTrigger.value += 1;

  logger.debug('🗓️ Calendar trigger incremented to:', calendarUpdateTrigger.value);
};

const onDateSelect = (date: string | string[] | null) => {
  logger.debug('🗓️ Date selected:', { date, type: typeof date });

  let selectedDate: string | null = null;

  if (typeof date === 'string') {
    // Convert from YYYY/MM/DD to YYYY-MM-DD
    selectedDate = date.replace(/\//g, '-');
  } else if (Array.isArray(date) && date.length > 0 && date[0]) {
    // Convert from YYYY/MM/DD to YYYY-MM-DD
    selectedDate = date[0].replace(/\//g, '-');
  }

  logger.debug('🗓️ Converted selectedDate:', selectedDate);

  if (selectedDate) {
    // Don't switch to day view - keep in month view and just show selected date events
    calendarState.value.selectedDate = selectedDate;

    // Only update selectedDateModel if we're not navigating
    if (!isNavigating.value) {
      selectedDateModel.value = date as string;
    }

    // Open the corresponding expansion panel for this date
    openExpansionForDate(selectedDate);

    // Debug the events for this date
    const eventsForDate = getEventsForDate(selectedDate);
    logger.debug('🗓️ Events found for date:', {
      selectedDate,
      eventsCount: eventsForDate.length,
      events: eventsForDate
    });
  }
};

const onEventClick = (event: CalendarEvent) => {
  selectedEvent.value = event;
};

// Handle expansion panel state changes
const onExpansionChange = (date: string, isOpen: boolean) => {
  logger.debug('🗓️ Expansion state changed:', { date, isOpen });

  // Track user's manual state changes
  expansionState.value[date] = isOpen;

  // Remove from auto-opened set if user manually closes
  if (!isOpen) {
    autoOpenedDays.value.delete(date);
  }
};

// Handle calendar date selection to open corresponding expansion panel
const openExpansionForDate = (date: string) => {
  logger.debug('🗓️ Opening expansion for date:', date);

  // Only auto-open if the user hasn't manually closed this day
  // If expansionState[date] is explicitly false, respect that choice
  if (expansionState.value[date] !== false) {
    autoOpenedDays.value.add(date);
    expansionState.value[date] = true;
  } else {
    logger.debug('🗓️ Respecting user preference to keep date closed:', date);
  }
};

const refreshEvents = () => {
  void loadEventsForMonth(calendarState.value.currentYear, calendarState.value.currentMonth);
};


const applyFilters = () => {
  const newFilters: typeof filters.value = {};

  if (filters.value.contentTypes && filters.value.contentTypes.length > 0) {
    newFilters.contentTypes = filters.value.contentTypes;
  }

  if (showFeaturedOnly.value) {
    newFilters.featured = true;
  } else {
    // Clear the featured filter when toggle is off
    clearFilter('featured');
    return; // Early return since clearFilter already calls loadEvents
  }

  // Apply filters using the composable method
  setFilters(newFilters);
};

const getEventColorForDate = (date: string): string => {
  // Convert from YYYY/MM/DD to YYYY-MM-DD
  const dateKey = date.replace(/\//g, '-');

  // Get events for this date
  const eventsForDate = getEventsForDate(dateKey);

  if (eventsForDate.length === 0) {
    return 'primary'; // Default color if no events
  }

  // If there's only one event, use its color
  if (eventsForDate.length === 1) {
    const event = eventsForDate[0];
    return event ? getEventColor(event) : 'primary';
  }

  // If there are multiple events, prioritize featured events, then use the first event's color
  const featuredEvent = eventsForDate.find(event => event.featured);
  if (featuredEvent) {
    return getEventColor(featuredEvent);
  }

  // Use the first event's color as fallback
  const firstEvent = eventsForDate[0];
  return firstEvent ? getEventColor(firstEvent) : 'primary';
};

const formatSelectedDate = (dateStr: string) => {
  // Handle date-only strings (YYYY-MM-DD) to avoid timezone issues
  const cleanDateStr = dateStr.includes('/') ? dateStr.replace(/\//g, '-') : dateStr;

  // Parse date components to create timezone-neutral date
  const parts = cleanDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(p => isNaN(p))) {
    logger.warn('🗓️ Invalid date format:', dateStr);
    return 'Invalid Date';
  }

  // Since we validated the parts array, we know these exist and are valid numbers
  const year = parts[0] as number;
  const month = parts[1] as number;
  const day = parts[2] as number;

  // Create date in local timezone to avoid UTC offset issues
  const date = new Date(year, month - 1, day); // month is 0-indexed

  return formatDate(date, 'FULL');
};

const formatDayGroupLabel = (dayGroup: { date: string; events: CalendarEvent[] }) => {
  // Use centralized date parsing to avoid timezone issues
  const date = parseDateOnly(dayGroup.date);
  if (!date) {
    logger.warn('Invalid date in formatDayGroupLabel:', dayGroup.date);
    return 'Invalid Date';
  }

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return `${formatDate(date, 'SHORT')} (${t(TRANSLATION_KEYS.CONTENT.CALENDAR.TODAY)})`;
  }

  return formatDate(date, 'SHORT');
};

const getDisplayTags = (event: CalendarEvent): string[] => {
  // Filter out content-type tags and system tags, show only meaningful tags
  return event.tags.filter(tag =>
    !tag.startsWith('content-type:') &&
    !tag.startsWith('featured:') &&
    !tag.startsWith('status:')
  );
};

const exportToCalendar = (event: CalendarEvent) => {
  // Generate ICS file for calendar export
  const startDate = new Date(event.eventDate);
  if (!startDate) {
    logger.warn('Invalid event date for calendar export:', event.eventDate);
    return;
  }

  if (event.eventTime && !event.allDay) {
    const timeParts = event.eventTime.split(':');
    const hours = parseInt(timeParts[0] || '0', 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    startDate.setHours(hours, minutes);
  }

  const endDate = new Date(startDate);
  if (event.eventEndTime && !event.allDay) {
    const timeParts = event.eventEndTime.split(':');
    const hours = parseInt(timeParts[0] || '0', 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    endDate.setHours(hours, minutes);
  } else if (event.allDay) {
    endDate.setDate(endDate.getDate() + 1);
  } else {
    endDate.setHours(endDate.getHours() + 1); // Default 1 hour
  }

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CLCA Courier//Calendar Event//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDateForICS(startDate)}`,
    `DTEND:${formatDateForICS(endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    ...(event.eventLocation ? [`LOCATION:${event.eventLocation}`] : []),
    `UID:${event.id}@clca-courier.com`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  $q.notify({
    message: t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENT_EXPORTED),
    color: 'positive',
    icon: 'mdi-calendar-export',
  });
};

const shareEvent = (event: CalendarEvent) => {
  const shareData = {
    title: event.title,
    text: `${event.title}\n\n${event.description}`,
    url: window.location.href,
  };

  if (navigator.share && window.isSecureContext) {
    navigator.share(shareData).catch(() => {
      // Fallback to copying to clipboard
      copyToClipboard(event);
    });
  } else {
    copyToClipboard(event);
  }
};

const copyToClipboard = (event: CalendarEvent) => {
  const eventText = `${event.title}\n\nDate: ${formatSelectedDate(event.eventDate)}\n${event.eventLocation ? `Location: ${event.eventLocation}\n` : ''}\n${event.description}`;

  navigator.clipboard.writeText(eventText).then(() => {
    $q.notify({
      message: t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENT_COPIED),
      color: 'positive',
      icon: 'mdi-content-copy',
    });
  }).catch(() => {
    $q.notify({
      message: t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENT_COPY_FAILED),
      color: 'negative',
      icon: 'mdi-alert',
    });
  });
};

// Watch calendar state changes and update selectedDateModel accordingly
watch(() => calendarState.value, (newState) => {
  logger.debug('🗓️ Calendar state changed:', newState);

  // Only update selectedDateModel if the selectedDate actually changed
  // Don't update during month navigation
  if (newState.selectedDate) {
    // Convert from YYYY-MM-DD to YYYY/MM/DD for q-date
    const formattedDate = newState.selectedDate.replace(/-/g, '/');
    if (selectedDateModel.value !== formattedDate) {
      selectedDateModel.value = formattedDate;
      logger.debug('🗓️ Updated selectedDateModel from calendar state:', formattedDate);
    }
  }
}, { deep: true });

// Watch for month/year changes - keep selected date unchanged for better UX
watch(() => [calendarState.value.currentYear, calendarState.value.currentMonth], ([year, month]) => {
  logger.debug('🗓️ Month/Year changed:', { year, month });
  // Note: We intentionally do NOT change the selected date when navigating months
  // This allows users to keep their selected date when browsing different months

  // Force calendar to update its view when month changes
  forceCalendarUpdate();
});

// Watch monthName changes
watch(() => monthName.value, (newMonthName) => {
  logger.debug('🗓️ Month name changed:', newMonthName);
});

// Initialize calendar on mount
onMounted(() => {
  // Ensure calendar state is properly initialized
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0] ?? '';

  logger.debug('🗓️ Today date info:', {
    today: today.toString(),
    todayISO,
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate()
  });

  // Update calendar state to match today
  calendarState.value.currentYear = today.getFullYear();
  calendarState.value.currentMonth = today.getMonth() + 1;
  calendarState.value.selectedDate = todayISO;

  // Update selectedDateModel to match
  const todayFormatted = `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
  selectedDateModel.value = todayFormatted;

  // Load events for current month
  void loadEventsForMonth(today.getFullYear(), today.getMonth() + 1);

  logger.debug('🗓️ Calendar page mounted and initialized with today:', {
    todayISO,
    todayFormatted,
    calendarState: calendarState.value
  });
});
</script>

<style scoped>
.calendar-page {
  max-width: 1200px;
  margin: 0 auto;
}

.calendar-day {
  position: relative;
  height: 100%;
  min-height: 40px;
}

.calendar-day-number {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 12px;
  font-weight: 500;
}

.calendar-day-events {
  position: absolute;
  bottom: 2px;
  left: 2px;
  right: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.calendar-event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.calendar-event-more {
  font-size: 8px;
  color: #666;
  margin-left: 2px;
}

:deep(.q-date__calendar-item) {
  height: 60px;
}

:deep(.q-date__calendar-item--in) {
  border: 1px solid rgba(0,0,0,0.1);
}

.sticky-details-pane {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.monthly-events-group {
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.event-details-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>
