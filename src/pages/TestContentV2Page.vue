<template>
  <q-page class="test-content-v2-page q-pa-md">
    <div class="q-mb-lg">
      <h4 class="q-mt-none q-mb-md">{{ $t('pages.testContentV2.title') }}</h4>
      <p class="text-body1 text-grey-7 q-mb-lg">
        {{ $t('pages.testContentV2.description') }}
      </p>

      <!-- Action Buttons Section -->
      <div class="row q-gutter-md q-mb-xl">
        <q-btn
          color="primary"
          icon="event"
          :label="$t('pages.testContentV2.createEvent')"
          @click="createSampleEvent"
          :loading="creating.event"
          :disable="isCreating"
        />

        <q-btn
          color="warning"
          icon="task_alt"
          :label="$t('pages.testContentV2.createTask')"
          @click="createSampleTask"
          :loading="creating.task"
          :disable="isCreating"
        />

        <q-btn
          color="secondary"
          icon="event_available"
          :label="$t('pages.testContentV2.createHybrid')"
          @click="createSampleHybrid"
          :loading="creating.hybrid"
          :disable="isCreating"
        />

        <q-btn
          color="info"
          icon="refresh"
          :label="$t('pages.testContentV2.refresh')"
          @click="loadContent"
          :loading="loading"
          flat
        />
      </div>
    </div>

    <!-- Statistics Section -->
    <div v-if="contentList.length > 0" class="row q-gutter-md q-mb-lg">
      <q-card class="col">
        <q-card-section class="text-center">
          <div class="text-h6">{{ contentList.length }}</div>
          <div class="text-caption text-grey-7">{{ $t('pages.testContentV2.totalContent') }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col">
        <q-card-section class="text-center">
          <div class="text-h6">{{ contentWithFeatures }}</div>
          <div class="text-caption text-grey-7">{{ $t('pages.testContentV2.withFeatures') }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col">
        <q-card-section class="text-center">
          <div class="text-h6">{{ contentTypeStats.event || 0 }}</div>
          <div class="text-caption text-grey-7">{{ $t('content.contentType.event') }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col">
        <q-card-section class="text-center">
          <div class="text-h6">{{ contentTypeStats.task || 0 }}</div>
          <div class="text-caption text-grey-7">{{ $t('content.contentType.task') }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Content List Section -->
    <div class="content-list-section">
      <div class="row items-center justify-between q-mb-md">
        <h5 class="q-ma-none">{{ $t('pages.testContentV2.contentList') }}</h5>
        <q-toggle
          v-model="showFeatured"
          :label="$t('pages.testContentV2.showFeaturedOnly')"
          color="primary"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner-dots size="50px" color="primary" />
        <div class="q-mt-md text-grey-6">{{ $t('pages.testContentV2.loading') }}</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredContent.length === 0" class="text-center q-py-xl">
        <q-icon name="inbox" size="64px" color="grey-5" />
        <div class="q-mt-md text-grey-6">
          {{ contentList.length === 0
             ? $t('pages.testContentV2.noContent')
             : $t('pages.testContentV2.noFilteredContent') }}
        </div>
        <q-btn
          v-if="contentList.length === 0"
          color="primary"
          :label="$t('pages.testContentV2.createFirst')"
          @click="createSampleEvent"
          class="q-mt-md"
        />
      </div>

      <!-- Content Grid -->
      <div v-else class="row q-gutter-md">
        <div
          v-for="content in filteredContent"
          :key="content.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <ContentCard
            :content="content"
            :variant="content.status === 'published' ? 'featured' : 'card'"
            show-actions
            @click="handleContentClick"
            @edit="handleContentEdit"
            @delete="handleContentDelete"
            @claim-task="handleTaskClaim"
          />
        </div>
      </div>
    </div>

    <!-- Success/Error Notifications -->
    <q-banner
      v-if="lastCreatedId"
      color="positive"
      text-color="white"
      icon="check_circle"
      class="q-mt-lg"
      dismissible
      @dismiss="lastCreatedId = null"
    >
      {{ $t('pages.testContentV2.contentCreated', { id: lastCreatedId }) }}
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timestamp } from 'firebase/firestore';
import { useQuasar } from 'quasar';
import { logger } from '../utils/logger';
import { contentSubmissionService } from '../services/content-submission.service';
import type { ContentDoc } from '../types/core/content.types';
import {
  contentUtils
} from '../types/core/content.types';
import type { ContentFeatures } from '../types/core/content.types';
import ContentCard from '../components/ContentCard.vue';

// Composables
const { t } = useI18n();
const $q = useQuasar();

// Reactive state
const contentList = ref<ContentDoc[]>([]);
const loading = ref(false);
const showFeatured = ref(false);
const lastCreatedId = ref<string | null>(null);

const creating = ref({
  event: false,
  task: false,
  hybrid: false
});

// Computed properties
const isCreating = computed(() => {
  return Object.values(creating.value).some(Boolean);
});

const filteredContent = computed(() => {
  if (!showFeatured.value) {
    return contentList.value;
  }

  return contentList.value.filter(content => {
    return contentUtils.hasFeature(content, 'feat:date') ||
           contentUtils.hasFeature(content, 'feat:task') ||
           contentUtils.hasFeature(content, 'feat:location') ||
           contentUtils.hasFeature(content, 'integ:canva');
  });
});

const contentWithFeatures = computed(() => {
  return contentList.value.filter(content => {
    return Object.keys(content.features).length > 0;
  }).length;
});

const contentTypeStats = computed(() => {
  const stats: Record<string, number> = {};

  contentList.value.forEach(content => {
    const type = contentUtils.getContentType(content);
    if (type) {
      stats[type] = (stats[type] || 0) + 1;
    }
  });

  return stats;
});

// Methods
const loadContent = () => {
  loading.value = true;
  try {
    logger.debug('Loading content for test page');

    // For now, we'll create a mock list since we need Firebase query methods
    // In a real implementation, this would query the Firebase collection
    contentList.value = [];

    logger.info('Content loaded successfully', { count: contentList.value.length });
  } catch (error) {
    logger.error('Failed to load content', error);
    $q.notify({
      type: 'negative',
      message: t('pages.testContentV2.loadError'),
      caption: error instanceof Error ? error.message : String(error)
    });
  } finally {
    loading.value = false;
  }
};

const createSampleEvent = async () => {
  creating.value.event = true;
  try {
    logger.debug('Creating sample event');

    const eventFeatures: Partial<ContentFeatures> = {
      'feat:date': {
        start: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 1 week from now
        end: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)), // 3 hours later
        isAllDay: false
      },
      'feat:location': {
        name: 'Community Center',
        address: '123 Main Street, Community, TX 75001'
      }
    };

    const eventId = await contentSubmissionService.createContent(
      'Community BBQ',
      'Join us for our annual summer BBQ! Food, fun, and fellowship for the whole family.',
      'event',
      eventFeatures,
      ['category:social', 'priority:high', 'location:center']
    );

    lastCreatedId.value = eventId;
    logger.info('Sample event created', { eventId });

    $q.notify({
      type: 'positive',
      message: t('pages.testContentV2.eventCreated'),
      timeout: 3000
    });

    // Reload content to show the new item
    loadContent();
  } catch (error) {
    logger.error('Failed to create sample event', error);
    $q.notify({
      type: 'negative',
      message: t('pages.testContentV2.createError'),
      caption: error instanceof Error ? error.message : String(error)
    });
  } finally {
    creating.value.event = false;
  }
};

const createSampleTask = async () => {
  creating.value.task = true;
  try {
    logger.debug('Creating sample task');

    const taskFeatures: Partial<ContentFeatures> = {
      'feat:task': {
        category: 'printing',
        qty: 50,
        unit: 'flyers',
        status: 'unclaimed'
      }
    };

    const taskId = await contentSubmissionService.createContent(
      'Volunteer Needed: Print Event Flyers',
      'We need someone to help print 50 flyers for our upcoming community event. Materials will be provided.',
      'task',
      taskFeatures,
      ['category:volunteer', 'priority:medium', 'skill:basic']
    );

    lastCreatedId.value = taskId;
    logger.info('Sample task created', { taskId });

    $q.notify({
      type: 'positive',
      message: t('pages.testContentV2.taskCreated'),
      timeout: 3000
    });

    loadContent();
  } catch (error) {
    logger.error('Failed to create sample task', error);
    $q.notify({
      type: 'negative',
      message: t('pages.testContentV2.createError'),
      caption: error instanceof Error ? error.message : String(error)
    });
  } finally {
    creating.value.task = false;
  }
};

const createSampleHybrid = async () => {
  creating.value.hybrid = true;
  try {
    logger.debug('Creating sample hybrid content');

    const hybridFeatures: Partial<ContentFeatures> = {
      'feat:date': {
        start: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 2 weeks from now
        end: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)), // 4 hours later
        isAllDay: false
      },
      'feat:location': {
        name: 'Lakeside Pavilion',
        address: '456 Lake Drive, Community, TX 75001'
      },
      'feat:task': {
        category: 'snacks',
        qty: 3,
        unit: 'volunteers',
        status: 'unclaimed'
      }
    };

    const hybridId = await contentSubmissionService.createContent(
      'Spring Festival Planning Meeting',
      'Join us to plan our annual Spring Festival! We need volunteers to help coordinate snacks for the planning sessions.',
      'event',
      hybridFeatures,
      ['category:planning', 'priority:high', 'event:festival', 'volunteer:needed']
    );

    lastCreatedId.value = hybridId;
    logger.info('Sample hybrid content created', { hybridId });

    $q.notify({
      type: 'positive',
      message: t('pages.testContentV2.hybridCreated'),
      timeout: 3000
    });

    loadContent();
  } catch (error) {
    logger.error('Failed to create sample hybrid content', error);
    $q.notify({
      type: 'negative',
      message: t('pages.testContentV2.createError'),
      caption: error instanceof Error ? error.message : String(error)
    });
  } finally {
    creating.value.hybrid = false;
  }
};

