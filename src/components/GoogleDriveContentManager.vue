<template>
    <div class="google-drive-content-manager">
        <div class="header">
            <h2>Content Management</h2>
            <div class="sync-status">
                <q-icon :name="syncIcon" :color="syncColor" class="q-mr-sm" />
                <span>{{ syncStatusText }}</span>
                <q-btn v-if="!isLoading" flat round icon="refresh" @click="handleRefresh" :loading="isLoading" />
            </div>
        </div>

        <q-tabs v-model="activeTab" class="q-mb-md">
            <q-tab name="articles" label="Articles" />
            <q-tab name="events" label="Events" />
            <q-tab name="issues" label="Issues" />
            <q-tab name="classifieds" label="Classifieds" />
        </q-tabs>

        <q-tab-panels v-model="activeTab">
            <!-- Articles Tab -->
            <q-tab-panel name="articles">
                <div class="content-grid">
                    <div v-for="article in articles" :key="article.id" class="content-card">
                        <q-card>
                            <q-card-section>
                                <h6>{{ article.title }}</h6>
                                <p class="text-caption">{{ article.lastModified }}</p>
                                <q-chip :color="article.status === 'published' ? 'green' : 'orange'" text-color="white"
                                    size="sm">
                                    {{ article.status }}
                                </q-chip>
                            </q-card-section>
                            <q-card-actions>
                                <q-btn flat @click="editContent(article)">Edit</q-btn>
                                <q-btn flat @click="previewContent(article)">Preview</q-btn>
                            </q-card-actions>
                        </q-card>
                    </div>
                </div>
            </q-tab-panel>

            <!-- Events Tab -->
            <q-tab-panel name="events">
                <div class="content-grid">
                    <div v-for="event in events" :key="event.id" class="content-card">
                        <q-card>
                            <q-card-section>
                                <h6>{{ event.title }}</h6>
                                <p class="text-caption">{{ event.lastModified }}</p>
                                <q-chip :color="event.status === 'published' ? 'green' : 'orange'" text-color="white"
                                    size="sm">
                                    {{ event.status }}
                                </q-chip>
                            </q-card-section>
                            <q-card-actions>
                                <q-btn flat @click="editContent(event)">Edit</q-btn>
                                <q-btn flat @click="previewContent(event)">Preview</q-btn>
                            </q-card-actions>
                        </q-card>
                    </div>
                </div>
            </q-tab-panel>

            <!-- Issues Tab -->
            <q-tab-panel name="issues">
                <div class="issues-grid">
                    <div v-for="issue in issues" :key="issue.id" class="issue-card">
                        <q-card>
                            <div class="thumbnail-container">
                                <img v-if="issue.cacheThumbnailUrl" :src="issue.cacheThumbnailUrl" :alt="issue.title"
                                    class="thumbnail" @error="handleThumbnailError(issue)" />
                                <div v-else class="thumbnail-placeholder">
                                    <q-icon name="picture_as_pdf" size="2rem" />
                                </div>
                                <q-chip :color="getStatusColor(issue.status)" text-color="white" size="xs"
                                    class="status-chip">
                                    {{ issue.status }}
                                </q-chip>
                            </div>
                            <q-card-section>
                                <h6>{{ issue.title }}</h6>
                                <p class="text-caption">{{ issue.date }} • {{ issue.pages }} pages</p>
                                <p class="text-caption">{{ issue.filename }}</p>
                            </q-card-section>
                            <q-card-actions>
                                <q-btn flat @click="viewIssue(issue)">View</q-btn>
                                <q-btn flat @click="downloadIssue(issue)">Download</q-btn>
                                <q-btn v-if="issue.canvaTemplateId" flat @click="openCanva(issue)">
                                    Edit in Canva
                                </q-btn>
                            </q-card-actions>
                        </q-card>
                    </div>
                </div>
            </q-tab-panel>

            <!-- Classifieds Tab -->
            <q-tab-panel name="classifieds">
                <q-table :rows="classifieds" :columns="classifiedColumns" row-key="id" flat bordered>
                    <template v-slot:top>
                        <h6>Classified Ads</h6>
                        <q-space />
                        <q-btn color="primary" @click="addClassified">Add New</q-btn>
                    </template>
                </q-table>
            </q-tab-panel>
        </q-tab-panels>

        <!-- Content Preview Dialog -->
        <q-dialog v-model="showPreview" maximized>
            <q-card>
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">{{ previewContentData?.title }}</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>
                <q-card-section class="q-pt-none">
                    <div v-html="previewContentData?.content" class="content-preview"></div>
                </q-card-section>
            </q-card>
        </q-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGoogleDriveContent } from '../composables/useGoogleDriveContent';
