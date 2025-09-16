<template>
  <q-page class="print-queue-page q-pa-md">
    <div class="row justify-between items-center q-mb-lg">
      <div>
        <h1 class="text-h4 q-mb-xs">{{ t(TRANSLATION_KEYS.CONTENT.PRINT.PRINT_QUEUE) }}</h1>
        <p class="text-body2 text-grey-7">
          {{ t('content.print.queueDescription') || 'View and claim content ready for printing' }}
        </p>
      </div>

      <div class="row q-gutter-md">
        <q-btn
          :icon="UI_ICONS.refresh"
          :label="t(TRANSLATION_KEYS.COMMON.REFRESH)"
          color="primary"
          outline
          @click="loadPrintJobs"
          :loading="isLoading"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && printReadyJobs.length === 0" class="flex flex-center q-py-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-ml-md text-body1">{{ t(TRANSLATION_KEYS.COMMON.LOADING) }}</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && printReadyJobs.length === 0" class="text-center q-py-xl">
      <q-icon :name="UI_ICONS.print" size="80px" color="grey-4" class="q-mb-md" />
      <div class="text-h6 text-grey-7 q-mb-sm">
        {{ t(TRANSLATION_KEYS.CONTENT.PRINT.NO_PRINT_JOBS) }}
      </div>
      <div class="text-body2 text-grey-6">
        {{ t('content.print.noPrintJobsDescription') || 'No content is currently ready for printing' }}
      </div>
    </div>

    <!-- Print Jobs Grid -->
    <div v-else class="row q-gutter-md">
      <div
        v-for="job in printReadyJobs"
        :key="job.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card class="print-job-card full-height">
          <q-card-section>
            <div class="row items-start justify-between q-mb-sm">
              <div class="col">
                <div class="text-overline text-primary">
                  {{ formatContentType(getContentTypeFromTags(job.tags)) }}
                </div>
                <div class="text-h6 q-mb-xs">{{ job.title }}</div>
                <div class="text-caption text-grey-6">
                  {{ t(TRANSLATION_KEYS.COMMON.BY) }} {{ job.authorName }}
                </div>
              </div>
              <q-chip
                :icon="UI_ICONS.print"
                :label="t(TRANSLATION_KEYS.CONTENT.PRINT.PRINT_READY)"
                color="positive"
                size="sm"
              />
            </div>

            <div class="text-body2 q-mb-md">
              {{ truncateContent(job.description) }}
            </div>

            <!-- Print Job Details -->
            <div class="print-details q-mb-md">
              <div class="row q-gutter-x-md q-mb-xs">
                <div class="text-caption">
                  <q-icon :name="UI_ICONS.quantity" size="xs" class="q-mr-xs" />
                  {{ t(TRANSLATION_KEYS.CONTENT.PRINT.QUANTITY) }}: {{ getPrintQuantity() }}
                </div>
                <div class="text-caption">
                  <q-icon :name="UI_ICONS.date" size="xs" class="q-mr-xs" />
                  {{ formatDate(getPrintExportDate(job)) }}
                </div>
              </div>
            </div>

            <!-- Canva Design Info -->
            <div v-if="hasCanvaDesign(job)" class="canva-info q-mb-md">
              <div class="text-caption text-purple-7 q-mb-xs">
                <q-icon name="palette" size="xs" class="q-mr-xs" />
                {{ t(TRANSLATION_KEYS.CANVA.DESIGN_ATTACHED) }}
              </div>
              <q-btn
                :label="t(TRANSLATION_KEYS.CANVA.OPEN_DESIGN)"
                :href="getCanvaEditUrl(job)"
                target="_blank"
                size="sm"
                color="purple"
                outline
                dense
                class="q-mb-xs"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              :label="t(TRANSLATION_KEYS.CONTENT.PRINT.CLAIM_JOB)"
              :icon="UI_ICONS.claim"
              color="primary"
              @click="claimPrintJob(job)"
              :loading="claimingJobs.has(job.id)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- My Claimed Jobs Section -->
    <div v-if="claimedJobs.length > 0" class="q-mt-xl">
      <h2 class="text-h5 q-mb-md">
        {{ t('content.print.myClaimedJobs') || 'My Claimed Print Jobs' }}
      </h2>

      <div class="row q-gutter-md">
        <div
          v-for="job in claimedJobs"
          :key="job.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <q-card class="claimed-job-card">
            <q-card-section>
              <div class="row items-start justify-between q-mb-sm">
                <div class="col">
                  <div class="text-overline text-orange">
                    {{ formatContentType(getContentTypeFromTags(job.tags)) }}
                  </div>
                  <div class="text-h6 q-mb-xs">{{ job.title }}</div>
                  <div class="text-caption text-grey-6">
                    {{ t(TRANSLATION_KEYS.COMMON.BY) }} {{ job.authorName }}
                  </div>
                </div>
                <q-chip
                  :icon="UI_ICONS.claimed"
                  :label="t(TRANSLATION_KEYS.CONTENT.PRINT.CLAIMED)"
                  color="orange"
                  size="sm"
                />
              </div>

              <div class="text-body2 q-mb-md">
                {{ truncateContent(job.description) }}
              </div>

              <div class="text-caption text-grey-6 q-mb-md">
                <q-icon :name="UI_ICONS.date" size="xs" class="q-mr-xs" />
                {{ t('content.print.claimedAt') || 'Claimed:' }} {{ formatDate(getPrintClaimedDate()) }}
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn
                :label="t(TRANSLATION_KEYS.CONTENT.PRINT.COMPLETE_JOB)"
                :icon="UI_ICONS.complete"
                color="positive"
                @click="completePrintJob(job)"
                :loading="completingJobs.has(job.id)"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoleAuth } from '../composables/useRoleAuth';
