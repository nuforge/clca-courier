<template>
  <div class="content-type-step">
    <div class="text-h6 q-mb-md">{{ $t('content.submission.steps.contentType.subtitle') }}</div>
    <p class="text-body2 text-grey-7 q-mb-lg">
      {{ $t('content.submission.steps.contentType.description') }}
    </p>

    <div class="row q-col-gutter-md">
      <div
        v-for="contentType in availableContentTypes"
        :key="contentType.type"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card
          class="content-type-card cursor-pointer transition-all"
          :class="{
            'selected-card': selectedType === contentType.type,
            'border-grey-4': selectedType !== contentType.type
          }"
          :style="selectedType === contentType.type ? {
            borderColor: getContentTypeTheme(contentType.type).color,
            backgroundColor: `${getContentTypeTheme(contentType.type).color}10`
          } : {}"
          @click="selectContentType(contentType.type)"
          flat
          bordered
        >
          <q-card-section class="text-center">
            <q-icon
              :name="getContentTypeTheme(contentType.type).icon"
              size="2.5rem"
              :color="selectedType === contentType.type ? getContentTypeTheme(contentType.type).color : 'grey-6'"
              class="q-mb-sm"
            />
            <h6 class="q-ma-none q-mb-xs text-weight-medium">
              {{ $t(`content.contentType.${contentType.type}`) }}
            </h6>
            <p class="text-body2 text-grey-7 q-ma-none q-mb-sm">
              {{ $t(`content.submission.contentTypes.${contentType.type}.description`) }}
            </p>

            <!-- Time and Difficulty Estimates -->
            <div class="content-metadata q-mb-sm">
              <div class="row justify-center q-gutter-xs">
                <q-chip
                  size="sm"
                  color="grey-3"
                  text-color="grey-8"
                  dense
                  class="metadata-chip"
                >
                  <q-icon name="schedule" size="xs" class="q-mr-xs" />
                  {{ contentType.timeEstimate }}
                </q-chip>
                <q-chip
                  size="sm"
                  :color="getDifficultyColor(contentType.difficulty)"
                  text-color="white"
                  dense
                  class="metadata-chip"
                >
                  {{ $t(`content.difficulty.${contentType.difficulty.toLowerCase()}`) }}
                </q-chip>
              </div>
            </div>

            <!-- Feature indicators -->
            <div v-if="contentType.requiredFeatures.length > 0" class="q-mt-sm">
              <q-chip
                v-for="feature in contentType.requiredFeatures"
                :key="feature"
                dense
                :color="selectedType === contentType.type ? getContentTypeTheme(contentType.type).color : 'grey-6'"
                text-color="white"
                size="sm"
                class="q-mr-xs q-mb-xs feature-chip"
              >
                <q-icon name="star" size="xs" class="q-mr-xs" />
                {{ $t(`content.features.${feature.replace('feat:', '')}.label`) }}
              </q-chip>
            </div>

            <div v-if="contentType.optionalFeatures.length > 0" class="q-mt-xs">
              <q-chip
                v-for="feature in contentType.optionalFeatures"
                :key="feature"
                dense
                outline
                :color="selectedType === contentType.type ? getContentTypeTheme(contentType.type).color : 'grey-6'"
                size="sm"
                class="q-mr-xs q-mb-xs feature-chip"
              >
                {{ $t(`content.features.${feature.replace('feat:', '').replace('integ:', '')}.label`) }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Navigation -->
    <div class="row justify-end q-mt-xl">
      <q-btn
        :label="$t('common.actions.next')"
        color="primary"
        :disable="!selectedType"
        @click="$emit('next')"
        unelevated
        size="lg"
        class="q-px-xl"
      >
        <q-tooltip
          v-if="!selectedType"
          :delay="500"
          class="text-body2"
          max-width="300px"
        >
          {{ $t('content.submission.steps.contentType.validationError') }}
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { logger } from '../../utils/logger';
import { useSiteThemeStore } from '../../stores/site-theme.store';

interface Props {
  selectedType: string | null;
}

interface Emits {
  (e: 'update:selectedType', value: string | null): void;
  (e: 'next'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Site theme integration
const siteTheme = useSiteThemeStore();

// Content type configuration with enhanced metadata
interface ContentType {
  type: string;
  tag: string;
  requiredFeatures: string[];
  optionalFeatures: string[];
  timeEstimate: string;
  difficulty: string;
}

// Get available content types from theme system with enhanced metadata
const availableContentTypes: ContentType[] = [
  {
    type: 'article',
    tag: 'content-type:article',
    requiredFeatures: [],
    optionalFeatures: ['feat:location'],
    timeEstimate: '15-30 min',
    difficulty: 'Hard'
  },
  {
    type: 'event',
    tag: 'content-type:event',
    requiredFeatures: ['feat:date'],
    optionalFeatures: ['feat:location', 'feat:task'],
    timeEstimate: '10-15 min',
    difficulty: 'Medium'
  },
  {
    type: 'announcement',
    tag: 'content-type:announcement',
    requiredFeatures: [],
    optionalFeatures: ['feat:date'],
    timeEstimate: '3-5 min',
    difficulty: 'Easy'
  },
  {
    type: 'classified',
    tag: 'content-type:classified',
    requiredFeatures: [],
    optionalFeatures: ['feat:location'],
    timeEstimate: '5-8 min',
    difficulty: 'Easy'
  },
  {
    type: 'photo',
    tag: 'content-type:photo',
    requiredFeatures: [],
    optionalFeatures: ['feat:location'],
    timeEstimate: '5-10 min',
    difficulty: 'Easy'
  }
];

const selectedType = computed({
  get: () => props.selectedType,
  set: (value) => emit('update:selectedType', value)
});

// Theme integration functions
const getContentTypeTheme = (type: string) => {
  return siteTheme.getContentIcon(type);
};

// Difficulty color mapping following Quasar standards
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'Easy':
      return 'positive';
    case 'Medium':
      return 'warning';
    case 'Hard':
      return 'negative';
    default:
      return 'grey-6';
  }
};

const selectContentType = (type: string) => {
  logger.debug('Content type selected', { type });
  selectedType.value = type;
};
</script>

<style lang="scss" scoped>
.content-type-step {
  padding: 1rem 0;
}

.content-type-card {
  height: 280px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-width: 2px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &.selected-card {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &.border-grey-4 {
    border-color: var(--q-grey-4);
  }
}

.content-metadata {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 8px;
  margin-top: 8px;
}

.metadata-chip {
  font-size: 0.75rem;
  height: 20px;
}

.feature-chip {
  font-size: 0.7rem;
  height: 18px;
}

/* Accessibility improvements */
.content-type-card:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .content-type-card {
    height: 260px;
  }
}

@media (max-width: 480px) {
  .content-type-card {
    height: 240px;
  }

  .metadata-chip,
  .feature-chip {
    font-size: 0.65rem;
  }
}
</style>
