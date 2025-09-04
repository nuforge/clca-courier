<template>
  <div class="pdf-extraction-tool q-pa-md">
    <q-card>
      <q-card-section>
        <div class="text-h4 q-mb-sm">📄 PDF Text Extraction Tool</div>
        <div class="text-subtitle1">
          Extract text content and images from PDF newsletters for database storage
        </div>
      </q-card-section>

      <!-- File Selection Section -->
      <q-card-section>
        <div class="text-h6 q-mb-md">Available PDF Files ({{ availablePdfs.length }})</div>

        <div class="row q-gutter-md q-mb-md">
          <q-btn @click="selectAll" color="primary" icon="select_all" label="Select All" size="sm" />
          <q-btn @click="selectNone" color="grey" icon="deselect" label="Select None" size="sm" />
          <q-btn @click="selectRecent" color="blue" icon="schedule" label="Select Recent (10)" size="sm" />
          <q-space />
          <q-chip :label="`${selectedFiles.length} selected`" color="orange" text-color="white" />
        </div>

        <q-scroll-area style="height: 300px; border: 1px solid #ddd; border-radius: 4px;">
          <q-list separator>
            <q-item v-for="filename in availablePdfs" :key="filename" clickable @click="toggleFileSelection(filename)">
              <q-item-section avatar>
                <q-checkbox v-model="selectedFiles" :val="filename" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ filename }}</q-item-label>
                <q-item-label caption>
                  {{ getFileInfo(filename) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="picture_as_pdf" color="red" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-card-section>

      <!-- Action Buttons -->
      <q-card-actions class="q-pa-md">
        <div class="row q-gutter-md full-width">
          <div class="col-12 q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Processing Actions</div>
          </div>

          <q-btn @click="startTextExtraction" :loading="isProcessingText"
            :disable="selectedFiles.length === 0 || isProcessingText || isProcessingImages" color="primary"
            icon="article" label="Extract Text Only" class="col-12 col-md-3" />

          <q-btn @click="startImageExtraction" :loading="isProcessingImages"
            :disable="selectedFiles.length === 0 || isProcessingText || isProcessingImages" color="purple" icon="image"
            label="Extract Images Only" class="col-12 col-md-3" />

          <q-btn @click="startFullExtraction" :loading="isProcessingText || isProcessingImages"
            :disable="selectedFiles.length === 0 || isProcessingText || isProcessingImages" color="green"
            icon="auto_awesome" label="Extract Text + Images" class="col-12 col-md-3" />
        </div>

        <!-- Feature info -->
        <div class="row q-mt-sm">
          <div class="col-12">
            <q-chip color="blue" text-color="white" icon="speed" size="sm">
              ✨ Now with optimized thumbnails for faster processing
            </q-chip>
          </div>
        </div>

        <div class="row q-mt-md">
          <div class="col-12 col-md-3">
            <div class="text-subtitle2 q-mb-sm">Export Actions</div>
            <div class="row q-gutter-sm">
              <q-btn @click="exportToJson" :disable="extractedData.length === 0" color="blue" icon="download"
                label="JSON" size="sm" />
              <q-btn @click="exportToCSV" :disable="extractedData.length === 0" color="orange" icon="table_chart"
                label="CSV" size="sm" />
              <q-btn @click="saveToDatabase" :disable="extractedData.length === 0" color="cyan" icon="storage"
                label="Database" size="sm" />
            </div>
          </div>
        </div>
      </q-card-actions>

      <!-- Progress Section -->
      <q-card-section v-if="isProcessingText || isProcessingImages || extractedData.length > 0">
        <div class="text-h6 q-mb-md">Processing Progress</div>

        <div class="row q-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-circular-progress :value="selectedFiles.length > 0 ? (processedCount / selectedFiles.length) * 100 : 0"
              size="80px" :thickness="0.15" color="primary" track-color="grey-3" class="q-ma-md">
              {{ processedCount }}/{{ selectedFiles.length }}
            </q-circular-progress>
          </div>
          <div class="col-12 col-md-8">
            <q-linear-progress :value="selectedFiles.length > 0 ? (processedCount / selectedFiles.length) : 0"
              size="20px" color="primary" class="q-mb-sm" />
            <div v-if="currentProcessingFile" class="text-body2">
              Currently processing: <strong>{{ currentProcessingFile }}</strong>
            </div>
            <div class="text-caption">
              {{ successCount }} successful, {{ errorCount }} errors
              <span v-if="isProcessingText">(Text Extraction)</span>
              <span v-if="isProcessingImages">(Image Extraction)</span>
            </div>
          </div>
        </div>

        <!-- Error List -->
        <div v-if="errors.length > 0" class="q-mt-md">
          <q-expansion-item icon="error" :label="`Processing Errors (${errors.length})`" header-class="text-negative">
            <q-list separator>
              <q-item v-for="error in errors" :key="error.filename + error.type">
                <q-item-section avatar>
                  <q-icon name="error" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ error.filename }}</q-item-label>
                  <q-item-label caption>{{ error.type }}: {{ error.error }}</q-item-label>
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

          <template v-slot:body-cell-images="props">
            <q-td :props="props">
              <div class="text-center">
                <div class="text-body2">
                  {{ props.value || 0 }}
                </div>
                <q-btn v-if="props.value > 0" flat dense size="sm" icon="image" @click="showImages(props.row)"
                  :label="`View ${props.value} images`" />
                <div v-else class="text-grey-5 text-caption">No images</div>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Full Text Dialog -->
    <q-dialog v-model="showTextDialog" maximized position="standard">
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedPdf?.filename }} - Full Text Content</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showTextDialog = false" color="grey-8" size="md" />
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

          <!-- Page-by-page text content -->
          <div v-if="selectedPdf?.pages">
            <q-expansion-item v-for="(page, pageIndex) in selectedPdf.pages" :key="pageIndex"
              :label="`Page ${page.pageNumber} (${page.wordCount} words)`"
              :caption="`${page.content.substring(0, 100)}...`" class="q-mb-sm">
              <q-card>
                <q-card-section>
                  <div class="text-body1 q-pa-md"
                    style="white-space: pre-wrap; font-family: 'Roboto Mono', monospace; border-radius: 4px;">
                    {{ page.content }}
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>

          <!-- Fallback for combined text content -->
          <div v-else class="text-body1 q-pa-md" style="white-space: pre-wrap; font-family: 'Roboto Mono', monospace;">
            {{ selectedPdf?.textContent }}
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Structure Dialog -->
    <q-dialog v-model="showStructureDialog" maximized position="standard">
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedPdf?.filename }} - Page Structure</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showStructureDialog = false" color="grey-8" size="md" />
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

    <!-- Images Dialog -->
    <q-dialog v-model="showImagesDialog" maximized position="standard">
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedPdf?.filename }} - Extracted Images</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showImagesDialog = false" color="grey-8" size="md" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="selectedPdf">
            <div class="text-subtitle1 q-mb-md">
              Total Images Found: {{selectedPdf.pages.reduce((count, page) => count +
                page.extractedImages.length,
                0)
              }}
            </div>

            <div v-for="(page, pageIndex) in selectedPdf.pages" :key="pageIndex" class="q-mb-xl">
              <div v-if="page.extractedImages.length > 0">
                <q-separator class="q-mb-md" />
                <div class="text-h6 q-mb-md">
                  <q-icon name="article" class="q-mr-sm" />
                  Page {{ page.pageNumber }} - {{ page.extractedImages.length }} image(s)
                </div>

                <div class="row q-gutter-md">
                  <div v-for="(image, imageIndex) in page.extractedImages" :key="imageIndex"
                    class="col-12 col-md-6 col-lg-4">
                    <q-card flat bordered>
                      <q-card-section class="text-center">
                        <div class="text-subtitle2 q-mb-sm">
                          Image {{ imageIndex + 1 }}
                        </div>
                        <img :src="image.thumbnail" :alt="image.description || 'Extracted image'"
                          style="max-width: 100%; max-height: 300px; border-radius: 4px;" class="q-mb-sm" />
                        <div class="text-caption text-grey-7">
                          <div>Size: {{ Math.round(image.position.width) }} × {{
                            Math.round(image.position.height) }} px
                          </div>
                          <div>Format: {{ image.format.toUpperCase() }}</div>
                          <div>Data Size: {{ (image.size / 1024).toFixed(1) }} KB</div>
                          <div v-if="image.description" class="q-mt-xs">{{ image.description
                          }}</div>
                        </div>
                        <q-btn flat size="sm" icon="download" label="Download"
                          @click="downloadImage(image, pageIndex, imageIndex)" class="q-mt-sm" />
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedPdf.pages.every(page => page.extractedImages.length === 0)" class="text-center q-py-xl">
              <q-icon name="image_not_supported" size="64px" class="text-grey-5" />
              <div class="text-h6 text-grey-6 q-mt-md">No Images Found</div>
              <div class="text-body2 text-grey-5">
                This PDF doesn't contain any significant images that meet our extraction criteria.
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
    hasImages: boolean;
    extractedImages: Array<{
      pageNumber: number;
      position: { x: number; y: number; width: number; height: number };
      description?: string;
      thumbnail: string;
      size: number;
      format: string;
      isSignificant: boolean;
    }>;
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
  type: 'text' | 'image'; // Added type to distinguish error types
}

