<!--
  BaseCalendar.vue - Reusable Calendar Component

  A "dumb" component that displays a calendar with events.
  Does not fetch data or manage business logic.

  Part of Week 1 Component Architecture Migration
-->
<template>
  <q-card flat class="base-calendar shadow-1">
    <q-card-section class="q-pa-none">
      <q-date
        :key="calendarKey"
        v-model="calendarModel"
        :events="events"
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

      <!-- Loading overlay -->
      <q-inner-loading :showing="loading && events.length === 0">
        <q-spinner-dots size="50px" color="primary" />
      </q-inner-loading>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
import { logger } from '../utils/logger';

const { t } = useI18n();

// Strict TypeScript interfaces
interface Props {
  events: string[]; // Array of YYYY/MM/DD date strings
  selectedDate: string | null; // YYYY/MM/DD format
  defaultYearMonth: string; // YYYY/MM format
  getEventColorForDate: (date: string) => string;
  loading?: boolean;
}

interface Emits {
  (e: 'date-select', date: string | string[] | null): void;
  (e: 'navigation', view: { year: number; month: number }): void;
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  loading: false
});

// Emits
const emit = defineEmits<Emits>();

// Refs
const calendarRef = ref();

// Reactive state for forcing calendar updates
const calendarUpdateTrigger = ref(0);

// Computed properties
const calendarKey = computed(() => {
  // Force complete re-render when defaultYearMonth changes
  return `base-calendar-${props.defaultYearMonth}-${calendarUpdateTrigger.value}`;
});

const calendarModel = computed({
  get: () => props.selectedDate,
  set: (value) => {
    // Always emit date selection changes to parent
    emit('date-select', value);
  }
});

// Methods
const onDateSelect = (date: string | string[] | null) => {
  logger.debug('🗓️ BaseCalendar date selected:', { date, type: typeof date });
  emit('date-select', date);
};

const onCalendarNavigation = (view: { year: number; month: number }) => {
  logger.debug('🗓️ BaseCalendar navigation triggered:', view);
  emit('navigation', view);

  // Force calendar update after navigation
  calendarUpdateTrigger.value += 1;
};

// Watch for prop changes to force calendar updates
watch(() => props.defaultYearMonth, () => {
  logger.debug('🗓️ BaseCalendar defaultYearMonth changed, forcing update');
  calendarUpdateTrigger.value += 1;
});

watch(() => props.events, (newEvents) => {
  logger.debug('🗓️ BaseCalendar events updated:', { count: newEvents.length });
});

// Expose calendar ref for parent access if needed
defineExpose({
  calendarRef
});
</script>

<style scoped>
.base-calendar {
  /* Use only Quasar utility classes - NO custom CSS */
}

/* Deep style for calendar customization - using Quasar patterns */
:deep(.q-date__calendar-item) {
  height: 60px;
}

:deep(.q-date__calendar-item--in) {
  border: 1px solid rgba(0,0,0,0.1);
}
</style>
