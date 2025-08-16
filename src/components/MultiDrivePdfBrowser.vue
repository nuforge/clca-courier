<template>
    <q-page class="q-pa-md">
        <!-- Header -->
        <div class="text-center q-mb-xl">
            <h1 class="text-h3 text-primary q-mb-sm">
                <q-icon name="folder_open" class="q-mr-md" />
                Multi-Drive PDF Browser
            </h1>
            <p class="text-h6 text-grey-7">
                Browse PDFs from all configured Google Drive folders
            </p>
        </div>

        <!-- Load Button -->
        <q-card v-if="!state.isInitialized" class="q-mb-lg" flat bordered>
            <q-card-section class="row items-center">
                <q-icon name="cloud_download" color="primary" size="lg" class="q-mr-md" />
                <div class="col">
                    <div class="text-h6">Load PDFs from Multiple Google Drives</div>
                    <div class="text-body2 text-grey-7 q-mb-sm">Access to all configured drive folders - NO AUTH
                        REQUIRED!</div>
                </div>
                <q-btn color="primary" icon="download" label="Load All PDFs" @click="loadAllPdfs"
                    :loading="state.isLoading" unelevated />
            </q-card-section>
        </q-card>

        <!-- Success Status -->
        <q-card v-if="state.isInitialized && !state.error" class="q-mb-lg bg-green-1" flat bordered>
            <q-card-section>
                <div class="row items-center q-mb-sm">
                    <q-icon name="check_circle" color="positive" size="lg" class="q-mr-md" />
                    <div class="col">
                        <div class="text-h6">✅ PDFs Loaded Successfully</div>
                        <div class="text-body2 text-grey-7">Found {{ allPdfs.length }} total PDF files</div>
                    </div>
                    <q-btn flat color="primary" icon="refresh" label="Reload" @click="loadAllPdfs" size="sm" />
                </div>

                <!-- Folder Summary -->
                <div class="q-mt-md">
                    <div class="text-body2 text-weight-bold q-mb-sm">Folder Summary:</div>
                    <div class="row q-gutter-sm">
                        <q-chip v-for="folder in folderSummary" :key="folder.name"
                            :color="folder.loaded ? 'positive' : 'negative'" :icon="folder.loaded ? 'check' : 'error'"
                            text-color="white" size="sm">
                            {{ folder.name }}: {{ folder.count }} PDFs
                            <q-tooltip v-if="folder.error">{{ folder.error }}</q-tooltip>
                        </q-chip>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- Error Status -->
        <q-card v-if="state.error" class="q-mb-lg bg-red-1" flat bordered>
            <q-card-section>
                <div class="text-h6 text-red-8">Error</div>
                <div class="text-body2">{{ state.error }}</div>
                <q-btn flat label="Retry" @click="loadAllPdfs" class="q-mt-sm" />
            </q-card-section>
        </q-card>

        <!-- Folder Tabs -->
        <q-tabs v-if="Object.keys(pdfsByFolder).length > 1" v-model="activeFolder" class="text-primary q-mb-md"
            align="left" indicator-color="primary">
            <q-tab name="all" label="All PDFs" :icon="'folder'" />
            <q-tab v-for="(pdfs, folderName) in pdfsByFolder" :key="folderName" :name="folderName"
                :label="`${folderName} (${pdfs.length})`" icon="folder_open" />
        </q-tabs>

        <!-- PDF Grid -->
        <div v-if="displayedPdfs.length > 0" class="row q-gutter-md">
            <q-card v-for="pdf in displayedPdfs" :key="pdf.id" class="col-12 col-md-6 col-lg-4 cursor-pointer pdf-card"
                flat bordered @click="openPdf(pdf)">
                <!-- Thumbnail -->
                <div class="pdf-thumbnail">
                    <img v-if="(pdf.thumbnailUrl || pdf.cacheThumbnailUrl)"
                        :src="(pdf.cacheThumbnailUrl || pdf.thumbnailUrl)!" :alt="pdf.title"
                        @error="handleThumbnailError($event, pdf)" />
                    <div v-else class="thumbnail-placeholder">
                        <q-icon name="picture_as_pdf" size="xl" color="grey-5" />
                    </div>
                </div>

                <q-card-section>
                    <div class="text-h6 text-ellipsis">{{ pdf.title }}</div>
                    <div class="text-caption text-grey-6">{{ pdf.filename }}</div>
                    <div class="text-caption text-grey-6">{{ formatDate(pdf.date) }}</div>

                    <!-- Category/Folder Badge -->
                    <q-chip size="xs" color="primary" text-color="white" class="q-mt-xs">
                        {{ pdf.category }}
                    </q-chip>

                    <div class="q-mt-sm">
                        <q-btn flat color="primary" icon="visibility" label="Preview" @click.stop="openPdf(pdf)"
                            size="sm" class="q-mr-sm" />
                        <q-btn flat color="secondary" icon="open_in_new" label="Drive" :href="pdf.url" target="_blank"
                            size="sm" @click.stop />
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Empty State -->
        <div v-else-if="state.isInitialized" class="text-center q-py-xl">
            <q-icon name="folder_open" size="72px" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">No PDFs found</div>
            <div class="text-body2 text-grey-5">
                {{ activeFolder === 'all' ? 'No PDFs found in any configured drive folder' : `No PDFs in
                ${activeFolder}` }}
            </div>
        </div>

        <!-- PDF Viewer Dialog -->
        <q-dialog v-model="pdfDialogOpen" maximized>
            <q-card>
                <q-bar class="bg-primary text-white">
                    <q-icon name="picture_as_pdf" />
                    <div class="col text-center">
                        {{ selectedPdf?.title || 'PDF Viewer' }}
                    </div>
                    <q-btn dense flat icon="close" @click="closePdf" />
                </q-bar>

                <q-card-section class="q-pa-none" style="height: calc(100vh - 52px);">
                    <iframe v-if="selectedPdf && pdfViewerSrc" :src="pdfViewerSrc" width="100%" height="100%"
                        style="border: none;" />
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMultiDriveGoogleDrive } from '../composables/useMultiDriveGoogleDrive'
import type { IssueWithGoogleDrive } from '../types/google-drive-content'