const $q = useQuasar();

// State
const availablePdfs = ref<string[]>([]);
const selectedFiles = ref<string[]>([]);
const extractedData = ref<ExtractedPdfData[]>([]);
const isProcessingText = ref(false);
const isProcessingImages = ref(false);
const currentProcessingFile = ref<string>('');
const processedCount = ref(0);
const successCount = ref(0);
const errorCount = ref(0);
const errors = ref<ProcessingError[]>([]);

// Dialog state
const showTextDialog = ref(false);
const showStructureDialog = ref(false);
const showImagesDialog = ref(false);
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
    name: 'images',
    label: 'Images',
    field: (row: ExtractedPdfData) => {
      const totalImages = row.pages.reduce((count, page) => count + page.extractedImages.length, 0);
      return totalImages;
    },
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

// File selection functions
function selectAll() {
  selectedFiles.value = [...availablePdfs.value];
}

function selectNone() {
  selectedFiles.value = [];
}

function selectRecent() {
  // Select the 10 most recent files (assuming they're sorted by date)
  const sortedFiles = [...availablePdfs.value].sort().reverse();
  selectedFiles.value = sortedFiles.slice(0, 10);
}

function toggleFileSelection(filename: string) {
  const index = selectedFiles.value.indexOf(filename);
  if (index >= 0) {
    selectedFiles.value.splice(index, 1);
  } else {
    selectedFiles.value.push(filename);
  }
}

