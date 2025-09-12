<template>
  <div class="date-feature-form">
    <div class="text-subtitle2 q-mb-md">
      <q-icon name="event" class="q-mr-sm" />
      {{ $t('content.features.date.label') }}
    </div>

    <div class="q-gutter-md">
      <!-- All Day Toggle -->
      <q-toggle
        v-model="localDateFeature.isAllDay"
        :label="$t('content.features.date.allDay')"
        color="primary"
        class="q-mb-md"
      />

      <!-- Start Date and Time -->
      <div class="row q-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="startDateDisplay"
            :label="$t('content.features.date.startDate')"
            filled
            readonly
            :rules="[required]"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="startDate"
                    :mask="'YYYY-MM-DD'"
                    :navigation-min-year-month="'2020/01'"
                    :navigation-max-year-month="'2030/12'"
                    today-btn
                    @update:model-value="onStartDateChange"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div v-if="!localDateFeature.isAllDay" class="col-12 col-sm-6">
          <q-input
            v-model="startTimeDisplay"
            :label="$t('content.features.date.startTime')"
            filled
            readonly
            :rules="[required]"
          >
            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time
                    v-model="startTime"
                    :mask="'HH:mm'"
                    format24h
                    @update:model-value="onStartTimeChange"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
      </div>

      <!-- End Date and Time (optional) -->
      <q-toggle
        v-model="hasEndDate"
        :label="$t('content.features.date.hasEndDate')"
        color="secondary"
        class="q-mt-md"
      />

      <div v-if="hasEndDate" class="row q-gutter-md q-mt-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="endDateDisplay"
            :label="$t('content.features.date.endDate')"
            filled
            readonly
            :rules="[required, validateEndDateDisplay]"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="endDate"
                    :mask="'YYYY-MM-DD'"
                    :navigation-min-year-month="'2020/01'"
                    :navigation-max-year-month="'2030/12'"
                    today-btn
                    @update:model-value="onEndDateChange"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div v-if="!localDateFeature.isAllDay" class="col-12 col-sm-6">
          <q-input
            v-model="endTimeDisplay"
            :label="$t('content.features.date.endTime')"
            filled
            readonly
            :rules="[required]"
          >
            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time
                    v-model="endTime"
                    :mask="'HH:mm'"
                    format24h
                    @update:model-value="onEndTimeChange"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
      </div>

      <!-- Preview -->
      <q-card flat bordered :class="[backgroundClasses.surface, 'q-mt-md']">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">{{ $t('common.preview') }}</div>
          <div class="text-body2">
            <q-icon name="event" class="q-mr-sm" />
            {{ formatDatePreview() }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timestamp } from 'firebase/firestore';
import { date } from 'quasar';
import { useTheme } from '../../../composables/useTheme';
import { logger } from '../../../utils/logger';

interface DateFeature {
  start: Timestamp;
  end?: Timestamp;
  isAllDay: boolean;
}

interface Props {
  dateFeature?: DateFeature;
}

