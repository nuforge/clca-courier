<!-- Enhanced issue details page with Google Drive support -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSiteStore } from '../stores/site-store-simple'
import { useGoogleDrivePdfs } from '../composables/useGoogleDrivePdfs'
import { usePdfViewer } from '../composables/usePdfViewer'
import GoogleDriveIssueCard from '../components/GoogleDriveIssueCard.vue'
import type { IssueWithGoogleDrive } from '../types/google-drive-content'

const route = useRoute()
const router = useRouter()
const siteStore = useSiteStore()
const googleDrivePdfs = useGoogleDrivePdfs()
const { openDocument } = usePdfViewer()

const issueId = computed(() => Number(route.params.id))
const issue = ref<IssueWithGoogleDrive | null>(null)
const metadata = ref<unknown>(null)
const loadingMetadata = ref(false)

// Navigation
const nextIssue = computed(() => issue.value ? googleDrivePdfs.getNextIssue(issue.value.id) : null)
const previousIssue = computed(() => issue.value ? googleDrivePdfs.getPreviousIssue(issue.value.id) : null)
const relatedIssues = computed(() => issue.value ? googleDrivePdfs.getRelatedIssues(issue.value, 3) : [])

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

const thumbnail = computed(() => {
    if (!issue.value?.googleDriveFileId) return null
    return googleDrivePdfs.state.value.thumbnails[issue.value.googleDriveFileId]
})

const isLoadingThumbnail = computed(() => {
    if (!issue.value?.googleDriveFileId) return false
    return googleDrivePdfs.state.value.loadingThumbnails.has(issue.value.googleDriveFileId)
})

onMounted(() => {
    // Initialize Google Drive if not already done
    if (!googleDrivePdfs.state.value.isInitialized) {
        void googleDrivePdfs.initialize()
    }
})

// Watch for route parameter changes to handle navigation between issues
watch(
    () => route.params.id,
    (newId) => {
        if (newId) {
            void loadIssueDetails()
        }
    }
)

async function loadIssueDetails() {
    // Find the issue in archived issues
    const foundIssue = googleDrivePdfs.getIssueById(issueId.value)

    if (foundIssue) {
        issue.value = foundIssue
        await loadMetadata()

        // Load thumbnail if not already loaded
        if (!thumbnail.value && !isLoadingThumbnail.value) {
            await googleDrivePdfs.loadThumbnail(foundIssue)
        }
    } else {
        // Issue not found, redirect back to archive
        void router.push('/archive')
    }
}

async function loadMetadata() {
    if (!issue.value) return

    try {
        loadingMetadata.value = true
        metadata.value = await googleDrivePdfs.getPdfMetadata(issue.value)
    } catch (error) {
        console.error('Failed to load metadata:', error)
    } finally {
        loadingMetadata.value = false
    }
}

async function regenerateIssueThumbnail() {
    if (!issue.value) return

    try {
        console.log('Regenerating thumbnail for:', issue.value.title)
        await googleDrivePdfs.regenerateThumbnail(issue.value)
        console.log('Thumbnail regenerated successfully')
    } catch (error) {
        console.error('Error regenerating thumbnail:', error)
    }
}

function openPdf() {
    if (!issue.value) return

    // Convert to PdfDocument format for compatibility
    const pdfDocument = {
        id: issue.value.id,
        title: issue.value.title,
        date: issue.value.date,
        pages: issue.value.pages,
        url: issue.value.googleDriveUrl || issue.value.localUrl || issue.value.url || '',
        filename: issue.value.filename
    }

    openDocument(pdfDocument)
}

function navigateToIssue(targetIssue: IssueWithGoogleDrive) {
    void router.push(`/archive/${targetIssue.id}`)
}

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
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
</script>

