<!--
  Calendar Event Card Component - New Architecture
  Displays individual calendar event information using ContentDoc system
-->
<template>
  <q-card
    class="calendar-event-card"
    :class="[
      `border-left-${getEventColor(event)}`,
      { 'cursor-pointer': !disabled, 'event-featured': event.featured, 'event-compact': compact }
    ]"
    @click="handleClick"
    :disable="disabled"
    :aria-label="`${event.title} - ${formatEventDateTime(event)}`"
    role="button"
    tabindex="0"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <q-card-section class="q-pa-sm" :class="{ 'q-pa-xs': compact }">
      <div class="row items-start no-wrap">
        <!-- Event Type Icon -->
        <div class="col-auto q-mr-sm">
          <q-icon
            :name="getEventIcon(event)"
            :color="getEventColor(event)"
            :size="compact ? 'sm' : 'md'"
          />
        </div>

        <!-- Event Content -->
        <div class="col">
          <!-- Event Title -->
          <div class="text-subtitle2 text-weight-medium q-mb-xs" :class="{ 'text-caption': compact }">
            {{ event.title }}
            <q-icon
              v-if="event.featured"
              name="mdi-star"
              color="amber"
              size="xs"
              class="q-ml-xs"
            />
          </div>

          <!-- Event Time and Date -->
          <div class="row items-center q-gutter-xs q-mb-xs" v-if="!compact">
            <q-icon name="mdi-clock-outline" size="xs" color="grey-6" />
            <span class="text-caption text-grey-7">
              {{ formatEventDateTime(event) }}
            </span>
          </div>

          <!-- Event Location -->
          <div class="row items-center q-gutter-xs q-mb-xs" v-if="event.eventLocation && !compact">
            <q-icon name="mdi-map-marker-outline" size="xs" color="grey-6" />
            <span class="text-caption text-grey-7">
              {{ event.eventLocation }}
            </span>
          </div>

          <!-- Event Content Preview -->
          <div v-if="!compact && event.description" class="text-caption text-grey-8 q-mb-xs">
            {{ truncatedContent }}
          </div>

          <!-- Content Type and Tags -->
          <div v-if="!compact && (getContentTypeDisplay(event) || event.tags.length > 0)" class="row items-center q-gutter-xs q-mt-xs">
            <!-- Content Type Badge -->
            <q-chip
              v-if="getContentTypeDisplay(event)"
              dense
              square
              :color="getEventColor(event)"
              text-color="white"
              size="xs"
              :icon="getEventIcon(event)"
              :label="getContentTypeDisplay(event) || ''"
            />

            <!-- Additional Tags -->
            <q-chip
              v-for="tag in getDisplayTags(event).slice(0, 2)"
              :key="tag"
              dense
              square
              color="grey-3"
              text-color="grey-8"
              size="xs"
              :label="tag"
            />
            <span v-if="getDisplayTags(event).length > 2" class="text-caption text-grey-6">
              +{{ getDisplayTags(event).length - 2 }} more
            </span>
          </div>

          <!-- Compact mode time display -->
          <div v-if="compact" class="text-caption text-grey-6 q-mt-xs">
            {{ formatEventDateTime(event) }}
          </div>
        </div>

        <!-- Action Menu (Optional) -->
        <div v-if="showActions && !compact" class="col-auto">
          <q-btn
            flat
            round
            icon="mdi-dots-vertical"
            size="sm"
            @click.stop="showMenu = true"
            :aria-label="$t(TRANSLATION_KEYS.COMMON.ACCESSIBILITY.OPEN_MENU)"
          >
            <q-menu v-model="showMenu">
              <q-list>
                <q-item clickable v-close-popup @click="$emit('view', event)">
                  <q-item-section avatar>
                    <q-icon name="mdi-eye" />
                  </q-item-section>
                  <q-item-section>{{ $t(TRANSLATION_KEYS.COMMON.VIEW) }}</q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="exportToCalendar">
                  <q-item-section avatar>
                    <q-icon name="mdi-calendar-export" />
                  </q-item-section>
                  <q-item-section>{{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.EXPORT_TO_CALENDAR) }}</q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="shareEvent">
                  <q-item-section avatar>
                    <q-icon name="mdi-share" />
                  </q-item-section>
                  <q-item-section>{{ $t(TRANSLATION_KEYS.CONTENT.CALENDAR.SHARE_EVENT) }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- Recurring Event Indicator -->
      <div v-if="event.eventRecurrence && event.eventRecurrence.type !== 'none'" class="q-mt-xs">
        <q-chip
          dense
          square
          color="info"
          text-color="white"
          size="xs"
          icon="mdi-repeat"
          :label="formatRecurrence(event.eventRecurrence)"
        />
      </div>
    </q-card-section>

    <!-- All Day Event Badge -->
    <q-badge
      v-if="event.allDay"
      floating
      color="secondary"
      :label="$t(TRANSLATION_KEYS.CONTENT.CALENDAR.ALL_DAY)"
      class="all-day-badge"
    />
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { CalendarEvent } from '../../services/calendar-content.service';
import { calendarContentService } from '../../services/calendar-content.service';
import { formatEventDateTime as formatEventDateTimeUtil } from '../../utils/date-formatter';
import { parseDateOnly } from '../../utils/date-formatter';
import { logger } from '../../utils/logger';
import { TRANSLATION_KEYS } from '../../i18n/utils/translation-keys';

interface Props {
  event: CalendarEvent;
  compact?: boolean;
  disabled?: boolean;
  showActions?: boolean;
}

interface Emits {
  (e: 'click', event: CalendarEvent): void;
  (e: 'view', event: CalendarEvent): void;
  (e: 'export', event: CalendarEvent): void;
  (e: 'share', event: CalendarEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  disabled: false,
  showActions: true,
});

const emit = defineEmits<Emits>();

const $q = useQuasar();
const { t } = useI18n();

// Local state
const showMenu = ref(false);

// Computed properties
const truncatedContent = computed(() => {
  if (!props.event.description) return '';
  const maxLength = props.compact ? 60 : 120;
  if (props.event.description.length <= maxLength) return props.event.description;
  return props.event.description.substring(0, maxLength) + '...';
});

// Methods
const handleClick = () => {
  if (!props.disabled) {
    emit('click', props.event);
  }
};

const getEventIcon = (event: CalendarEvent): string => {
  return calendarContentService.getEventTypeIcon(
    calendarContentService.getEventContentType(event) || 'event'
  );
};

const getEventColor = (event: CalendarEvent): string => {
  return calendarContentService.getEventTypeColor(
    calendarContentService.getEventContentType(event) || 'event'
  );
};

const getContentTypeDisplay = (event: CalendarEvent): string | null => {
  const contentType = calendarContentService.getEventContentType(event);
  if (!contentType) return null;

  // Map content types to display names
  const typeMap: Record<string, string> = {
    'event': t(TRANSLATION_KEYS.CONTENT.TYPES.EVENT),
    'announcement': t(TRANSLATION_KEYS.CONTENT.TYPES.ANNOUNCEMENT),
    'article': t(TRANSLATION_KEYS.CONTENT.TYPES.NEWS),
    'classified': t(TRANSLATION_KEYS.CONTENT.TYPES.CLASSIFIED),
    'photo': t(TRANSLATION_KEYS.CONTENT.TYPES.PHOTO),
  };

  return typeMap[contentType] || contentType;
};

const getDisplayTags = (event: CalendarEvent): string[] => {
  // Filter out content-type tags and system tags, show only meaningful tags
  return event.tags.filter(tag =>
    !tag.startsWith('content-type:') &&
    !tag.startsWith('featured:') &&
    !tag.startsWith('status:')
  );
};

const formatEventDateTime = (event: CalendarEvent): string => {
  return formatEventDateTimeUtil(
    event.eventDate,
    event.eventTime,
    event.eventEndTime,
    event.allDay
  );
};

const formatRecurrence = (recurrence: NonNullable<CalendarEvent['eventRecurrence']>): string => {
  const { type, interval = 1 } = recurrence;

  if (interval === 1) {
    switch (type) {
      case 'daily': return t(TRANSLATION_KEYS.CONTENT.CALENDAR.RECURRENCE.DAILY);
      case 'weekly': return t(TRANSLATION_KEYS.CONTENT.CALENDAR.RECURRENCE.WEEKLY);
      case 'monthly': return t(TRANSLATION_KEYS.CONTENT.CALENDAR.RECURRENCE.MONTHLY);
      case 'yearly': return t(TRANSLATION_KEYS.CONTENT.CALENDAR.RECURRENCE.YEARLY);
      default: return '';
    }
  } else {
    switch (type) {
      case 'daily': return t(TRANSLATION_KEYS.CONTENT.CALENDAR.RECURRENCE.EVERY_N_DAYS, { n: interval });
      case 'weekly': return t(TRANSLATION_KEYS.CONTENT.CALENDAR.RECURRENCE.EVERY_N_WEEKS, { n: interval });
      case 'monthly': return t(TRANSLATION_KEYS.CONTENT.CALENDAR.RECURRENCE.EVERY_N_MONTHS, { n: interval });
      case 'yearly': return t(TRANSLATION_KEYS.CONTENT.CALENDAR.RECURRENCE.EVERY_N_YEARS, { n: interval });
      default: return '';
    }
  }
};

const exportToCalendar = () => {
  // Generate ICS file for calendar export
  const event = props.event;

  // Use centralized date parsing to avoid timezone issues
  const startDate = parseDateOnly(event.eventDate);
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

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CLCA Courier//Calendar Event//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
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

  emit('export', event);
};

const shareEvent = () => {
  const shareData = {
    title: props.event.title,
    text: `${props.event.title}\n\n${props.event.description}`,
    url: window.location.href,
  };

  if (navigator.share && window.isSecureContext) {
    navigator.share(shareData).catch(() => {
      // Fallback to copying to clipboard
      copyToClipboard();
    });
  } else {
    copyToClipboard();
  }

  emit('share', props.event);
};

const copyToClipboard = () => {
  const eventText = `${props.event.title}\n\nDate: ${formatEventDateTime(props.event)}\n${props.event.eventLocation ? `Location: ${props.event.eventLocation}\n` : ''}\n${props.event.description}`;

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
</script>

<style scoped>
.calendar-event-card {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.calendar-event-card:hover:not(.calendar-event-card--disabled) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.calendar-event-card.event-featured {
  box-shadow: 0 2px 12px rgba(255, 193, 7, 0.3);
}

.calendar-event-card.event-compact {
  min-height: auto;
}

.border-left-primary {
  border-left-color: var(--q-primary);
}

.border-left-secondary {
  border-left-color: var(--q-secondary);
}

.border-left-accent {
  border-left-color: var(--q-accent);
}

.border-left-info {
  border-left-color: var(--q-info);
}

.border-left-warning {
  border-left-color: var(--q-warning);
}

.border-left-positive {
  border-left-color: var(--q-positive);
}

.border-left-negative {
  border-left-color: var(--q-negative);
}

.border-left-orange {
  border-left-color: #ff9800;
}

.border-left-grey-6 {
  border-left-color: #757575;
}

.all-day-badge {
  top: 8px;
  right: 8px;
}
</style>
