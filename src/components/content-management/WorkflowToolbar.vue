<!--
  Newsletter Workflow Toolbar Component
  Handles workflow operations like import, processing, and batch operations
-->
<template>
    <q-card class="q-mb-lg">
        <q-card-section>
            <q-expansion-item default-opened icon="mdi-cog" label="Content Management Workflow" class="text-h6">
                <q-card-section>
                    <!-- STEP 1: System Management -->
                    <div class="q-mb-md">
                        <h6 class="text-h6 q-my-none text-grey-7">🏗️ Step 1: System Management</h6>
                        <div class="row q-gutter-sm q-mt-sm">
                            <q-btn color="positive" icon="mdi-database-import" label="Import Data"
                                @click="$emit('import-data')" :loading="processingStates.isImporting" outline
                                class="text-weight-medium" />
                            <q-btn v-if="hasDrafts" color="primary" icon="mdi-cloud-upload"
                                label="Upload Drafts to Cloud" @click="$emit('upload-drafts')"
                                :loading="processingStates.isImporting" unelevated class="text-weight-medium" />
                            <q-btn v-if="hasDrafts" color="negative" icon="mdi-delete" label="Clear Local Drafts"
                                @click="$emit('clear-drafts')" outline class="text-weight-medium" />
                            <q-chip v-if="hasDrafts" :label="`${draftCount} local drafts`" color="orange"
                                text-color="white" size="sm" />
                        </div>
                    </div>

                    <!-- STEP 2: Database Setup -->
                    <div class="q-mb-md">
                        <h6 class="text-h6 q-my-none text-grey-7">🗄️ Step 2: Database Setup</h6>
                        <div class="row q-gutter-sm q-mt-sm">
                            <q-btn color="deep-orange" icon="mdi-database-plus" label="Create Missing Records"
                                @click="$emit('create-records')" :loading="processingStates.isCreatingRecords"
                                unelevated class="text-weight-medium" />
                            <q-btn color="deep-purple" icon="mdi-cache-clear" label="Clear Cache"
                                @click="$emit('clear-cache')" :loading="processingStates.isClearingCache" unelevated
                                class="text-weight-medium" />
                            <q-btn color="blue" icon="mdi-link-variant" label="Fix URLs" @click="$emit('fix-urls')"
                                :loading="processingStates.isFixingUrls" unelevated class="text-weight-medium" />
                            <q-btn color="red" icon="mdi-database-sync" label="Rebuild Database"
                                @click="$emit('rebuild-database')" :loading="processingStates.isRebuildingDatabase"
                                unelevated class="text-weight-medium" />
                        </div>
                    </div>

                    <!-- STEP 3: Content Processing -->
                    <div class="q-mb-md">
                        <h6 class="text-h6 q-my-none text-grey-7">📄 Step 3: Content Processing</h6>
                        <div class="row q-gutter-sm q-mt-sm">
                            <q-btn color="warning" icon="mdi-calendar-clock" label="Enhance Dates"
                                @click="$emit('enhance-dates')" :loading="processingStates.isEnhancingDates" unelevated
                                class="text-weight-medium" />
                            <q-btn color="accent" icon="mdi-image-multiple" label="Generate ALL Thumbnails"
                                @click="$emit('generate-thumbnails')" :loading="processingStates.isGeneratingThumbs"
                                unelevated class="text-weight-medium" />
                            <q-btn color="secondary" icon="mdi-text-search" label="Extract ALL Text to Firebase"
                                @click="$emit('extract-text')" :loading="processingStates.isExtractingAllText"
                                unelevated class="text-weight-medium" />
                            <q-chip v-if="newslettersNeedingExtraction > 0"
                                :label="`${newslettersNeedingExtraction} need extraction`" color="orange"
                                text-color="white" size="sm" />
                            <q-chip v-else label="All extracted ✓" color="green" text-color="white" size="sm" />
                            <q-btn color="primary" icon="mdi-tag-multiple" label="Generate ALL Tags"
                                @click="$emit('extract-metadata')" :loading="processingStates.isExtracting" unelevated
                                class="text-weight-medium" />
                        </div>
                    </div>

                    <!-- STEP 4: Individual Metadata Functions -->
                    <div class="q-mb-md">
                        <h6 class="text-h6 q-my-none text-grey-7">🎯 Step 4: Individual Metadata Functions</h6>
                        <p class="text-caption text-grey-6 q-mt-sm q-mb-sm">
                            These functions work on SELECTED items or ALL items if none selected
                        </p>
                        <div class="row q-gutter-sm q-mt-sm">
                            <q-btn color="purple" icon="mdi-file-document-outline" label="Extract Page Count"
                                @click="$emit('extract-page-count')" :loading="processingStates.isExtractingPageCount"
                                dense class="text-weight-medium" />
                            <q-btn color="teal" icon="mdi-scale" label="Extract File Size"
                                @click="$emit('extract-file-size')" :loading="processingStates.isExtractingFileSize"
                                dense class="text-weight-medium" />
                            <q-btn color="indigo" icon="mdi-calendar-range" label="Extract Dates"
                                @click="$emit('extract-dates')" :loading="processingStates.isExtractingDates" dense
                                class="text-weight-medium" />
                            <q-btn color="pink" icon="mdi-tag-outline" label="Generate Keywords"
                                @click="$emit('generate-keywords')" :loading="processingStates.isGeneratingKeywords"
                                dense class="text-weight-medium" />
                            <q-btn color="brown" icon="mdi-text-short" label="Generate Descriptions"
                                @click="$emit('generate-descriptions')"
                                :loading="processingStates.isGeneratingDescriptions" dense class="text-weight-medium" />
                            <q-btn color="cyan" icon="mdi-format-title" label="Generate Titles"
                                @click="$emit('generate-titles')" :loading="processingStates.isGeneratingTitles" dense
                                class="text-weight-medium" />
                        </div>
                    </div>

                    <!-- Status Indicators -->
                    <div class="q-mt-md">
                        <q-banner class="bg-blue-1 text-blue-9" dense rounded>
                            <template v-slot:avatar>
                                <q-icon name="mdi-information" />
                            </template>
                            💡 <strong>Workflow Tip:</strong> Run steps in order for best results.
                            Start with System Management, then Database Setup, then Content Processing.
                        </q-banner>
                    </div>
                </q-card-section>
            </q-expansion-item>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
