<template>
    <q-card class="newsletter-card" flat bordered>
        <!-- Header with title and date -->
        <q-card-section class="row items-center q-pb-none">
            <div class="col">
                <div class="text-h6 q-mb-xs">{{ newsletter.title }}</div>
                <div class="text-subtitle2 text-grey-6">
                    {{ formatDate(newsletter.date) }}
                </div>
            </div>
            <div class="col-auto">
                <q-badge :color="contentTypeColor" :label="newsletter.contentType || 'newsletter'" class="q-ma-xs" />
            </div>
        </q-card-section>

        <!-- Newsletter metadata -->
        <q-card-section class="q-py-sm">
            <div class="row items-center q-gutter-md text-body2 text-grey-7">
                <div class="row items-center">
                    <q-icon name="description" class="q-mr-xs" />
                    {{ newsletter.pages }} pages
                </div>

                <div v-if="newsletter.fileSize" class="row items-center">
                    <q-icon name="folder" class="q-mr-xs" />
                    {{ newsletter.fileSize }}
                </div>

                <!-- Source indicators -->
                <div class="row items-center q-gutter-xs">
                    <q-chip v-if="sources.local" icon="computer" size="sm" color="positive" text-color="white" dense>
                        Local
                    </q-chip>

                    <q-chip v-if="sources.drive" icon="cloud" size="sm" color="info" text-color="white" dense>
                        Drive
                    </q-chip>

                    <q-chip v-if="sources.hybrid" icon="sync" size="sm" color="secondary" text-color="white" dense>
                        Hybrid
                    </q-chip>
                </div>
            </div>
        </q-card-section>

        <!-- Thumbnail preview -->
        <q-card-section v-if="newsletter.thumbnailPath" class="q-pt-none">
            <q-img :src="newsletter.thumbnailPath" :alt="`${newsletter.title} thumbnail`"
                class="rounded-borders newsletter-thumbnail" loading="lazy" @error="onThumbnailError">
                <template v-slot:error>
                    <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                        <q-icon name="image_not_supported" size="2rem" />
                    </div>
                </template>

                <div class="absolute-bottom-right q-ma-sm">
                    <q-btn round color="primary" icon="visibility" size="sm" @click="openWebViewer"
                        :loading="loading.webView">
                        <q-tooltip>View Newsletter</q-tooltip>
                    </q-btn>
                </div>
            </q-img>
        </q-card-section>

        <!-- Actions -->
        <q-card-actions align="around" class="q-pt-none">
            <!-- Web View Button -->
            <q-btn flat icon="visibility" label="View" color="primary" @click="openWebViewer" :loading="loading.webView"
                class="col" />

            <!-- Download Button -->
            <q-btn flat icon="download" label="Download" color="secondary" @click="downloadNewsletter"
                :loading="loading.download" class="col" />

            <!-- More Options Menu -->
            <q-btn-dropdown flat icon="more_vert" dropdown-icon="" class="col-auto">
                <q-list dense>
                    <!-- View Sources -->
                    <q-item clickable @click="showSourcesDialog = true">
                        <q-item-section avatar>
                            <q-icon name="source" />
                        </q-item-section>
                        <q-item-section>View Sources</q-item-section>
                    </q-item>

                    <!-- Copy Link -->
                    <q-item clickable @click="copyLink">
                        <q-item-section avatar>
                            <q-icon name="link" />
                        </q-item-section>
                        <q-item-section>Copy Link</q-item-section>
                    </q-item>

                    <!-- Newsletter Details -->
                    <q-item clickable @click="showDetails = true">
                        <q-item-section avatar>
                            <q-icon name="info" />
                        </q-item-section>
                        <q-item-section>Details</q-item-section>
                    </q-item>
                </q-list>
            </q-btn-dropdown>
        </q-card-actions>

        <!-- Sources Dialog -->
        <q-dialog v-model="showSourcesDialog">
            <q-card style="min-width: 350px">
                <q-card-section class="row items-center">
                    <q-avatar icon="source" color="primary" text-color="white" />
                    <span class="q-ml-sm text-h6">Available Sources</span>
                </q-card-section>

                <q-card-section>
                    <q-list>
                        <q-item v-for="source in availableSources" :key="source.type"
                            :class="{ 'bg-green-1': source.available, 'bg-grey-1': !source.available }">
                            <q-item-section avatar>
                                <q-icon :name="getSourceIcon(source.type)"
                                    :color="source.available ? 'positive' : 'grey'" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ capitalizeFirst(source.type) }} Source</q-item-label>
                                <q-item-label caption>
                                    {{ source.available ? 'Available' : 'Unavailable' }}
                                    {{ source.lastChecked ? `• Checked ${formatTime(source.lastChecked)}` : '' }}
                                </q-item-label>
                            </q-item-section>
                            <q-item-section side v-if="source.available">
                                <q-btn flat round icon="open_in_new" size="sm" @click="openSource(source)" />
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Close" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Details Dialog -->
        <q-dialog v-model="showDetails">
            <q-card style="min-width: 350px">
                <q-card-section class="row items-center">
                    <q-avatar icon="info" color="primary" text-color="white" />
                    <span class="q-ml-sm text-h6">Newsletter Details</span>
                </q-card-section>

                <q-card-section>
                    <div class="q-gutter-sm">
                        <div><strong>Title:</strong> {{ newsletter.title }}</div>
                        <div><strong>Date:</strong> {{ formatDate(newsletter.date) }}</div>
                        <div><strong>Pages:</strong> {{ newsletter.pages }}</div>
                        <div><strong>Filename:</strong> {{ newsletter.filename }}</div>
                        <div v-if="newsletter.publishDate">
                            <strong>Published:</strong> {{ formatDate(newsletter.publishDate) }}
                        </div>
                        <div v-if="newsletter.topics?.length">
                            <strong>Topics:</strong> {{ newsletter.topics.join(', ') }}
                        </div>
                        <div v-if="newsletter.tags?.length">
                            <strong>Tags:</strong> {{ newsletter.tags.join(', ') }}
                        </div>
                    </div>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Close" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import type { NewsletterMetadata, NewsletterSource } from '../services/newsletter-service';
