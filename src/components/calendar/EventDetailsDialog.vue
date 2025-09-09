<!--
  Event Details Dialog Component
  Full details view for calendar events
-->
<template>
  <q-dialog
    v-model="dialogVisible"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card v-if="event" class="event-details-dialog">
      <!-- Header -->
      <q-card-section class="row items-center no-wrap bg-primary text-white">
        <div class="col">
          <div class="text-h6">{{ event.title }}</div>
          <div class="text-subtitle2 opacity-70">
            {{ formatEventType(event.type) }}
            <q-icon
              v-if="event.featured"
              name="mdi-star"
              class="q-ml-xs"
            />
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="mdi-close"
          @click="dialogVisible = false"
        />
      </q-card-section>

      <!-- Content -->
      <q-card-section class="q-pa-none">
        <div class="row">
          <!-- Main Content -->
          <div class="col-12 col-md-8 q-pa-md">
            <!-- Event Info Cards -->
            <div class="q-gutter-md">
              <!-- Date & Time Card -->
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-calendar-clock" class="q-mr-sm" />
                    Date & Time
                  </div>

                  <div class="q-gutter-sm">
                    <div class="row items-center">
                      <div class="col-3 text-weight-medium">Date:</div>
                      <div class="col">{{ formatEventDate(event.eventDate) }}</div>
                    </div>

                    <div v-if="event.eventEndDate && event.eventEndDate !== event.eventDate" class="row items-center">
                      <div class="col-3 text-weight-medium">End Date:</div>
                      <div class="col">{{ formatEventDate(event.eventEndDate) }}</div>
                    </div>

                    <div class="row items-center">
                      <div class="col-3 text-weight-medium">Time:</div>
                      <div class="col">{{ formatEventTime(event) }}</div>
                    </div>

                    <!-- Recurring Event Info -->
                    <div v-if="event.eventRecurrence && event.eventRecurrence.type !== 'none'" class="row items-center">
                      <div class="col-3 text-weight-medium">Recurrence:</div>
                      <div class="col">
                        <q-chip
                          color="info"
                          text-color="white"
                          icon="mdi-repeat"
                          :label="formatRecurrence(event.eventRecurrence)"
                        />
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Location Card -->
              <q-card v-if="event.eventLocation" flat bordered>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-map-marker" class="q-mr-sm" />
                    Location
                  </div>

                  <div class="text-body1">{{ event.eventLocation }}</div>

                  <!-- Map link if location looks like an address -->
                  <div v-if="isAddress(event.eventLocation)" class="q-mt-sm">
                    <q-btn
                      flat
                      color="primary"
                      icon="mdi-map"
                      label="View on Map"
                      @click="openInMaps(event.eventLocation)"
                    />
                  </div>
                </q-card-section>
              </q-card>

              <!-- Description Card -->
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-text" class="q-mr-sm" />
                    Description
                  </div>

                  <div class="text-body1 whitespace-pre-wrap">{{ event.content }}</div>
                </q-card-section>
              </q-card>

              <!-- Tags Card -->
              <q-card v-if="event.tags.length > 0" flat bordered>
                <q-card-section>
                  <div class="text-h6 q-mb-md">
                    <q-icon name="mdi-tag-multiple" class="q-mr-sm" />
                    Tags
                  </div>

                  <div class="q-gutter-xs">
                    <q-chip
                      v-for="tag in event.tags"
                      :key="tag"
                      color="grey-3"
                      text-color="grey-8"
                      :label="tag"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="col-12 col-md-4 bg-grey-1 q-pa-md">
            <!-- Event Actions -->
            <q-card flat>
              <q-card-section>
                <div class="text-h6 q-mb-md">Actions</div>

                <div class="q-gutter-sm">
                  <q-btn
                    unelevated
                    color="primary"
                    icon="mdi-calendar-export"
                    label="Export to Calendar"
                    class="full-width"
                    @click="exportEvent"
                  />

                  <q-btn
                    unelevated
                    color="secondary"
                    icon="mdi-share"
                    label="Share Event"
                    class="full-width"
                    @click="shareEvent"
                  />

                  <q-btn
                    unelevated
                    color="info"
                    icon="mdi-content-copy"
                    label="Copy Details"
                    class="full-width"
                    @click="copyEventDetails"
                  />
                </div>
              </q-card-section>
            </q-card>

            <!-- Event Meta Information -->
            <q-card flat class="q-mt-md">
              <q-card-section>
                <div class="text-h6 q-mb-md">Event Information</div>

                <div class="q-gutter-sm">
                  <div class="row items-center">
                    <div class="col-5 text-caption text-grey-6">Type:</div>
                    <div class="col">
                      <q-chip
                        dense
                        :color="getEventColor(event.type)"
                        text-color="white"
                        :icon="getEventIcon(event.type)"
                        :label="formatEventType(event.type)"
                      />
                    </div>
                  </div>

                  <div class="row items-center">
                    <div class="col-5 text-caption text-grey-6">Organizer:</div>
                    <div class="col text-body2">{{ event.authorName }}</div>
                  </div>

                  <div v-if="event.featured" class="row items-center">
                    <div class="col-5 text-caption text-grey-6">Featured:</div>
                    <div class="col">
                      <q-icon name="mdi-star" color="amber" />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- Contact Information -->
            <q-card flat class="q-mt-md">
              <q-card-section>
                <div class="text-h6 q-mb-md">Contact</div>

                <div class="q-gutter-sm">
                  <q-btn
                    flat
                    color="primary"
                    icon="mdi-email"
                    :label="event.authorEmail"
                    class="full-width justify-start"
                    @click="contactOrganizer"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- Footer Actions -->
      <q-card-actions align="right" class="bg-grey-2">
        <q-btn
          flat
          label="Close"
          color="primary"
          @click="dialogVisible = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import type { CalendarEvent } from '../../services/calendar-events.service';
