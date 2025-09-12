<template>
  <q-card flat bordered :class="cardClasses" class="newsletter-card cursor-pointer transition-all"
    @click="openNewsletter" :style="cardStyle" :tabindex="0" @keydown.enter="openNewsletter"
    @keydown.space.prevent="openNewsletter" role="article"
    :aria-label="'Newsletter: ' + newsletter.title + ', published ' + formattedDate + (newsletter.description ? ', ' + newsletter.description : '')">

    <!-- Thumbnail Section -->
    <div class="thumbnail-container" role="img"
      :aria-label="newsletter.thumbnailUrl ? 'Newsletter thumbnail' : 'PDF document icon'">
      <q-img v-if="newsletter.thumbnailUrl" :src="newsletter.thumbnailUrl"
        :alt="'Thumbnail preview for ' + newsletter.title" class="thumbnail-image" loading="lazy"
        @error="onThumbnailError" position="top">
        <template v-slot:loading>
          <div class="absolute-center">
            <q-spinner color="primary" size="2em" />
          </div>
        </template>
      </q-img>

      <!-- Fallback when no thumbnail -->
      <div v-else class="thumbnail-fallback" :class="fallbackClasses">
        <q-icon name="mdi-file-pdf-box" size="3rem" class="text-grey-5" />
        <div class="text-caption text-center q-mt-xs">PDF</div>

        <!-- Admin: Show regenerate thumbnail button if no thumbnail -->
        <q-btn v-if="showAdminControls && !newsletter.thumbnailUrl" flat dense size="sm" color="primary" icon="image"
          class="q-mt-xs" @click.stop="generateThumbnail" :loading="thumbnailGenerating">
          <q-tooltip>Generate Thumbnail</q-tooltip>
        </q-btn>
      </div>

      <!-- Featured Badge -->
      <q-badge v-if="newsletter.featured" color="accent" floating rounded class="featured-badge"
        :aria-label="t(TRANSLATION_KEYS.CONTENT.ACTIONS.FEATURE)" style="top: 8px; right: 8px;">
        <q-icon name="star" size="12px" class="q-mr-xs" />
        {{ t(TRANSLATION_KEYS.FORMS.FEATURED) }}
      </q-badge>

      <!-- Accessibility indicators -->
      <div class="accessibility-indicators absolute-top-right q-pa-xs">
        <q-icon v-if="newsletter.description" name="description" size="16px" class="text-positive q-mr-xs"
          aria-label="Has description for screen readers">
          <q-tooltip>Has description</q-tooltip>
        </q-icon>
        <q-icon v-if="newsletter.searchableText" name="search" size="16px" class="text-info"
          aria-label="Text content is searchable">
          <q-tooltip>Searchable content</q-tooltip>
        </q-icon>
      </div>
    </div>

    <!-- Content Section -->
    <q-card-section class="newsletter-content">
      <!-- Title -->
      <div class="text-subtitle1 text-weight-medium newsletter-title q-mb-xs" role="heading" aria-level="3">
        {{ newsletter.title }}
      </div>

      <!-- Publication Info -->
      <div class="text-caption text-grey-6 q-mb-sm">
        <q-icon name="event" size="14px" class="q-mr-xs" />
        <time :datetime="newsletter.publicationDate" :aria-label="'Published on ' + formattedDate">
          {{ formattedDate }}
        </time>
        <span v-if="newsletter.season" class="q-ml-sm">
          <q-icon name="wb_sunny" size="14px" class="q-mr-xs" />
          {{ capitalizeFirst(newsletter.season) }}
        </span>
      </div>

      <!-- Issue Number -->
      <div v-if="newsletter.issueNumber" class="text-caption text-grey-6 q-mb-sm">
        <q-icon name="numbers" size="14px" class="q-mr-xs" />
        {{ t(TRANSLATION_KEYS.NEWSLETTER.ISSUE) }} {{ newsletter.issueNumber }}
      </div>

      <!-- Description -->
      <div v-if="newsletter.description" class="text-body2 newsletter-description q-mb-sm"
        :aria-label="'Description: ' + newsletter.description">
        {{ truncatedDescription }}
      </div>

      <!-- Tags -->
      <div v-if="newsletter.tags && newsletter.tags.length > 0" class="q-mb-sm" role="list" aria-label="Tags">
        <q-chip v-for="tag in visibleTags" :key="tag" size="sm" color="primary" text-color="white" dense
          class="q-mr-xs q-mb-xs" role="listitem" :aria-label="'Tag: ' + tag">
          {{ tag }}
        </q-chip>
        <q-chip v-if="newsletter.tags.length > maxVisibleTags" size="sm" color="grey" text-color="white" dense
          class="q-mr-xs q-mb-xs" :aria-label="'And ' + (newsletter.tags.length - maxVisibleTags) + ' more tags'">
          +{{ newsletter.tags.length - maxVisibleTags }}
        </q-chip>
      </div>
    </q-card-section>

    <!-- Footer Section -->
    <q-card-section class="newsletter-footer q-pt-none">
      <div class="row items-center text-caption text-grey-6">
        <!-- File Info -->
        <div class="col">
          <q-icon name="description" size="14px" class="q-mr-xs" />
          <span v-if="newsletter.pageCount" :aria-label="newsletter.pageCount + ' ' + t(TRANSLATION_KEYS.NEWSLETTER.PAGE_COUNT)">
            {{ newsletter.pageCount }} {{ newsletter.pageCount === 1 ? t(TRANSLATION_KEYS.NEWSLETTER.PAGE_COUNT).slice(0, -1) : t(TRANSLATION_KEYS.NEWSLETTER.PAGE_COUNT) }}
          </span>
          <span v-else>PDF</span>
          <span v-if="formattedFileSize" class="q-ml-sm" :aria-label="'File size: ' + formattedFileSize">
            • {{ formattedFileSize }}
          </span>
        </div>

        <!-- Actions -->
        <div class="col-auto" role="group" aria-label="Newsletter actions">
          <!-- Admin Toggle Actions (only shown when showAdminControls is true) -->
          <template v-if="showAdminControls">
            <q-btn flat dense round size="sm" :color="newsletter.isPublished === true ? 'positive' : 'orange'"
              :icon="newsletter.isPublished === true ? 'visibility' : 'visibility_off'"
              @click.stop="togglePublishedStatus"
              :aria-label="(newsletter.isPublished === true ? 'Unpublish' : 'Publish') + ' newsletter: ' + newsletter.title"
              :tabindex="0" :loading="publishLoading">
              <q-tooltip>{{ newsletter.isPublished === true ? 'Unpublish' : 'Publish' }}
                Newsletter</q-tooltip>
            </q-btn>

            <q-btn flat dense round size="sm" :color="newsletter.featured === true ? 'accent' : 'grey'"
              :icon="newsletter.featured === true ? 'star' : 'star_border'" @click.stop="toggleFeaturedStatus"
              :aria-label="(newsletter.featured === true ? 'Remove from featured' : 'Add to featured') + ' newsletter: ' + newsletter.title"
              :tabindex="0" :loading="featuredLoading">
              <q-tooltip>{{ newsletter.featured ? 'Remove from Featured' : 'Add to Featured'
                }}</q-tooltip>
            </q-btn>

          <!-- View/Download Actions -->
          <q-btn flat dense round size="sm" color="primary" icon="open_in_new" @click.stop="viewNewsletter"
            :aria-label="'View newsletter: ' + newsletter.title" :tabindex="0">
            <q-tooltip>View PDF</q-tooltip>
          </q-btn>

          <q-btn v-if="newsletter.downloadUrl" flat dense round size="sm" color="secondary" icon="download"
            @click.stop="downloadNewsletter" :aria-label="'Download newsletter: ' + newsletter.title" :tabindex="0">
            <q-tooltip>Download PDF</q-tooltip>
          </q-btn>
          </template>

        </div>
      </div>
    </q-card-section>

    <!-- Loading overlay for actions -->
    <q-inner-loading :showing="loading" color="primary" />
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useTheme } from '../composables/useTheme';
import { type NewsletterMetadata, firestoreService } from '../services/firebase-firestore.service';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
import { logger } from '../utils/logger';