function getFileInfo(filename: string): string {
  // Extract date from filename
  const dateMatch = filename.match(/(\d{4})\.(\d{2}|\w+)/);
  if (dateMatch) {
    return `Date: ${dateMatch[0]}`;
  }
  return 'PDF Document';
}

// Processing functions
async function startTextExtraction() {
  await processFiles('text');
}

async function startImageExtraction() {
  await processFiles('images');
}

async function startFullExtraction() {
  await processFiles('both');
}

async function processFiles(mode: 'text' | 'images' | 'both') {
  if (selectedFiles.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'No files selected for processing',
    });
    return;
  }

  // Set processing state
  if (mode === 'text' || mode === 'both') {
    isProcessingText.value = true;
  }
  if (mode === 'images' || mode === 'both') {
    isProcessingImages.value = true;
  }

  // Reset counters
  processedCount.value = 0;
  successCount.value = 0;
  errorCount.value = 0;
  errors.value = [];

  $q.notify({
    type: 'info',
    message: `Starting ${mode} extraction of ${selectedFiles.value.length} PDFs`,
    timeout: 2000,
  });

  for (const filename of selectedFiles.value) {
    currentProcessingFile.value = filename;

    try {
      const startTime = Date.now();

      if (mode === 'text') {
        const extracted = await extractPdfTextOnly(filename);
        if (extracted) {
          extracted.processingTimeMs = Date.now() - startTime;
          updateOrAddPdfData(extracted);
          successCount.value++;
        }
      } else if (mode === 'images') {
        const extracted = await extractPdfImagesOnly(filename);
        if (extracted) {
          extracted.processingTimeMs = Date.now() - startTime;
          updateOrAddPdfData(extracted);
          successCount.value++;
        }
      } else if (mode === 'both') {
        const extracted = await extractPdfText(filename);
        if (extracted) {
          extracted.processingTimeMs = Date.now() - startTime;
          updateOrAddPdfData(extracted);
          successCount.value++;
        }
      }

      console.log(`[PDF Processing] Successfully processed: ${filename} (${mode})`);
    } catch (error) {
      console.error(`[PDF Processing] Error processing ${filename} (${mode}):`, error);
      errors.value.push({
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: mode === 'text' ? 'text' : 'image',
      });
      errorCount.value++;
    }

    processedCount.value++;
  }

  // Reset processing state
  isProcessingText.value = false;
  isProcessingImages.value = false;
  currentProcessingFile.value = '';

  $q.notify({
    type: 'positive',
    message: `${mode} extraction complete! ${successCount.value} successful, ${errorCount.value} errors`,
    timeout: 3000,
  });
}

