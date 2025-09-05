<template>
    <q-card flat bordered :class="cardClasses" class="newsletter-card cursor-pointer transition-all"
        @click="openNewsletter" :style="cardStyle">

        <!-- Thumbnail Section -->
        <div class="thumbnail-container">
            <q-img v-if="newsletter.thumbnailUrl" :src="newsletter.thumbnailUrl"
                :alt="`Thumbnail for ${newsletter.title}`" class="thumbnail-image" loading="lazy"
                @error="onThumbnailError">
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
            </div>

            <!-- Featured Badge -->
            <q-badge v-if="newsletter.featured" color="accent" floating rounded class="featured-badge">
                <q-icon name="star" size="12px" class="q-mr-xs" />
                Featured
            </q-badge>

            <!-- Publication Status -->
            <q-badge v-if="!newsletter.isPublished" color="orange" floating class="status-badge">
                Draft
            </q-badge>
        </div>

        <!-- Content Section -->
        <q-card-section class="newsletter-content">
            <!-- Title -->
            <div class="text-subtitle1 text-weight-medium newsletter-title q-mb-xs">
                {{ newsletter.title }}
            </div>

            <!-- Publication Info -->
            <div class="text-caption text-grey-6 q-mb-sm">
                <q-icon name="event" size="14px" class="q-mr-xs" />
                {{ formattedDate }}
                <span v-if="newsletter.season" class="q-ml-sm">
                    <q-icon name="wb_sunny" size="14px" class="q-mr-xs" />
                    {{ capitalizeFirst(newsletter.season) }}
                </span>
            </div>

            <!-- Issue Number -->
            <div v-if="newsletter.issueNumber" class="text-caption text-grey-6 q-mb-sm">
                <q-icon name="numbers" size="14px" class="q-mr-xs" />
                Issue {{ newsletter.issueNumber }}
            </div>

            <!-- Description -->
            <div v-if="newsletter.description" class="text-body2 newsletter-description q-mb-sm">
                {{ truncatedDescription }}
            </div>

            <!-- Tags -->
            <div v-if="newsletter.tags && newsletter.tags.length > 0" class="q-mb-sm">
                <q-chip v-for="tag in visibleTags" :key="tag" size="sm" color="primary" text-color="white" dense
                    class="q-mr-xs q-mb-xs">
                    {{ tag }}
                </q-chip>
                <q-chip v-if="newsletter.tags.length > maxVisibleTags" size="sm" color="grey" text-color="white" dense
                    class="q-mr-xs q-mb-xs">
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
                    <span v-if="newsletter.pageCount">{{ newsletter.pageCount }} pages</span>
                    <span v-else>PDF</span>
                    <span v-if="formattedFileSize" class="q-ml-sm">
                        • {{ formattedFileSize }}
                    </span>
                </div>

                <!-- Actions -->
                <div class="col-auto">
                    <q-btn flat dense round size="sm" color="primary" icon="visibility" @click.stop="viewNewsletter">
                        <q-tooltip>View PDF</q-tooltip>
                    </q-btn>

                    <q-btn v-if="newsletter.downloadUrl" flat dense round size="sm" color="secondary" icon="download"
                        @click.stop="downloadNewsletter">
                        <q-tooltip>Download PDF</q-tooltip>
                    </q-btn>
                </div>
            </div>
        </q-card-section>

        <!-- Loading overlay for actions -->
        <q-inner-loading :showing="loading" color="primary" />
    </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useSiteStore } from '../stores/site-store-simple';
import { type NewsletterMetadata } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';

// Props
interface Props {
    newsletter: NewsletterMetadata;
}

const props = defineProps<Props>();

// Composables
const $q = useQuasar();
const siteStore = useSiteStore();

// State
const loading = ref(false);
const thumbnailError = ref(false);

// Constants
const maxVisibleTags = 2;
const maxDescriptionLength = 100;

// Computed properties
const isDarkMode = computed(() => siteStore.isDarkMode);

const cardClasses = computed(() => {
    const base = 'newsletter-card';
    if (isDarkMode.value) {
        return `${base} bg-dark text-white q-dark`;
    } else {
        return `${base} bg-white text-dark`;
    }
});

const cardStyle = computed(() => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const
})); const fallbackClasses = computed(() => ({
    'flex': true,
    'flex-center': true,
    'column': true,
    'full-height': true,
    'bg-grey-2': !isDarkMode.value,
    'bg-grey-8': isDarkMode.value
}));

const formattedDate = computed(() => {
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