// Props
interface Props {
  newsletter: NewsletterMetadata;
  showAdminControls?: boolean; // Optional prop to show admin toggle buttons
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  metadataUpdated: [newsletterId: string, updates: Partial<NewsletterMetadata>];
  newsletterDeleted: [newsletterId: string];
  refreshNeeded: [];
}>();

// Composables
const { t } = useI18n();
const $q = useQuasar();
const { cardClasses: themeCardClasses, backgroundClasses } = useTheme();

// State
const loading = ref(false);
const thumbnailError = ref(false);
const publishLoading = ref(false);
const featuredLoading = ref(false);
const thumbnailGenerating = ref(false);

// Constants
const maxVisibleTags = 2;
const maxDescriptionLength = 100;

// Computed properties
const cardClasses = computed(() => {
  const base = 'newsletter-card';
  return `${base} ${themeCardClasses.value}`;
});

const cardStyle = computed(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const
}));

// Controls when admin toggle buttons are shown
const showAdminControls = computed(() => {
  return props.showAdminControls ?? false;
});

const fallbackClasses = computed(() => ({
  'flex': true,
  'flex-center': true,
  'column': true,
  'full-height': true,
  [backgroundClasses.value.surface]: true
}));

const formattedDate = computed(() => {
  // Use the enhanced displayDate if available, otherwise fall back to publicationDate formatting
  if (props.newsletter.displayDate) {
    return props.newsletter.displayDate;
  }

  const date = new Date(props.newsletter.publicationDate);
  return isNaN(date.getTime())
    ? 'Date unknown'
    : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
});