// Helper function to update or add PDF data
function updateOrAddPdfData(newData: ExtractedPdfData) {
  const existingIndex = extractedData.value.findIndex(item => item.filename === newData.filename);
  if (existingIndex >= 0) {
    // Merge data additively instead of replacing
    const existing = extractedData.value[existingIndex];
    if (existing) {
      extractedData.value[existingIndex] = {
        ...existing,
        ...newData,
        // Merge text content if both exist
        textContent: newData.textContent || existing.textContent,
        wordCount: Math.max(newData.wordCount, existing.wordCount),
        characterCount: Math.max(newData.characterCount, existing.characterCount),
        // Merge pages data additively
        pages: newData.pages.map((newPage, index) => {
          const existingPage = existing.pages[index];
          if (existingPage) {
            return {
              ...existingPage,
              ...newPage,
              // Keep text content if either exists
              content: newPage.content || existingPage.content,
              wordCount: Math.max(newPage.wordCount, existingPage.wordCount),
              // Combine images from both extractions
              hasImages: newPage.hasImages || existingPage.hasImages,
              extractedImages: [
                ...existingPage.extractedImages,
                ...newPage.extractedImages.filter(newImg =>
                  !existingPage.extractedImages.some(existingImg =>
                    existingImg.pageNumber === newImg.pageNumber &&
                    existingImg.format === newImg.format &&
                    existingImg.thumbnail === newImg.thumbnail
                  )
                )
              ]
            };
          }
          return newPage;
        }),
        // Keep the latest extraction timestamp
        extractedAt: newData.extractedAt,
      };
    }
  } else {
    extractedData.value.push(newData);
  }
}

// Initialize
onMounted(async () => {
  await loadAvailablePdfs();

  // Add keyboard shortcuts for closing dialogs
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showImagesDialog.value) {
        showImagesDialog.value = false;
      } else if (showStructureDialog.value) {
        showStructureDialog.value = false;
      } else if (showTextDialog.value) {
        showTextDialog.value = false;
      }
    }
  };

  // Listen for keyboard events
  window.addEventListener('keydown', handleKeyDown);

  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
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

