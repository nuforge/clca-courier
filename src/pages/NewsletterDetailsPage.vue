<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12 col-md-10 col-lg-8">
                    <!-- Back Button -->
                    <q-btn flat icon="mdi-arrow-left" label="Back to Archive" @click="goBackToArchive" class="q-mb-md"
                        :color="isDarkMode ? 'white' : 'primary'" />

                    <!-- Loading State -->
                    <div v-if="isLoading" class="row justify-center q-pa-lg">
                        <q-spinner-hourglass color="primary" size="3rem" />
                        <div class="text-body1 q-ml-md">Loading newsletter from Firebase...</div>
                    </div>

                    <!-- Error State -->
                    <q-card v-else-if="error" flat bordered class="q-mb-md bg-negative text-white">
                        <q-card-section>
                            <div class="text-h6">
                                <q-icon name="error" class="q-mr-sm" />
                                Error Loading Newsletter
                            </div>
                            <p class="q-mb-none">{{ error }}</p>
                            <q-btn flat color="white" label="Retry" @click="retryLoad" class="q-mt-sm" />
                        </q-card-section>
                    </q-card>

                    <!-- Newsletter Details -->
                    <div v-else-if="newsletter">
                        <!-- Newsletter Header -->
                        <q-card flat :class="cardClasses" class="q-mb-md">
                            <q-card-section>
                                <div class="row">
                                    <!-- Thumbnail Column -->
                                    <div class="col-12 col-md-4 q-pa-md">
                                        <div class="thumbnail-container">
                                            <q-img v-if="newsletter.thumbnailUrl && !thumbnailError"
                                                :src="newsletter.thumbnailUrl"
                                                :alt="`Thumbnail for ${newsletter.title}`" class="thumbnail-large"
                                                @error="onThumbnailError">
                                                <template v-slot:loading>
                                                    <div class="absolute-center">
                                                        <q-spinner color="primary" size="3em" />
                                                    </div>
                                                </template>
                                            </q-img>

                                            <!-- Fallback when no thumbnail -->
                                            <div v-else class="thumbnail-fallback-large">
                                                <q-icon name="mdi-file-pdf-box" size="6rem" class="text-grey-5" />
                                                <div class="text-h6 text-center q-mt-md">PDF Document</div>
                                            </div>
                                        </div>

                                        <!-- Action Buttons -->
                                        <div class="q-mt-md ">
                                            <q-btn color="primary" icon="visibility" label="View PDF"
                                                @click="viewNewsletter" :loading="viewLoading" class="full-width" />

                                            <q-btn v-if="newsletter.downloadUrl" color="secondary" icon="download"
                                                label="Download" @click="downloadNewsletter" :loading="downloadLoading"
                                                class="full-width" />
                                        </div>
                                    </div>

                                    <!-- Details Column -->
                                    <div class="col-12 col-md-8 q-pa-md">
                                        <!-- Title and Status -->
                                        <div class="row items-start q-mb-md">
                                            <div class="col">
                                                <h1 class="text-h4 q-my-none">{{ newsletter.title }}</h1>
                                                <div v-if="newsletter.issueNumber"
                                                    class="text-subtitle1 text-grey-6 q-mt-xs">
                                                    Issue {{ newsletter.issueNumber }}
                                                </div>
                                            </div>
                                            <div class="col-auto">
                                                <q-badge v-if="newsletter.featured" color="accent" rounded>
                                                    <q-icon name="star" size="14px" class="q-mr-xs" />
                                                    Featured
                                                </q-badge>
                                                <q-badge v-if="!newsletter.isPublished" color="orange" rounded
                                                    class="q-ml-xs">
                                                    Draft
                                                </q-badge>
                                            </div>
                                        </div>

                                        <!-- Publication Info -->
                                        <div class="publication-info q-mb-md">
                                            <div class="info-item">
                                                <q-icon name="event" class="q-mr-sm" />
                                                <strong>Published:</strong> {{ formattedDate }}
                                            </div>
                                            <div v-if="newsletter.season" class="info-item">
                                                <q-icon name="wb_sunny" class="q-mr-sm" />
                                                <strong>Season:</strong> {{ capitalizeFirst(newsletter.season) }}
                                            </div>
                                            <div class="info-item">
                                                <q-icon name="calendar_today" class="q-mr-sm" />
                                                <strong>Year:</strong> {{ newsletter.year }}
                                            </div>
                                        </div>

                                        <!-- File Information -->
                                        <div class="file-info q-mb-md">
                                            <div class="info-item">
                                                <q-icon name="description" class="q-mr-sm" />
                                                <strong>Pages:</strong> {{ newsletter.pageCount || 'Unknown' }}
                                            </div>
                                            <div class="info-item">
                                                <q-icon name="file_copy" class="q-mr-sm" />
                                                <strong>Size:</strong> {{ formattedFileSize }}
                                            </div>
                                            <div class="info-item">
                                                <q-icon name="insert_drive_file" class="q-mr-sm" />
                                                <strong>Filename:</strong> {{ newsletter.filename }}
                                            </div>
                                        </div>

                                        <!-- Description -->
                                        <div v-if="newsletter.description" class="description q-mb-md">
                                            <div class="text-subtitle2 q-mb-sm">Description</div>
                                            <div class="text-body1">{{ newsletter.description }}</div>
                                        </div>

                                        <!-- Tags -->
                                        <div v-if="newsletter.tags && newsletter.tags.length > 0" class="tags-section">
                                            <div class="text-subtitle2 q-mb-sm">Tags</div>
                                            <q-chip v-for="tag in newsletter.tags" :key="tag" color="primary"
                                                text-color="white" class="q-mr-sm q-mb-sm">
                                                {{ tag }}
                                            </q-chip>
                                        </div>
                                    </div>
                                </div>
                            </q-card-section>
                        </q-card>

                        <!-- Additional Information -->
                        <q-card flat :class="cardClasses" class="q-mb-md">
                            <q-card-section>
                                <div class="text-h6 q-mb-md">Newsletter Information</div>

                                <div class="row">
                                    <div class="col-12 col-md-6 q-pa-md">
                                        <div class="info-group">
                                            <div class="text-subtitle2 q-mb-sm">Storage Information</div>
                                            <div class="info-item">
                                                <q-icon name="cloud" class="q-mr-sm" />
                                                <strong>Storage:</strong> Firebase Cloud Storage
                                            </div>
                                            <div v-if="newsletter.storageRef" class="info-item">
                                                <q-icon name="folder" class="q-mr-sm" />
                                                <strong>Path:</strong> {{ newsletter.storageRef }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-12 col-md-6 q-pa-md">
                                        <div class="info-group">
                                            <div class="text-subtitle2 q-mb-sm">Timestamps</div>
                                            <div class="info-item">
                                                <q-icon name="add" class="q-mr-sm" />
                                                <strong>Created:</strong> {{ formattedCreatedAt }}
                                            </div>
                                            <div class="info-item">
                                                <q-icon name="edit" class="q-mr-sm" />
                                                <strong>Updated:</strong> {{ formattedUpdatedAt }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Search Text Information -->
                                <div v-if="newsletter.searchableText" class="q-mt-md">
                                    <div class="text-subtitle2 q-mb-sm">Content Analysis</div>
                                    <div class="info-item">
                                        <q-icon name="search" class="q-mr-sm" />
                                        <strong>Full-text Search:</strong> Available ({{
                                            newsletter.searchableText.length.toLocaleString() }}
                                        characters indexed)
                                    </div>
                                </div>
                            </q-card-section>
                        </q-card>

                        <!-- Related Newsletters -->
                        <q-card v-if="relatedNewsletters.length > 0" flat :class="cardClasses">
                            <q-card-section>
                                <div class="text-h6 q-mb-md">Related Newsletters</div>
                                <div class="row">
                                    <div v-for="related in relatedNewsletters" :key="related.id"
                                        class="col-12 col-sm-6 col-md-4 q-pa-sm">
                                        <q-card flat bordered class="cursor-pointer"
                                            @click="navigateToNewsletter(related.id)">
                                            <q-card-section class="q-pa-md">
                                                <div class="text-subtitle2">{{ related.title }}</div>
                                                <div class="text-caption text-grey-6">{{
                                                    formatDate(related.publicationDate) }}</div>
                                            </q-card-section>
                                        </q-card>
                                    </div>
                                </div>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Newsletter Not Found -->
                    <div v-else class="text-center q-pa-lg">
                        <q-icon name="search_off" size="4rem" class="text-grey-5" />
                        <div class="text-h6 q-mt-md text-grey-6">Newsletter Not Found</div>
                        <div class="text-body1 q-mt-sm text-grey-6">
                            The requested newsletter could not be found in our Firebase database.
                        </div>
                        <q-btn color="primary" label="Back to Archive" @click="goBackToArchive" class="q-mt-md" />
                    </div>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useSiteStore } from '../stores/site-store-simple';
import { useFirebaseNewsletterArchive } from '../composables/useFirebaseNewsletterArchive';
import { type NewsletterMetadata } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';

// Composables
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const siteStore = useSiteStore();

// Archive composable
const { getNewsletterById, newsletters } = useFirebaseNewsletterArchive();

// State
const newsletter = ref<NewsletterMetadata | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const thumbnailError = ref(false);
const viewLoading = ref(false);
const downloadLoading = ref(false);

// Computed properties
const isDarkMode = computed(() => siteStore.isDarkMode);

const cardClasses = computed(() => {
    if (isDarkMode.value) {
        return 'bg-dark text-white q-dark';
    } else {
        return 'bg-white text-dark';
    }
});

const formattedDate = computed(() => {
    if (!newsletter.value) return '';
    const date = new Date(newsletter.value.publicationDate);
    return isNaN(date.getTime())
        ? 'Date unknown'
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
});

const formattedFileSize = computed(() => {
    if (!newsletter.value?.fileSize) return 'Unknown';

    const size = newsletter.value.fileSize;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
});

const formattedCreatedAt = computed(() => {
    if (!newsletter.value?.createdAt) return 'Unknown';
    const date = new Date(newsletter.value.createdAt);
    return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-US');
});

const formattedUpdatedAt = computed(() => {
    if (!newsletter.value?.updatedAt) return 'Unknown';
    const date = new Date(newsletter.value.updatedAt);
    return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-US');
});

const relatedNewsletters = computed(() => {
    if (!newsletter.value) return [];

    return newsletters.value
        .filter(n => n.id !== newsletter.value!.id && n.year === newsletter.value!.year)
        .slice(0, 3);
});

// Methods
const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
        ? 'Date unknown'
        : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

const loadNewsletter = async () => {
    const newsletterId = route.params.id as string;
    if (!newsletterId) {
        error.value = 'Newsletter ID is required';
        return;
    }

    try {
        isLoading.value = true;
        error.value = null;

        logger.info('Loading newsletter from Firebase:', newsletterId);

        const loadedNewsletter = await getNewsletterById(newsletterId);

        if (loadedNewsletter) {
            newsletter.value = loadedNewsletter;
            logger.success('Newsletter loaded successfully:', loadedNewsletter.title);
        } else {
            error.value = 'Newsletter not found';
            logger.warn('Newsletter not found:', newsletterId);
        }

    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load newsletter';
        logger.error('Error loading newsletter:', err);
    } finally {
        isLoading.value = false;
    }
};

const retryLoad = () => {
    void loadNewsletter();
};

const viewNewsletter = () => {
    if (!newsletter.value?.downloadUrl) {
        $q.notify({
            type: 'negative',
            message: 'PDF not available for viewing'
        });
        return;
    }

    try {
        viewLoading.value = true;

        // Open PDF in new tab (future: integrate with global PDF viewer)
        window.open(newsletter.value.downloadUrl, '_blank');

        logger.info('Newsletter opened for viewing:', newsletter.value.title);

    } catch (error) {
        logger.error('Error opening newsletter:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to open PDF'
        });
    } finally {
        viewLoading.value = false;
    }
}; const downloadNewsletter = () => {
    if (!newsletter.value?.downloadUrl) {
        $q.notify({
            type: 'negative',
            message: 'Download not available'
        });
        return;
    }

    try {
        downloadLoading.value = true;

        // Create download link
        const link = document.createElement('a');
        link.href = newsletter.value.downloadUrl;
        link.download = newsletter.value.filename;
        link.target = '_blank';

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        $q.notify({
            type: 'positive',
            message: `Downloading ${newsletter.value.title}`
        });

        logger.info('Newsletter download started:', newsletter.value.filename);

    } catch (error) {
        logger.error('Error downloading newsletter:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to download PDF'
        });
    } finally {
        downloadLoading.value = false;
    }
};

const navigateToNewsletter = (newsletterId: string) => {
    void router.push(`/archive/${newsletterId}`);
};

const goBackToArchive = () => {
    void router.push('/archive');
};

const onThumbnailError = () => {
    thumbnailError.value = true;
    logger.warn('Thumbnail failed to load for:', newsletter.value?.title);
};

// Lifecycle
onMounted(() => {
    void loadNewsletter();
});
</script>

<style scoped>
.thumbnail-container {
    border-radius: 8px;
    overflow: hidden;
    background-color: #f5f5f5;
    height: 300px;
}

.thumbnail-large {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.thumbnail-fallback-large {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
}

.info-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.info-group {
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    padding: 16px;
}

.publication-info,
.file-info {
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    padding: 16px;
}

.tags-section {
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    padding: 16px;
}

.description {
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    padding: 16px;
}

/* Dark mode adjustments */
.q-dark .thumbnail-container {
    background-color: #2a2a2a;
}

.q-dark .thumbnail-fallback-large {
    background-color: #2a2a2a;
}

.q-dark .info-group,
.q-dark .publication-info,
.q-dark .file-info,
.q-dark .tags-section,
.q-dark .description {
    background-color: rgba(255, 255, 255, 0.05);
}
</style>
