<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">
        <q-icon name="mdi-text-box-search" class="q-mr-sm" />
        PDF Text Extraction Tool
      </div>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Firebase Integration</div>
          <p class="text-body2">
            Extract text from PDFs and store in Firebase for search functionality.
          </p>

          <div class="q-mb-md">
            <q-chip color="primary" text-color="white">
              {{ needsExtraction.length }} newsletters need text extraction
            </q-chip>
          </div>

          <q-btn :loading="extracting" :disable="needsExtraction.length === 0" color="primary"
            icon="mdi-text-box-search" label="Extract Text for All PDFs" @click="extractAllPdfs" />

          <div v-if="progress.completed > 0" class="q-mt-md">
            <q-linear-progress :value="progress.percentage / 100" color="primary" size="20px" />
            <div class="text-caption q-mt-xs">
              {{ progress.completed }} / {{ progress.total }} processed
              ({{ progress.successful }} successful, {{ progress.failed }} failed)
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card v-if="results.length > 0">
        <q-card-section>
          <div class="text-h6 q-mb-md">Extraction Results</div>

          <q-list>
            <q-item v-for="result in results" :key="result.filename" class="q-mb-sm">
              <q-item-section side>
                <q-icon :name="result.success ? 'mdi-check-circle' : 'mdi-alert-circle'"
                  :color="result.success ? 'positive' : 'negative'" size="sm" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ result.filename }}</q-item-label>
                <q-item-label v-if="result.error" caption class="text-negative">
                  {{ result.error }}
                </q-item-label>
                <q-item-label v-else-if="result.extractedData" caption>
                  {{ result.extractedData.totalWords }} words extracted
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-chip :color="result.firestoreUpdated ? 'positive' : 'warning'"
                  :text-color="result.firestoreUpdated ? 'white' : 'dark'" size="sm">
                  {{ result.firestoreUpdated ? 'Saved' : 'Not Saved' }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useFirebaseNewsletterArchive } from '../composables/useFirebaseNewsletterArchive';
import { pdfExtractionFirebaseIntegration, type PdfExtractionResult } from '../services/pdf-extraction-firebase-integration.service';

const $q = useQuasar();
const { newsletters, loadNewsletters } = useFirebaseNewsletterArchive();

const extracting = ref(false);
const results = ref<PdfExtractionResult[]>([]);

const progress = computed(() => {
  return pdfExtractionFirebaseIntegration.getExtractionProgress(results.value);
});

const needsExtraction = computed(() => {
  return newsletters.value.filter(n =>
    pdfExtractionFirebaseIntegration.needsTextExtraction(n)
  );
});

async function extractAllPdfs() {
  try {
    extracting.value = true;
    results.value = [];

    for (const newsletter of needsExtraction.value) {
      const pdfUrl = `/issues/${newsletter.filename}`;
      const result = await pdfExtractionFirebaseIntegration.extractAndStoreInFirebase(
        pdfUrl,
        newsletter.filename,
        newsletter
      );
      results.value.push(result);

      $q.notify({
        type: result.success ? 'positive' : 'negative',
        message: result.success
          ? `Extracted text from ${newsletter.filename}`
          : `Failed to extract from ${newsletter.filename}: ${result.error}`,
        timeout: 3000
      });
    }
  } catch (err) {
    console.error('Extraction process failed:', err);
    $q.notify({
      type: 'negative',
      message: 'Extraction process failed',
      timeout: 5000
    });
  } finally {
    extracting.value = false;
  }
}

onMounted(() => {
  void loadNewsletters();
});
</script>
