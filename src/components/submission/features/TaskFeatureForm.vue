<template>
  <div class="task-feature-form">
    <div class="text-subtitle2 q-mb-md">
      <q-icon name="assignment" class="q-mr-sm" />
      {{ $t('content.features.task.label') }}
    </div>

    <div class="q-gutter-md">
      <!-- Task Category -->
      <q-select
        v-model="localTaskFeature.category"
        :options="taskCategories"
        :label="$t('content.features.task.category')"
        filled
        emit-value
        map-options
        :rules="[required]"
      />

      <!-- Quantity and Unit -->
      <div class="row q-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="localTaskFeature.qty"
            :label="$t('content.features.task.quantity')"
            type="number"
            filled
            min="1"
            max="999"
            :rules="[required, validateQuantity]"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-select
            v-model="localTaskFeature.unit"
            :options="unitOptions"
            :label="$t('content.features.task.unit')"
            filled
            emit-value
            map-options
            :rules="[required]"
          />
        </div>
      </div>

      <!-- Task Status (always starts as unclaimed) -->
      <q-card flat bordered :class="backgroundClasses.surface">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">{{ $t('content.features.task.status') }}</div>
          <q-chip color="orange" text-color="white" icon="pending">
            {{ $t('content.status.unclaimed') }}
          </q-chip>
          <div class="text-caption text-grey-7 q-mt-sm">
            {{ $t('content.features.task.statusHelp') }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Preview -->
      <q-card flat bordered :class="backgroundClasses.surface">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">{{ $t('common.preview') }}</div>
          <div class="text-body2">
            <q-icon name="assignment" class="q-mr-sm" />
            {{ formatTaskPreview() }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from '../../../composables/useTheme';
import { logger } from '../../../utils/logger';

interface TaskFeature {
  category: string;
  qty: number;
  unit: string;
  status: 'unclaimed' | 'claimed' | 'completed';
  claimedBy?: string;
}

interface Props {
  taskFeature?: TaskFeature;
}

interface Emits {
  (e: 'update:taskFeature', value: TaskFeature): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { backgroundClasses } = useTheme();

// Local task feature with defaults
const localTaskFeature = ref<TaskFeature>({
  category: '',
  qty: 1,
  unit: '',
  status: 'unclaimed',
  ...(props.taskFeature || {})
});

// Flag to prevent emission during prop updates
const isUpdatingFromProps = ref(false);

// Task category options
const taskCategories = computed(() => [
  { label: t('content.features.task.categories.setup'), value: 'setup' },
  { label: t('content.features.task.categories.printing'), value: 'printing' },
  { label: t('content.features.task.categories.cleanup'), value: 'cleanup' },
  { label: t('content.features.task.categories.delivery'), value: 'delivery' },
  { label: t('content.features.task.categories.coordination'), value: 'coordination' },
  { label: t('content.features.task.categories.supplies'), value: 'supplies' },
  { label: t('content.features.task.categories.technical'), value: 'technical' },
  { label: t('content.features.task.categories.other'), value: 'other' }
]);

// Unit options
const unitOptions = computed(() => [
  { label: t('content.features.task.units.people'), value: 'people' },
  { label: t('content.features.task.units.hours'), value: 'hours' },
  { label: t('content.features.task.units.items'), value: 'items' },
  { label: t('content.features.task.units.copies'), value: 'copies' },
  { label: t('content.features.task.units.sets'), value: 'sets' },
  { label: t('content.features.task.units.tables'), value: 'tables' },
  { label: t('content.features.task.units.chairs'), value: 'chairs' },
  { label: t('content.features.task.units.boxes'), value: 'boxes' }
]);

// Validation
const required = (val: string | number) => !!val || t('forms.required');
const validateQuantity = (val: number) => (val > 0 && val <= 999) || t('content.features.task.quantityRange');

// Methods
const formatTaskPreview = (): string => {
  if (!localTaskFeature.value.category || !localTaskFeature.value.qty || !localTaskFeature.value.unit) {
    return t('content.features.task.incompleteTask');
  }

  const categoryLabel = taskCategories.value.find(cat => cat.value === localTaskFeature.value.category)?.label || localTaskFeature.value.category;
  const unitLabel = unitOptions.value.find(unit => unit.value === localTaskFeature.value.unit)?.label || localTaskFeature.value.unit;

  return t('content.features.task.previewFormat', {
    qty: localTaskFeature.value.qty,
    unit: unitLabel,
    category: categoryLabel
  });
};

// Watch for changes and emit updates
watch(
  localTaskFeature,
  (newFeature) => {
    // Only emit if this isn't a prop update and feature is valid
    if (!isUpdatingFromProps.value && newFeature.category && newFeature.qty > 0 && newFeature.unit) {
      emit('update:taskFeature', { ...newFeature });
      logger.debug('Task feature updated', newFeature);
    }
  },
  { deep: true }
);

// Initialize from prop - set flag to prevent emission during prop updates
watch(
  () => props.taskFeature,
  (newFeature) => {
    if (newFeature) {
      isUpdatingFromProps.value = true;
      localTaskFeature.value = { ...newFeature };
      // Reset flag on next tick
      setTimeout(() => {
        isUpdatingFromProps.value = false;
      }, 0);
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.task-feature-form {
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--q-surface);
  color: var(--q-on-surface);
}
</style>
