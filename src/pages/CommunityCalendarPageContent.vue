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

      <!-- Calendar Grid -->
      <q-card flat class="calendar-grid shadow-1">
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
            :aria-label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.TITLE)"
          />

          <!-- Events list for selected date -->
          <div v-if="selectedDateModel && getEventsForSelectedDate().length > 0" class="q-pa-md" :class="backgroundClasses.surface">
            <div class="text-subtitle1 q-mb-md text-weight-medium">
              <q-icon name="mdi-calendar-check" class="q-mr-sm" color="primary" />
              {{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENTS_ON_DATE, { date: formatSelectedDate(selectedDateModel.replace(/\//g, '-')) }) }}
            </div>
            <div class="q-gutter-sm">
              <CalendarEventCardContent
                v-for="event in getEventsForSelectedDate()"
                :key="event.id"
                :event="event"
                compact
                @click="onEventClick(event)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Selected Date Events Panel -->
      <q-card v-if="selectedDateModel && getEventsForSelectedDate().length > 0" flat class="q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-calendar-check" class="q-mr-sm" />
            {{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EVENTS_ON_DATE, { date: formatSelectedDate(selectedDateModel.replace(/\//g, '-')) }) }}
          </div>
          <div class="row q-col-gutter-md">
            <div
              v-for="event in getEventsForSelectedDate()"
              :key="event.id"
              class="col-12 col-md-6"
            >
              <CalendarEventCardContent
                :event="event"
                @click="onEventClick(event)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Upcoming Events Sidebar -->
      <q-card v-if="upcomingEvents.length > 0" flat class="q-mt-md shadow-1">
        <q-card-section>
          <div class="text-h6 q-mb-md text-weight-light">
            <q-icon name="mdi-calendar-clock" class="q-mr-sm" color="primary" />
            {{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.UPCOMING_EVENTS) }}
          </div>

          <div class="q-gutter-sm">
            <CalendarEventCardContent
              v-for="event in upcomingEvents.slice(0, 3)"
              :key="event.id"
              :event="event"
              compact
              @click="onEventClick(event)"
            />

            <q-btn
              v-if="upcomingEvents.length > 3"
              flat
              color="primary"
              :label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.VIEW_ALL_UPCOMING)"
              @click="showAllUpcoming = true"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Event Details Dialog -->
      <q-dialog v-model="showEventDialog" position="right" full-height>
        <q-card style="width: 500px; max-width: 90vw;" role="dialog" aria-labelledby="event-dialog-title">
          <q-card-section class="row items-center q-pb-none">
            <div id="event-dialog-title" class="text-h6">{{ selectedEvent?.title }}</div>
            <q-space />
            <q-btn
              icon="close"
              flat
              round
              dense
              v-close-popup
              :aria-label="$t(TRANSLATION_KEYS.COMMON.ACCESSIBILITY.CLOSE_DIALOG)"
            />
          </q-card-section>

          <q-card-section v-if="selectedEvent">
            <!-- Event Category -->
            <div class="text-overline q-mb-sm" :class="`text-${getEventColor(selectedEvent)}`">
              <q-icon :name="getEventIcon(selectedEvent)" size="sm" class="q-mr-xs" />
              {{ formatCategoryName(selectedEvent) }}
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

            <!-- Event Author -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-6">
                {{ $t(TRANSLATION_KEYS.COMMON.BY) }} {{ selectedEvent.authorName }}
              </div>
            </div>

            <!-- Featured Badge -->
            <q-badge v-if="selectedEvent.featured" color="amber" text-color="black" class="q-mt-sm">
              <q-icon name="star" size="xs" class="q-mr-xs" />
              {{ $t(TRANSLATION_KEYS.FORMS.FEATURED) }}
            </q-badge>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- All Upcoming Events Dialog -->
      <q-dialog v-model="showAllUpcoming">
        <q-card style="min-width: 400px; max-width: 600px" role="dialog" aria-labelledby="upcoming-events-title">
          <q-card-section>
            <div id="upcoming-events-title" class="text-h6">
              <q-icon name="mdi-calendar-clock" class="q-mr-sm" color="primary" />
              {{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.ALL_UPCOMING_EVENTS) }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="q-gutter-sm">
              <CalendarEventCardContent
                v-for="event in upcomingEvents"
                :key="event.id"
                :event="event"
                @click="onEventClick(event)"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat :label="$t(TRANSLATION_KEYS.COMMON.CLOSE)" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCalendarContent } from '../composables/useCalendarContent';
import { useTheme } from '../composables/useTheme';
import type { CalendarEvent } from '../services/calendar-content.service';
import CalendarEventCardContent from '../components/calendar/CalendarEventCardContent.vue';
import { logger } from '../utils/logger';
import { formatDate } from '../utils/date-formatter';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

const { t } = useI18n();
const { backgroundClasses } = useTheme();

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
  upcomingEvents,
  eventTypeOptions,
  goToToday,
  loadEventsForMonth,
  getEventsForDate,
  getFilteredEventsForDate,
  getEventIcon,
  getEventColor,
  setFilters,
  clearFilter,
} = useCalendarContent();

// Local state - initialize with today's date
const today = new Date();
const todayFormatted = `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
const selectedDateModel = ref<string | null>(todayFormatted);
const showFeaturedOnly = ref(false);
const showEventDialog = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);
const showAllUpcoming = ref(false);

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

// Computed for calendar view to force updates - include selected date to force re-render
const calendarKey = computed(() =>
  `${calendarState.value.currentYear}-${calendarState.value.currentMonth}-${selectedDateModel.value || 'none'}`
);

const defaultYearMonth = computed(() =>
  `${calendarState.value.currentYear}/${calendarState.value.currentMonth.toString().padStart(2, '0')}`
);

// Force calendar to update when month/year changes
const calendarModel = computed({
  get: () => selectedDateModel.value,
  set: (value) => {
    selectedDateModel.value = value;
  }
});

// Methods
const onCalendarNavigation = (view: { year: number; month: number }) => {
  logger.debug('🗓️ Calendar navigation triggered:', view);
  logger.debug('🗓️ Current calendar state before update:', {
    currentYear: calendarState.value.currentYear,
    currentMonth: calendarState.value.currentMonth
  });

  // Update calendar state when user navigates in the q-date component
  calendarState.value.currentYear = view.year;
  calendarState.value.currentMonth = view.month;

  logger.debug('🗓️ Calendar state after update:', {
    currentYear: calendarState.value.currentYear,
    currentMonth: calendarState.value.currentMonth
  });

  // Load events for the new month
  void loadEventsForMonth(view.year, view.month);
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
    selectedDateModel.value = date as string;

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
  showEventDialog.value = true;
};

const refreshEvents = () => {
  void loadEventsForMonth(calendarState.value.currentYear, calendarState.value.currentMonth);
};

const getEventsForSelectedDate = (): CalendarEvent[] => {
  if (!selectedDateModel.value) return [];
  // Convert from YYYY/MM/DD to YYYY-MM-DD
  const dateKey = selectedDateModel.value.replace(/\//g, '-');
  return getFilteredEventsForDate(dateKey);
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

// Watch calendar state changes and update selectedDateModel accordingly
watch(() => calendarState.value, (newState) => {
  logger.debug('🗓️ Calendar state changed:', newState);

  // Update selectedDateModel to match the current calendar view
  if (newState.selectedDate) {
    // Convert from YYYY-MM-DD to YYYY/MM/DD for q-date
    const formattedDate = newState.selectedDate.replace(/-/g, '/');
    if (selectedDateModel.value !== formattedDate) {
      selectedDateModel.value = formattedDate;
    }
  }
}, { deep: true });

// Watch for month/year changes - keep selected date unchanged for better UX
watch(() => [calendarState.value.currentYear, calendarState.value.currentMonth], ([year, month]) => {
  logger.debug('🗓️ Month/Year changed:', { year, month });
  // Note: We intentionally do NOT change the selected date when navigating months
  // This allows users to keep their selected date when browsing different months
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
</style>
