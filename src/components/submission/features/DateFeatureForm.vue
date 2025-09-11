<template>
  <div class="date-feature-form">
    <div class="text-subtitle2 q-mb-md">
      <q-icon name="event" class="q-mr-sm" />
      {{ $t('features.date.label') }}
    </div>

    <div class="q-gutter-md">
      <!-- All Day Toggle -->
      <q-toggle
        v-model="localDateFeature.isAllDay"
        :label="$t('features.date.allDay')"
        color="primary"
        class="q-mb-md"
      />

      <!-- Start Date and Time -->
      <div class="row q-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="startDate"
            :label="$t('features.date.startDate')"
            filled
            type="date"
            :rules="[required]"
          />
        </div>
        <div v-if="!localDateFeature.isAllDay" class="col-12 col-sm-6">
          <q-input
            v-model="startTime"
            :label="$t('features.date.startTime')"
            filled
            type="time"
            :rules="[required]"
          />
        </div>
      </div>

      <!-- End Date and Time (optional) -->
      <q-toggle
        v-model="hasEndDate"
        :label="$t('features.date.hasEndDate')"
        color="secondary"
        class="q-mt-md"
      />

      <div v-if="hasEndDate" class="row q-gutter-md q-mt-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="endDate"
            :label="$t('features.date.endDate')"
            filled
            type="date"
            :rules="[required, (val) => validateEndDate(val)]"
          />
        </div>
        <div v-if="!localDateFeature.isAllDay" class="col-12 col-sm-6">
          <q-input
            v-model="endTime"
            :label="$t('features.date.endTime')"
            filled
            type="time"
            :rules="[required]"
          />
        </div>
      </div>

      <!-- Preview -->
      <q-card flat bordered class="bg-grey-1 q-mt-md">
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
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timestamp } from 'firebase/firestore';
import { date } from 'quasar';
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

// Local state
const hasEndDate = ref(false);
const startDate = ref('');
const startTime = ref('09:00');
const endDate = ref('');
const endTime = ref('17:00');

// Local date feature with defaults
const localDateFeature = ref<DateFeature>({
  start: Timestamp.now(),
  isAllDay: false,
  ...(props.dateFeature || {})
});

// Computed
const required = (val: string) => !!val || t('forms.required');

// Methods
const validateEndDate = (val: string): boolean | string => {
  if (!val || !startDate.value) return true;
  const start = new Date(startDate.value);
  const end = new Date(val);
  return end >= start || t('features.date.endAfterStart');
};

const formatDatePreview = (): string => {
  try {
    const start = localDateFeature.value.start.toDate();
    let preview = '';

    if (localDateFeature.value.isAllDay) {
      preview = date.formatDate(start, 'MMMM D, YYYY');
      if (localDateFeature.value.end) {
        const end = localDateFeature.value.end.toDate();
        if (!date.isSameDate(start, end)) {
          preview += ` - ${date.formatDate(end, 'MMMM D, YYYY')}`;
        }
      }
      preview += ` (${t('features.date.allDay')})`;
    } else {
      preview = date.formatDate(start, 'MMMM D, YYYY [at] h:mm A');
      if (localDateFeature.value.end) {
        const end = localDateFeature.value.end.toDate();
        if (date.isSameDate(start, end)) {
          preview += ` - ${date.formatDate(end, 'h:mm A')}`;
        } else {
          preview += ` - ${date.formatDate(end, 'MMMM D, YYYY [at] h:mm A')}`;
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
    if (!startDate.value) return;

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
  } catch (error) {
    logger.error('Failed to update date feature', error);
  }
};

// Initialize form values from prop
watch(
  () => props.dateFeature,
  (newFeature) => {
    if (newFeature) {
      localDateFeature.value = { ...newFeature };
      const startDateTime = newFeature.start.toDate();
      startDate.value = date.formatDate(startDateTime, 'YYYY-MM-DD');
      startTime.value = date.formatDate(startDateTime, 'HH:mm');

      if (newFeature.end) {
        hasEndDate.value = true;
        const endDateTime = newFeature.end.toDate();
        endDate.value = date.formatDate(endDateTime, 'YYYY-MM-DD');
        endTime.value = date.formatDate(endDateTime, 'HH:mm');
      }
    }
  },
  { immediate: true }
);

// Watch for changes and update the feature
watch([startDate, startTime, endDate, endTime, hasEndDate, () => localDateFeature.value.isAllDay],
  updateDateFeature,
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
