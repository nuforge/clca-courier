<!--
  TaskWidget - Display widget for volunteer workflow tasks
  Part of the volunteer workflow system for content cards
-->
<template>
  <q-card flat bordered class="task-widget">
    <q-card-section class="q-pa-sm">
      <div class="row items-center">
        <div class="col">
          <div class="text-subtitle2 text-weight-medium">
            <q-icon :name="UI_ICONS.assignment" class="q-mr-xs" />
            {{ $t('content.features.task.title') }}
          </div>
          <div class="text-caption text-grey-7">
            {{ $t(`content.features.task.categories.${taskFeature.category}`) }}
            • {{ taskFeature.estimatedTime }} {{ $t('content.features.task.minutes') }}
            • {{ $t(`content.features.task.priorities.${taskFeature.priority}`) }}
          </div>
        </div>
        <div class="col-auto">
          <q-chip
            :color="statusColor"
            :text-color="statusTextColor"
            size="sm"
            :label="$t(`content.features.task.status.${taskFeature.status}`)"
          />
        </div>
      </div>

      <!-- Task Details -->
      <div v-if="taskFeature.instructions" class="q-mt-sm">
        <div class="text-caption text-grey-7">
          {{ taskFeature.instructions }}
        </div>
      </div>

      <!-- Due Date -->
      <div v-if="taskFeature.dueDate" class="q-mt-xs">
        <div class="text-caption text-grey-6">
          <q-icon name="schedule" size="xs" class="q-mr-xs" />
          {{ $t('content.features.task.due') }}: {{ formatDate(taskFeature.dueDate) }}
        </div>
      </div>

      <!-- Assigned User -->
      <div v-if="taskFeature.assignedTo && assignedUserName" class="q-mt-xs">
        <div class="text-caption text-grey-6">
          <q-icon name="person" size="xs" class="q-mr-xs" />
          {{ $t('content.features.task.assigned_to') }}: {{ assignedUserName }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { UI_ICONS } from '../../constants/ui-icons';
import { formatDate } from '../../utils/date-formatter';
import type { TaskFeature } from '../../types/core/content.types';

// Props
interface Props {
  taskFeature: TaskFeature;
  assignedUserName?: string;
  canClaim?: boolean;
}

const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// Computed properties - using existing patterns from TaskCard.vue
const statusColor = computed(() => {
  const colors = {
    unclaimed: 'grey-4',
    claimed: 'orange',
    'in-progress': 'blue',
    completed: 'green'
  };
  return colors[props.taskFeature.status] || 'grey';
});

const statusTextColor = computed(() => {
  return props.taskFeature.status === 'unclaimed' ? 'grey-8' : 'white';
});
</script>

<style scoped>
.task-widget {
  border-left: 3px solid var(--q-primary);
}
</style>