import { calendarEventsService } from '../../services/calendar-events.service';

interface Props {
  modelValue: boolean;
  event: CalendarEvent | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const $q = useQuasar();

// Dialog visibility
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Methods
const formatEventDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatEventTime = (event: CalendarEvent): string => {
  return calendarEventsService.formatEventTime(event);
};

const formatEventType = (type: CalendarEvent['type']): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
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

const getEventIcon = (type: CalendarEvent['type']): string => {
  return calendarEventsService.getEventTypeIcon(type);
};

const getEventColor = (type: CalendarEvent['type']): string => {
  return calendarEventsService.getEventTypeColor(type);
};

const isAddress = (location: string): boolean => {
  // Simple heuristic to detect if location might be an address
  return /\d/.test(location) && (location.includes(',') || location.includes('St') || location.includes('Ave') || location.includes('Rd') || location.includes('Dr'));
};

const openInMaps = (location: string) => {
  const encodedLocation = encodeURIComponent(location);
  const url = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  window.open(url, '_blank');
};

const exportEvent = () => {
  if (!props.event) return;

  // This would trigger the same export logic as in CalendarEventCard
  // For now, we'll just show a notification
  $q.notify({
    message: 'Event export functionality would be implemented here',
    color: 'info',
    icon: 'mdi-calendar-export',
  });
};

const shareEvent = () => {
  if (!props.event) return;

  const shareData = {
    title: props.event.title,
    text: `${props.event.title}\n\n${props.event.content}`,
    url: window.location.href,
  };

  if (navigator.share && window.isSecureContext) {
    navigator.share(shareData).catch(() => {
      copyEventDetails();
    });
  } else {
    copyEventDetails();
  }
};

const copyEventDetails = () => {
  if (!props.event) return;

  const eventText = [
    props.event.title,
    '',
    `Type: ${formatEventType(props.event.type)}`,
    `Date: ${formatEventDate(props.event.eventDate)}`,
    `Time: ${formatEventTime(props.event)}`,
    ...(props.event.eventLocation ? [`Location: ${props.event.eventLocation}`] : []),
    '',
    props.event.content,
    '',
    `Organizer: ${props.event.authorName} (${props.event.authorEmail})`,
  ].join('\n');

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

const contactOrganizer = () => {
  if (!props.event) return;

  const subject = encodeURIComponent(`Re: ${props.event.title}`);
  const body = encodeURIComponent(`Hi ${props.event.authorName},\n\nI'm interested in your event "${props.event.title}" scheduled for ${formatEventDate(props.event.eventDate)}.\n\n`);

  window.open(`mailto:${props.event.authorEmail}?subject=${subject}&body=${body}`);
};
</script>

<style scoped>
.event-details-dialog {
  height: 100vh;
  max-height: 100vh;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .event-details-dialog .row > div {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
}
</style>
