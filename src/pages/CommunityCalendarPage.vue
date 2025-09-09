<!--
  Community Calendar Page
  Displays community events in a calendar interface using existing userContent data
-->
<template>
  <q-page padding>
    <div class="calendar-page">
      <!-- Page Header -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <h1 class="text-h4 q-ma-none">Community Calendar</h1>
          <p class="text-subtitle1 text-grey-6 q-ma-none">
            Stay up to date with community events and activities
          </p>
        </div>
      </div>

      <!-- Calendar Toolbar -->
      <q-card flat class="q-mb-md">
        <q-card-section class="q-pa-md">
          <div class="row items-center justify-between">
            <!-- Navigation Controls -->
            <div class="row items-center q-gutter-sm">
              <q-btn
                flat
                round
                icon="mdi-chevron-left"
                @click="goToPreviousMonth"
                :loading="isLoading"
              />

              <div class="text-h6 q-mx-md">
                {{ monthName }} {{ calendarState.currentYear }}
              </div>

              <q-btn
                flat
                round
                icon="mdi-chevron-right"
                @click="goToNextMonth"
                :loading="isLoading"
              />

              <q-separator vertical class="q-mx-md" />

              <q-btn
                flat
                label="Today"
                icon="mdi-calendar-today"
                @click="goToToday"
                :disable="isLoading"
              />
            </div>

            <!-- Filters and Actions -->
            <div class="row items-center q-gutter-sm">
              <!-- Event Type Filter -->
              <q-select
                v-model="filters.types"
                multiple
                dense
                outlined
                label="Event Types"
                :options="eventTypeOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              >
                <template v-slot:option="{ itemProps, opt }">
                  <q-item v-bind="itemProps">
                    <q-item-section avatar>
                      <q-icon :name="getEventIcon(opt.value)" :color="getEventColor(opt.value)" />
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
                label="Featured Only"
                @update:model-value="applyFilters"
              />

              <!-- Refresh Button -->
              <q-btn
                flat
                round
                icon="mdi-refresh"
                @click="refreshEvents"
                :loading="isLoading"
              />
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
          <q-btn flat label="Retry" @click="refreshEvents" />
        </template>
      </q-banner>

      <!-- Calendar Grid -->
      <q-card flat class="calendar-grid">
        <q-card-section class="q-pa-none">
          <!-- Calendar Component -->
          <q-date
            :key="calendarKey"
            v-model="selectedDateModel"
            :events="calendarEvents"
            event-color="primary"
            today-btn
            class="full-width"
            @update:model-value="onDateSelect"
            @navigation="onCalendarNavigation"
            landscape
            :default-year-month="defaultYearMonth"
            :navigation-min-year-month="`2020/01`"
            :navigation-max-year-month="`2030/12`"
            flat
          />

          <!-- Events list for selected date -->
          <div v-if="selectedDateModel && getEventsForSelectedDate().length > 0" class="q-pa-md">
            <div class="text-subtitle1 q-mb-sm">
              Events on {{ formatSelectedDate(selectedDateModel.replace(/\//g, '-')) }}:
            </div>
            <div class="q-gutter-sm">
              <CalendarEventCard
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
            Events on {{ formatSelectedDate(selectedDateModel.replace(/\//g, '-')) }}
          </div>
          <div class="row q-col-gutter-md">
            <div
              v-for="event in getEventsForSelectedDate()"
              :key="event.id"
              class="col-12 col-md-6"
            >
              <CalendarEventCard
                :event="event"
                @click="onEventClick(event)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Upcoming Events Sidebar -->
      <q-card v-if="upcomingEvents.length > 0" flat class="q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="mdi-calendar-clock" class="q-mr-sm" />
            Upcoming Events
          </div>

          <div class="q-gutter-sm">
            <CalendarEventCard
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
              label="View All Upcoming"
              @click="showAllUpcoming = true"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Event Details Dialog -->
      <q-dialog v-model="showEventDialog" position="right" full-height>
        <q-card style="width: 500px; max-width: 90vw;">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">{{ selectedEvent?.title }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section v-if="selectedEvent">
            <!-- Event Category -->
            <div class="text-overline q-mb-sm" :class="`text-${getEventColor(selectedEvent.type)}`">
              <q-icon :name="getEventIcon(selectedEvent.type)" size="sm" class="q-mr-xs" />
              {{ formatCategoryName(selectedEvent.type) }}
            </div>

            <!-- Event Date & Time -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-xs">
                <q-icon name="mdi-calendar" class="q-mr-xs" />
                {{ formatSelectedDate(selectedEvent.eventDate) }}
              </div>
              <div v-if="selectedEvent.eventTime || selectedEvent.eventEndTime" class="text-body2">
                <q-icon name="mdi-clock" class="q-mr-xs" />
                <span v-if="selectedEvent.allDay">All Day</span>
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
                Location
              </div>
              <div class="text-body2">{{ selectedEvent.eventLocation }}</div>
            </div>

            <!-- Event Content -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-xs">
                <q-icon name="mdi-text" class="q-mr-xs" />
                Description
              </div>
              <div class="text-body1" style="white-space: pre-line;">
                {{ selectedEvent.content }}
              </div>
            </div>

            <!-- Event Author -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-6">
                By {{ selectedEvent.authorName }} • {{ selectedEvent.authorEmail }}
              </div>
            </div>

            <!-- Featured Badge -->
            <q-badge v-if="selectedEvent.featured" color="amber" text-color="black" class="q-mt-sm">
              <q-icon name="star" size="xs" class="q-mr-xs" />
              Featured Event
            </q-badge>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- All Upcoming Events Dialog -->
      <q-dialog v-model="showAllUpcoming">
        <q-card style="min-width: 400px; max-width: 600px">
          <q-card-section>
            <div class="text-h6">All Upcoming Events</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="q-gutter-sm">
              <CalendarEventCard
                v-for="event in upcomingEvents"
                :key="event.id"
                :event="event"
                @click="onEventClick(event)"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Close" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCalendar } from '../composables/useCalendar';
import type { CalendarEvent } from '../services/calendar-events.service';
import CalendarEventCard from '../components/calendar/CalendarEventCard.vue';
import { logger } from '../utils/logger';
import { formatDate } from '../utils/date-formatter';

// Helper function for formatting category names
const formatCategoryName = (category: string): string => {
  return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/-/g, ' ');
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
  goToNextMonth,
  goToPreviousMonth,
  goToToday,
  loadEventsForMonth,
  getEventsForDate,
  getEventIcon,
  getEventColor,
} = useCalendar();

// Local state
const selectedDateModel = ref<string | null>(null);
const showFeaturedOnly = ref(false);
const showEventDialog = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);
const showAllUpcoming = ref(false);

// Event type options for filter
const eventTypeOptions = [
  { label: 'Events', value: 'event' },
  { label: 'Announcements', value: 'announcement' },
  { label: 'Articles', value: 'article' },
  { label: 'Classifieds', value: 'classified' },
  { label: 'Photos', value: 'photo' },
];

// Computed properties
const calendarEvents = computed(() => {
  // q-date expects an array of date strings in YYYY/MM/DD format
  return Object.keys(eventsByDate.value).map(date => {
    // Convert from YYYY-MM-DD to YYYY/MM/DD
    return date.replace(/-/g, '/');
  });
});

// Computed for calendar view to force updates
const calendarKey = computed(() =>
  `${calendarState.value.currentYear}-${calendarState.value.currentMonth}`
);

const defaultYearMonth = computed(() =>
  `${calendarState.value.currentYear}/${calendarState.value.currentMonth.toString().padStart(2, '0')}`
);

// Debug computed properties
// const debugCalendarHeader = computed(() => {
//   const result = {
//     monthName: monthName.value,
//     currentYear: calendarState.value.currentYear,
//     currentMonth: calendarState.value.currentMonth,
//     selectedDate: calendarState.value.selectedDate,
//     viewMode: calendarState.value.viewMode
//   };
//   logger.debug('🗓️ Calendar header debug:', result);
//   return result;
// });

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
  return getEventsForDate(dateKey);
};const applyFilters = () => {
  const newFilters: typeof filters.value = {};

  if (filters.value.types && filters.value.types.length > 0) {
    newFilters.types = filters.value.types;
  }

  if (showFeaturedOnly.value) {
    newFilters.featured = true;
  }

  // Apply filters and reload
  void loadEventsForMonth(calendarState.value.currentYear, calendarState.value.currentMonth);
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

// Watch calendar state changes for debugging
watch(() => calendarState.value, (newState) => {
  logger.debug('🗓️ Calendar state changed:', newState);
}, { deep: true });

// Watch monthName changes
watch(() => monthName.value, (newMonthName) => {
  logger.debug('🗓️ Month name changed:', newMonthName);
});

// Debug calendar state and events on mount
onMounted(() => {
  logger.debug('🗓️ Calendar page mounted with state:', {
    currentMonth: calendarState.value.currentMonth,
    currentYear: calendarState.value.currentYear,
    viewMode: calendarState.value.viewMode,
    eventsCount: events.value.length
  });

  logger.debug('🗓️ EventsByDate structure:', eventsByDate.value);
  logger.debug('🗓️ CalendarEvents array:', calendarEvents.value);
  logger.debug('🗓️ monthName value:', monthName.value);
  logger.debug('🗓️ All events:', events.value);

  // Manual debug of calendar header
  logger.debug('🗓️ Calendar header debug:', {
    monthName: monthName.value,
    currentYear: calendarState.value.currentYear,
    currentMonth: calendarState.value.currentMonth,
    selectedDate: calendarState.value.selectedDate,
    viewMode: calendarState.value.viewMode
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
