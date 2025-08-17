<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-file-check" class="q-mr-sm" />
                PDF Diagnostics
              </div>
              <p class="text-body1">
                Check the status of all PDF files in the system. This helps identify
                broken links and invalid files.
              </p>
            </q-card-section>
          </q-card>

          <q-card flat :class="cardClasses">
            <q-card-section>
              <div class="row justify-between items-center q-mb-md">
                <div class="text-h6">PDF File Status</div>
                <q-btn color="primary" label="Check All PDFs" icon="mdi-refresh" @click="checkAllPdfs"
                  :loading="isChecking" />
              </div>
              <q-separator class="q-mb-md" />

              <div v-if="!hasChecked && !isChecking" class="text-center q-pa-lg">
                <q-icon name="mdi-information" size="3em" color="info" />
                <div class="q-mt-md text-body1">Click "Check All PDFs" to start validation</div>
              </div>

              <div v-if="isChecking" class="text-center q-pa-lg">
                <q-spinner-dots size="50px" color="primary" />
                <div class="q-mt-md">Checking PDF files...</div>
                <div class="text-caption">{{ checkedCount }}/{{ totalCount }} files checked</div>
              </div>

              <div v-if="hasChecked && !isChecking" class="q-gutter-md">
                <!-- Summary -->
                <q-banner v-if="summary.total > 0"
                  :class="summary.valid === summary.total ? 'bg-positive text-white' : 'bg-warning text-dark'" rounded>
                  <template v-slot:avatar>
                    <q-icon :name="summary.valid === summary.total ? 'mdi-check-circle' : 'mdi-alert-circle'" />
                  </template>
                  {{ summary.valid }}/{{ summary.total }} PDF files are valid
                  <div v-if="summary.invalid > 0" class="text-caption">
                    {{ summary.invalid }} files have issues
                  </div>
                </q-banner>

                <!-- PDF Status List -->
                <div class="q-gutter-sm">
                  <q-expansion-item v-for="result in pdfResults" :key="result.document.id"
                    :label="result.document.title" :caption="result.document.filename"
                    :icon="result.status === 'valid' ? 'mdi-check-circle' : result.status === 'invalid' ? 'mdi-alert-circle' : 'mdi-help-circle'"
                    :header-class="result.status === 'valid' ? 'text-positive' : result.status === 'invalid' ? 'text-negative' : 'text-warning'">
                    <q-card flat bordered>
                      <q-card-section>
                        <div class="text-body2 q-mb-sm">
                          <strong>URL:</strong> {{ result.document.url }}
                        </div>

                        <div v-if="result.status === 'valid'" class="text-positive">
                          <q-icon name="mdi-check" class="q-mr-sm" />
                          File is accessible and valid
                          <div v-if="result.size" class="text-caption q-mt-xs">
                            File size: {{ formatFileSize(result.size) }}
                          </div>
                        </div>

                        <div v-else-if="result.status === 'invalid'" class="text-negative">
                          <q-icon name="mdi-alert" class="q-mr-sm" />
                          {{ result.error }}
                        </div>

                        <div v-else class="text-warning">
                          <q-icon name="mdi-help" class="q-mr-sm" />
                          Status unknown - check pending
                        </div>

                        <div class="q-mt-md q-gutter-sm">
                          <q-btn size="sm" color="primary" label="Test Load" icon="mdi-eye"
                            @click="openPdf(result.document)" outline />
                          <q-btn size="sm" color="secondary" label="Direct Link" icon="mdi-open-in-new"
                            :href="result.document.url" target="_blank" outline />
                          <q-btn size="sm" color="accent" label="Re-check" icon="mdi-refresh"
                            @click="checkSinglePdf(result.document)" :loading="result.checking" outline />
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfViewer } from '../composables/usePdfViewer'
import { validatePdfFile } from '../utils/pdfValidator'
import type { PdfDocument } from '../composables/usePdfViewer'

const siteStore = useSiteStore()
const { openDocument } = usePdfViewer()

// Computed property for card theme classes
const cardClasses = computed(() => {
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

interface PdfCheckResult {
  document: PdfDocument
  status: 'valid' | 'invalid' | 'pending'
  error?: string
  size?: number
  checking?: boolean
}

const isChecking = ref(false)
const hasChecked = ref(false)
const checkedCount = ref(0)
const totalCount = ref(0)
const pdfResults = ref<PdfCheckResult[]>([])

const summary = computed(() => {
  const valid = pdfResults.value.filter(r => r.status === 'valid').length
  const invalid = pdfResults.value.filter(r => r.status === 'invalid').length
  const total = pdfResults.value.length
  return { valid, invalid, total }
})

async function checkAllPdfs() {
  isChecking.value = true
  hasChecked.value = false
  checkedCount.value = 0

  const documents = siteStore.archivedIssues
  totalCount.value = documents.length

  // Initialize results
  pdfResults.value = documents.map(doc => ({
    document: doc,
    status: 'pending' as const,
    checking: false
  }))

  // Check each PDF
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i]
    const result = pdfResults.value[i]
    if (!result || !document) continue

    try {
      const validation = await validatePdfFile(document.url)

      result.status = validation.isValid ? 'valid' : 'invalid'
      if (validation.error) result.error = validation.error
      if (validation.size !== undefined) result.size = validation.size
    } catch (error) {
      result.status = 'invalid'
      result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    checkedCount.value = i + 1
  }

  isChecking.value = false
  hasChecked.value = true
}

async function checkSinglePdf(document: PdfDocument) {
  const result = pdfResults.value.find(r => r.document.id === document.id)
  if (!result) return

  result.checking = true

  try {
    const validation = await validatePdfFile(document.url)
    result.status = validation.isValid ? 'valid' : 'invalid'
    if (validation.error) result.error = validation.error
    if (validation.size !== undefined) result.size = validation.size
  } catch (error) {
    result.status = 'invalid'
    result.error = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    result.checking = false
  }
}

function openPdf(document: PdfDocument) {
  openDocument(document)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(() => {
  // Auto-check if we have documents loaded
  if (siteStore.archivedIssues.length > 0 && !siteStore.isLoading) {
    void checkAllPdfs()
  }
})
</script>

<style scoped>
.q-expansion-item {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
</style>
