<template>
  <q-card
    class="content-card cursor-pointer transition-all duration-200 hover:shadow-lg"
    :class="cardClasses"
    @click="handleCardClick"
  >
    <!-- Header Section -->
    <q-card-section class="q-pb-none">
      <div class="row items-center justify-between">
        <div class="col">
          <h6 class="q-ma-none text-weight-medium">{{ content.title }}</h6>
          <div class="row items-center q-mt-xs">
            <q-icon
              :name="getContentTypeIcon.icon"
              size="sm"
              class="q-mr-xs"
              :color="getContentTypeIcon.color"
            />
            <span class="text-caption text-grey-7">{{ getContentTypeLabel }}</span>
            <q-chip
              v-if="content.status === 'published'"
              dense
              color="positive"
              text-color="white"
              size="sm"
              class="q-ml-sm"
            >
              {{ $t('status.published') }}
            </q-chip>
          </div>
        </div>

        <!-- Actions Menu -->
        <q-btn
          v-if="showActions"
          flat
          round
          dense
          icon="more_vert"
          @click.stop="showActionsMenu = !showActionsMenu"
          :aria-label="$t('accessibility.showActions')"
        >
          <q-menu v-model="showActionsMenu">
            <q-list>
              <q-item clickable @click="$emit('edit', content)">
                <q-item-section avatar>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>{{ $t('actions.edit') }}</q-item-section>
              </q-item>
              <q-item clickable @click="$emit('delete', content)">
                <q-item-section avatar>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>{{ $t('actions.delete') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-card-section>

    <!-- Content Description -->
    <q-card-section class="q-pt-sm">
      <p class="text-body2 q-ma-none">{{ content.description }}</p>
    </q-card-section>

    <!-- Feature Widgets Section -->
    <q-card-section v-if="hasAnyFeature" class="q-pt-none">
      <!-- Date Feature Widget -->
      <EventDateWidget
        v-if="contentUtils.hasFeature(content, 'feat:date')"
        :dateFeature="content.features['feat:date']"
        class="q-mb-sm"
      />

      <!-- Task Feature Widget -->
      <TaskWidget
        v-if="contentUtils.hasFeature(content, 'feat:task')"
        :taskFeature="content.features['feat:task']"
        :canClaim="canClaimTask"
        @claim-task="handleClaimTask"
        class="q-mb-sm"
      />

      <!-- Location Feature Widget -->
      <LocationWidget
        v-if="contentUtils.hasFeature(content, 'feat:location')"
        :locationFeature="content.features['feat:location']"
        class="q-mb-sm"
      />

      <!-- Canva Integration Widget -->
      <CanvaWidget
        v-if="contentUtils.hasFeature(content, 'integ:canva')"
        :canvaFeature="content.features['integ:canva']"
        class="q-mb-sm"
      />
    </q-card-section>

    <!-- Footer Section with Tags -->
    <q-card-section v-if="displayTags.length > 0" class="q-pt-none">
      <div class="row q-gutter-xs">
        <q-chip
          v-for="tag in displayTags"
          :key="tag"
          dense
          outline
          size="sm"
          :color="getTagColor(tag)"
        >
          {{ formatTag(tag) }}
        </q-chip>
      </div>
    </q-card-section>

    <!-- Author and Timestamp Footer -->
    <q-card-section class="q-pt-none text-caption text-grey-6">
      <div class="row items-center justify-between">
        <span>{{ $t('content.byAuthor', { author: content.authorName }) }}</span>
        <span>{{ formatDate(content.timestamps.created) }}</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSiteStore } from '../stores/site-store-simple';
import { useSiteTheme } from '../composables/useSiteTheme';
import { formatDate } from '../utils/date-formatter';
import { logger } from '../utils/logger';
import {
  type ContentDoc,
  contentUtils
} from '../types/core/content.types';// Import placeholder widget components (these will be empty for now)
import EventDateWidget from './widgets/EventDateWidget.vue';
import TaskWidget from './widgets/TaskWidget.vue';
import LocationWidget from './widgets/LocationWidget.vue';
import CanvaWidget from './widgets/CanvaWidget.vue';

interface Props {
  content: ContentDoc;
  variant?: 'card' | 'list' | 'featured';
  showActions?: boolean;
}

interface Emits {
  (e: 'click', content: ContentDoc): void;
  (e: 'edit', content: ContentDoc): void;
  (e: 'delete', content: ContentDoc): void;
  (e: 'claim-task', content: ContentDoc): void;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'card',
  showActions: false
});

const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();
const siteStore = useSiteStore();
const { getContentIcon } = useSiteTheme();

// Local state
const showActionsMenu = ref(false);

// Computed properties for mechanical feature-driven rendering
const hasAnyFeature = computed(() => {
  return contentUtils.hasFeature(props.content, 'feat:date') ||
         contentUtils.hasFeature(props.content, 'feat:task') ||
         contentUtils.hasFeature(props.content, 'feat:location') ||
         contentUtils.hasFeature(props.content, 'integ:canva');
});

const canClaimTask = computed(() => {
  return contentUtils.hasFeature(props.content, 'feat:task') &&
         props.content.features['feat:task']?.status === 'unclaimed';
});

const getContentTypeLabel = computed(() => {
  const contentType = contentUtils.getContentType(props.content);
  return contentType ? t(`contentType.${contentType}`) : t('contentType.unknown');
});

const getContentTypeIcon = computed(() => {
  const contentType = contentUtils.getContentType(props.content);
  return getContentIcon(contentType || 'unknown');
});

const displayTags = computed(() => {
  // Filter out content-type tags since they're shown separately
  return props.content.tags.filter(tag => !tag.startsWith('content-type:'));
});

const cardClasses = computed(() => {
  const baseClasses = 'content-card';
  const themeClasses = siteStore.isDarkMode
    ? 'bg-dark text-white q-dark hover:bg-grey-9'
    : 'bg-white text-dark hover:bg-grey-1';

  const variantClasses = props.variant === 'featured'
    ? 'q-pa-lg border-left-4 border-primary'
    : '';

  return `${baseClasses} ${themeClasses} ${variantClasses}`;
});

// Methods
const handleCardClick = () => {
  logger.debug('ContentCard clicked', { contentId: props.content.id });
  emit('click', props.content);
};

const handleClaimTask = () => {
  logger.info('Task claim requested', { contentId: props.content.id });
  emit('claim-task', props.content);
};

const formatTag = (tag: string): string => {
  // Format namespace:value tags for display
  const parts = tag.split(':');
  const value = parts[1];
  if (value) {
    return value.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return tag.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getTagColor = (tag: string): string => {
  const [namespace] = tag.split(':');
  switch (namespace) {
    case 'category': return 'primary';
    case 'priority': return 'warning';
    case 'location': return 'secondary';
    case 'status': return 'info';
    default: return 'grey-5';
  }
};
</script>

<style lang="scss" scoped>
.content-card {
  border-radius: 8px;

  &:hover {
    transform: translateY(-2px);
  }

  .border-left-4 {
    border-left: 4px solid;
  }

  .border-primary {
    border-color: var(--q-primary);
  }
}
</style>
