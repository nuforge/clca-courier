<template>
  <div class="content-type-step">
    <div class="text-h6 q-mb-md">{{ $t('content.submission.steps.contentType.subtitle') }}</div>
    <p class="text-body2 text-grey-7 q-mb-lg">
      {{ $t('content.submission.steps.contentType.description') }}
    </p>

    <div class="row q-gutter-md">
      <div
        v-for="contentType in availableContentTypes"
        :key="contentType.type"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card
          class="content-type-card cursor-pointer transition-all"
          :class="{
            'border-primary bg-primary-1': selectedType === contentType.type,
            'border-grey-4': selectedType !== contentType.type
          }"
          @click="selectContentType(contentType.type)"
          flat
          bordered
        >
          <q-card-section class="text-center">
            <q-icon
              :name="contentType.icon"
              size="3rem"
              :color="selectedType === contentType.type ? 'primary' : 'grey-6'"
              class="q-mb-md"
            />
            <h6 class="q-ma-none q-mb-xs">{{ $t(`contentType.${contentType.type}`) }}</h6>
            <p class="text-body2 text-grey-7 q-ma-none">
              {{ $t(`content.submission.contentTypes.${contentType.type}.description`) }}
            </p>

            <!-- Feature indicators -->
            <div v-if="contentType.requiredFeatures.length > 0" class="q-mt-sm">
              <q-chip
                v-for="feature in contentType.requiredFeatures"
                :key="feature"
                dense
                color="primary"
                text-color="white"
                size="sm"
                class="q-mr-xs q-mb-xs"
              >
                {{ $t(`features.${feature.replace('feat:', '')}.label`) }}
              </q-chip>
            </div>

            <div v-if="contentType.optionalFeatures.length > 0" class="q-mt-xs">
              <q-chip
                v-for="feature in contentType.optionalFeatures"
                :key="feature"
                dense
                outline
                color="grey-6"
                size="sm"
                class="q-mr-xs q-mb-xs"
              >
                {{ $t(`features.${feature.replace('feat:', '').replace('integ:', '')}.label`) }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Navigation -->
    <div class="row justify-end q-mt-xl">
      <q-btn
        :label="$t('actions.next')"
        color="primary"
        :disable="!selectedType"
        @click="$emit('next')"
        unelevated
        size="lg"
        class="q-px-xl"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { logger } from '../../utils/logger';

interface Props {
  selectedType: string | null;
}

interface Emits {
  (e: 'update:selectedType', value: string | null): void;
  (e: 'next'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Content type configuration
const availableContentTypes = [
  {
    type: 'news',
    icon: 'newspaper',
    tag: 'content-type:news',
    requiredFeatures: [],
    optionalFeatures: ['feat:location']
  },
  {
    type: 'event',
    icon: 'event',
    tag: 'content-type:event',
    requiredFeatures: ['feat:date'],
    optionalFeatures: ['feat:location', 'feat:task']
  },
  {
    type: 'announcement',
    icon: 'campaign',
    tag: 'content-type:announcement',
    requiredFeatures: [],
    optionalFeatures: ['feat:date']
  },
  {
    type: 'classified',
    icon: 'local_offer',
    tag: 'content-type:classified',
    requiredFeatures: [],
    optionalFeatures: ['feat:location']
  },
  {
    type: 'task',
    icon: 'assignment',
    tag: 'content-type:task',
    requiredFeatures: ['feat:task'],
    optionalFeatures: ['feat:date', 'feat:location']
  },
  {
    type: 'article',
    icon: 'article',
    tag: 'content-type:article',
    requiredFeatures: [],
    optionalFeatures: ['feat:location']
  }
];

const selectedType = computed({
  get: () => props.selectedType,
  set: (value) => emit('update:selectedType', value)
});

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
  height: 240px;
  transition: all 0.2s ease;
  border-width: 2px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.border-primary {
    border-color: var(--q-primary);
  }

  &.border-grey-4 {
    border-color: var(--q-grey-4);
  }
}
</style>
