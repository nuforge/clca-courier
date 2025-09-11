<template>
  <div class="features-step">
    <div class="text-h6 q-mb-md">{{ $t('content.submission.steps.features.subtitle') }}</div>
    <p class="text-body2 text-grey-7 q-mb-lg">
      {{ $t('content.submission.steps.features.description') }}
    </p>

    <div class="q-gutter-lg">
      <!-- Required Features Section -->
      <div v-if="requiredFeatures.length > 0">
        <h6 class="text-h6 text-weight-medium q-mb-md">
          {{ $t('content.submission.steps.features.required') }}
        </h6>

        <!-- Date Feature (Required for events) -->
        <div v-if="requiredFeatures.includes('feat:date')" class="feature-section">
          <DateFeatureForm
            v-if="localFeatures['feat:date']"
            :date-feature="localFeatures['feat:date']"
            @update:date-feature="(value: DateFeature) => updateFeature('feat:date', value)"
          />
        </div>

        <!-- Task Feature (Required for tasks) -->
        <div v-if="requiredFeatures.includes('feat:task')" class="feature-section">
          <TaskFeatureForm
            v-if="localFeatures['feat:task']"
            :task-feature="localFeatures['feat:task']"
            @update:task-feature="(value: TaskFeature) => updateFeature('feat:task', value)"
          />
        </div>
      </div>

      <!-- Optional Features Section -->
      <div v-if="optionalFeatures.length > 0">
        <h6 class="text-h6 text-weight-medium q-mb-md">
          {{ $t('content.submission.steps.features.optional') }}
        </h6>

        <!-- Location Feature Toggle -->
        <div v-if="optionalFeatures.includes('feat:location')" class="feature-section">
          <q-expansion-item
            v-model="featureToggles.location"
            :label="$t('content.features.location.label')"
            icon="location_on"
            :caption="$t('content.features.location.description')"
            class="feature-toggle"
          >
            <LocationFeatureForm
              v-if="localFeatures['feat:location']"
              :location-feature="localFeatures['feat:location']"
              @update:location-feature="(value: LocationFeature) => updateFeature('feat:location', value)"
            />
          </q-expansion-item>
        </div>

        <!-- Additional Task Feature (for events) -->
        <div v-if="optionalFeatures.includes('feat:task')" class="feature-section">
          <q-expansion-item
            v-model="featureToggles.task"
            :label="$t('content.features.task.label')"
            icon="assignment"
            :caption="$t('content.features.task.description')"
            class="feature-toggle"
          >
            <TaskFeatureForm
              v-if="localFeatures['feat:task']"
              :task-feature="localFeatures['feat:task']"
              @update:task-feature="(value: TaskFeature) => updateFeature('feat:task', value)"
            />
          </q-expansion-item>
        </div>

        <!-- Additional Date Feature (for announcements) -->
        <div v-if="optionalFeatures.includes('feat:date')" class="feature-section">
          <q-expansion-item
            v-model="featureToggles.date"
            :label="$t('content.features.date.label')"
            icon="event"
            :caption="$t('content.features.date.description')"
            class="feature-toggle"
          >
            <DateFeatureForm
              v-if="localFeatures['feat:date']"
              :date-feature="localFeatures['feat:date']"
              @update:date-feature="(value: DateFeature) => updateFeature('feat:date', value)"
            />
          </q-expansion-item>
        </div>

        <!-- Canva Integration Feature -->
        <div v-if="optionalFeatures.includes('integ:canva')" class="feature-section">
          <q-expansion-item
            v-model="featureToggles.canva"
            :label="$t('content.features.canva.label')"
            icon="design_services"
            :caption="$t('content.features.canva.description')"
            class="feature-toggle"
          >
            <CanvaFeatureForm
              v-if="localFeatures['integ:canva']"
              :canva-feature="localFeatures['integ:canva']"
              @update:canva-feature="(value: CanvaFeature) => updateFeature('integ:canva', value)"
            />
          </q-expansion-item>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="row justify-between q-mt-xl">
      <q-btn
        :label="$t('common.actions.back')"
        flat
        color="grey-7"
        @click="$emit('back')"
        size="lg"
        class="q-px-xl"
      />
      <q-btn
        :label="$t('common.actions.next')"
        color="primary"
        :disable="!isValid"
        @click="handleNext"
        unelevated
        size="lg"
        class="q-px-xl"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { logger } from '../../utils/logger';
import type { ContentFeatures } from '../../types/core/content.types';

// Type aliases for easier reference
type DateFeature = NonNullable<ContentFeatures['feat:date']>;
type TaskFeature = NonNullable<ContentFeatures['feat:task']>;
type LocationFeature = NonNullable<ContentFeatures['feat:location']>;
type CanvaFeature = NonNullable<ContentFeatures['integ:canva']>;