import { useFirebaseAuth } from '../composables/useFirebase';
// Legacy firestoreService import removed - print functionality will be reimplemented with ContentDoc
import type { ContentDoc } from '../types/core/content.types';
import { logger } from '../utils/logger';
import { formatDateTime } from '../utils/date-formatter';
import { UI_ICONS } from '../constants/ui-icons';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

const { t } = useI18n();
const $q = useQuasar();
const { requireEditor, isAuthReady } = useRoleAuth();
const { currentUser } = useFirebaseAuth();

// State
const isLoading = ref(false);
const printReadyJobs = ref<ContentDoc[]>([]);
const claimedJobs = ref<ContentDoc[]>([]);
const claimingJobs = ref<Set<string>>(new Set());
const completingJobs = ref<Set<string>>(new Set());

// Auto-refresh interval
let refreshInterval: number | null = null;

// Check authorization when auth is ready
watch(isAuthReady, (ready: boolean) => {
  if (ready && !requireEditor()) {
    // Redirect handled by useRoleAuth
    return;
  }
});

/**
 * Load print jobs from Firestore
 * TODO: Implement print functionality using ContentDoc with print-related tags/features
 * This will need to query the 'content' collection for ContentDoc items with print tags
 */
function loadPrintJobs(): void {
  try {
    isLoading.value = true;
    logger.debug('Loading print jobs...');

    // TODO: Replace with ContentDoc-based print job queries
    // Example: Query for ContentDoc items with tags like 'print:ready', 'print:claimed'
    // For now, set empty arrays until print system is reimplemented
    printReadyJobs.value = [];
    claimedJobs.value = [];

    logger.info('Print functionality temporarily disabled during UserContent to ContentDoc migration');

    $q.notify({
      type: 'info',
      message: 'Print functionality is being updated to the new content system',
      timeout: 3000
    });
  } catch (error) {
    logger.error('Error loading print jobs:', error);
    $q.notify({
      type: 'negative',
      message: t('common.error') || 'Error loading print jobs'
    });
  } finally {
    isLoading.value = false;
  }
}

/**
 * Claim a print job for the current user
 */
function claimPrintJob(_job: ContentDoc): void {
  if (!currentUser.value?.uid) {
    $q.notify({
      type: 'warning',
      message: t('auth.loginRequired') || 'Please log in to claim print jobs'
    });
    return;
  }

  try {
    claimingJobs.value.add(_job.id);

    // TODO: Implement print job claiming using ContentDoc system
    // This should update the ContentDoc with appropriate print-related tags/features
    logger.info('Print job claiming temporarily disabled during migration');

    $q.notify({
      type: 'info',
      message: 'Print functionality is being updated to the new content system',
      timeout: 3000
    });
  } catch (error) {
    logger.error('Error claiming print job:', error);
    $q.notify({
      type: 'negative',
      message: t('content.print.claimError') || 'Failed to claim print job'
    });
  } finally {
    claimingJobs.value.delete(_job.id);
  }
}