interface ProcessingStates {
    isImporting: boolean;
    isCreatingRecords: boolean;
    isClearingCache: boolean;
    isFixingUrls: boolean;
    isRebuildingDatabase: boolean;
    isEnhancingDates: boolean;
    isGeneratingThumbs: boolean;
    isExtractingAllText: boolean;
    isExtracting: boolean;
    isExtractingPageCount: boolean;
    isExtractingFileSize: boolean;
    isExtractingDates: boolean;
    isGeneratingKeywords: boolean;
    isGeneratingDescriptions: boolean;
    isGeneratingTitles: boolean;
}

interface Props {
    processingStates: ProcessingStates;
    hasDrafts: boolean;
    draftCount: number;
    newslettersNeedingExtraction: number;
}

interface Emits {
    (e: 'import-data'): void;
    (e: 'upload-drafts'): void;
    (e: 'clear-drafts'): void;
    (e: 'create-records'): void;
    (e: 'clear-cache'): void;
    (e: 'fix-urls'): void;
    (e: 'rebuild-database'): void;
    (e: 'enhance-dates'): void;
    (e: 'generate-thumbnails'): void;
    (e: 'extract-text'): void;
    (e: 'extract-metadata'): void;
    (e: 'extract-page-count'): void;
    (e: 'extract-file-size'): void;
    (e: 'extract-dates'): void;
    (e: 'generate-keywords'): void;
    (e: 'generate-descriptions'): void;
    (e: 'generate-titles'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>