const formattedFileSize = computed(() => {
  if (!props.newsletter.fileSize) return '';

  const size = props.newsletter.fileSize;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
});

const truncatedDescription = computed(() => {
  if (!props.newsletter.description) return '';

  if (props.newsletter.description.length <= maxDescriptionLength) {
    return props.newsletter.description;
  }

  return props.newsletter.description.substring(0, maxDescriptionLength) + '...';
});

const visibleTags = computed(() => {
  if (!props.newsletter.tags) return [];
  return props.newsletter.tags.slice(0, maxVisibleTags);
});

// Methods
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const openNewsletter = () => {
  // For now, just view the newsletter
  viewNewsletter();
}; const viewNewsletter = () => {
  if (!props.newsletter.downloadUrl) {
    $q.notify({
      type: 'negative',
      message: 'PDF not available for viewing'
    });
    return;
  }

  try {
    loading.value = true;

    // Open PDF in the global PDF viewer
    // This would integrate with your existing PDF viewer system
    logger.info('Opening newsletter:', props.newsletter.title);

    // For now, open in new tab
    window.open(props.newsletter.downloadUrl, '_blank');

  } catch (error) {
    logger.error('Error opening newsletter:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to open PDF'
    });
  } finally {
    loading.value = false;
  }
}; const downloadNewsletter = () => {
  if (!props.newsletter.downloadUrl) {
    $q.notify({
      type: 'negative',
      message: 'Download not available'
    });
    return;
  }

  try {
    loading.value = true;

    // Create download link
    const link = document.createElement('a');
    link.href = props.newsletter.downloadUrl;
    link.download = props.newsletter.filename;
    link.target = '_blank';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    $q.notify({
      type: 'positive',
      message: `Downloading ${props.newsletter.title}`
    });

    logger.info('Newsletter download started:', props.newsletter.filename);

  } catch (error) {
    logger.error('Error downloading newsletter:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to download PDF'
    });
  } finally {
    loading.value = false;
  }
};

const onThumbnailError = () => {
  thumbnailError.value = true;
  logger.warn('Thumbnail failed to load for:', props.newsletter.title);
};

// Generate thumbnail for newsletter (admin only)
const generateThumbnail = () => {
  try {
    thumbnailGenerating.value = true;

    // Thumbnail generation removed - PDF processing disabled
    $q.notify({
      type: 'warning',
      message: 'Thumbnail generation disabled',
      caption: 'PDF processing functionality removed',
    });

  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate thumbnail',
      position: 'top'
    });
  } finally {
    thumbnailGenerating.value = false;
  }
};