import { usePdfThumbnails } from '../composables/usePdfThumbnails';
import type {
    GoogleDriveContentConfig,
    IssueWithGoogleDrive,
    ContentPreview
} from '../types/google-drive-content';

const {
    initialize,
    refreshContent,
    articles,
    events,
    issues,
    classifieds,
    isLoading,
    error,
    syncStatus,
    isContentStale
} = useGoogleDriveContent();

const { generateThumbnailWithGoogleDrive } = usePdfThumbnails();

// Component state
const activeTab = ref('articles');
const showPreview = ref(false);
const previewContentData = ref<ContentPreview | null>(null);

// Computed properties
const syncIcon = computed(() => {
    if (isLoading.value) return 'sync';
    if (error.value) return 'error';
    if (isContentStale.value) return 'sync_problem';
    return 'cloud_done';
});

const syncColor = computed(() => {
    if (error.value) return 'negative';
    if (isContentStale.value) return 'warning';
    return 'positive';
});

const syncStatusText = computed(() => {
    if (isLoading.value) return 'Syncing...';
    if (error.value) return 'Sync Error';
    if (isContentStale.value) return 'Content may be outdated';
    if (syncStatus.value?.lastSync) {
        const lastSync = new Date(syncStatus.value.lastSync);
        return `Last synced: ${lastSync.toLocaleTimeString()}`;
    }
    return 'Not synced';
});

const classifiedColumns = [
    { name: 'title', label: 'Title', field: 'title', align: 'left' as const },
    { name: 'category', label: 'Category', field: 'category', align: 'left' as const },
    { name: 'contact', label: 'Contact', field: 'contact', align: 'left' as const },
    { name: 'date', label: 'Date', field: 'date', align: 'left' as const },
];

// Methods
const handleRefresh = async () => {
    try {
        await refreshContent();
    } catch (err) {
        console.error('Refresh failed:', err);
    }
};

const editContent = (content: ContentPreview) => {
    // Open Google Docs in new tab
    if (content.id) {
        window.open(`https://docs.google.com/document/d/${content.id}/edit`, '_blank');
    }
};

const previewContent = (content: ContentPreview) => {
    previewContentData.value = content;
    showPreview.value = true;
};

const viewIssue = (issue: IssueWithGoogleDrive) => {
    // Determine the best URL to use
    const url = issue.googleDriveUrl || issue.localUrl || issue.url;
    if (url) {
        window.open(url, '_blank');
    }
};

const downloadIssue = (issue: IssueWithGoogleDrive) => {
    try {
        const url = issue.googleDriveUrl || issue.localUrl || issue.url;
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.download = issue.filename;
            link.click();
        }
    } catch (error) {
        console.error('Download failed:', error);
    }
};

const openCanva = (issue: IssueWithGoogleDrive) => {
    if (issue.canvaTemplateId) {
        window.open(`https://www.canva.com/design/${issue.canvaTemplateId}/edit`, '_blank');
    }
};

const handleThumbnailError = async (issue: IssueWithGoogleDrive) => {
    try {
        const thumbnail = await generateThumbnailWithGoogleDrive(issue);
        if (thumbnail) {
            issue.cacheThumbnailUrl = thumbnail;
        }
    } catch (error) {
        console.error('Thumbnail generation failed:', error);
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'google-drive': return 'blue';
        case 'local': return 'orange';
        case 'hybrid': return 'purple';
        default: return 'grey';
    }
};

const addClassified = () => {
    // Open Google Sheets for classifieds
    const sheetsData = classifieds.value;
    if (sheetsData.length > 0) {
        // Assuming we have the sheet ID from the data structure
        window.open('https://docs.google.com/spreadsheets/create', '_blank');
    }
};

// Initialize on mount
onMounted(async () => {
    const config: GoogleDriveContentConfig = {
        contentFolderId: import.meta.env.VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID || '',
        issuesFolderId: import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID || '',
        imagesFolderId: import.meta.env.VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID || '',
        templatesFolderId: import.meta.env.VITE_GOOGLE_DRIVE_TEMPLATES_FOLDER_ID || '',
    };

    try {
        await initialize(config);
    } catch (err) {
        console.error('Initialization failed:', err);
    }
});
</script>

<style scoped>
.google-drive-content-manager {
    padding: 1rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.sync-status {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
}

.content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}

.issues-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.content-card,
.issue-card {
    height: fit-content;
}

.thumbnail-container {
    position: relative;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.thumbnail {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.thumbnail-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
}

.status-chip {
    position: absolute;
    top: 8px;
    right: 8px;
}

.content-preview {
    max-height: 70vh;
    overflow-y: auto;
    white-space: pre-wrap;
    font-family: 'Georgia', serif;
    line-height: 1.6;
}
</style>