import { useHybridNewsletters } from '../composables/useHybridNewsletters';
import { usePdfViewer } from '../composables/usePdfViewer';

interface Props {
    newsletter: NewsletterMetadata;
}

const props = defineProps<Props>();
const $q = useQuasar();
const hybridNewsletters = useHybridNewsletters();
const pdfViewer = usePdfViewer();

// Local state
const showSourcesDialog = ref(false);
const showDetails = ref(false);
const availableSources = ref<NewsletterSource[]>([]);
const loading = reactive({
    webView: false,
    download: false,
    sources: false
});

// Computed properties
const sources = reactive({
    local: false,
    drive: false,
    hybrid: false
});

const contentTypeColor = computed(() => {
    switch (props.newsletter.contentType) {
        case 'annual': return 'orange';
        case 'special': return 'purple';
        default: return 'primary';
    }
});

// Methods
const loadSources = async () => {
    try {
        loading.sources = true;
        availableSources.value = await hybridNewsletters.getNewsletterSources(props.newsletter);

        // Update source indicators
        sources.local = await hybridNewsletters.hasLocalSource(props.newsletter);
        sources.drive = await hybridNewsletters.hasDriveSource(props.newsletter);
        sources.hybrid = await hybridNewsletters.hasHybridSources(props.newsletter);
    } catch (error) {
        console.error('Error loading sources:', error);
    } finally {
        loading.sources = false;
    }
};

const openWebViewer = async () => {
    try {
        loading.webView = true;
        const webUrl = await hybridNewsletters.getWebViewUrl(props.newsletter);

        if (webUrl) {
            // Use the existing PDF viewer
            pdfViewer.openDocument({
                ...props.newsletter,
                url: webUrl
            });
        } else {
            $q.notify({
                type: 'negative',
                message: 'Newsletter not available for viewing'
            });
        }
    } catch (error) {
        console.error('Error opening web viewer:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to open newsletter'
        });
    } finally {
        loading.webView = false;
    }
};

const downloadNewsletter = async () => {
    try {
        loading.download = true;
        const downloadUrl = await hybridNewsletters.getDownloadUrl(props.newsletter);

        if (downloadUrl) {
            window.open(downloadUrl, '_blank');
            $q.notify({
                type: 'positive',
                message: 'Download started'
            });
        } else {
            $q.notify({
                type: 'negative',
                message: 'Download not available'
            });
        }
    } catch (error) {
        console.error('Error downloading newsletter:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to download newsletter'
        });
    } finally {
        loading.download = false;
    }
};

const copyLink = async () => {
    try {
        const webUrl = await hybridNewsletters.getWebViewUrl(props.newsletter);
        if (webUrl) {
            await navigator.clipboard.writeText(window.location.origin + webUrl);
            $q.notify({
                type: 'positive',
                message: 'Link copied to clipboard'
            });
        }
    } catch (error) {
        console.error('Error copying link:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to copy link'
        });
    }
};

const openSource = (source: NewsletterSource) => {
    window.open(source.url, '_blank');
    showSourcesDialog.value = false;
};

const onThumbnailError = () => {
    console.warn(`Thumbnail not found: ${props.newsletter.thumbnailPath}`);
};

// Utility functions
const formatDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getSourceIcon = (type: string) => {
    switch (type) {
        case 'local': return 'computer';
        case 'drive': return 'cloud';
        case 'hybrid': return 'sync';
        default: return 'source';
    }
};

const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Lifecycle
onMounted(() => {
    void loadSources();
});
</script>

<style scoped>
.newsletter-card {
    transition: all 0.3s ease;
    min-height: 200px;
}

.newsletter-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.newsletter-thumbnail {
    height: 150px;
    position: relative;
    cursor: pointer;
}

.newsletter-thumbnail:hover .absolute-bottom-right {
    opacity: 1;
}

.absolute-bottom-right {
    opacity: 0.8;
    transition: opacity 0.3s ease;
}
</style>
