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

        <!-- View Mode Toggle -->
        <q-btn-toggle
          v-model="calendarState.viewMode"
          toggle-color="primary"
          :options="[
            { label: 'Month', value: 'month', icon: 'mdi-calendar-month' },
            { label: 'Day', value: 'day', icon: 'mdi-calendar-today' },
          ]"
          @update:model-value="setViewMode"
        />
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

      <!-- Calendar Grid (Month View) -->
      <q-card v-if="calendarState.viewMode === 'month'" flat class="calendar-grid">
        <q-card-section class="q-pa-none">
          <!-- Calendar Component -->
          <q-date
            v-model="selectedDateModel"
            :events="calendarEvents"
            event-color="primary"
            today-btn
            class="full-width"
            @update:model-value="onDateSelect"
            landscape
            :default-year-month="`${calendarState.currentYear}/${calendarState.currentMonth.toString().padStart(2, '0')}`"
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

      <!-- Day View -->
      <div v-if="calendarState.viewMode === 'day' && calendarState.selectedDate">
        <q-card flat>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              Events for {{ formatSelectedDate(calendarState.selectedDate) }}
            </div>

            <div v-if="selectedDateEvents.length === 0" class="text-center q-pa-lg">
              <q-icon name="mdi-calendar-blank" size="64px" color="grey-4" />
              <div class="text-h6 text-grey-6 q-mt-md">No events scheduled</div>
              <div class="text-body2 text-grey-5">Check other dates for upcoming events</div>
            </div>

            <div v-else class="q-gutter-md">
              <CalendarEventCard
                v-for="event in selectedDateEvents"
                :key="event.id"
                :event="event"
                @click="onEventClick(event)"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Upcoming Events Sidebar (Month View) -->
      <q-card v-if="calendarState.viewMode === 'month' && upcomingEvents.length > 0" flat class="q-mt-md">
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
      <EventDetailsDialog
        v-model="showEventDialog"
        :event="selectedEvent"
      />

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
import EventDetailsDialog from '../components/calendar/EventDetailsDialog.vue';
import { logger } from '../utils/logger';

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
  selectDate,
  setViewMode,
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

const selectedDateEvents = computed(() => {
  if (!calendarState.value.selectedDate) {
    logger.debug('🗓️ No selectedDate in calendarState');
    return [];
  }

  const events = getEventsForDate(calendarState.value.selectedDate);
  logger.debug('🗓️ selectedDateEvents computed:', {
    selectedDate: calendarState.value.selectedDate,
    eventsFound: events.length,
    events
  });

  return events;
});

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
    selectDate(selectedDate);
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
};

const applyFilters = () => {
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
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Watch for view mode changes
watch(() => calendarState.value.viewMode, (newMode: string) => {
  if (newMode === 'month') {
    calendarState.value.selectedDate = null;
    selectedDateModel.value = null;
  }
});

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
