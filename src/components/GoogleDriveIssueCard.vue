<!-- Enhanced issue card component for Google Drive integration -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfViewer } from '../composables/usePdfViewer'
import type { IssueWithGoogleDrive } from '../types/google-drive-content'

interface Props {
    issue: IssueWithGoogleDrive
    thumbnail?: string | undefined
    isLoading?: boolean
    showMetadata?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showMetadata: false
})

const emit = defineEmits<{
    'regenerate-thumbnail': [issue: IssueWithGoogleDrive, event?: Event]
}>()

const router = useRouter()
const siteStore = useSiteStore()
const { openDocument } = usePdfViewer()

// Computed property for card theme classes
const cardClasses = computed(() => {
    if (siteStore.isDarkMode) {
        return 'bg-dark text-white q-dark';
    } else {
        return 'bg-white text-dark';
    }
});

const greyTextClass = computed(() =>
    siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
)

const statusColor = computed(() => {
    switch (props.issue.syncStatus) {
        case 'synced': return 'positive'
        case 'syncing': return 'warning'
        case 'error': return 'negative'
        case 'outdated': return 'orange'
        default: return 'grey'
    }
})

const statusIcon = computed(() => {
    switch (props.issue.syncStatus) {
        case 'synced': return 'mdi-cloud-check'
        case 'syncing': return 'mdi-cloud-sync'
        case 'error': return 'mdi-cloud-alert'
        case 'outdated': return 'mdi-cloud-refresh'
        default: return 'mdi-cloud'
    }
})

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    } catch {
        return dateString
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function handleCardClick() {
    // Navigate to issue details page
    void router.push(`/archive/${props.issue.id}`)
}

function handlePdfClick(event: Event) {
    event.stopPropagation() // Prevent card click
    // Convert IssueWithGoogleDrive to PdfDocument format for compatibility
    const pdfDocument = {
        id: props.issue.id,
        title: props.issue.title,
        date: props.issue.date,
        pages: props.issue.pages,
        url: props.issue.googleDriveUrl || props.issue.localUrl || props.issue.url || '',
        filename: props.issue.filename
    }
    openDocument(pdfDocument)
}

function handleRegenerateThumbnail(event: Event) {
    event.stopPropagation() // Prevent card click
    emit('regenerate-thumbnail', props.issue, event)
}
</script>

<template>
    <q-card :class="cardClasses" class="issue-card cursor-pointer transition-all duration-300 hover:shadow-lg"
        @click="handleCardClick">
        <!-- Thumbnail Section -->
        <div class="relative">
            <q-card-section class="q-pa-none">
                <div class="thumbnail-container" style="aspect-ratio: 210/297; background: #f5f5f5;">
                    <!-- Loading state -->
                    <div v-if="isLoading" class="flex items-center justify-center h-full">
                        <q-spinner-dots size="40px" color="primary" />
                    </div>

                    <!-- Always show fallback placeholder since Google Drive thumbnails are CORS blocked -->
                    <div v-else class="flex flex-col items-center justify-center h-full text-grey-6">
                        <q-icon name="mdi-file-pdf-box" size="48px" />
                        <div class="text-caption mt-2 text-center px-2">
                            {{ issue.filename }}
                        </div>
                    </div>
                </div>
            </q-card-section>

            <!-- Status badge -->
            <q-badge :color="statusColor" class="absolute top-2 left-2" :icon="statusIcon" v-if="showMetadata">
                {{ issue.syncStatus }}
            </q-badge>
        </div>

        <!-- Content Section -->
        <q-card-section class="q-pa-sm">
            <!-- Make sure title has enough space and doesn't overlap with buttons -->
            <div class="text-subtitle2 mb-1" style="padding-right: 80px; line-height: 1.3;">
                {{ issue.title }}
            </div>

            <div :class="greyTextClass" class="text-caption mb-2">
                {{ formatDate(issue.date) }}
            </div>

            <!-- Metadata section -->
            <div v-if="showMetadata" class="text-caption" :class="greyTextClass">
                <div class="flex items-center gap-1 mb-1">
                    <q-icon name="mdi-file-document" size="12px" />
                    <span>{{ issue.pages }} pages</span>
                </div>

                <div v-if="issue.fileSize" class="flex items-center gap-1 mb-1">
                    <q-icon name="mdi-harddisk" size="12px" />
                    <span>{{ issue.fileSize }}</span>
                </div>

                <div v-if="issue.lastModified" class="flex items-center gap-1 mb-1">
                    <q-icon name="mdi-clock" size="12px" />
                    <span>Modified {{ formatDate(issue.lastModified) }}</span>
                </div>

                <div v-if="issue.description" class="flex items-center gap-1 mb-1">
                    <q-icon name="mdi-information" size="12px" />
                    <span class="line-clamp-1">{{ issue.description }}</span>
                </div>

                <div v-if="issue.status === 'google-drive'" class="flex items-center gap-1">
                    <q-icon name="mdi-google-drive" size="12px" />
                    <span>Google Drive</span>
                </div>
            </div>
        </q-card-section>

        <!-- Action buttons -->
        <q-card-actions class="q-pa-sm q-pt-none" v-if="!showMetadata">
            <q-btn flat size="sm" color="primary" icon="mdi-eye" label="View Details" class="text-xs"
                @click.stop="handleCardClick" />
            <q-space />
            <q-btn flat size="sm" color="grey-7" icon="mdi-refresh" @click.stop="handleRegenerateThumbnail">
                <q-tooltip>Regenerate thumbnail</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" color="primary" icon="mdi-file-pdf-box" @click="handlePdfClick">
                <q-tooltip>Open PDF</q-tooltip>
            </q-btn>
        </q-card-actions>
    </q-card>
</template>

<style scoped>
.issue-card {
    transition: all 0.3s ease;
    border: 1px solid var(--q-color-separator);
}

.issue-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.thumbnail-container {
    overflow: hidden;
    border-radius: 4px 4px 0 0;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Dark mode adjustments */
.q-dark .issue-card {
    border-color: rgba(255, 255, 255, 0.12);
}

.q-dark .issue-card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}
</style>
