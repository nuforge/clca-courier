<template>
  <q-card
    class="cursor-pointer transition-all duration-200 hover:shadow-lg"
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
              {{ $t('content.status.published') }}
            </q-chip>
          </div>
        </div>

      </div>
      </q-card-section>


    <!-- Author and Timestamp Footer -->
    <q-card-section class="q-pt-none text-caption text-grey-6">
      <div class="row items-center q-gutter-sm">
        <span>{{ formatDate(content.timestamps.created) }}</span>
        <span>{{ $t('content.byAuthor', { author: content.authorName }) }}</span>
      </div>
    </q-card-section>
    <!-- Content Description -->
    <q-card-section class="q-pt-sm">
      <p class="text-body2 q-ma-none">{{ content.description }}</p>
    </q-card-section>

    <q-card-section class="q-pb-none">
    <div v-if="content">

      <!-- Date Feature Widget -->
      <EventDateWidget
        v-if="contentUtils.hasFeature(content, 'feat:date')"
        :dateFeature="content.features['feat:date']"
        class="q-mb-sm"
      />


      <!-- Location Feature Widget -->
      <LocationWidget
        v-if="contentUtils.hasFeature(content, 'feat:location')"
        :locationFeature="content.features['feat:location']"
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

                <!-- Event Tags -->
                <div v-if="content.tags.length > 0" class="q-mb-md">
                  <div class="text-subtitle2 q-mb-xs">
                    <q-icon name="mdi-tag" class="q-mr-xs" />
                    {{ $t(TRANSLATION_KEYS.CONTENT.TAGS) }}
                  </div>
                  <div class="q-gutter-xs">
                    <TagDisplay
                      :tags="displayTags"
                      variant="flat"
                      size="sm"
                      square
                      dense
                    />
                  </div>
                </div>

              </div>
              </q-card-section>
              <q-card-section class="q-pb-none">
        <!-- Actions Menu -->
        <q-btn
          v-if="showActions"
          flat
          round
          dense
          icon="more_vert"
          @click.stop="showActionsMenu = !showActionsMenu"
          :aria-label="$t('common.accessibility.showActions')"
        >
          <q-menu v-model="showActionsMenu">
            <q-list>
              <q-item clickable @click="$emit('edit', content)">
                <q-item-section avatar>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>{{ $t('common.actions.edit') }}</q-item-section>
              </q-item>
              <q-item clickable @click="$emit('delete', content)">
                <q-item-section avatar>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>{{ $t('common.actions.delete') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
    </q-card-section>

  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSiteTheme } from '../composables/useSiteTheme';
import { formatDate } from '../utils/date-formatter';
import { logger } from '../utils/logger';
import {
  contentUtils,
  type ContentDoc
} from '../types/core/content.types';// Import placeholder widget components (these will be empty for now)
import EventDateWidget from './widgets/EventDateWidget.vue';
import TaskWidget from './widgets/TaskWidget.vue';
import LocationWidget from './widgets/LocationWidget.vue';
import TagDisplay from './common/TagDisplay.vue';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

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
const { getContentIcon } = useSiteTheme();

// Local state
const showActionsMenu = ref(false);


const canClaimTask = computed(() => {
  return contentUtils.hasFeature(props.content, 'feat:task') &&
         props.content.features['feat:task']?.status === 'unclaimed';
});

const getContentTypeLabel = computed(() => {
  const contentType = contentUtils.getContentType(props.content);
  return contentType ? t(`content.types.${contentType}`) : t('content.types.unknown');
});

const getContentTypeIcon = computed(() => {
  const contentType = contentUtils.getContentType(props.content);
  return getContentIcon(contentType || 'unknown');
});



const displayTags = computed(() => {
  // Filter out content-type tags since they're shown separately
  return props.content.tags.filter(tag => !tag.startsWith('content-type:'));
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
