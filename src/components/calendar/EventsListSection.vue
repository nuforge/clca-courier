<!--
  Events List Section Component
  Reusable component for displaying grouped events with smart expand/collapse behavior
-->
<template>
  <div class="events-list-section">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-medium">
        <q-icon :name="icon" class="q-mr-sm" :color="iconColor" />
        {{ title }}
        <q-chip
          v-if="eventsGrouped.length > 0"
          :color="chipColor"
          text-color="white"
          size="sm"
          :label="eventsGrouped.length.toString()"
          class="q-ml-sm"
        />
      </div>
      <div class="row q-gutter-xs" v-if="eventsGrouped.length > 0">
        <q-btn
          flat
          round
          :icon="smartToggleIcon"
          size="sm"
          @click="handleSmartToggle"
          :aria-label="smartToggleLabel"
        >
          <q-tooltip>{{ smartToggleLabel }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Events grouped by day -->
    <div v-if="eventsGrouped.length > 0" class="q-gutter-sm">
      <q-expansion-item
        v-for="dayGroup in eventsGrouped"
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
                flat
                :text-color="getEventColor(event)"
                size="sm"
                :icon="getEventIcon(event)"
                class="q-mr-xs"
              />
              <q-chip
                v-if="dayGroup.events.length > 3"
                dense
                square
                flat
                color="grey-4"
                text-color="grey-8"
                size="sm"
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
            @click="$emit('event-click', event)"
          />
        </div>
      </q-expansion-item>
    </div>

    <!-- No events message -->
    <div v-else class="text-center q-pa-md text-grey-6">
      <q-icon :name="emptyIcon" size="32px" class="q-mb-sm" />
      <div class="text-body2">{{ emptyMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CalendarEvent } from '../../services/calendar-content.service';
import CalendarEventCardContent from './CalendarEventCardContent.vue';
import { logger } from '../../utils/logger';
import { formatDate, parseDateOnly } from '../../utils/date-formatter';
import { TRANSLATION_KEYS } from '../../i18n/utils/translation-keys';

const { t } = useI18n();

// Props
interface Props {
  title: string;
  eventsGrouped: Array<{ date: string; events: CalendarEvent[] }>;
  icon: string;
  iconColor?: string;
  chipColor?: string;
  emptyIcon?: string;
  emptyMessage: string;
  getEventIcon: (event: CalendarEvent) => string;
  getEventColor: (event: CalendarEvent) => string;
  isExpansionOpen: (date: string) => boolean;
  onExpansionChange: (date: string, isOpen: boolean) => void;
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  chipColor: 'primary',
  emptyIcon: 'mdi-calendar-blank'
});

// Emits
const emit = defineEmits<{
  'event-click': [event: CalendarEvent];
  'expand-all': [];
  'collapse-all': [];
}>();

// Local state for tracking expansion states
const localExpansionState = ref<Record<string, boolean>>({});

// Computed properties for smart toggle behavior
const openExpansionCount = computed(() => {
  return props.eventsGrouped.filter(dayGroup =>
    props.isExpansionOpen(dayGroup.date)
  ).length;
});

const totalExpansionCount = computed(() => {
  return props.eventsGrouped.length;
});

const isMostlyOpen = computed(() => {
  if (totalExpansionCount.value === 0) return false;
  return openExpansionCount.value > totalExpansionCount.value / 2;
});

const smartToggleIcon = computed(() => {
  return isMostlyOpen.value ? 'mdi-chevron-double-up' : 'mdi-chevron-double-down';
});

const smartToggleLabel = computed(() => {
  return isMostlyOpen.value
    ? t(TRANSLATION_KEYS.CONTENT.CALENDAR.COLLAPSE_ALL)
    : t(TRANSLATION_KEYS.CONTENT.CALENDAR.EXPAND_ALL);
});

// Methods
const formatDayGroupLabel = (dayGroup: { date: string; events: CalendarEvent[] }) => {
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

const handleSmartToggle = () => {
  if (isMostlyOpen.value) {
    // Collapse all
    props.eventsGrouped.forEach(dayGroup => {
      props.onExpansionChange(dayGroup.date, false);
    });
    emit('collapse-all');
    logger.debug('🗓️ Smart toggle: Collapsed all events');
  } else {
    // Expand all
    props.eventsGrouped.forEach(dayGroup => {
      props.onExpansionChange(dayGroup.date, true);
    });
    emit('expand-all');
    logger.debug('🗓️ Smart toggle: Expanded all events');
  }
};

// Watch for changes in events to reset local state if needed
watch(() => props.eventsGrouped, (newEvents) => {
  // Clean up local state for dates that no longer exist
  const currentDates = new Set(newEvents.map(group => group.date));
  Object.keys(localExpansionState.value).forEach(date => {
    if (!currentDates.has(date)) {
      delete localExpansionState.value[date];
    }
  });
}, { deep: true });
</script>

<style scoped>
.events-list-section {
  width: 100%;
}

.monthly-events-group {
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}
</style>
