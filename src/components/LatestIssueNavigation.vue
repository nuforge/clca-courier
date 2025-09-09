<template>
  <div class="latest-issue-section q-mt-md">
    <!-- Section Header -->
    <div v-if="!mini" class="text-caption text-grey-4 q-px-md q-pb-sm text-weight-medium">
      LATEST ISSUE
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="q-pa-md text-center">
      <q-spinner size="20px" color="grey-5" />
      <div v-if="!mini" class="text-caption text-grey-5 q-mt-xs">Loading...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="q-pa-md text-center">
      <q-icon name="mdi-alert-circle" color="warning" size="20px" />
      <div v-if="!mini" class="text-caption text-warning q-mt-xs">
        Error loading latest issue
      </div>
    </div>

    <!-- Latest Issue Card -->
    <div v-else-if="hasLatestIssue" class="latest-issue-card q-ml-md">
      <!-- Full mode (expanded navigation) -->
      <q-card
        v-if="!mini"
        flat
        class="bg-primary cursor-pointer"
        @click="openNewsletter"
      >
        <div class="text-center no-wrap">
          <!-- Thumbnail -->
          <div class="col">
            <div class="text-caption text-grey-4 q-mt-xs">
              {{ formattedDate }}
            </div>

            <div class="thumbnail-container">
              <q-img
                v-if="thumbnailUrl"
                :src="thumbnailUrl"
                :alt="`${latestNewsletter?.title} thumbnail`"
                class="thumbnail-image"
                :ratio="0.75"
                fit="cover"
                loading="lazy"
              >
                <template #error>
                  <div class="thumbnail-placeholder">
                    <q-icon name="mdi-file-pdf-box" color="red" size="24px" />
                  </div>
                </template>
              </q-img>
              <div v-else class="thumbnail-placeholder">
                <q-icon name="mdi-file-pdf-box" color="red" size="24px" />
              </div>
            </div>
          </div>
            <div v-if="latestNewsletter?.pageCount" class="text-caption text-grey-5 q-mt-xs">
              {{ latestNewsletter.pageCount }} pages
            </div>

          <!-- Content -->
        </div>
      </q-card>

      <!-- Mini mode (collapsed navigation) -->
      <div v-else class="text-center">
        <q-btn
          round
          flat
          size="sm"
          @click="openNewsletter"
          class="latest-issue-mini-btn"
        >
          <q-avatar size="32px" class="newsletter-avatar">
            <q-img
              v-if="thumbnailUrl"
              :src="thumbnailUrl"
              :alt="`${latestNewsletter?.title} thumbnail`"
              fit="cover"
              loading="lazy"
            >
              <template #error>
                <q-icon name="mdi-file-pdf-box" color="red" size="20px" />
              </template>
            </q-img>
            <q-icon v-else name="mdi-file-pdf-box" color="red" size="20px" />
          </q-avatar>

          <!-- Tooltip for mini mode -->
          <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">
            <div class="text-weight-medium">{{ latestNewsletter?.title }}</div>
            <div class="text-caption">{{ formattedDate }}</div>
            <div v-if="latestNewsletter?.pageCount" class="text-caption">
              {{ latestNewsletter.pageCount }} pages
            </div>
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- No Issue Available -->
    <div v-else class="q-pa-md text-center">
      <q-icon name="mdi-newspaper" color="grey-6" size="20px" />
      <div v-if="!mini" class="text-caption text-grey-6 q-mt-xs">
        No issues available
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useLatestNewsletter } from '../composables/useLatestNewsletter';
import { logger } from '../utils/logger';

interface Props {
  mini: boolean;
}

defineProps<Props>();

// Composables
const router = useRouter();
const $q = useQuasar();
const { latestNewsletter, isLoading, error, hasLatestIssue, formattedDate, thumbnailUrl } = useLatestNewsletter();

// Methods
const openNewsletter = () => {
  if (!latestNewsletter.value) return;

  // Use PDF URL if available
  if (latestNewsletter.value.downloadUrl) {
    try {
      logger.info('Opening latest newsletter:', latestNewsletter.value.title);

      // Open PDF in new tab for now
      // TODO: Integrate with global PDF viewer when available
      window.open(latestNewsletter.value.downloadUrl, '_blank');
    } catch (error) {
      logger.error('Error opening newsletter:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to open newsletter'
      });
    }
  } else {
    // Navigate to archive page with the newsletter
    void router.push(`/archive/${latestNewsletter.value.id}`);
  }
};
</script>

<style lang="scss" scoped>
.latest-issue-section {
  .latest-issue-card {
    .thumbnail-container {
      max-width: 150px;
      border-radius: 4px;
      overflow: hidden;

      .thumbnail-image {
        width: 100%;
        height: 100%;
      }

      .thumbnail-placeholder {
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
    }
  }

  .latest-issue-mini-btn {
    .newsletter-avatar {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px !important; // Override Quasar's circular avatar
    }
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.2;
    max-height: calc(1.2em * 2);
  }
}

// Hover effects
.latest-issue-card .q-card {
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05) !important;
    transform: translateY(-1px);
  }
}

.latest-issue-mini-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
}
</style>