// Multi-drive composable
const {
    state,
    allPdfs,
    pdfsByFolder,
    folderSummary,
    initialize
} = useMultiDriveGoogleDrive()

// Local state
const pdfDialogOpen = ref(false)
const selectedPdf = ref<IssueWithGoogleDrive | null>(null)
const activeFolder = ref('all')

// Computed
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
}

const pdfViewerSrc = computed(() => {
    if (!selectedPdf.value) return ''
    return selectedPdf.value.googleDriveUrl || selectedPdf.value.url || ''
})

const displayedPdfs = computed(() => {
    if (activeFolder.value === 'all') {
        return allPdfs.value
    }
    return pdfsByFolder.value[activeFolder.value] || []
})

// Methods
const loadAllPdfs = async () => {
    try {
        console.log('🚀 Loading PDFs from all drives...')
        await initialize()
        console.log('✅ SUCCESS!')
    } catch (error) {
        console.error('❌ Failed:', error)
    }
}

const openPdf = (pdf: IssueWithGoogleDrive) => {
    selectedPdf.value = pdf
    pdfDialogOpen.value = true
}

const closePdf = () => {
    pdfDialogOpen.value = false
    selectedPdf.value = null
}

const handleThumbnailError = (event: Event, pdf: IssueWithGoogleDrive) => {
    console.warn(`⚠️ Thumbnail failed to load for ${pdf.title}`)
    const img = event.target as HTMLImageElement
    img.style.display = 'none'
}
</script>

<style scoped>
.pdf-card {
    transition: transform 0.2s, box-shadow 0.2s;
}

.pdf-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pdf-thumbnail {
    height: 200px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.pdf-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.thumbnail-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    background: #fafafa;
    border: 2px dashed #ddd;
}

.text-ellipsis {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>