// Event handlers
const handleContentClick = (content: ContentDoc) => {
  logger.debug('Content clicked', { contentId: content.id, title: content.title });
  $q.notify({
    type: 'info',
    message: t('pages.testContentV2.contentClicked', { title: content.title }),
    timeout: 2000
  });
};

const handleContentEdit = (content: ContentDoc) => {
  logger.debug('Content edit requested', { contentId: content.id });
  $q.notify({
    type: 'info',
    message: t('pages.testContentV2.editNotImplemented'),
    timeout: 2000
  });
};

const handleContentDelete = (content: ContentDoc) => {
  logger.debug('Content delete requested', { contentId: content.id });
  $q.dialog({
    title: t('pages.testContentV2.confirmDelete'),
    message: t('pages.testContentV2.deleteMessage', { title: content.title }),
    cancel: true,
    persistent: true
  }).onOk(() => {
    $q.notify({
      type: 'info',
      message: t('pages.testContentV2.deleteNotImplemented'),
      timeout: 2000
    });
  });
};

const handleTaskClaim = (content: ContentDoc) => {
  logger.debug('Task claim requested', { contentId: content.id });

  if (contentUtils.hasFeature(content, 'feat:task')) {
    const task = content.features['feat:task'];
    if (task && task.status === 'unclaimed') {
      $q.notify({
        type: 'positive',
        message: t('pages.testContentV2.taskClaimed', { title: content.title }),
        timeout: 3000
      });

      // In a real implementation, this would update the task status
      logger.info('Task claimed', { contentId: content.id, category: task.category });
    }
  }
};

// Lifecycle
onMounted(() => {
  loadContent();
});
</script>

<style lang="scss" scoped>
.test-content-v2-page {
  max-width: 1200px;
  margin: 0 auto;
}

.content-list-section {
  min-height: 400px;
}
</style>