// Admin toggle methods
const togglePublishedStatus = async () => {
  try {
    publishLoading.value = true;

    // Explicitly handle undefined/falsy values as false for better boolean logic
    const currentStatus = props.newsletter.isPublished === true;
    const newStatus = !currentStatus;

    logger.info(`Toggling publication status: ${currentStatus} -> ${newStatus} for newsletter ${props.newsletter.id}`);

    // First, ensure the newsletter exists in Firebase by syncing it if needed
    try {
      await firestoreService.updateNewsletterMetadata(props.newsletter.id, {
        isPublished: newStatus
      });
    } catch (error) {
      // If update fails because document doesn't exist, notify parent to handle sync
      if (error instanceof Error && error.message.includes('No document to update')) {
        logger.warn('Document does not exist, requesting parent to sync first...');
        emit('refreshNeeded');
        $q.notify({
          type: 'warning',
          message: 'Newsletter needs to be synced to Firebase first',
          caption: 'Please use the sync button to create the Firebase record',
          position: 'top'
        });
        return;
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Update the newsletter object directly to provide immediate feedback
    const mutableNewsletter = props.newsletter as NewsletterMetadata & { isPublished: boolean };
    mutableNewsletter.isPublished = newStatus;

    // Emit event to parent so archive can refresh if needed
    emit('metadataUpdated', props.newsletter.id, { isPublished: newStatus });

    $q.notify({
      type: 'positive',
      message: `Newsletter ${newStatus ? 'published' : 'unpublished'} successfully`,
      position: 'top'
    });

    logger.info(`Newsletter ${props.newsletter.id} ${newStatus ? 'published' : 'unpublished'}`);

  } catch (error) {
    logger.error('Error toggling publish status:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update publication status',
      caption: error instanceof Error ? error.message : 'Unknown error',
      position: 'top'
    });
  } finally {
    publishLoading.value = false;
  }
};

const toggleFeaturedStatus = async () => {
  try {
    featuredLoading.value = true;

    // Explicitly handle undefined/falsy values as false for better boolean logic
    const currentStatus = props.newsletter.featured === true;
    const newStatus = !currentStatus;

    logger.info(`Toggling featured status: ${currentStatus} -> ${newStatus} for newsletter ${props.newsletter.id}`);

    // First, ensure the newsletter exists in Firebase by syncing it if needed
    try {
      await firestoreService.updateNewsletterMetadata(props.newsletter.id, {
        featured: newStatus
      });
    } catch (error) {
      // If update fails because document doesn't exist, notify parent to handle sync
      if (error instanceof Error && error.message.includes('No document to update')) {
        logger.warn('Document does not exist, requesting parent to sync first...');
        emit('refreshNeeded');
        $q.notify({
          type: 'warning',
          message: 'Newsletter needs to be synced to Firebase first',
          caption: 'Please use the sync button to create the Firebase record',
          position: 'top'
        });
        return;
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Update the newsletter object directly to provide immediate feedback
    const mutableNewsletter = props.newsletter as NewsletterMetadata & { featured: boolean };
    mutableNewsletter.featured = newStatus;

    // Emit event to parent so archive can refresh if needed
    emit('metadataUpdated', props.newsletter.id, { featured: newStatus });

    $q.notify({
      type: 'positive',
      message: `Newsletter ${newStatus ? 'added to featured' : 'removed from featured'}`,
      position: 'top'
    });

    logger.info(`Newsletter ${props.newsletter.id} featured status: ${newStatus}`);

  } catch (error) {
    logger.error('Error toggling featured status:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update featured status',
      position: 'top'
    });
  } finally {
    featuredLoading.value = false;
  }
};
</script>

<style scoped>
.newsletter-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 8px;
  overflow: hidden;
}

.newsletter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.thumbnail-container {
  position: relative;
  height: 140px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-fallback {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.featured-badge {
  top: 8px;
  right: 8px;
}

.status-badge {
  top: 8px;
  left: 8px;
}

.accessibility-indicators {
  top: 40px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  padding: 2px;
  display: flex;
  gap: 2px;
}

.newsletter-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.newsletter-title {
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.newsletter-description {
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.newsletter-footer {
  margin-top: auto;
}

/* Dark mode adjustments */
.q-dark .newsletter-card {
  border-color: #444;
}

.q-dark .thumbnail-container {
  background-color: #2a2a2a;
}

.q-dark .thumbnail-fallback {
  background-color: #2a2a2a;
}
</style>