// Import feature form components
import DateFeatureForm from './features/DateFeatureForm.vue';
import TaskFeatureForm from './features/TaskFeatureForm.vue';
import LocationFeatureForm from './features/LocationFeatureForm.vue';
import CanvaFeatureForm from './features/CanvaFeatureForm.vue';

interface Props {
  features: Partial<ContentFeatures>;
  contentType: string | null;
}

interface Emits {
  (e: 'update:features', value: Partial<ContentFeatures>): void;
  (e: 'next'): void;
  (e: 'back'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Content type configuration
const contentTypeConfig = {
  news: {
    requiredFeatures: [],
    optionalFeatures: ['feat:location']
  },
  event: {
    requiredFeatures: ['feat:date'],
    optionalFeatures: ['feat:location', 'feat:task', 'integ:canva']
  },
  announcement: {
    requiredFeatures: [],
    optionalFeatures: ['feat:date', 'integ:canva']
  },
  classified: {
    requiredFeatures: [],
    optionalFeatures: ['feat:location']
  },
  task: {
    requiredFeatures: ['feat:task'],
    optionalFeatures: ['feat:date', 'feat:location']
  },
  article: {
    requiredFeatures: [],
    optionalFeatures: ['feat:location', 'integ:canva']
  }
};

// Feature toggles for optional features
const featureToggles = ref({
  date: false,
  task: false,
  location: false,
  canva: false
});

// Local features state
const localFeatures = computed({
  get: () => props.features,
  set: (value) => emit('update:features', value)
});

// Computed properties
const requiredFeatures = computed(() => {
  if (!props.contentType) return [];
  return contentTypeConfig[props.contentType as keyof typeof contentTypeConfig]?.requiredFeatures || [];
});

const optionalFeatures = computed(() => {
  if (!props.contentType) return [];
  return contentTypeConfig[props.contentType as keyof typeof contentTypeConfig]?.optionalFeatures || [];
});

const isValid = computed(() => {
  // Check if all required features are properly configured
  for (const feature of requiredFeatures.value) {
    const featureData = localFeatures.value[feature as keyof ContentFeatures];
    if (!featureData || !isFeatureValid(feature, featureData)) {
      return false;
    }
  }
  return true;
});

// Methods
const isFeatureValid = (featureKey: string, featureData: unknown): boolean => {
  if (!featureData || typeof featureData !== 'object' || featureData === null) {
    return false;
  }

  const data = featureData as Record<string, unknown>;

  switch (featureKey) {
    case 'feat:date':
      return 'start' in data;
    case 'feat:task':
      return 'category' in data && 'qty' in data && 'unit' in data;
    case 'feat:location':
      return 'address' in data;
    case 'integ:canva':
      return 'designId' in data;
    default:
      return true;
  }
};

const updateFeature = (featureKey: keyof ContentFeatures, value: unknown) => {
  const updatedFeatures = { ...localFeatures.value };

  if (value) {
    (updatedFeatures as Record<string, unknown>)[featureKey] = value;
  } else {
    delete (updatedFeatures as Record<string, unknown>)[featureKey];
  }

  localFeatures.value = updatedFeatures;
};

const handleNext = () => {
  if (!isValid.value) {
    logger.warn('Attempted to proceed with invalid features');
    return;
  }

  logger.debug('Features configuration completed', {
    requiredFeatures: requiredFeatures.value,
    configuredFeatures: Object.keys(localFeatures.value),
    contentType: props.contentType
  });

  emit('next');
};

// Watch for feature toggle changes to clean up disabled features
watch(
  featureToggles,
  (newToggles) => {
    const updatedFeatures = { ...localFeatures.value };

    // Remove features that were toggled off
    if (!newToggles.date && !requiredFeatures.value.includes('feat:date')) {
      delete updatedFeatures['feat:date'];
    }
    if (!newToggles.task && !requiredFeatures.value.includes('feat:task')) {
      delete updatedFeatures['feat:task'];
    }
    if (!newToggles.location) {
      delete updatedFeatures['feat:location'];
    }
    if (!newToggles.canva) {
      delete updatedFeatures['integ:canva'];
    }

    localFeatures.value = updatedFeatures;
  },
  { deep: true }
);

// Initialize feature toggles based on existing features
watch(
  () => props.features,
  (features) => {
    featureToggles.value = {
      date: !!features['feat:date'],
      task: !!features['feat:task'],
      location: !!features['feat:location'],
      canva: !!features['integ:canva']
    };
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.features-step {
  padding: 1rem 0;
}

.feature-section {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.feature-toggle {
  border: 1px solid var(--q-grey-4);
  border-radius: 8px;

  :deep(.q-expansion-item__container) {
    .q-expansion-item__content {
      padding: 1rem;
      background-color: var(--q-grey-1);
    }
  }
}
</style>
