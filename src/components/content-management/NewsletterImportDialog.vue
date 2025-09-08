<!--
  Newsletter Import Dialog
  Handles PDF file selection, processing, and Firebase upload
-->
<template>
  <q-dialog v-model="dialogModel" @hide="resetDialog" persistent>
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Import Newsletter PDFs</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="q-mb-md">
          <p class="text-body2">
            Select PDF files to import. Each file will be processed for text extraction,
            thumbnail generation, and uploaded to Firebase.
          </p>
        </div>

        <!-- File Selection -->
        <div class="q-mb-lg">
          <q-file v-model="selectedFiles" multiple accept=".pdf" @update:model-value="handleFileSelection"
            class="q-mb-md">
            <template v-slot:prepend>
              <q-icon name="mdi-file-pdf-box" />
            </template>
            <template v-slot:hint>
              Select PDF files (max 50MB each)
            </template>
          </q-file>

          <!-- File List -->
          <div v-if="fileList.length > 0" class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Selected Files:</div>
            <q-list dense>
              <q-item v-for="file in fileList" :key="file.id" class="q-pa-sm">
                <q-item-section avatar>
                  <q-icon :name="getFileStatusIcon(file)" :color="getFileStatusColor(file)" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ file.name }}</q-item-label>
                  <q-item-label caption>
                    {{ formatFileSize(file.size) }} • {{ file.status }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side v-if="file.status === 'processing'">
                  <q-circular-progress :value="file.progress" size="md" :thickness="0.22" color="primary" />
                </q-item-section>

                <q-item-section side v-else-if="file.status === 'ready'">
                  <q-btn icon="mdi-close" size="sm" flat round @click="removeFile(file.id)" />
                </q-item-section>

                <q-item-section side v-else-if="file.status === 'error'">
                  <q-tooltip>{{ file.error }}</q-tooltip>
                  <q-btn icon="mdi-close" size="sm" flat round @click="removeFile(file.id)" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>

        <!-- Processing Summary -->
        <div v-if="processingStats.total > 0" class="q-mb-md">
          <q-linear-progress :value="processingStats.completed / processingStats.total" size="lg" color="primary"
            class="q-mb-sm" />
          <div class="text-caption text-center">
            {{ processingStats.completed }}/{{ processingStats.total }} files processed
            <span v-if="processingStats.errors > 0" class="text-negative">
              ({{ processingStats.errors }} errors)
            </span>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="dialogModel = false" :disable="isProcessing" />
        <q-btn color="primary" label="Import Files" @click="processAndUploadFiles" :loading="isProcessing"
          :disable="fileList.length === 0 || fileList.every(f => f.status !== 'ready')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { firebaseNewsletterService } from '../../services/firebase-newsletter.service';
import { firestoreService, type NewsletterMetadata } from '../../services/firebase-firestore.service';
import { firebaseStorageService } from '../../services/firebase-storage.service';
import { dateManagementService } from '../../services/date-management.service';
import { pdfMetadataService } from '../../services/pdf-metadata-service';
import { logger } from '../../utils/logger';

interface FileItem {
  id: string;
  name: string;
  size: number;
  file: File;
  status: 'ready' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'imported', count: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

// Local state
const selectedFiles = ref<File[] | null>(null);
const fileList = ref<FileItem[]>([]);
const isProcessing = ref(false);

// Dialog model
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

// Processing statistics
const processingStats = computed(() => ({
  total: fileList.value.length,
  completed: fileList.value.filter(f => f.status === 'completed').length,
  processing: fileList.value.filter(f => f.status === 'processing').length,
  errors: fileList.value.filter(f => f.status === 'error').length
}));

// File handling
function handleFileSelection(files: File[] | null): void {
  if (!files) return;

  // Validate files
  const validFiles = files.filter(file => {
    if (file.type !== 'application/pdf') {
      $q.notify({
        type: 'warning',
        message: `${file.name} is not a PDF file`,
      });
      return false;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      $q.notify({
        type: 'warning',
        message: `${file.name} is too large (max 50MB)`,
      });
      return false;
    }

    return true;
  });

  // Add to file list
  const newFiles: FileItem[] = validFiles.map(file => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    file,
    status: 'ready',
    progress: 0
  }));

  fileList.value.push(...newFiles);
  selectedFiles.value = null; // Reset file input
}

