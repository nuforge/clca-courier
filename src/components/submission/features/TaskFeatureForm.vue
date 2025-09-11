<template>
  <div class="task-feature-form">
    <div class="text-subtitle2 q-mb-md">
      <q-icon name="assignment" class="q-mr-sm" />
      {{ $t('features.task.label') }}
    </div>

    <div class="q-gutter-md">
      <!-- Task Category -->
      <q-select
        v-model="localTaskFeature.category"
        :options="taskCategories"
        :label="$t('features.task.category')"
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
            :label="$t('features.task.quantity')"
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
            :label="$t('features.task.unit')"
            filled
            emit-value
            map-options
            :rules="[required]"
          />
        </div>
      </div>

      <!-- Task Status (always starts as unclaimed) -->
      <q-card flat bordered class="bg-grey-1">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">{{ $t('features.task.status') }}</div>
          <q-chip color="orange" text-color="white" icon="pending">
            {{ $t('content.status.unclaimed') }}
          </q-chip>
          <div class="text-caption text-grey-7 q-mt-sm">
            {{ $t('features.task.statusHelp') }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Preview -->
      <q-card flat bordered class="bg-grey-1">
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

// Local task feature with defaults
const localTaskFeature = ref<TaskFeature>({
  category: '',
  qty: 1,
  unit: '',
  status: 'unclaimed',
  ...(props.taskFeature || {})
});

// Task category options
const taskCategories = computed(() => [
  { label: t('features.task.categories.setup'), value: 'setup' },
  { label: t('features.task.categories.printing'), value: 'printing' },
  { label: t('features.task.categories.cleanup'), value: 'cleanup' },
  { label: t('features.task.categories.delivery'), value: 'delivery' },
  { label: t('features.task.categories.coordination'), value: 'coordination' },
  { label: t('features.task.categories.supplies'), value: 'supplies' },
  { label: t('features.task.categories.technical'), value: 'technical' },
  { label: t('features.task.categories.other'), value: 'other' }
]);

// Unit options
const unitOptions = computed(() => [
  { label: t('features.task.units.people'), value: 'people' },
  { label: t('features.task.units.hours'), value: 'hours' },
  { label: t('features.task.units.items'), value: 'items' },
  { label: t('features.task.units.copies'), value: 'copies' },
  { label: t('features.task.units.sets'), value: 'sets' },
  { label: t('features.task.units.tables'), value: 'tables' },
  { label: t('features.task.units.chairs'), value: 'chairs' },
  { label: t('features.task.units.boxes'), value: 'boxes' }
]);

// Validation
const required = (val: string | number) => !!val || t('forms.required');
const validateQuantity = (val: number) => (val > 0 && val <= 999) || t('features.task.quantityRange');

// Methods
const formatTaskPreview = (): string => {
  if (!localTaskFeature.value.category || !localTaskFeature.value.qty || !localTaskFeature.value.unit) {
    return t('features.task.incompleteTask');
  }

  const categoryLabel = taskCategories.value.find(cat => cat.value === localTaskFeature.value.category)?.label || localTaskFeature.value.category;
  const unitLabel = unitOptions.value.find(unit => unit.value === localTaskFeature.value.unit)?.label || localTaskFeature.value.unit;

  return t('features.task.previewFormat', {
    qty: localTaskFeature.value.qty,
    unit: unitLabel,
    category: categoryLabel
  });
};

// Watch for changes and emit updates
watch(
  localTaskFeature,
  (newFeature) => {
    if (newFeature.category && newFeature.qty > 0 && newFeature.unit) {
      emit('update:taskFeature', { ...newFeature });
      logger.debug('Task feature updated', newFeature);
    }
  },
  { deep: true }
);

// Initialize from prop
watch(
  () => props.taskFeature,
  (newFeature) => {
    if (newFeature) {
      localTaskFeature.value = { ...newFeature };
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.task-feature-form {
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--q-grey-1);
}
</style>
