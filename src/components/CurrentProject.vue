

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useLatestNewsletter } from '../composables/useLatestNewsletter';
import { logger } from '../utils/logger';
import { UI_ICONS } from '../constants/ui-icons';
import { useSiteTheme } from '../composables/useSiteTheme';

interface Props {
  mini: boolean;
}

defineProps<Props>();

// Composables
const router = useRouter();
const $q = useQuasar();
const { latestNewsletter, isLoading, error, hasLatestIssue, formattedDate, thumbnailUrl } = useLatestNewsletter();
const { getContentIcon } = useSiteTheme();
const canvaUrl = 'https://www.canva.com/design/DAGvRIZSh5E/BceK20Jwt5tDRtCOFr_tfA/edit?utm_content=DAGvRIZSh5E&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton';

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
const openProject = () => {
  if (!canvaUrl) return;

  // Use PDF URL if available
  if (canvaUrl) {
    try {
      logger.info('Opening latest project:', canvaUrl);

      window.open(canvaUrl, '_blank');
    } catch (error) {
      logger.error('Error opening project:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to open project'
      });
    }
  } else {
    // Navigate to archive page with the newsletter
    openNewsletter();
  }
};
</script>


<template>
  <div class="latest-issue-section q-mt-md">

    <!-- Loading State -->
    <div v-if="isLoading" class="q-pa-md text-center">
      <q-spinner size="20px" color="grey-5" />
      <div v-if="!mini" class="text-caption text-grey-5 q-mt-xs">Loading...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="q-pa-md text-center">
      <q-icon :name="UI_ICONS.warning" color="warning" size="20px" />
      <div v-if="!mini" class="text-caption text-warning q-mt-xs">
        Error loading latest issue
      </div>
    </div>

    <!-- Latest Issue Card -->
    <div v-else-if="hasLatestIssue" class="latest-issue-card">
      <!-- Full mode (expanded navigation) -->
      <q-card
        v-if="!mini"
        flat
        class="bg-primary cursor-pointer latest-issue-expanded-card"
      >
        <div class="text-center q-pa-sm">
    <!-- Section Header -->
          <div v-if="!mini" class="text-caption text-grey-4 q-px-md q-pb-sm text-weight-medium">
            CURRENT PROJECT
          </div>

          <!-- Centered Thumbnail -->
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
                  <q-icon :name="UI_ICONS.filePdf" color="red" size="20px" />
                </div>
              </template>
            </q-img>
            <div v-else class="thumbnail-placeholder">
              <q-icon :name="UI_ICONS.filePdf" color="red" size="20px" />
            </div>
          </div>

          <div class="text-caption text-white q-mb-xs">
            <q-btn @click.stop="openProject" color="accent" class="full-width line-clamp-2 " size="xs" >
              <q-icon :name="UI_ICONS.tools" class="q-mr-sm" />Canva
            </q-btn>
          </div>

        </div>
      </q-card>

      <!-- Mini mode (collapsed navigation) -->
      <div v-else class="mini-mode-container">
        <q-btn
          :color="getContentIcon('newsletter').color"
          :icon="getContentIcon('newsletter').icon"
          round
          size="sm"
          @click="openNewsletter"
          class="latest-issue-mini-btn"
        >
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
      <q-icon :name="getContentIcon('newsletter').icon" :color="getContentIcon('newsletter').color" size="20px" />
      <div v-if="!mini" class="text-caption text-grey-6 q-mt-xs">
        No issues available
      </div>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.latest-issue-section {
  .latest-issue-card {
    // Make card flush with right edge
    margin-right: 0;
    margin-left: 16px; // Standard spacing from left edge

    .latest-issue-expanded-card {
      width: auto;
      max-width: 200px; // Limit max width to prevent overflow
      margin-left:auto;
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    .thumbnail-container {
      display: inline-block;
      width: 100px;  // Reduced from 120px
      height: 133px; // Reduced proportionally to maintain ~0.75 aspect ratio
      border-radius: 6px; // Slightly smaller radius
      overflow: hidden;
      margin: 0 auto; // Center horizontally
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

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
        border-radius: 6px;
      }
    }
  }

  // Mini mode container - ensure proper centering within nav width
  .mini-mode-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 60px; // Match mini navigation width
    margin: 0 auto;
    padding: 8px 4px; // Minimal padding to prevent overflow
  }

  .latest-issue-mini-btn {
    // Ensure button fits within mini nav width
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;

    &.q-btn {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
.latest-issue-card {
  .latest-issue-expanded-card {
    transition: all 0.2s ease;

    &:hover {
      transform: translateX(-2px); // Slide slightly left on hover
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }
}

.latest-issue-mini-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05); // Reduced scale to prevent overflow
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
  }
}
</style>