// Extract PDF text using the advanced service
async function extractPdfText(filename: string): Promise<ExtractedPdfData | null> {
  try {
    const pdfUrl = `/issues/${filename}`;
    // Pass options for full extraction (both text and images)
    const advancedExtraction = await advancedPdfTextExtractionService.extractAdvancedPdfData(pdfUrl, filename, {
      extractText: true,
      extractImages: true,
      extractArticles: true,
      extractTopics: true,
      generateThumbnails: true,
      thumbnailMaxSize: 200
    });

    return {
      filename: advancedExtraction.filename,
      title: advancedExtraction.title,
      date: advancedExtraction.date,
      textContent: advancedExtraction.cleanedText || '',
      wordCount: advancedExtraction.totalWords || 0,
      characterCount: advancedExtraction.totalCharacters || 0,
      pages: advancedExtraction.pages.map(page => ({
        pageNumber: page.pageNumber,
        content: page.cleanedText,
        wordCount: page.wordCount,
        hasImages: page.hasImages,
        extractedImages: page.extractedImages,
      })),
      metadata: {
        ...(advancedExtraction.metadata.author && { author: advancedExtraction.metadata.author }),
        ...(advancedExtraction.metadata.subject && { subject: advancedExtraction.metadata.subject }),
        ...(advancedExtraction.metadata.keywords && { keywords: advancedExtraction.metadata.keywords.join(', ') }),
        ...(advancedExtraction.metadata.creationDate && { creationDate: advancedExtraction.metadata.creationDate }),
        ...(advancedExtraction.metadata.modifiedDate && { modifiedDate: advancedExtraction.metadata.modifiedDate }),
      },
      extractedAt: advancedExtraction.extractedAt,
      processingTimeMs: advancedExtraction.processingTimeMs,
      articles: advancedExtraction.articles?.map(article => ({
        title: article.title,
        content: article.content,
        wordCount: article.wordCount,
      })),
      topics: advancedExtraction.topics,
    };
  } catch (error) {
    console.error(`Error extracting text from ${filename}:`, error);
    throw error;
  }
}

// Extract PDF text only (without image processing)
async function extractPdfTextOnly(filename: string): Promise<ExtractedPdfData | null> {
  try {
    const pdfUrl = `/issues/${filename}`;
    // Pass options to extract text only, skip images
    const advancedExtraction = await advancedPdfTextExtractionService.extractAdvancedPdfData(pdfUrl, filename, {
      extractText: true,
      extractImages: false,
      extractArticles: true,
      extractTopics: true,
      generateThumbnails: false // Skip thumbnails for text-only extraction
    });

    return {
      filename: advancedExtraction.filename,
      title: advancedExtraction.title,
      date: advancedExtraction.date,
      textContent: advancedExtraction.cleanedText || '',
      wordCount: advancedExtraction.totalWords || 0,
      characterCount: advancedExtraction.totalCharacters || 0,
      pages: advancedExtraction.pages.map(page => ({
        pageNumber: page.pageNumber,
        content: page.cleanedText,
        wordCount: page.wordCount,
        hasImages: page.hasImages, // Keep the actual image status from extraction
        extractedImages: page.extractedImages, // Keep any images that were found
      })),
      metadata: {
        ...(advancedExtraction.metadata.author && { author: advancedExtraction.metadata.author }),
        ...(advancedExtraction.metadata.subject && { subject: advancedExtraction.metadata.subject }),
        ...(advancedExtraction.metadata.keywords && { keywords: advancedExtraction.metadata.keywords.join(', ') }),
        ...(advancedExtraction.metadata.creationDate && { creationDate: advancedExtraction.metadata.creationDate }),
        ...(advancedExtraction.metadata.modifiedDate && { modifiedDate: advancedExtraction.metadata.modifiedDate }),
      },
      extractedAt: advancedExtraction.extractedAt,
      processingTimeMs: advancedExtraction.processingTimeMs,
      articles: advancedExtraction.articles?.map(article => ({
        title: article.title,
        content: article.content,
        wordCount: article.wordCount,
      })),
      topics: advancedExtraction.topics,
    };
  } catch (error) {
    console.error(`Error extracting text from ${filename}:`, error);
    throw error;
  }
}