function removeFile(id: string): void {
  fileList.value = fileList.value.filter(f => f.id !== id);
}

function resetDialog(): void {
  selectedFiles.value = null;
  fileList.value = [];
  isProcessing.value = false;
}

// File processing
async function processAndUploadFiles(): Promise<void> {
  if (fileList.value.length === 0) return;

  isProcessing.value = true;
  let successCount = 0;

  try {
    logger.info(`Starting import of ${fileList.value.length} files...`);

    for (const fileItem of fileList.value) {
      if (fileItem.status !== 'ready') continue;

      try {
        fileItem.status = 'processing';
        fileItem.progress = 0;

        await processFile(fileItem);

        fileItem.status = 'completed';
        fileItem.progress = 100;
        successCount++;

      } catch (error) {
        fileItem.status = 'error';
        fileItem.error = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to process ${fileItem.name}:`, error);
      }
    }

    // Show results
    if (successCount > 0) {
      $q.notify({
        type: 'positive',
        message: `Successfully imported ${successCount} newsletter${successCount > 1 ? 's' : ''}`,
      });
      emit('imported', successCount);
    }

    if (processingStats.value.errors > 0) {
      $q.notify({
        type: 'warning',
        message: `${processingStats.value.errors} file${processingStats.value.errors > 1 ? 's' : ''} failed to import`,
      });
    }

  } finally {
    isProcessing.value = false;
  }
}

async function processFile(fileItem: FileItem): Promise<void> {
  try {
    // Step 1: Extract comprehensive metadata using the full PDF metadata service
    fileItem.progress = 10;
    logger.info(`Starting comprehensive processing for ${fileItem.name}`);

    // Create blob URL for the PDF metadata service
    const blobUrl = URL.createObjectURL(fileItem.file);
    let comprehensiveMetadata;

    try {
      comprehensiveMetadata = await pdfMetadataService.extractPDFMetadata(blobUrl, fileItem.name);
    } finally {
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    }

    // If comprehensive extraction fails, fall back to basic extraction
    if (!comprehensiveMetadata) {
      logger.warn(`Comprehensive metadata extraction failed for ${fileItem.name}, using basic extraction`);
      comprehensiveMetadata = {
        filename: fileItem.name,
        title: fileItem.name.replace(/\.pdf$/i, ''),
        description: '',
        textContent: await extractTextFromPDF(fileItem.file),
        searchableText: '', // Will be derived from textContent
        pageCount: 0, // Will be extracted
        keywords: [],
        thumbnailDataUrl: '', // Will be generated
        year: new Date().getFullYear(),
        displayDate: new Date().getFullYear().toString(),
        fileSize: fileItem.size
      };

      // Extract page count manually
      try {
        const pdfjsLib = await import('pdfjs-dist');
        const arrayBuffer = await fileItem.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        comprehensiveMetadata.pageCount = pdf.numPages;
      } catch (error) {
        logger.warn(`Could not extract page count for ${fileItem.name}:`, error);
      }

      // Generate searchable text from content
      if (comprehensiveMetadata.textContent) {
        comprehensiveMetadata.searchableText = comprehensiveMetadata.textContent
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Generate thumbnail
      const thumbnailBlob = await generateThumbnailFromPDF(fileItem.file);
      if (thumbnailBlob) {
        comprehensiveMetadata.thumbnailDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(thumbnailBlob);
        });
      }
    }

    fileItem.progress = 30;

    // Step 2: Parse and format dates (handle season-to-month conversion)
    const parsedDate = dateManagementService.parseFilenameDate(fileItem.name);
    if (parsedDate) {
      logger.info(`Parsed date for ${fileItem.name}:`, parsedDate);
    }
    fileItem.progress = 40;

    // Step 3: Check if PDF already exists in Firebase (both Firestore AND Storage)
    const existingId = await firestoreService.findNewsletterIdByFilename(fileItem.name);
    const isUpdate = !!existingId;

    // Check if file exists in Storage
    const storagePath = `newsletters/${fileItem.name}`;
    const fileExistsInStorage = await firebaseStorageService.fileExists(storagePath);

    if (isUpdate) {
      logger.info(`Found existing newsletter in Firebase: ${existingId}, will update metadata only`);
    } else {
      logger.info(`Newsletter ${fileItem.name} not found in Firebase, will create new`);
    }

    if (fileExistsInStorage) {
      logger.info(`File ${fileItem.name} already exists in Storage, will not re-upload`);
    } else {
      logger.info(`File ${fileItem.name} not found in Storage, will upload`);
    }
    fileItem.progress = 50;

    // Step 4: Prepare comprehensive metadata for Firebase
    const firebaseMetadata: Partial<NewsletterMetadata> = {
      filename: fileItem.name,
      title: comprehensiveMetadata.title || fileItem.name.replace(/\.pdf$/i, ''),
      description: '', // PDFMetadata doesn't have description, using empty

      // Date information (with season-to-month conversion)
      year: parsedDate?.year || new Date().getFullYear(),
      ...(parsedDate?.month && { month: parsedDate.month }),
      ...(parsedDate?.season && { season: parsedDate.season }),
      publicationDate: parsedDate?.publicationDate || new Date().toISOString(),
      displayDate: parsedDate?.displayDate || `${parsedDate?.year || new Date().getFullYear()}`,
      sortValue: parsedDate?.sortValue || 0,

      // Extracted content and metadata (map PDFMetadata properties correctly)
      pageCount: comprehensiveMetadata.pages || 0, // PDFMetadata uses 'pages', not 'pageCount'
      fileSize: fileItem.size,
      searchableText: comprehensiveMetadata.searchableText || '',

      // Storage information (will be updated by upload)
      downloadUrl: '', // Will be set by Firebase upload
      storageRef: '', // Will be set by Firebase upload
      ...(comprehensiveMetadata.thumbnailDataUrl && { thumbnailUrl: comprehensiveMetadata.thumbnailDataUrl }),

      // Publication settings
      isPublished: true,
      featured: false,
      tags: ['imported', 'pdf', ...(comprehensiveMetadata.searchableText ? ['searchable'] : []), ...(comprehensiveMetadata.keywords || [])],

      // System fields will be set by Firebase service automatically
    };

    fileItem.progress = 70;

    // Step 5: Upload/Update in Firebase
    if (isUpdate) {
      // UPDATE existing newsletter
      logger.info(`Updating existing newsletter ${existingId} with comprehensive metadata`);

      // Get existing data to check if we have a downloadUrl
      const existingData = await firestoreService.getNewsletterMetadata(existingId);

      // Only upload file if it doesn't exist in Storage
      if (!fileExistsInStorage) {
        logger.info(`File ${fileItem.name} not in Storage, uploading...`);
        const progressCallback = (progress: { percentage: number }): void => {
          fileItem.progress = 70 + (progress.percentage * 0.25); // 70-95% for upload
        };

        const uploadResult = await firebaseNewsletterService.uploadNewsletter(
          fileItem.file,
          {
            title: firebaseMetadata.title!,
            publicationDate: firebaseMetadata.publicationDate!,
            year: firebaseMetadata.year!,
            ...(firebaseMetadata.season && { season: firebaseMetadata.season }),
            tags: firebaseMetadata.tags || [],
            featured: firebaseMetadata.featured || false
          },
          progressCallback
        );

        // Update metadata with storage information
        firebaseMetadata.downloadUrl = uploadResult;
      } else {
        // File exists in storage, just use existing downloadUrl or generate it
        if (existingData?.downloadUrl) {
          firebaseMetadata.downloadUrl = existingData.downloadUrl;
          logger.info(`Using existing downloadUrl for ${fileItem.name}`);
        } else {
          // Generate downloadUrl from storage path
          firebaseMetadata.downloadUrl = await firebaseStorageService.getDownloadUrl(storagePath);
          logger.info(`Generated downloadUrl from storage path for ${fileItem.name}`);
        }
        fileItem.progress = 95; // Skip upload progress
      }

      // Update with comprehensive metadata
      await firestoreService.updateNewsletterMetadata(existingId, firebaseMetadata);
      logger.success(`Successfully updated newsletter ${existingId} with comprehensive metadata`);

    } else {
      // CREATE new newsletter
      logger.info(`Creating new newsletter with comprehensive metadata`);

      // Only upload file if it doesn't exist in Storage
      if (!fileExistsInStorage) {
        logger.info(`File ${fileItem.name} not in Storage, uploading...`);
        const progressCallback = (progress: { percentage: number }): void => {
          fileItem.progress = 70 + (progress.percentage * 0.25); // 70-95% for upload
        };

        await firebaseNewsletterService.uploadNewsletter(
          fileItem.file,
          {
            title: firebaseMetadata.title!,
            publicationDate: firebaseMetadata.publicationDate!,
            year: firebaseMetadata.year!,
            ...(firebaseMetadata.season && { season: firebaseMetadata.season }),
            tags: firebaseMetadata.tags || [],
            featured: firebaseMetadata.featured || false
          },
          progressCallback
        );
      } else {
        // File exists in storage, create Firestore entry with existing file
        logger.info(`File ${fileItem.name} already in Storage, creating Firestore entry only`);
        firebaseMetadata.downloadUrl = await firebaseStorageService.getDownloadUrl(storagePath);
        firebaseMetadata.storageRef = storagePath;

        // Create new Firestore document
        await firestoreService.saveNewsletterMetadata(firebaseMetadata as Omit<NewsletterMetadata, 'id'>);
        fileItem.progress = 95; // Skip upload progress
      }

      logger.success(`Successfully created new newsletter with comprehensive metadata`);
    }

    fileItem.progress = 100;
    logger.success(`Comprehensive processing completed for ${fileItem.name}`);

  } catch (error) {
    logger.error(`Comprehensive processing failed for ${fileItem.name}:`, error);
    throw error;
  }
}

// UI helper functions
function getFileStatusIcon(file: FileItem): string {
  switch (file.status) {
    case 'ready': return 'mdi-file-document';
    case 'processing': return 'mdi-loading';
    case 'completed': return 'mdi-check-circle';
    case 'error': return 'mdi-alert-circle';
    default: return 'mdi-file-document';
  }
}

function getFileStatusColor(file: FileItem): string {
  switch (file.status) {
    case 'ready': return 'blue';
    case 'processing': return 'orange';
    case 'completed': return 'green';
    case 'error': return 'red';
    default: return 'grey';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Fallback functions for when comprehensive extraction fails
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Use PDF.js to extract text
    const pdfjsLib = await import('pdfjs-dist');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: Record<string, unknown>) => {
          if ('str' in item && typeof item.str === 'string') {
            return item.str;
          }
          return '';
        })
        .join(' ');

      fullText += pageText + '\n';
    }

    return fullText.trim();

  } catch (error) {
    logger.error('Error extracting text from PDF:', error);
    return '';
  }
}

async function generateThumbnailFromPDF(file: File): Promise<Blob | null> {
  try {
    // Use PDF.js to generate thumbnail
    const pdfjsLib = await import('pdfjs-dist');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // First page

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    const viewport = page.getViewport({ scale: 0.5 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });

  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    return null;
  }
}
</script>

<style scoped>
.import-dialog {
  max-width: 800px;
  width: 100%;
}

.file-list {
  max-height: 400px;
  overflow-y: auto;
}

.file-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.file-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.processing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.import-actions {
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}
</style>
