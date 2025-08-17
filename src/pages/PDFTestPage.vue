<template>
    <q-page class="q-pa-md">
        <div class="text-h4 q-mb-md">PDF Metadata Test</div>

        <q-btn @click="testPDFMetadata" color="primary" :loading="loading" label="Generate PDF Thumbnails" />

        <div v-if="results.length" class="q-mt-md">
            <div class="text-h6 q-mb-md">Results ({{ results.length }} PDFs)</div>

            <div class="row q-gutter-md">
                <q-card v-for="result in results" :key="result.filename" class="col-12 col-md-5 col-lg-3" flat bordered>
                    <q-card-section>
                        <div class="text-subtitle1">{{ result.title }}</div>
                        <div class="text-caption text-grey-6">{{ result.filename }}</div>
                        <div class="text-body2 q-mt-sm">
                            Pages: {{ result.pages }} | Size: {{ result.fileSize }}
                        </div>
                    </q-card-section>

                    <q-card-section v-if="result.thumbnailDataUrl">
                        <img :src="result.thumbnailDataUrl" :alt="result.title"
                            style="width: 100%; max-height: 200px; object-fit: contain;" />
                    </q-card-section>

                    <q-card-actions>
                        <q-btn flat color="primary" :href="`/issues/${result.filename}`" target="_blank">
                            View PDF
                        </q-btn>
                    </q-card-actions>
                </q-card>
            </div>
        </div>

        <div v-if="error" class="q-mt-md">
            <q-banner class="text-negative">
                {{ error }}
            </q-banner>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { pdfMetadataService } from '../services/pdf-metadata-service';
import type { PDFMetadata } from '../services/pdf-metadata-service';

const loading = ref(false);
const results = ref<PDFMetadata[]>([]);
const error = ref<string | null>(null);

const testPDFMetadata = async () => {
    loading.value = true;
    error.value = null;
    results.value = [];

    try {
        // Test with a few PDFs
        const testPDFs = [
            { url: '/issues/2024.02-conashaugh-courier.pdf', filename: '2024.02-conashaugh-courier.pdf' },
            { url: '/issues/2024.03-conashaugh-courier.pdf', filename: '2024.03-conashaugh-courier.pdf' },
            { url: '/issues/2025.08-conashaugh-courier.pdf', filename: '2025.08-conashaugh-courier.pdf' }
        ];

        console.log('Testing PDF metadata extraction...');
        const metadata = await pdfMetadataService.processPDFBatch(testPDFs);

        console.log('PDF metadata results:', metadata);
        results.value = metadata;

    } catch (err) {
        console.error('PDF test error:', err);
        error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
        loading.value = false;
    }
};
</script>
