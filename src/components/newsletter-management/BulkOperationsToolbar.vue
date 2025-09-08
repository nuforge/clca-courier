<template>
    <q-card v-if="selectedCount > 0" class="q-mb-md">
        <q-card-section>
            <div class="row items-center justify-between">
                <div class="col-auto">
                    <div class="text-h6">
                        <q-icon name="mdi-checkbox-multiple-marked" class="q-mr-sm" />
                        {{ selectedCount }} item{{ selectedCount === 1 ? '' : 's' }} selected
                    </div>
                </div>
                <div class="col-auto">
                    <div class="row items-center">
                        <q-btn color="secondary" icon="mdi-text-search" label="Extract Text"
                            @click="$emit('extract-selected-text')" :loading="isExtractingText" class="q-mr-sm" />
                        <q-btn color="accent" icon="mdi-image-multiple" label="Generate Thumbnails"
                            @click="$emit('generate-selected-thumbnails')" :loading="isGeneratingThumbs"
                            class="q-mr-sm" />
                        <q-btn color="orange" icon="mdi-cloud-upload" label="Sync to Cloud"
                            @click="$emit('sync-selected')" :loading="isSyncing" class="q-mr-sm" />
                        <q-btn color="positive" icon="mdi-publish" label="Publish All"
                            @click="$emit('bulk-toggle-published', true)" :loading="isToggling" class="q-mr-sm" />
                        <q-btn color="orange" icon="mdi-star" label="Feature All"
                            @click="$emit('bulk-toggle-featured', true)" :loading="isToggling" class="q-mr-sm" />
                        <q-btn color="negative" icon="mdi-delete" label="Delete Selected" @click="$emit('bulk-delete')"
                            :loading="isDeleting" class="q-mr-sm" />
                        <q-btn flat icon="mdi-close" label="Clear Selection" @click="$emit('clear-selection')" />
                    </div>
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
// =============================================
// PROPS - MINIMAL STATE NEEDED
// =============================================

interface Props {
    selectedCount: number;
    isExtractingText: boolean;
    isGeneratingThumbs: boolean;
    isSyncing: boolean;
    isToggling: boolean;
    isDeleting: boolean;
}

defineProps<Props>();

// =============================================
// EMITS - ALL BULK ACTIONS
// =============================================

defineEmits<{
    'extract-selected-text': [];
    'generate-selected-thumbnails': [];
    'sync-selected': [];
    'bulk-toggle-published': [published: boolean];
    'bulk-toggle-featured': [featured: boolean];
    'bulk-delete': [];
    'clear-selection': [];
}>();
</script>
