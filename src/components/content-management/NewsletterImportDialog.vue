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
        <q-btn flat label="Cancel" @click="dialogModel = false" v-if="isProcessing" />
        <q-btn flat label="Close" @click="dialogModel = false" v-if="!isProcessing" />
        <q-btn color="primary" label="Import Files" @click="processAndUploadFiles" :loading="isProcessing"
          :disable="fileList.length === 0 || fileList.every(f => f.status !== 'ready')" v-if="fileList.length > 0" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
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
    // Use the WORKING pdfProcessingService approach
    fileItem.progress = 10;
    logger.info(`Processing ${fileItem.name} using working pdfProcessingService`);

    // Import the working services
    const { pdfProcessingService } = await import('../../services/pdf-processing.service');
    const { firebaseAuthService } = await import('../../services/firebase-auth.service');

    // Get current user
    const user = firebaseAuthService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to import PDFs');
    }

    fileItem.progress = 30;

    // Use the WORKING approach: Process PDF to Firebase with comprehensive extraction
    const result = await pdfProcessingService.processPdfToFirebase(fileItem.name, user.uid, {
      isPublished: true // Default to published for imports
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to process PDF to Firebase');
    }

    fileItem.progress = 90;
    logger.success(`Successfully processed ${fileItem.name} to Firebase with ID: ${result.firebaseId}`);

    // Update the file item status
    fileItem.status = 'completed';
    fileItem.progress = 100;

    logger.success(`Import completed for ${fileItem.name} - Page count, word count, and thumbnails extracted`);

  } catch (error) {
    logger.error(`Processing failed for ${fileItem.name}:`, error);
    fileItem.status = 'error';
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
