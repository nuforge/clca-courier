<!--
  Content Management Action Toolbar
  Provides action buttons for content management operations
-->
<template>
    <q-card class="q-mb-lg">
        <q-card-section>
            <div v-if="(selectedCount || 0) > 0" class="row q-mb-md">
                <div class="col-12">
                    <q-banner class="bg-primary text-white">
                        <template v-slot:avatar>
                            <q-icon name="mdi-check-circle" />
                        </template>
                        {{ selectedCount || 0 }} newsletter{{ (selectedCount || 0) > 1 ? 's' : '' }} selected
                        <template v-slot:action>
                            <q-btn flat label="Clear Selection" @click="$emit('clear-selection')" />
                        </template>
                    </q-banner>
                </div>
            </div>

            <div class="row">
                <div class="col-12 col-md-3 q-pa-sm">
                    <q-btn color="primary" icon="mdi-refresh"
                        :label="(selectedCount || 0) > 0 ? `Generate Tags (${selectedCount})` : 'Generate All Tags'"
                        @click="$emit('extract-metadata')" :loading="processingStates.isExtracting"
                        class="full-width" />
                </div>
                <div class="col-12 col-md-3 q-pa-sm">
                    <q-btn color="secondary" icon="mdi-text-search"
                        :label="(selectedCount || 0) > 0 ? `Extract Text (${selectedCount})` : 'Extract All Text'"
                        @click="$emit('extract-text')" :loading="processingStates.isExtractingAllText"
                        class="full-width" />
                </div>
                <div class="col-12 col-md-3 q-pa-sm">
                    <q-btn color="accent" icon="mdi-image-multiple"
                        :label="(selectedCount || 0) > 0 ? `Generate Thumbs (${selectedCount})` : 'Generate Thumbnails'"
                        @click="$emit('generate-thumbnails')" :loading="processingStates.isGeneratingThumbs"
                        class="full-width" />
                </div>
                <div class="col-12 col-md-3 q-pa-sm">
                    <q-btn color="positive" icon="mdi-cloud-upload"
                        :label="(selectedCount || 0) > 0 ? `Sync Selected (${selectedCount})` : 'Sync All to Firebase'"
                        @click="$emit('sync-selected')" :loading="processingStates.isSyncing" class="full-width" />
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import type { ProcessingStates } from 'src/types';

interface Props {
    processingStates: ProcessingStates;
    selectedCount?: number;
}

defineProps<Props>();

defineEmits<{
    'extract-metadata': [];
    'extract-text': [];
    'generate-thumbnails': [];
    'sync-selected': [];
    'clear-selection': [];
}>();
</script>
