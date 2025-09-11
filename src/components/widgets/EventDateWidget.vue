<template>
  <div class="event-date-widget q-pa-sm bg-blue-1 rounded-borders">
    <div class="row items-center q-gutter-sm">
      <q-icon name="event" color="primary" size="sm" />
      <div class="col">
        <div class="text-body2 text-weight-medium">
          {{ $t('content.features.date.label') }}
        </div>
        <div class="text-caption text-grey-7">
          {{ formatEventDate }}
        </div>
      </div>
      <q-chip
        v-if="dateFeature.isAllDay"
        dense
        color="primary"
        text-color="white"
        size="sm"
      >
        {{ $t('content.features.date.allDay') }}
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '../../utils/date-formatter';
import type { ContentFeatures } from '../../types/core/content.types';

interface Props {
  dateFeature: NonNullable<ContentFeatures['feat:date']>;
}

const props = defineProps<Props>();

const formatEventDate = computed(() => {
  const start = formatDate(props.dateFeature.start);

  if (props.dateFeature.isAllDay) {
    if (props.dateFeature.end) {
      const end = formatDate(props.dateFeature.end);
      return `${start} - ${end}`;
    }
    return start;
  }

  if (props.dateFeature.end) {
    const end = formatDate(props.dateFeature.end);
    return `${start} - ${end}`;
  }

  return start;
});
</script>

<style lang="scss" scoped>
.event-date-widget {
  border-left: 3px solid var(--q-primary);
}
</style>