// Extract PDF images only (minimal text processing)
async function extractPdfImagesOnly(filename: string): Promise<ExtractedPdfData | null> {
  try {
    const pdfUrl = `/issues/${filename}`;
    // Pass options to extract images only, skip text processing
    const advancedExtraction = await advancedPdfTextExtractionService.extractAdvancedPdfData(pdfUrl, filename, {
      extractText: false,
      extractImages: true,
      extractArticles: false,
      extractTopics: false,
      generateThumbnails: true, // Enable thumbnails for image extraction
      thumbnailMaxSize: 150 // Smaller thumbnails for faster processing
    });

    return {
      filename: advancedExtraction.filename,
      title: advancedExtraction.title,
      date: advancedExtraction.date,
      textContent: '', // Minimal text for images-only extraction
      wordCount: 0, // No word count for images-only
      characterCount: 0, // No character count for images-only
      pages: advancedExtraction.pages.map(page => ({
        pageNumber: page.pageNumber,
        content: '', // No content for images-only extraction
        wordCount: 0, // No word count for images-only
        hasImages: page.hasImages,
        extractedImages: page.extractedImages, // Keep all extracted images
      })),
      metadata: {
        ...(advancedExtraction.metadata.author && { author: advancedExtraction.metadata.author }),
        ...(advancedExtraction.metadata.subject && { subject: advancedExtraction.metadata.subject }),
        ...(advancedExtraction.metadata.keywords && { keywords: advancedExtraction.metadata.keywords.join(', ') }),
        ...(advancedExtraction.metadata.creationDate && { creationDate: advancedExtraction.metadata.creationDate }),
        ...(advancedExtraction.metadata.modifiedDate && { modifiedDate: advancedExtraction.metadata.modifiedDate }),
      },
      extractedAt: advancedExtraction.extractedAt,
      processingTimeMs: advancedExtraction.processingTimeMs,
      articles: [], // No articles for images-only extraction
      topics: [], // No topics for images-only extraction
    };
  } catch (error) {
    console.error(`Error extracting images from ${filename}:`, error);
    throw error;
  }
}

// Dialog functions
function showFullText(pdf: ExtractedPdfData) {
  selectedPdf.value = pdf;
  showTextDialog.value = true;
}

function showStructure(pdf: ExtractedPdfData) {
  selectedPdf.value = pdf;
  showStructureDialog.value = true;
}

function showImages(pdf: ExtractedPdfData) {
  selectedPdf.value = pdf;
  showImagesDialog.value = true;
}