<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12 col-lg-10">
                    <!-- Navigation breadcrumb -->
                    <q-breadcrumbs class="q-mb-md">
                        <q-breadcrumbs-el icon="mdi-home" to="/" />
                        <q-breadcrumbs-el label="Archive" to="/archive" />
                        <q-breadcrumbs-el :label="issue?.title || 'Issue Details'" />
                    </q-breadcrumbs>

                    <!-- Issue not found -->
                    <q-card v-if="!issue" flat :class="cardClasses" class="text-center q-pa-xl">
                        <q-icon name="mdi-alert-circle" size="4em" color="warning" />
                        <div class="text-h6 q-mt-md">Issue not found</div>
                        <div :class="greyTextClass" class="q-mt-sm">
                            The requested issue could not be found.
                        </div>
                        <q-btn color="primary" to="/archive" class="q-mt-md">
                            Back to Archive
                        </q-btn>
                    </q-card>

                    <!-- Issue details -->
                    <div v-else class="row q-col-gutter-lg">
                        <!-- Main content -->
                        <div class="col-12 col-md-8">
                            <q-card flat :class="cardClasses" class="q-mb-lg">
                                <q-card-section>
                                    <div class="row q-col-gutter-md">
                                        <!-- Thumbnail -->
                                        <div class="col-12 col-sm-4">
                                            <div class="thumbnail-large"
                                                style="aspect-ratio: 210/297; max-width: 300px;">
                                                <!-- Loading state -->
                                                <div v-if="isLoadingThumbnail"
                                                    class="flex items-center justify-center h-full bg-grey-2 rounded">
                                                    <q-spinner-dots size="40px" color="primary" />
                                                </div>

                                                <!-- Thumbnail image -->
                                                <img v-else-if="thumbnail" :src="thumbnail"
                                                    :alt="`Thumbnail for ${issue.title}`"
                                                    class="w-full h-full object-cover rounded shadow-2"
                                                    loading="lazy" />

                                                <!-- Fallback placeholder -->
                                                <div v-else
                                                    class="flex flex-col items-center justify-center h-full bg-grey-2 rounded">
                                                    <q-icon name="mdi-file-pdf-box" size="64px" color="grey-6" />
                                                    <div class="text-caption mt-2 text-center px-2"
                                                        :class="greyTextClass">
                                                        {{ issue.filename }}
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Action buttons -->
                                            <div class="q-mt-md">
                                                <q-btn color="primary" icon="mdi-open-in-new" label="Open PDF"
                                                    class="full-width q-mb-sm" @click="openPdf" />
                                                <q-btn outline color="primary" icon="mdi-refresh"
                                                    label="Regenerate Thumbnail" class="full-width"
                                                    @click="regenerateIssueThumbnail" />
                                            </div>
                                        </div>

                                        <!-- Issue information -->
                                        <div class="col-12 col-sm-8">
                                            <div class="text-h4 q-mb-md">{{ issue.title }}</div>

                                            <div class="row q-col-gutter-md q-mb-lg">
                                                <div class="col-6">
                                                    <q-chip icon="mdi-calendar" color="primary" text-color="white">
                                                        {{ formatDate(issue.date) }}
                                                    </q-chip>
                                                </div>
                                                <div class="col-6">
                                                    <q-chip icon="mdi-file-document" color="secondary"
                                                        text-color="white">
                                                        {{ issue.pages }} pages
                                                    </q-chip>
                                                </div>
                                            </div>

                                            <!-- Status and sync info -->
                                            <div class="q-mb-lg">
                                                <div class="text-subtitle1 q-mb-sm">Status & Sync</div>
                                                <div class="row q-col-gutter-sm">
                                                    <div class="col-auto">
                                                        <q-badge
                                                            :color="issue.syncStatus === 'synced' ? 'positive' : 'warning'"
                                                            :icon="issue.syncStatus === 'synced' ? 'mdi-cloud-check' : 'mdi-cloud-sync'">
                                                            {{ issue.syncStatus }}
                                                        </q-badge>
                                                    </div>
                                                    <div class="col-auto">
                                                        <q-badge color="info" icon="mdi-google-drive">
                                                            Google Drive
                                                        </q-badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Metadata -->
                                            <div v-if="metadata" class="q-mb-lg">
                                                <div class="text-subtitle1 q-mb-sm">File Information</div>
                                                <q-list separator class="rounded-borders">
                                                    <q-item>
                                                        <q-item-section avatar>
                                                            <q-icon name="mdi-file" />
                                                        </q-item-section>
                                                        <q-item-section>
                                                            <q-item-label>Filename</q-item-label>
                                                            <q-item-label caption>{{ issue.filename }}</q-item-label>
                                                        </q-item-section>
                                                    </q-item>

                                                    <q-item v-if="metadata && (metadata as any).fileSize">
                                                        <q-item-section avatar>
                                                            <q-icon name="mdi-harddisk" />
                                                        </q-item-section>
                                                        <q-item-section>
                                                            <q-item-label>File Size</q-item-label>
                                                            <q-item-label caption>{{ (metadata as any).fileSize
                                                            }}</q-item-label>
                                                        </q-item-section>
                                                    </q-item>

                                                    <q-item v-if="issue.lastModified">
                                                        <q-item-section avatar>
                                                            <q-icon name="mdi-clock" />
                                                        </q-item-section>
                                                        <q-item-section>
                                                            <q-item-label>Last Modified</q-item-label>
                                                            <q-item-label caption>{{ formatDate(issue.lastModified)
                                                            }}</q-item-label>
                                                        </q-item-section>
                                                    </q-item>

                                                    <q-item v-if="issue.googleDriveFileId">
                                                        <q-item-section avatar>
                                                            <q-icon name="mdi-google-drive" />
                                                        </q-item-section>
                                                        <q-item-section>
                                                            <q-item-label>Google Drive ID</q-item-label>
                                                            <q-item-label caption>{{ issue.googleDriveFileId
                                                            }}</q-item-label>
                                                        </q-item-section>
                                                    </q-item>
                                                </q-list>
                                            </div>

                                            <!-- Loading metadata -->
                                            <div v-if="loadingMetadata" class="text-center q-py-md">
                                                <q-spinner-dots />
                                                <div class="text-caption q-mt-sm">Loading file information...</div>
                                            </div>
                                        </div>
                                    </div>
                                </q-card-section>
                            </q-card>
                        </div>

                        <!-- Sidebar -->
                        <div class="col-12 col-md-4">
                            <!-- Navigation -->
                            <q-card flat :class="cardClasses" class="q-mb-lg">
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">Navigation</div>

                                    <q-btn v-if="previousIssue" outline color="primary" icon="mdi-chevron-left"
                                        :label="previousIssue.title" class="full-width q-mb-sm text-left"
                                        @click="navigateToIssue(previousIssue)" />

                                    <q-btn v-if="nextIssue" outline color="primary" icon-right="mdi-chevron-right"
                                        :label="nextIssue.title" class="full-width q-mb-sm text-left"
                                        @click="navigateToIssue(nextIssue)" />

                                    <q-btn color="secondary" icon="mdi-archive" label="Back to Archive"
                                        class="full-width" to="/archive" />
                                </q-card-section>
                            </q-card>

                            <!-- Related issues -->
                            <q-card v-if="relatedIssues.length > 0" flat :class="cardClasses">
                                <q-card-section>
                                    <div class="text-h6 q-mb-md">Related Issues</div>

                                    <div class="q-gutter-md">
                                        <GoogleDriveIssueCard v-for="relatedIssue in relatedIssues"
                                            :key="relatedIssue.id" :issue="relatedIssue"
                                            :thumbnail="googleDrivePdfs.state.value.thumbnails[relatedIssue.googleDriveFileId || String(relatedIssue.id)]"
                                            :is-loading="googleDrivePdfs.state.value.loadingThumbnails.has(relatedIssue.googleDriveFileId || String(relatedIssue.id))"
                                            :show-metadata="false"
                                            @regenerate-thumbnail="(issue) => googleDrivePdfs.regenerateThumbnail(issue)" />
                                    </div>
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </q-page>
</template>

<style scoped>
.thumbnail-large {
    max-width: 100%;
}

/* Dark mode adjustments */
.q-dark .thumbnail-large img {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
</style>
