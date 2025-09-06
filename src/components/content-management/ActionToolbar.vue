<!--
  Content Management Action Toolbar
  Provides action buttons for content management operations
-->
<template>
    <q-card class="q-mb-lg">
        <q-card-section>
            <div class="row">
                <div class="col-12 col-md-4 q-pa-sm">
                    <q-btn color="primary" icon="mdi-refresh" label="Extract All Metadata"
                        @click="$emit('extract-metadata')" :loading="processingStates.isExtracting"
                        class="full-width" />
                </div>
                <div class="col-12 col-md-4 q-pa-sm">
                    <q-btn color="secondary" icon="mdi-text-search" label="Extract All Text Content"
                        @click="$emit('extract-text')" :loading="processingStates.isExtractingAllText"
                        class="full-width" />
                </div>
                <div class="col-12 col-md-4 q-pa-sm">
                    <q-btn color="accent" icon="mdi-image-multiple" label="Generate Thumbnails"
                        @click="$emit('generate-thumbnails')" :loading="processingStates.isGeneratingThumbs"
                        class="full-width" />
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import type { ProcessingStates } from 'src/types';

interface Props {
    processingStates: ProcessingStates;
}

defineProps<Props>();

defineEmits<{
    'extract-metadata': [];
    'extract-text': [];
    'generate-thumbnails': [];
}>();
</script>
