<template>
  <div class="basic-info-step">
    <div class="text-h6 q-mb-md">{{ $t('content.submission.steps.basicInfo.subtitle') }}</div>
    <p class="text-body2 text-grey-7 q-mb-lg">
      {{ $t('content.submission.steps.basicInfo.description') }}
    </p>

    <div class="q-gutter-md">
      <!-- Title Field -->
      <q-input
        v-model="localTitle"
        :label="$t('forms.title.label')"
        :hint="$t('forms.title.hint')"
        filled
        lazy-rules
        :rules="titleRules"
        maxlength="200"
        counter
        autofocus
        @blur="handleTitleBlur"
      >
        <template #prepend>
          <q-icon :name="contentTypeIcon" :color="contentTypeColor" />
        </template>
      </q-input>

      <!-- Description Field -->
      <q-input
        v-model="localDescription"
        :label="$t('forms.description.label')"
        :hint="$t('forms.description.hint')"
        type="textarea"
        filled
        rows="6"
        lazy-rules
        :rules="descriptionRules"
        maxlength="2000"
        counter
        @blur="handleDescriptionBlur"
      />

      <!-- Content Type Display -->
      <q-card flat bordered class="bg-grey-1">
        <q-card-section class="row items-center">
          <q-icon :name="contentTypeIcon" :color="contentTypeColor" size="md" class="q-mr-md" />
          <div>
            <div class="text-subtitle2">{{ $t(`content.contentType.${contentType}`) }}</div>
            <div class="text-caption text-grey-7">
              {{ $t(`submission.contentTypes.${contentType}.description`) }}
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Preview of required features -->
      <div v-if="requiredFeatures.length > 0" class="q-mt-md">
        <div class="text-subtitle2 q-mb-sm">{{ $t('content.submission.steps.basicInfo.requiredFeatures') }}</div>
        <q-chip
          v-for="feature in requiredFeatures"
          :key="feature"
          color="primary"
          text-color="white"
          :icon="getFeatureIcon(feature)"
          class="q-mr-sm q-mb-sm"
        >
          {{ $t(`content.features.${feature.replace('feat:', '')}.label`) }}
        </q-chip>
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { logger } from '../../utils/logger';

interface Props {
  title: string;
  description: string;
  contentType: string | null;
}

interface Emits {
  (e: 'update:title', value: string): void;
  (e: 'update:description', value: string): void;
  (e: 'next'): void;
  (e: 'back'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

// Local reactive state for v-model
const localTitle = computed({
  get: () => props.title,
  set: (value) => emit('update:title', value)
});

const localDescription = computed({
  get: () => props.description,
  set: (value) => emit('update:description', value)
});

// Content type configuration map
const contentTypeConfig = {
  news: {
    icon: 'newspaper',
    color: 'blue',
    requiredFeatures: []
  },
  event: {
    icon: 'event',
    color: 'green',
    requiredFeatures: ['feat:date']
  },
  announcement: {
    icon: 'campaign',
    color: 'orange',
    requiredFeatures: []
  },
  classified: {
    icon: 'local_offer',
    color: 'purple',
    requiredFeatures: []
  },
  task: {
    icon: 'assignment',
    color: 'teal',
    requiredFeatures: ['feat:task']
  },
  article: {
    icon: 'article',
    color: 'indigo',
    requiredFeatures: []
  }
};

// Computed properties
const contentTypeIcon = computed(() => {
  if (!props.contentType) return 'help';
  return contentTypeConfig[props.contentType as keyof typeof contentTypeConfig]?.icon || 'help';
});

const contentTypeColor = computed(() => {
  if (!props.contentType) return 'grey';
  return contentTypeConfig[props.contentType as keyof typeof contentTypeConfig]?.color || 'grey';
});

const requiredFeatures = computed(() => {
  if (!props.contentType) return [];
  return contentTypeConfig[props.contentType as keyof typeof contentTypeConfig]?.requiredFeatures || [];
});

const isValid = computed(() => {
  return props.title.trim().length >= 3 && props.description.trim().length >= 10;
});

// Validation rules
const titleRules = [
  (val: string) => val && val.trim().length > 0 || t('forms.title.required'),
  (val: string) => val.trim().length >= 3 || t('forms.title.minLength'),
  (val: string) => val.length <= 200 || t('forms.title.maxLength')
];

const descriptionRules = [
  (val: string) => val && val.trim().length > 0 || t('forms.description.required'),
  (val: string) => val.trim().length >= 10 || t('forms.description.minLength'),
  (val: string) => val.length <= 2000 || t('forms.description.maxLength')
];

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

const handleTitleBlur = () => {
  logger.debug('Title field blurred', { title: props.title });
};

const handleDescriptionBlur = () => {
  logger.debug('Description field blurred', { descriptionLength: props.description.length });
};

const handleNext = () => {
  if (!isValid.value) {
    logger.warn('Attempted to proceed with invalid basic info');
    return;
  }

  logger.debug('Basic info completed', {
    titleLength: props.title.length,
    descriptionLength: props.description.length,
    contentType: props.contentType
  });

  emit('next');
};
</script>

<style lang="scss" scoped>
.basic-info-step {
  padding: 1rem 0;
}

.q-field {
  margin-bottom: 1rem;
}
</style>
