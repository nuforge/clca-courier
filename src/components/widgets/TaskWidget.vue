<template>
  <div class="task-widget q-pa-sm bg-orange-1 rounded-borders">
    <div class="row items-center justify-between">
      <div class="row items-center q-gutter-sm">
        <q-icon name="task_alt" color="warning" size="sm" />
        <div class="col">
          <div class="text-body2 text-weight-medium">
            {{ $t('content.features.task.label') }}: {{ taskFeature.category }}
          </div>
          <div class="text-caption text-grey-7">
            {{ $t('content.features.task.quantity', { qty: taskFeature.qty, unit: taskFeature.unit }) }}
          </div>
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-chip
          :color="getStatusColor"
          :text-color="getStatusTextColor"
          dense
          size="sm"
        >
          {{ getStatusLabel }}
        </q-chip>

        <q-btn
          v-if="canClaim && taskFeature.status === 'unclaimed'"
          dense
          outline
          color="primary"
          size="sm"
          :label="$t('content.features.task.claim')"
          @click="$emit('claim-task')"
          :aria-label="$t('common.accessibility.claimTask')"
        />
      </div>
    </div>

    <div v-if="taskFeature.claimedBy && taskFeature.status === 'claimed'" class="q-mt-sm">
      <div class="text-caption text-grey-6">
        {{ $t('content.features.task.claimedBy', { user: taskFeature.claimedBy }) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContentFeatures } from '../../types/core/content.types';

interface Props {
  taskFeature: NonNullable<ContentFeatures['feat:task']>;
  canClaim?: boolean;
}

interface Emits {
  (e: 'claim-task'): void;
}

const props = withDefaults(defineProps<Props>(), {
  canClaim: false
});

defineEmits<Emits>();

const { t } = useI18n();

const getStatusColor = computed(() => {
  switch (props.taskFeature.status) {
    case 'unclaimed': return 'warning';
    case 'claimed': return 'info';
    case 'completed': return 'positive';
    default: return 'grey';
  }
});

const getStatusTextColor = computed(() => {
  return props.taskFeature.status === 'unclaimed' ? 'dark' : 'white';
});

const getStatusLabel = computed(() => {
  return t(`features.task.status.${props.taskFeature.status}`);
});
</script>

<style lang="scss" scoped>
.task-widget {
  border-left: 3px solid var(--q-warning);
}
</style>
