<template>
  <div class="pdf-extraction-tool q-pa-md">
    <q-card>
      <q-card-section>
        <div class="text-h4 q-mb-sm">📄 PDF Text Extraction Tool</div>
        <div class="text-subtitle1 ">
          Extract text content from all PDF newsletters for database storage
        </div>
        <q-banner v-if="!isProcessing && extractedData.length === 0" class="bg-info q-mt-md">
          <q-icon name="info" />
          This tool will process all {{ availablePdfs.length }} PDFs in the issues folder and extract their text
          content let savedCount = 0;
          const totalCount = extractedData.value.length;

          // Only show loading if available
          if ($q?.loading?.show) {
          $q.loading.show({
          message: `Saving ${totalCount} records to database...`,
          });
          }

          for (const data of extractedData.value) {
          try {
          // Convert ExtractedPdfData to AdvancedPdfExtraction format
          const advancedData: AdvancedPdfExtraction = { The extracted data can then be exported for database storage.
        </q-banner>
      </q-card-section>

      <q-card-actions>
        <q-btn @click="startExtraction" :loading="isProcessing" :disable="isProcessing || availablePdfs.length === 0"
          color="primary" icon="play_arrow" label="Start Text Extraction" />
        <q-btn @click="exportToJson" :disable="extractedData.length === 0" color="green" icon="download"
          label="Export to JSON" class="q-ml-sm" />
        <q-btn @click="exportToCSV" :disable="extractedData.length === 0" color="orange" icon="table_chart"
          label="Export to CSV" class="q-ml-sm" />
        <q-btn @click="saveToDatabase" :disable="extractedData.length === 0" color="purple" icon="storage"
          label="Save to Database" class="q-ml-sm" />
        <q-btn @click="showDatabaseStats" color="blue-grey" icon="analytics" label="Database Stats" class="q-ml-sm" />
        <q-btn @click="clearData" :disable="extractedData.length === 0" color="negative" icon="clear" label="Clear Data"
          class="q-ml-sm" />
      </q-card-actions>

      <!-- Progress Section -->
      <q-card-section v-if="isProcessing || extractedData.length > 0">
        <div class="text-h6 q-mb-md">Processing Progress</div>

        <div class="row q-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-circular-progress :value="(processedCount / availablePdfs.length) * 100" size="80px" :thickness="0.15"
              color="primary" track-color="grey-3" class="q-ma-md">
              {{ processedCount }}/{{ availablePdfs.length }}
            </q-circular-progress>
          </div>
          <div class="col-12 col-md-8">
            <q-linear-progress :value="(processedCount / availablePdfs.length)" size="20px" color="primary"
              class="q-mb-sm" />
            <div v-if="currentProcessingFile" class="text-body2">
              Currently processing: <strong>{{ currentProcessingFile }}</strong>
            </div>
            <div class="text-caption ">
              {{ successCount }} successful, {{ errorCount }} errors
            </div>
          </div>
        </div>

        <!-- Error List -->
        <div v-if="errors.length > 0" class="q-mt-md">
          <q-expansion-item icon="error" :label="`Processing Errors (${errors.length})`" header-class="text-negative">
            <q-list separator>
              <q-item v-for="error in errors" :key="error.filename">
                <q-item-section avatar>
                  <q-icon name="error" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ error.filename }}</q-item-label>
                  <q-item-label caption>{{ error.error }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </div>
      </q-card-section>

      <!-- Results Preview -->
      <q-card-section v-if="extractedData.length > 0">
        <div class="text-h6 q-mb-md">Extracted Data Preview</div>

        <!-- Summary Stats -->
        <div class="row q-gutter-md q-mb-md">
          <q-card flat bordered class="col-12 col-md-3">
            <q-card-section class="text-center">
              <div class="text-h4 text-primary">{{ extractedData.length }}</div>
              <div class="text-caption">Total PDFs Processed</div>
            </q-card-section>
          </q-card>
          <q-card flat bordered class="col-12 col-md-3">
            <q-card-section class="text-center">
              <div class="text-h4 text-green">{{ totalWords.toLocaleString() }}</div>
              <div class="text-caption">Total Words Extracted</div>
            </q-card-section>
          </q-card>
          <q-card flat bordered class="col-12 col-md-3">
            <q-card-section class="text-center">
              <div class="text-h4 text-orange">{{ totalPages }}</div>
              <div class="text-caption">Total Pages</div>
            </q-card-section>
          </q-card>
          <q-card flat bordered class="col-12 col-md-3">
            <q-card-section class="text-center">
              <div class="text-h4 text-purple">{{ averageWordsPerPdf }}</div>
              <div class="text-caption">Avg Words/PDF</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Data Table -->
        <q-table :rows="extractedData" :columns="tableColumns" row-key="filename" :pagination="{ rowsPerPage: 10 }" flat
          bordered>
          <template v-slot:body-cell-preview="props">
            <q-td :props="props">
              <div class="text-body2" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                {{ props.row.textContent.substring(0, 100) }}...
              </div>
              <q-btn flat dense size="sm" icon="visibility" @click="showFullText(props.row)" label="View Full Text" />
            </q-td>
          </template>

          <template v-slot:body-cell-structure="props">
            <q-td :props="props">
              <q-btn flat dense size="sm" icon="account_tree" @click="showStructure(props.row)"
                :label="`${props.row.pages.length} pages`" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Full Text Dialog -->
    <q-dialog v-model="showTextDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedPdf?.filename }} - Full Text Content</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showTextDialog = false" />
        </q-card-section>

        <q-card-section class="q-pt-none" style="max-height: 70vh; overflow-y: auto;">
          <div v-if="selectedPdf" class="q-mb-md">
            <q-chip icon="article" color="primary" text-color="white">
              {{ selectedPdf.wordCount.toLocaleString() }} words
            </q-chip>
            <q-chip icon="description" color="green" text-color="white">
              {{ selectedPdf.pages.length }} pages
            </q-chip>
            <q-chip icon="schedule" color="orange" text-color="white">
              ~{{ Math.ceil(selectedPdf.wordCount / 200) }} min read
            </q-chip>
          </div>

          <div class="text-body1 q-pa-md" style="white-space: pre-wrap; font-family: 'Roboto Mono', monospace;">
            {{ selectedPdf?.textContent }}
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Structure Dialog -->
    <q-dialog v-model="showStructureDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedPdf?.filename }} - Page Structure</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showStructureDialog = false" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="selectedPdf">
            <q-list separator>
              <q-item v-for="(page, index) in selectedPdf.pages" :key="index">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ index + 1 }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>Page {{ index + 1 }}</q-item-label>
                  <q-item-label caption>
                    {{ page.wordCount }} words | {{ page.content.length }} characters
                  </q-item-label>
                  <q-item-label class="q-mt-sm">
                    <div class="q-pa-sm rounded-borders" style="max-height: 100px; overflow-y: auto;">
                      {{ page.content.substring(0, 300) }}...
                    </div>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { advancedPdfTextExtractionService, type AdvancedPdfExtraction } from '../services/advanced-pdf-text-extraction-service';
import { pdfTextDatabaseService } from '../services/pdf-text-database-service';

interface ManifestFile {
  filename: string;
  path: string;
  size?: number;
}

interface ExtractedPdfData {
  filename: string;
  title: string;
  date: string;
  textContent: string;
  wordCount: number;
  characterCount: number;
  pages: Array<{
    pageNumber: number;
    content: string;
    wordCount: number;
  }>;
  metadata: {
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
    modifiedDate?: string;
  };
  extractedAt: string;
  processingTimeMs: number;
  articles?: Array<{
    title: string;
    content: string;
    wordCount: number;
  }>;
  topics?: string[];
}

interface ProcessingError {
  filename: string;
  error: string;
}

const $q = useQuasar();

// State
const availablePdfs = ref<string[]>([]);
const extractedData = ref<ExtractedPdfData[]>([]);
const isProcessing = ref(false);
const currentProcessingFile = ref<string>('');
const processedCount = ref(0);
const successCount = ref(0);
const errorCount = ref(0);
const errors = ref<ProcessingError[]>([]);

// Dialog state
const showTextDialog = ref(false);
const showStructureDialog = ref(false);
const selectedPdf = ref<ExtractedPdfData | null>(null);

// Computed values
const totalWords = computed(() =>
  extractedData.value.reduce((sum, pdf) => sum + pdf.wordCount, 0)
);

const totalPages = computed(() =>
  extractedData.value.reduce((sum, pdf) => sum + pdf.pages.length, 0)
);

const averageWordsPerPdf = computed(() =>
  extractedData.value.length > 0
    ? Math.round(totalWords.value / extractedData.value.length)
    : 0
);

// Table columns
const tableColumns = [
  {
    name: 'filename',
    label: 'Filename',
    field: 'filename',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'date',
    label: 'Date',
    field: 'date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'wordCount',
    label: 'Words',
    field: 'wordCount',
    align: 'right' as const,
    sortable: true,
    format: (val: number) => val.toLocaleString(),
  },
  {
    name: 'pages',
    label: 'Pages',
    field: (row: ExtractedPdfData) => row.pages.length,
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'processingTime',
    label: 'Processing Time',
    field: 'processingTimeMs',
    align: 'right' as const,
    sortable: true,
    format: (val: number) => `${val}ms`,
  },
  {
    name: 'preview',
    label: 'Text Preview',
    field: 'textContent',
    align: 'left' as const,
  },
  {
    name: 'structure',
    label: 'Structure',
    field: 'pages',
    align: 'center' as const,
  },
];

// Initialize
onMounted(async () => {
  await loadAvailablePdfs();
});

// Load available PDFs from manifest
async function loadAvailablePdfs() {
  try {
    const response = await fetch('/data/pdf-manifest.json');
    const manifest = await response.json() as { files: ManifestFile[]; generatedAt?: string };

    availablePdfs.value = manifest.files
      .filter((file: ManifestFile) => file.filename.endsWith('.pdf'))
      .map((file: ManifestFile) => file.filename);

    console.log(`[PDF Text Extraction] Found ${availablePdfs.value.length} PDFs to process`);
  } catch (error) {
    console.error('[PDF Text Extraction] Error loading PDF manifest:', error);
    $q.notify({
      type: 'negative',
      message: 'Error loading PDF manifest. Please ensure the manifest file exists.',
    });
  }
}

// Start extraction process
async function startExtraction() {
  if (availablePdfs.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'No PDFs found to process',
    });
    return;
  }

  isProcessing.value = true;
  extractedData.value = [];
  errors.value = [];
  processedCount.value = 0;
  successCount.value = 0;
  errorCount.value = 0;

  $q.notify({
    type: 'info',
    message: `Starting extraction of ${availablePdfs.value.length} PDFs`,
    timeout: 2000,
  });

  for (const filename of availablePdfs.value) {
    currentProcessingFile.value = filename;

    try {
      const startTime = Date.now();
      const extracted = await extractPdfText(filename);
      const processingTime = Date.now() - startTime;

      if (extracted) {
        extracted.processingTimeMs = processingTime;
        extractedData.value.push(extracted);
        successCount.value++;

        console.log(`[PDF Text Extraction] Successfully processed: ${filename} (${processingTime}ms)`);
      }
    } catch (error) {
      console.error(`[PDF Text Extraction] Error processing ${filename}:`, error);
      errors.value.push({
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      errorCount.value++;
    }

    processedCount.value++;
  }

  isProcessing.value = false;
  currentProcessingFile.value = '';

  $q.notify({
    type: 'positive',
    message: `Extraction complete! ${successCount.value} successful, ${errorCount.value} errors`,
    timeout: 3000,
  });
}

// Extract text from a single PDF using advanced service
async function extractPdfText(filename: string): Promise<ExtractedPdfData | null> {
  const pdfUrl = `/issues/${filename}`;

  try {
    // Use the advanced extraction service
    const advancedData = await advancedPdfTextExtractionService.extractAdvancedPdfData(pdfUrl, filename);

    // Convert to ExtractedPdfData format for display
    const extractedData: ExtractedPdfData = {
      filename: advancedData.filename,
      title: advancedData.title,
      date: advancedData.date,
      textContent: advancedData.cleanedText,
      wordCount: advancedData.totalWords,
      characterCount: advancedData.totalCharacters,
      pages: advancedData.pages.map(page => ({
        pageNumber: page.pageNumber,
        content: page.cleanedText,
        wordCount: page.wordCount,
      })),
      metadata: {
        ...(advancedData.metadata.author && { author: advancedData.metadata.author }),
        ...(advancedData.metadata.subject && { subject: advancedData.metadata.subject }),
        ...(advancedData.metadata.keywords && { keywords: advancedData.metadata.keywords.join(', ') }),
        ...(advancedData.metadata.creationDate && { creationDate: advancedData.metadata.creationDate }),
        ...(advancedData.metadata.modifiedDate && { modifiedDate: advancedData.metadata.modifiedDate }),
      },
      extractedAt: advancedData.extractedAt,
      processingTimeMs: advancedData.processingTimeMs,
      articles: advancedData.articles.map(article => ({
        title: article.title,
        content: article.content,
        wordCount: article.wordCount,
      })),
      topics: advancedData.topics,
    };

    return extractedData;
  } catch (error) {
    console.error(`[PDF Text Extraction] Failed to extract text from ${filename}:`, error);
    throw error;
  }
}

// Show full text dialog
function showFullText(pdf: ExtractedPdfData) {
  selectedPdf.value = pdf;
  showTextDialog.value = true;
}

// Show structure dialog
function showStructure(pdf: ExtractedPdfData) {
  selectedPdf.value = pdf;
  showStructureDialog.value = true;
}

// Export to JSON
function exportToJson() {
  const dataStr = JSON.stringify(extractedData.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `pdf-text-extraction-${new Date().toISOString().split('T')[0]}.json`;
  link.click();

  $q.notify({
    type: 'positive',
    message: 'JSON export downloaded successfully',
  });
}

// Export to CSV
function exportToCSV() {
  const headers = ['filename', 'title', 'date', 'wordCount', 'characterCount', 'pageCount', 'extractedAt', 'textContent'];
  const csvRows = [headers.join(',')];

  extractedData.value.forEach(pdf => {
    const row = [
      `"${pdf.filename}"`,
      `"${pdf.title}"`,
      `"${pdf.date}"`,
      pdf.wordCount.toString(),
      pdf.characterCount.toString(),
      pdf.pages.length.toString(),
      `"${pdf.extractedAt}"`,
      `"${pdf.textContent.replace(/"/g, '""')}"`, // Escape quotes in text
    ];
    csvRows.push(row.join(','));
  });

  const csvStr = csvRows.join('\n');
  const csvBlob = new Blob([csvStr], { type: 'text/csv' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(csvBlob);
  link.download = `pdf-text-extraction-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  $q.notify({
    type: 'positive',
    message: 'CSV export downloaded successfully',
  });
}

// Clear all data
function clearData() {
  $q.dialog({
    title: 'Confirm Clear',
    message: 'Are you sure you want to clear all extracted data? This action cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    extractedData.value = [];
    errors.value = [];
    processedCount.value = 0;
    successCount.value = 0;
    errorCount.value = 0;

    $q.notify({
      type: 'info',
      message: 'All data cleared',
    });
  });
}

// Save extracted data to database
async function saveToDatabase() {
  if (extractedData.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'No data to save',
    });
    return;
  }

  try {
    // Initialize database
    await pdfTextDatabaseService.initialize();

    let savedCount = 0;
    const totalCount = extractedData.value.length;

    $q.loading.show({
      message: `Saving ${totalCount} records to database...`,
    });

    for (const data of extractedData.value) {
      try {
        // Convert ExtractedPdfData to AdvancedPdfExtraction format
        const advancedData: AdvancedPdfExtraction = {
          filename: data.filename,
          title: data.title,
          date: data.date,
          rawText: data.textContent,
          cleanedText: data.textContent,
          structuredText: data.textContent,
          totalWords: data.wordCount,
          totalCharacters: data.characterCount,
          readingTimeMinutes: Math.ceil(data.wordCount / 200),
          pages: data.pages.map(page => ({
            ...page,
            rawText: page.content,
            cleanedText: page.content,
            hasImages: false,
            extractedImages: [],
          })),
          articles: data.articles?.map(article => ({
            ...article,
            pageNumbers: [1],
            startPosition: 0,
            endPosition: article.content.length,
          })) || [],
          sections: [],
          metadata: {
            ...(data.metadata.author && { author: data.metadata.author }),
            ...(data.metadata.subject && { subject: data.metadata.subject }),
            ...(data.metadata.keywords && { keywords: [data.metadata.keywords] }),
            ...(data.metadata.creationDate && { creationDate: data.metadata.creationDate }),
            ...(data.metadata.modifiedDate && { modifiedDate: data.metadata.modifiedDate }),
            pageCount: data.pages.length,
          },
          searchableTerms: [],
          keyPhrases: [],
          topics: data.topics || [],
          extractedAt: data.extractedAt,
          processingTimeMs: data.processingTimeMs,
          extractionVersion: '1.0.0',
        };

        await pdfTextDatabaseService.storePdfText(advancedData);
        savedCount++;
      } catch (error) {
        console.error(`Failed to save ${data.filename}:`, error);
      }
    }

    if ($q?.loading?.hide) {
      $q.loading.hide();
    }

    $q.notify({
      type: 'positive',
      message: `Successfully saved ${savedCount}/${totalCount} records to database`,
      timeout: 3000,
    });

  } catch (error) {
    if ($q?.loading?.hide) {
      $q.loading.hide();
    }
    console.error('Database save error:', error);
    $q.notify({
      type: 'negative',
      message: `Failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

// Show database statistics
async function showDatabaseStats() {
  try {
    // Only show loading if available
    if ($q?.loading?.show) {
      $q.loading.show({
        message: 'Loading database statistics...',
      });
    }

    await pdfTextDatabaseService.initialize();
    const stats = await pdfTextDatabaseService.getStats();

    if ($q?.loading?.hide) {
      $q.loading.hide();
    }

    $q.dialog({
      title: 'Database Statistics',
      message: `
        <div style="text-align: left;">
          <strong>Total Records:</strong> ${stats.totalRecords}<br>
          <strong>Total Words:</strong> ${stats.totalWords.toLocaleString()}<br>
          <strong>Total Characters:</strong> ${stats.totalCharacters.toLocaleString()}<br>
          <strong>Average Words/Record:</strong> ${stats.averageWordsPerRecord}<br>
          <strong>Oldest Record:</strong> ${stats.oldestRecord}<br>
          <strong>Newest Record:</strong> ${stats.newestRecord}<br><br>
          <strong>Top Topics:</strong><br>
          ${stats.topTopics.map(topic => `• ${topic.topic} (${topic.count})`).join('<br>')}
        </div>
      `,
      html: true,
      ok: 'Close',
    });

  } catch (error) {
    if ($q?.loading?.hide) {
      $q.loading.hide();
    }
    console.error('Database stats error:', error);
    $q.notify({
      type: 'negative',
      message: `Failed to load database statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
</script>

<style scoped>
.pdf-extraction-tool {
  max-width: 1200px;
  margin: 0 auto;
}

.text-body1 {
  line-height: 1.6;
}
</style>