/**
 * Mark a print job as completed
 */
function completePrintJob(_job: ContentDoc): void {
  try {
    completingJobs.value.add(_job.id);

    // TODO: Implement print job completion using ContentDoc system
    // This should update the ContentDoc with appropriate print-related tags/features
    logger.info('Print job completion temporarily disabled during migration');

    $q.notify({
      type: 'info',
      message: 'Print functionality is being updated to the new content system',
      timeout: 3000
    });
  } catch (error) {
    logger.error('Error completing print job:', error);
    $q.notify({
      type: 'negative',
      message: t('content.print.completeError') || 'Failed to complete print job'
    });
  } finally {
    completingJobs.value.delete(_job.id);
  }
}

/**
 * Extract content type from ContentDoc tags
 */
function getContentTypeFromTags(tags: string[]): string {
  const contentTypeTag = tags.find(tag => tag.startsWith('content-type:'));
  return contentTypeTag ? contentTypeTag.replace('content-type:', '') : 'unknown';
}

/**
 * Get print quantity from ContentDoc features
 * TODO: Implement once print features are defined in ContentDoc
 */
function getPrintQuantity(): number {
  // For now, return default quantity
  // TODO: Extract from features when print system is implemented
  return 1;
}

/**
 * Get print export date from ContentDoc features
 * TODO: Implement once print features are defined in ContentDoc
 */
function getPrintExportDate(job: ContentDoc): unknown {
  // For now, return content creation date as placeholder
  // TODO: Extract from features when print system is implemented
  return job.timestamps.created;
}

/**
 * Get print claimed date from ContentDoc features
 * TODO: Implement once print features are defined in ContentDoc
 */
function getPrintClaimedDate(): unknown {
  // For now, return null as placeholder
  // TODO: Extract from features when print system is implemented
  return null;
}

/**
 * Check if ContentDoc has Canva design attached
 * TODO: Implement once Canva features are defined in ContentDoc
 */
function hasCanvaDesign(job: ContentDoc): boolean {
  // For now, check if there's a Canva integration feature
  // TODO: Extract from features when Canva integration is implemented
  return job.features && 'integ:canva' in job.features;
}

/**
 * Get Canva edit URL from ContentDoc features
 * TODO: Implement once Canva features are defined in ContentDoc
 */
function getCanvaEditUrl(job: ContentDoc): string {
  // For now, return empty string as placeholder
  // TODO: Extract from features when Canva integration is implemented
  const canvaFeature = job.features['integ:canva'];
  return (canvaFeature as Record<string, unknown>)?.editUrl as string || '#';
}

/**
 * Format content type for display
 */
function formatContentType(type: string): string {
  return t(`content.types.${type}`) || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Truncate content for card display
 */
function truncateContent(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

/**
 * Format date for display
 */
function formatDate(timestamp: unknown): string {
  if (!timestamp) return '';

  try {
    if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
      const date = new Date((timestamp as { seconds: number }).seconds * 1000);
      return formatDateTime(date);
    }
    return '';
  } catch (error) {
    logger.warn('Error formatting date:', error);
    return '';
  }
}

// Lifecycle
onMounted(() => {
  if (isAuthReady.value && requireEditor()) {
    loadPrintJobs();

    // Set up auto-refresh every 30 seconds
    refreshInterval = window.setInterval(() => {
      loadPrintJobs();
    }, 30000);
  }
});

onBeforeUnmount(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.print-queue-page {
  min-height: calc(100vh - 100px);
}

.print-job-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.print-job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.claimed-job-card {
  border-left: 4px solid var(--q-orange);
}

.print-details {
  background: rgba(var(--q-positive-rgb), 0.05);
  border-radius: 4px;
  padding: 8px 12px;
}

.canva-info {
  background: rgba(var(--q-purple-rgb), 0.05);
  border-radius: 4px;
  padding: 8px 12px;
}
</style>
