<!--
  Bulk Operations Toolbar Component
  Handles batch operations for selected newsletters
-->
<template>
    <q-card v-if="selectedNewsletters.length > 0" class="q-mb-md">
        <q-card-section>
            <div class="row items-center q-gutter-md">
                <div class="text-body1 text-weight-medium">
                    {{ selectedNewsletters.length }} newsletter{{ selectedNewsletters.length === 1 ? '' : 's' }}
                    selected
                </div>

                <q-separator vertical />

                <!-- Primary bulk actions -->
                <div class="row q-gutter-sm">
                    <q-btn color="primary" icon="mdi-text-search" label="Extract Text"
                        @click="$emit('extract-selected-text')" :loading="processingStates.isExtracting" size="sm"
                        unelevated />
                    <q-btn color="accent" icon="mdi-image-multiple" label="Generate Thumbnails"
                        @click="$emit('generate-selected-thumbnails')" :loading="processingStates.isGeneratingThumbs"
                        size="sm" unelevated />
                    <q-btn color="secondary" icon="mdi-sync" label="Sync to Firebase" @click="$emit('sync-selected')"
                        :loading="processingStates.isSyncing" size="sm" unelevated />
                </div>

                <q-separator vertical />

                <!-- Publication toggles -->
                <div class="row q-gutter-sm">
                    <q-btn color="positive" icon="mdi-publish" label="Publish All"
                        @click="$emit('bulk-toggle-published', true)" :loading="processingStates.isToggling" size="sm"
                        outline />
                    <q-btn color="warning" icon="mdi-publish-off" label="Unpublish All"
                        @click="$emit('bulk-toggle-published', false)" :loading="processingStates.isToggling" size="sm"
                        outline />
                </div>

                <q-separator vertical />

                <!-- Featured toggles -->
                <div class="row q-gutter-sm">
                    <q-btn color="amber" icon="mdi-star" label="Feature All"
                        @click="$emit('bulk-toggle-featured', true)" :loading="processingStates.isToggling" size="sm"
                        outline />
                    <q-btn color="grey" icon="mdi-star-off" label="Unfeature All"
                        @click="$emit('bulk-toggle-featured', false)" :loading="processingStates.isToggling" size="sm"
                        outline />
                </div>

                <q-separator vertical />

                <!-- Destructive actions -->
                <div class="row q-gutter-sm">
                    <q-btn color="negative" icon="mdi-delete" label="Delete Selected" @click="$emit('bulk-delete')"
                        :loading="processingStates.isDeleting" size="sm" outline />
                </div>

                <q-space />

                <!-- Clear selection -->
                <q-btn icon="mdi-close" label="Clear Selection" @click="$emit('clear-selection')" flat size="sm" />
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import type { ContentManagementNewsletter } from '../../types';

interface ProcessingStates {
    isExtracting: boolean;
    isGeneratingThumbs: boolean;
    isSyncing: boolean;
    isToggling: boolean;
    isDeleting: boolean;
}

interface Props {
    selectedNewsletters: ContentManagementNewsletter[];
    processingStates: ProcessingStates;
}

interface Emits {
    (e: 'extract-selected-text'): void;
    (e: 'generate-selected-thumbnails'): void;
    (e: 'sync-selected'): void;
    (e: 'bulk-toggle-published', published: boolean): void;
    (e: 'bulk-toggle-featured', featured: boolean): void;
    (e: 'bulk-delete'): void;
    (e: 'clear-selection'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>
