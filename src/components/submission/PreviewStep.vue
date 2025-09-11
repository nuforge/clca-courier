<template>
  <div class="preview-step">
    <div class="text-h6 q-mb-md">{{ $t('content.submission.steps.preview.subtitle') }}</div>
    <p class="text-body2 text-grey-7 q-mb-lg">
      {{ $t('content.submission.steps.preview.description') }}
    </p>

    <!-- Content Preview -->
    <div v-if="previewContent" class="preview-container q-mb-xl">
      <h6 class="text-subtitle1 q-mb-md">{{ $t('content.submission.steps.preview.contentPreview') }}</h6>

      <ContentCard
        :content="previewContent"
        variant="featured"
        class="preview-card"
      />
    </div>

    <!-- Submission Summary -->
    <q-card flat bordered class="summary-card q-mb-lg">
      <q-card-section>
        <h6 class="text-subtitle1 q-mb-md">{{ $t('content.submission.steps.preview.summary') }}</h6>

        <div class="summary-grid">
          <!-- Content Type -->
          <div class="summary-item">
            <div class="summary-label">{{ $t('forms.contentType.label') }}</div>
            <div class="summary-value">
              <q-chip color="primary" text-color="white" :icon="contentTypeIcon">
                {{ $t(`content.contentType.${contentType}`) }}
              </q-chip>
            </div>
          </div>

          <!-- Features Summary -->
          <div v-if="featuresCount > 0" class="summary-item">
            <div class="summary-label">{{ $t('content.submission.steps.preview.features') }}</div>
            <div class="summary-value">
              <q-chip
                v-for="feature in enabledFeatures"
                :key="feature"
                dense
                color="secondary"
                text-color="white"
                :icon="getFeatureIcon(feature)"
                class="q-mr-xs q-mb-xs"
              >
                {{ $t(`content.features.${feature.replace('feat:', '').replace('integ:', '')}.label`) }}
              </q-chip>
            </div>
          </div>

          <!-- Status -->
          <div class="summary-item">
            <div class="summary-label">{{ $t('forms.status.label') }}</div>
            <div class="summary-value">
              <q-chip color="orange" text-color="white" icon="pending">
                {{ $t('content.status.pending') }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Submission Notes -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="row items-start">
          <q-icon name="info" size="md" class="text-info q-mr-md q-mt-xs" />
          <div>
            <div class="text-subtitle2 q-mb-xs">{{ $t('content.submission.steps.preview.notesTitle') }}</div>
            <ul class="q-ma-none q-pl-md">
              <li>{{ $t('content.submission.steps.preview.note1') }}</li>
              <li>{{ $t('content.submission.steps.preview.note2') }}</li>
              <li>{{ $t('content.submission.steps.preview.note3') }}</li>
            </ul>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Navigation -->
    <div class="row justify-between q-mt-xl">
      <q-btn
        :label="$t('common.actions.back')"
        flat
        color="grey-7"
        @click="$emit('back')"
        size="lg"
        class="q-px-xl"
        :disable="isSubmitting"
      />
      <q-btn
        :label="$t('common.actions.submit')"
        color="primary"
        :loading="isSubmitting"
        @click="handleSubmit"
        unelevated
        size="lg"
        class="q-px-xl"
      >
        <template #loading>
          <q-spinner-facebook />
        </template>
        <q-tooltip
          v-if="!canSubmit"
          :delay="500"
          class="text-body2"
          max-width="300px"
        >
          {{ $t('content.submission.steps.preview.validationError') }}
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { logger } from '../../utils/logger';
import type { ContentDoc } from '../../types/core/content.types';
import ContentCard from '../ContentCard.vue';

interface Props {
  previewContent: ContentDoc | null;
  isSubmitting: boolean;
}

interface Emits {
  (e: 'submit'): void;
  (e: 'back'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed properties
const contentType = computed(() => {
  if (!props.previewContent) return null;
  const contentTypeTag = props.previewContent.tags.find(tag => tag.startsWith('content-type:'));
  return contentTypeTag?.replace('content-type:', '') || null;
});

const contentTypeIcon = computed(() => {
  const iconMap: Record<string, string> = {
    'news': 'newspaper',
    'event': 'event',
    'announcement': 'campaign',
    'classified': 'local_offer',
    'task': 'assignment',
    'article': 'article'
  };
  return iconMap[contentType.value || ''] || 'help';
});

const enabledFeatures = computed(() => {
  if (!props.previewContent) return [];
  return Object.keys(props.previewContent.features || {}).filter(key =>
    key.startsWith('feat:') || key.startsWith('integ:')
  );
});

const canSubmit = computed(() => {
  return props.previewContent !== null && !props.isSubmitting;
});

const featuresCount = computed(() => enabledFeatures.value.length);

// Methods
const getFeatureIcon = (feature: string): string => {
  const iconMap: Record<string, string> = {
    'feat:date': 'event',
    'feat:task': 'assignment',
    'feat:location': 'location_on',
    'integ:canva': 'design_services'
  };
  return iconMap[feature] || 'extension';
};

const handleSubmit = () => {
  if (!props.previewContent) {
    logger.warn('Attempted to submit without preview content');
    return;
  }

  logger.info('Content submission requested', {
    contentType: contentType.value,
    title: props.previewContent.title,
    featuresCount: featuresCount.value
  });

  emit('submit');
};
</script>

<style lang="scss" scoped>
.preview-step {
  padding: 1rem 0;
}

.preview-container {
  .preview-card {
    max-width: 600px;
    margin: 0 auto;
  }
}

.summary-card {
  .summary-grid {
    display: grid;
    gap: 1rem;
  }

  .summary-item {
    .summary-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--q-grey-7);
      margin-bottom: 0.5rem;
    }

    .summary-value {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
  }
}
</style>
