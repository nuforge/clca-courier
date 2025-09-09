<!--
  Calendar Event Card Component
  Displays individual calendar event information in a card format
-->
<template>
  <q-card
    class="calendar-event-card"
    :class="[
      `border-left-${getEventColor(event.type)}`,
      { 'cursor-pointer': !disabled, 'event-featured': event.featured, 'event-compact': compact }
    ]"
    @click="handleClick"
    :disable="disabled"
  >
    <q-card-section class="q-pa-sm" :class="{ 'q-pa-xs': compact }">
      <div class="row items-start no-wrap">
        <!-- Event Type Icon -->
        <div class="col-auto q-mr-sm">
          <q-icon
            :name="getEventIcon(event.type)"
            :color="getEventColor(event.type)"
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
          <div v-if="!compact && event.content" class="text-caption text-grey-8 q-mb-xs">
            {{ truncatedContent }}
          </div>

          <!-- Event Tags -->
          <div v-if="!compact && event.tags.length > 0" class="row items-center q-gutter-xs">
            <q-chip
              v-for="tag in event.tags.slice(0, 3)"
              :key="tag"
              dense
              square
              color="grey-3"
              text-color="grey-8"
              size="xs"
              :label="tag"
            />
            <span v-if="event.tags.length > 3" class="text-caption text-grey-6">
              +{{ event.tags.length - 3 }} more
            </span>
          </div>

          <!-- Compact mode time display -->
          <div v-if="compact" class="text-caption text-grey-6 q-mt-xs">
            {{ formatEventDateTime(event) }}
          </div>
        </div>

        <!-- Action Menu (Optional) -->
        <div v-if="showActions && !compact" class="col-auto">
          <q-btn flat round icon="mdi-dots-vertical" size="sm" @click.stop="showMenu = true">
            <q-menu v-model="showMenu">
              <q-list>
                <q-item clickable v-close-popup @click="$emit('view', event)">
                  <q-item-section avatar>
                    <q-icon name="mdi-eye" />
                  </q-item-section>
                  <q-item-section>View Details</q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="exportToCalendar">
                  <q-item-section avatar>
                    <q-icon name="mdi-calendar-export" />
                  </q-item-section>
                  <q-item-section>Export to Calendar</q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="shareEvent">
                  <q-item-section avatar>
                    <q-icon name="mdi-share" />
                  </q-item-section>
                  <q-item-section>Share Event</q-item-section>
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
      label="All Day"
      class="all-day-badge"
    />
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { CalendarEvent } from '../../services/calendar-events.service';
import { calendarEventsService } from '../../services/calendar-events.service';

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

// Local state
const showMenu = ref(false);

// Computed properties
const truncatedContent = computed(() => {
  if (!props.event.content) return '';
  const maxLength = props.compact ? 60 : 120;
  if (props.event.content.length <= maxLength) return props.event.content;
  return props.event.content.substring(0, maxLength) + '...';
});

// Methods
const handleClick = () => {
  if (!props.disabled) {
    emit('click', props.event);
  }
};

const getEventIcon = (type: CalendarEvent['type']): string => {
  return calendarEventsService.getEventTypeIcon(type);
};

const getEventColor = (type: CalendarEvent['type']): string => {
  return calendarEventsService.getEventTypeColor(type);
};

const formatEventDateTime = (event: CalendarEvent): string => {
  const date = new Date(event.eventDate);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (event.allDay) {
    return `${dateStr} (All Day)`;
  }

  const timeStr = calendarEventsService.formatEventTime(event);
  if (timeStr) {
    return `${dateStr} at ${timeStr}`;
  }

  return dateStr;
};

const formatRecurrence = (recurrence: NonNullable<CalendarEvent['eventRecurrence']>): string => {
  const { type, interval = 1 } = recurrence;

  if (interval === 1) {
    switch (type) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return '';
    }
  } else {
    switch (type) {
      case 'daily': return `Every ${interval} days`;
      case 'weekly': return `Every ${interval} weeks`;
      case 'monthly': return `Every ${interval} months`;
      case 'yearly': return `Every ${interval} years`;
      default: return '';
    }
  }
};

const exportToCalendar = () => {
  // Generate ICS file for calendar export
  const event = props.event;

  const startDate = new Date(event.eventDate);
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
    `DESCRIPTION:${event.content.replace(/\n/g, '\\n')}`,
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
    message: 'Event exported to calendar',
    color: 'positive',
    icon: 'mdi-calendar-export',
  });

  emit('export', event);
};

const shareEvent = () => {
  const shareData = {
    title: props.event.title,
    text: `${props.event.title}\n\n${props.event.content}`,
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
  const eventText = `${props.event.title}\n\nDate: ${formatEventDateTime(props.event)}\n${props.event.eventLocation ? `Location: ${props.event.eventLocation}\n` : ''}\n${props.event.content}`;

  navigator.clipboard.writeText(eventText).then(() => {
    $q.notify({
      message: 'Event details copied to clipboard',
      color: 'positive',
      icon: 'mdi-content-copy',
    });
  }).catch(() => {
    $q.notify({
      message: 'Failed to copy event details',
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

.border-left-info {
  border-left-color: var(--q-info);
}

.border-left-warning {
  border-left-color: var(--q-warning);
}

.border-left-positive {
  border-left-color: var(--q-positive);
}

.border-left-grey-6 {
  border-left-color: #757575;
}

.all-day-badge {
  top: 8px;
  right: 8px;
}
</style>