interface Emits {
  (e: 'update:dateFeature', value: DateFeature): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { backgroundClasses } = useTheme();

// State management flags
const isUpdatingFromProps = ref(false);

// Local state
const hasEndDate = ref(false);
const startDate = ref('');
const startTime = ref('09:00');
const endDate = ref('');
const endTime = ref('17:00');

// Display values for readonly inputs
const startDateDisplay = computed(() => {
  if (!startDate.value) return '';
  const date = new Date(startDate.value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const startTimeDisplay = computed(() => {
  if (!startTime.value) return '';
  const [hours, minutes] = startTime.value.split(':');
  if (!hours || !minutes) return '';
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

const endDateDisplay = computed(() => {
  if (!endDate.value) return '';
  const date = new Date(endDate.value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const endTimeDisplay = computed(() => {
  if (!endTime.value) return '';
  const [hours, minutes] = endTime.value.split(':');
  if (!hours || !minutes) return '';
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

// Local date feature with defaults
const localDateFeature = ref<DateFeature>({
  start: Timestamp.now(),
  isAllDay: false,
  ...(props.dateFeature || {})
});

// Computed
const required = (val: string) => !!val || t('forms.required');

// Event handlers for date/time pickers
const onStartDateChange = (value: string | null) => {
  if (value) {
    startDate.value = value;
    updateDateFeature();
  }
};

const onStartTimeChange = (value: string | null) => {
  if (value) {
    startTime.value = value;
    updateDateFeature();
  }
};

const onEndDateChange = (value: string | null) => {
  if (value) {
    endDate.value = value;
    updateDateFeature();
  }
};

const onEndTimeChange = (value: string | null) => {
  if (value) {
    endTime.value = value;
    updateDateFeature();
  }
};

// Methods
const validateEndDateDisplay = (): boolean | string => {
  if (!endDate.value || !startDate.value) return true;
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  return end >= start || t('features.date.endAfterStart');
};

const formatDatePreview = (): string => {
  try {
    const start = toDate(localDateFeature.value.start);
    if (!start) return '';

    let preview = '';

    if (localDateFeature.value.isAllDay) {
      preview = date.formatDate(start, 'MMMM D, YYYY');
      if (localDateFeature.value.end) {
        const end = toDate(localDateFeature.value.end);
        if (end && !date.isSameDate(start, end)) {
          preview += ` - ${date.formatDate(end, 'MMMM D, YYYY')}`;
        }
      }
      preview += ` (${t('features.date.allDay')})`;
    } else {
      preview = date.formatDate(start, 'MMMM D, YYYY [at] h:mm A');
      if (localDateFeature.value.end) {
        const end = toDate(localDateFeature.value.end);
        if (end) {
          if (date.isSameDate(start, end)) {
            preview += ` - ${date.formatDate(end, 'h:mm A')}`;
          } else {
            preview += ` - ${date.formatDate(end, 'MMMM D, YYYY [at] h:mm A')}`;
          }
        }
      }
    }

    return preview;
  } catch (error) {
    logger.error('Failed to format date preview', error);
    return t('features.date.invalidDate');
  }
};

const updateDateFeature = () => {
  try {
    // Don't emit updates during prop initialization
    if (isUpdatingFromProps.value || !startDate.value) return;

    let startDateTime: Date;
    if (localDateFeature.value.isAllDay) {
      startDateTime = new Date(startDate.value + 'T00:00:00');
    } else {
      startDateTime = new Date(startDate.value + 'T' + (startTime.value || '09:00'));
    }

    const updatedFeature: DateFeature = {
      start: Timestamp.fromDate(startDateTime),
      isAllDay: localDateFeature.value.isAllDay
    };

    if (hasEndDate.value && endDate.value) {
      let endDateTime: Date;
      if (localDateFeature.value.isAllDay) {
        endDateTime = new Date(endDate.value + 'T23:59:59');
      } else {
        endDateTime = new Date(endDate.value + 'T' + (endTime.value || '17:00'));
      }
      updatedFeature.end = Timestamp.fromDate(endDateTime);
    }

    localDateFeature.value = updatedFeature;
    emit('update:dateFeature', updatedFeature);
    logger.debug('Date feature updated', updatedFeature);
  } catch (error) {
    logger.error('Failed to update date feature', error);
  }
};

// Helper function to safely convert timestamps to Date objects
const toDate = (timestamp: Date | Timestamp | null | undefined): Date | null => {
  if (!timestamp) return null;

  // If it's already a Date object, return it
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // If it's a Firebase Timestamp, convert it
  if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }

  // Fallback: try to create a Date from the value
  try {
    return new Date(timestamp);
  } catch (error) {
    logger.error('Failed to convert timestamp to Date', { timestamp, error });
    return null;
  }
};

// Initialize from prop - set flag to prevent emission during prop updates
watch(
  () => props.dateFeature,
  (newFeature) => {
    if (newFeature) {
      isUpdatingFromProps.value = true;
      localDateFeature.value = { ...newFeature };

      const startDateTime = toDate(newFeature.start);
      if (startDateTime) {
        startDate.value = date.formatDate(startDateTime, 'YYYY-MM-DD');
        startTime.value = date.formatDate(startDateTime, 'HH:mm');
      }

      if (newFeature.end) {
        hasEndDate.value = true;
        const endDateTime = toDate(newFeature.end);
        if (endDateTime) {
          endDate.value = date.formatDate(endDateTime, 'YYYY-MM-DD');
          endTime.value = date.formatDate(endDateTime, 'HH:mm');
        }
      }

      // Reset flag on next tick
      setTimeout(() => {
        isUpdatingFromProps.value = false;
      }, 0);
    }
  },
  { immediate: true }
);

// Watch for changes and update the feature (avoid recursive updates)
watch([startDate, startTime, endDate, endTime, hasEndDate, () => localDateFeature.value.isAllDay],
  () => {
    if (!isUpdatingFromProps.value) {
      updateDateFeature();
    }
  },
  { deep: true }
);

// Initialize with default date (tomorrow at 9 AM)
if (!props.dateFeature) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  startDate.value = date.formatDate(tomorrow, 'YYYY-MM-DD');
  updateDateFeature();
}
</script>

<style lang="scss" scoped>
.date-feature-form {
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--q-grey-1);
}
</style>