// Download image function
function downloadImage(
  image: { thumbnail: string; fullSize?: string;[key: string]: unknown },
  pageIndex: number,
  imageIndex: number
) {
  try {
    // Use fullSize if available, otherwise fallback to thumbnail
    const imageDataUrl: string = image.fullSize || image.thumbnail;

    // Determine actual format from image data URL
    let actualFormat = 'png'; // default
    if (imageDataUrl.includes('data:image/jpeg')) {
      actualFormat = 'jpg';
    } else if (imageDataUrl.includes('data:image/png')) {
      actualFormat = 'png';
    } else if (imageDataUrl.includes('data:image/webp')) {
      actualFormat = 'webp';
    }

    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `${selectedPdf.value?.filename || 'pdf'}-page${pageIndex + 1}-image${imageIndex + 1}.${actualFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    $q.notify({
      type: 'positive',
      message: `${image.fullSize ? 'Full-size' : 'Thumbnail'} image downloaded successfully`,
      timeout: 2000,
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    $q.notify({
      type: 'negative',
      message: 'Error downloading image',
    });
  }
}

// Export functions
function exportToJson() {
  try {
    const jsonData = JSON.stringify(extractedData.value, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pdf-extraction-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    $q.notify({
      type: 'positive',
      message: 'JSON export completed successfully',
      timeout: 3000,
    });
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    $q.notify({
      type: 'negative',
      message: 'Error exporting to JSON',
    });
  }
}

function exportToCSV() {
  try {
    const headers = ['filename', 'title', 'date', 'wordCount', 'pages', 'extractedAt'];
    const csvContent = [
      headers.join(','),
      ...extractedData.value.map(pdf =>
        headers.map(header => {
          const value = header === 'pages'
            ? pdf.pages.length
            : header === 'wordCount'
              ? pdf.wordCount
              : header === 'filename'
                ? pdf.filename
                : header === 'title'
                  ? pdf.title
                  : header === 'date'
                    ? pdf.date
                    : header === 'extractedAt'
                      ? pdf.extractedAt
                      : '';
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pdf-extraction-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    $q.notify({
      type: 'positive',
      message: 'CSV export completed successfully',
      timeout: 3000,
    });
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    $q.notify({
      type: 'negative',
      message: 'Error exporting to CSV',
    });
  }
}

async function saveToDatabase() {
  try {
    let savedCount = 0;
    let errorCount = 0;

    for (const pdf of extractedData.value) {
      try {
        // Convert our ExtractedPdfData back to AdvancedPdfExtraction format
        const advancedFormat: AdvancedPdfExtraction = {
          filename: pdf.filename,
          title: pdf.title,
          date: pdf.date,
          rawText: pdf.textContent, // Use cleaned text as raw text
          cleanedText: pdf.textContent,
          structuredText: pdf.textContent,
          totalWords: pdf.wordCount,
          totalCharacters: pdf.characterCount,
          readingTimeMinutes: Math.ceil(pdf.wordCount / 200),
          pages: pdf.pages.map(page => ({
            pageNumber: page.pageNumber,
            rawText: page.content,
            cleanedText: page.content,
            wordCount: page.wordCount,
            hasImages: page.hasImages,
            extractedImages: page.extractedImages.map(img => ({
              ...img,
              fullSize: (img as { fullSize?: string }).fullSize || img.thumbnail // Fallback for existing data
            })),
          })),
          articles: (pdf.articles || []).map(article => ({
            title: article.title,
            content: article.content,
            pageNumbers: [1], // Default to page 1
            startPosition: 0,
            endPosition: article.content.length,
            wordCount: article.wordCount,
          })),
          sections: [],
          metadata: {
            ...(pdf.metadata.author && { author: pdf.metadata.author }),
            ...(pdf.metadata.subject && { subject: pdf.metadata.subject }),
            ...(pdf.metadata.keywords && { keywords: pdf.metadata.keywords.split(', ') }),
            ...(pdf.metadata.creationDate && { creationDate: pdf.metadata.creationDate }),
            ...(pdf.metadata.modifiedDate && { modifiedDate: pdf.metadata.modifiedDate }),
            pageCount: pdf.pages.length,
          },
          searchableTerms: [],
          keyPhrases: [],
          topics: pdf.topics || [],
          extractedAt: pdf.extractedAt,
          processingTimeMs: pdf.processingTimeMs,
          extractionVersion: '1.0.0',
        };

        await pdfTextDatabaseService.storePdfText(advancedFormat);
        savedCount++;
      } catch (error) {
        console.error(`Error saving ${pdf.filename} to database:`, error);
        errorCount++;
      }
    }

    $q.notify({
      type: savedCount > 0 ? 'positive' : 'negative',
      message: `Database save completed: ${savedCount} successful, ${errorCount} errors`,
      timeout: 3000,
    });
  } catch (error) {
    console.error('Error saving to database:', error);
    $q.notify({
      type: 'negative',
      message: 'Error saving to database',
    });
  }
}
</script>
