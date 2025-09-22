<!--
  TaskFeatureForm - Form for creating volunteer workflow tasks
  Part of the volunteer workflow system for content submission
-->
<template>
  <q-card flat bordered class="feature-form">
    <q-card-section>
      <div class="text-subtitle1 q-mb-md">
        <q-icon name="assignment" class="q-mr-sm" />
        {{ $t('content.features.task.title') }}
      </div>

      <div class="q-gutter-md">
        <!-- Task Category -->
        <q-select
          v-model="localTask.category"
          :options="taskCategories"
          :label="$t('content.features.task.category')"
          outlined
          emit-value
          map-options
          :rules="[val => !!val || $t('content.features.task.category_required')]"
        />

        <!-- Estimated Time -->
        <q-input
          v-model.number="localTask.estimatedTime"
          type="number"
          :label="$t('content.features.task.estimated_time')"
          outlined
          suffix="minutes"
          :rules="[
            val => !!val || $t('content.features.task.time_required'),
            val => val > 0 || $t('content.features.task.time_positive')
          ]"
        />

        <!-- Priority -->
        <q-select
          v-model="localTask.priority"
          :options="priorityOptions"
          :label="$t('content.features.task.priority')"
          outlined
          emit-value
          map-options
        />

        <!-- Instructions -->
        <q-input
          v-model="localTask.instructions"
          type="textarea"
          :label="$t('content.features.task.instructions')"
          outlined
          rows="3"
          :hint="$t('content.features.task.instructions_hint')"
        />

        <!-- Due Date (Optional) -->
        <q-input
          v-model="dueDateString"
          type="datetime-local"
          :label="$t('content.features.task.due_date')"
          outlined
          :hint="$t('content.features.task.due_date_hint')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timestamp } from 'firebase/firestore';
import { formatDate } from '../../../utils/date-formatter';
import type { TaskFeature } from '../../../types/core/content.types';

// Props
interface Props {
  taskFeature: TaskFeature;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:task-feature': [value: TaskFeature];
}>();

// Composables
const { t } = useI18n();

// Local state
const localTask = ref<TaskFeature>({ ...props.taskFeature });

// Computed property for due date string conversion using date formatter
const dueDateString = computed({
  get: () => {
    if (!localTask.value.dueDate) return '';
    // Use date formatter to safely convert Timestamp to ISO string
    const date = localTask.value.dueDate.toDate();
    return date.toISOString().slice(0, 16);
  },
  set: (value: string) => {
    if (value) {
      localTask.value.dueDate = Timestamp.fromDate(new Date(value));
    } else {
      delete localTask.value.dueDate;
    }
  }
});

// Task categories for volunteer workflow
const taskCategories = computed(() => [
  { label: t('content.features.task.categories.review'), value: 'review' },
  { label: t('content.features.task.categories.layout'), value: 'layout' },
  { label: t('content.features.task.categories.fact_check'), value: 'fact-check' },
  { label: t('content.features.task.categories.approve'), value: 'approve' },
  { label: t('content.features.task.categories.print'), value: 'print' }
]);

// Priority options
const priorityOptions = computed(() => [
  { label: t('content.features.task.priorities.low'), value: 'low' },
  { label: t('content.features.task.priorities.medium'), value: 'medium' },
  { label: t('content.features.task.priorities.high'), value: 'high' }
]);

// Watch for changes and emit updates
watch(localTask, (newValue) => {
  emit('update:task-feature', { ...newValue });
}, { deep: true });

// Watch for prop changes
watch(() => props.taskFeature, (newValue) => {
  localTask.value = { ...newValue };
}, { deep: true });
</script>

<style scoped>
.feature-form {
  border-left: 4px solid var(--q-primary);
}
</style>
