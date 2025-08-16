<template>
    <q-page class="q-pa-md">
        <!-- Header -->
        <div class="text-center q-mb-xl">
            <h1 class="text-h3 text-primary q-mb-sm">
                <q-icon name="book" class="q-mr-md" />
                Publication Browser - WORKING VERSION
            </h1>
            <p class="text-h6 text-grey-7">
                Direct access to public Google Drive folder
            </p>
        </div>

        <!-- Load Button -->
        <q-card v-if="!state.isInitialized" class="q-mb-lg" flat bordered>
            <q-card-section class="row items-center">
                <q-icon name="folder_open" color="primary" size="lg" class="q-mr-md" />
                <div class="col">
                    <div class="text-h6">Load PDFs from Google Drive</div>
                    <div class="text-body2 text-grey-7 q-mb-sm">Direct access to public folder - NO AUTH REQUIRED!</div>
                </div>
                <q-btn color="primary" icon="download" label="Load PDFs" @click="loadPdfs" :loading="state.isLoading"
                    unelevated />
            </q-card-section>
        </q-card>

        <!-- Success Status -->
        <q-card v-if="state.isInitialized && !state.error" class="q-mb-lg bg-green-1" flat bordered>
            <q-card-section class="row items-center">
                <q-icon name="check_circle" color="positive" size="lg" class="q-mr-md" />
                <div class="col">
                    <div class="text-h6">🎉 SUCCESS! PDFs Loaded</div>
                    <div class="text-body2 text-grey-7">Found {{ archivedIssues.length }} PDF files</div>
                </div>
                <q-btn flat color="primary" icon="refresh" label="Reload" @click="loadPdfs" size="sm" />
            </q-card-section>
        </q-card>

        <!-- Error Status -->
        <q-card v-if="state.error" class="q-mb-lg bg-red-1" flat bordered>
            <q-card-section>
                <div class="text-h6 text-red-8">Error</div>
                <div class="text-body2">{{ state.error }}</div>
                <q-btn flat label="Retry" @click="loadPdfs" class="q-mt-sm" />
            </q-card-section>
        </q-card>

        <!-- PDF Grid -->
        <div v-if="archivedIssues.length > 0" class="row q-gutter-md">
            <q-card v-for="issue in archivedIssues" :key="issue.id" class="col-12 col-md-6 col-lg-4 cursor-pointer" flat
                bordered @click="openPdf(issue)">
                <q-card-section>
                    <div class="text-h6">{{ issue.title }}</div>
                    <div class="text-caption text-grey-6">{{ issue.filename }}</div>
                    <div class="text-caption text-grey-6">{{ formatDate(issue.date) }}</div>

                    <div class="q-mt-sm">
                        <q-btn flat color="primary" icon="visibility" label="Preview" @click.stop="openPdf(issue)"
                            size="sm" class="q-mr-sm" />
                        <q-btn flat color="secondary" icon="open_in_new" label="Drive" :href="issue.url" target="_blank"
                            size="sm" @click.stop />
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- PDF Viewer Dialog -->
        <q-dialog v-model="pdfDialogOpen" maximized>
            <q-card>
                <q-bar class="bg-primary text-white">
                    <div class="col text-center">
                        {{ selectedIssue?.title || 'PDF Viewer' }}
                    </div>
                    <q-btn dense flat icon="close" @click="closePdf" />
                </q-bar>

                <q-card-section class="q-pa-none" style="height: calc(100vh - 52px);">
                    <iframe v-if="selectedIssue && pdfViewerSrc" :src="pdfViewerSrc" width="100%" height="100%"
                        style="border: none;" />
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePublicGoogleDrive } from '../composables/usePublicGoogleDrive'
import type { IssueWithGoogleDrive } from '../types/google-drive-content'

// Working no-auth composable
const { state, archivedIssues, initialize } = usePublicGoogleDrive()

// Local state
const pdfDialogOpen = ref(false)
const selectedIssue = ref<IssueWithGoogleDrive | null>(null)

// Computed
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
}

const pdfViewerSrc = computed(() => {
    if (!selectedIssue.value) return ''
    return selectedIssue.value.googleDriveUrl || selectedIssue.value.url || ''
})

// Methods
const loadPdfs = async () => {
    try {
        console.log('🚀 Loading PDFs with working approach...')
        await initialize()
        console.log('✅ SUCCESS!')
    } catch (error) {
        console.error('❌ Failed:', error)
    }
}

const openPdf = (issue: IssueWithGoogleDrive) => {
    selectedIssue.value = issue
    pdfDialogOpen.value = true
}

const closePdf = () => {
    pdfDialogOpen.value = false
    selectedIssue.value = null
}
</script>
