<template>
    <q-page class="q-pa-md">
        <div class="text-center q-mb-xl">
            <h1 class="text-h3 text-primary q-mb-sm">
                NO AUTH TEST
            </h1>
            <p class="text-h6 text-grey-7">
                Direct API access to PUBLIC folder
            </p>
        </div>

        <!-- Test Button -->
        <q-card class="q-mb-lg" flat bordered>
            <q-card-section class="row items-center">
                <q-icon name="science" color="primary" size="lg" class="q-mr-md" />
                <div class="col">
                    <div class="text-h6">No Authentication Required</div>
                    <div class="text-body2 text-grey-7">Using API key only for public folder</div>
                </div>
                <q-btn color="primary" icon="download" label="Load Public PDFs" @click="loadPdfs"
                    :loading="state.isLoading" unelevated />
            </q-card-section>
        </q-card>

        <!-- Results -->
        <q-card v-if="state.error" class="q-mb-lg bg-red-1" flat bordered>
            <q-card-section>
                <div class="text-h6 text-red-8">Error</div>
                <div class="text-body2">{{ state.error }}</div>
            </q-card-section>
        </q-card>

        <q-card v-if="archivedIssues.length > 0" class="q-mb-lg bg-green-1" flat bordered>
            <q-card-section>
                <div class="text-h6 text-green-8">SUCCESS!</div>
                <div class="text-body2">Found {{ archivedIssues.length }} PDFs</div>
            </q-card-section>
        </q-card>

        <!-- PDF List -->
        <div v-if="archivedIssues.length > 0" class="row q-gutter-md">
            <q-card v-for="issue in archivedIssues" :key="issue.id" class="col-12 col-md-6 col-lg-4" flat bordered>
                <q-card-section>
                    <div class="text-h6">{{ issue.title }}</div>
                    <div class="text-caption text-grey-6">{{ issue.filename }}</div>
                    <div class="text-caption text-grey-6">{{ issue.date }}</div>
                    <q-btn flat color="primary" icon="open_in_new" label="Open" :href="issue.googleDriveUrl"
                        target="_blank" size="sm" class="q-mt-sm" />
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { usePublicGoogleDrive } from '../composables/usePublicGoogleDrive'

// No auth composable
const { state, archivedIssues, initialize } = usePublicGoogleDrive()

const loadPdfs = async () => {
    try {
        console.log('🚀 Testing NO AUTH approach...')
        await initialize()
        console.log('✅ NO AUTH SUCCESS!')
    } catch (error) {
        console.error('❌ NO AUTH FAILED:', error)
    }
}
</script>
