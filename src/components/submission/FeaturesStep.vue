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
            :model-value="expansionStates['feat:location'] || false"
            @update:model-value="(val: boolean) => expansionStates['feat:location'] = val"
            :label="$t('content.features.location.label')"
            icon="location_on"
            :caption="$t('content.features.location.description')"
            class="feature-toggle"
            @show="initializeFeatureIfNeeded('feat:location')"
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
            :model-value="expansionStates['feat:task'] || false"
            @update:model-value="(val: boolean) => expansionStates['feat:task'] = val"
            :label="$t('content.features.task.label')"
            icon="assignment"
            :caption="$t('content.features.task.description')"
            class="feature-toggle"
            @show="initializeFeatureIfNeeded('feat:task')"
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
            :model-value="expansionStates['feat:date'] || false"
            @update:model-value="(val: boolean) => expansionStates['feat:date'] = val"
            :label="$t('content.features.date.label')"
            icon="event"
            :caption="$t('content.features.date.description')"
            class="feature-toggle"
            @show="initializeFeatureIfNeeded('feat:date')"
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
            :model-value="expansionStates['integ:canva'] || false"
            @update:model-value="(val: boolean) => expansionStates['integ:canva'] = val"
            :label="$t('content.features.canva.label')"
            icon="design_services"
            :caption="$t('content.features.canva.description')"
            class="feature-toggle"
            @show="initializeFeatureIfNeeded('integ:canva')"
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
import { computed, ref } from 'vue';
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
  (e: 'initializing-feature'): void;
  (e: 'feature-initialized'): void;
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

// Local features state - use direct props reference to avoid computed setter loops
const localFeatures = computed(() => props.features);

// Expansion panel state management to prevent reactive loops
const expansionStates = ref<Record<string, boolean>>({
  'feat:location': false,
  'feat:task': false,
  'feat:date': false,
  'integ:canva': false
});

// Initialize expansion states based on existing features
const initializeExpansionStates = () => {
  expansionStates.value['feat:location'] = !!localFeatures.value['feat:location'];
  expansionStates.value['feat:task'] = !!localFeatures.value['feat:task'];
  expansionStates.value['feat:date'] = !!localFeatures.value['feat:date'];
  expansionStates.value['integ:canva'] = !!localFeatures.value['integ:canva'];
};

// Initialize on component mount
initializeExpansionStates();

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
  const newFeatures = { ...localFeatures.value };

  if (value) {
    (newFeatures as Record<string, unknown>)[featureKey] = value;
  } else {
    delete newFeatures[featureKey];
  }

  emit('update:features', newFeatures);
};

const initializeFeatureIfNeeded = (featureKey: keyof ContentFeatures) => {
  // Guard against multiple initialization calls - more robust checking
  if (localFeatures.value[featureKey] && Object.keys(localFeatures.value[featureKey] as Record<string, unknown>).length > 0) {
    // Feature already exists with content, just open the expansion panel
    expansionStates.value[featureKey] = true;
    return;
  }

  // Emit start of initialization to prevent auto-save
  emit('initializing-feature');

  try {
    // Initialize with default values when user expands the section
    const newFeatures = { ...localFeatures.value };

    switch (featureKey) {
      case 'feat:date':
        (newFeatures as Record<string, unknown>)[featureKey] = {
          start: new Date(),
          isAllDay: false
        };
        break;
      case 'feat:task':
        (newFeatures as Record<string, unknown>)[featureKey] = {
          category: 'volunteers',
          qty: 1,
          unit: 'person',
          status: 'unclaimed'
        };
        break;
      case 'feat:location':
        (newFeatures as Record<string, unknown>)[featureKey] = {
          address: ''
        };
        break;
      case 'integ:canva':
        (newFeatures as Record<string, unknown>)[featureKey] = {
          designId: ''
        };
        break;
    }

    // Update expansion state
    expansionStates.value[featureKey] = true;

    emit('update:features', newFeatures);
  } finally {
    // Always emit completion, even if there was an error
    setTimeout(() => {
      emit('feature-initialized');
    }, 0);
  }
};

// Navigation methods
const handleNext = () => {
  emit('next');
};
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
