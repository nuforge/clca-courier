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
                    <q-file v-model="selectedFiles" multiple accept=".pdf" max-files="10"
                        @update:model-value="handleFileSelection" class="q-mb-md">
                        <template v-slot:prepend>
                            <q-icon name="mdi-file-pdf-box" />
                        </template>
                        <template v-slot:hint>
                            Select up to 10 PDF files (max 50MB each)
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
                                    <q-circular-progress :value="file.progress" size="24px" color="primary"
                                        show-value />
                                </q-item-section>

                                <q-item-section side v-if="file.status === 'ready'">
                                    <q-btn flat dense icon="mdi-delete" @click="removeFile(file.id)" color="negative" />
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </div>
                </div>

                <!-- Processing Summary -->
                <div v-if="processingStats.total > 0" class="q-mb-md">
                    <q-linear-progress :value="processingStats.completed / processingStats.total" color="primary"
                        class="q-mb-sm" />
                    <div class="text-caption text-center">
                        {{ processingStats.completed }} of {{ processingStats.total }} files processed
                    </div>
                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat label="Cancel" @click="dialogModel = false" :disable="isProcessing" />
                <q-btn color="primary" label="Import Selected Files" @click="processAndUploadFiles"
                    :disable="fileList.length === 0 || isProcessing" :loading="isProcessing" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { firebaseNewsletterService } from '../../services/firebase-newsletter.service';
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
    // Step 1: Extract metadata
    fileItem.progress = 10;
    const metadata = extractFileMetadata(fileItem.file);

    // Step 2: Extract text content
    fileItem.progress = 30;
    const textContent = await extractTextFromPDF(fileItem.file);

    // Step 3: Generate thumbnail
    fileItem.progress = 60;
    const thumbnailBlob = await generateThumbnailFromPDF(fileItem.file);

    // TODO: Store thumbnail - need to implement thumbnail upload to Firebase
    if (thumbnailBlob) {
        logger.info(`Generated thumbnail for ${fileItem.name}: ${thumbnailBlob.size} bytes`);
    }

    // Step 4: Upload to Firebase
    fileItem.progress = 80;
    await uploadToFirebase(fileItem, metadata, textContent);

    fileItem.progress = 100;
}

function extractFileMetadata(file: File): Record<string, unknown> {
    // Extract basic metadata from filename and file
    const filename = file.name;
    const fileSize = file.size;

    // Parse year and season from filename if possible
    const yearMatch = filename.match(/(\d{4})/);
    const seasonMatch = filename.match(/(spring|summer|fall|winter)/i);

    return {
        filename,
        fileSize,
        year: yearMatch?.[1] ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
        season: seasonMatch?.[1]?.toLowerCase() || 'unknown',
        uploadedAt: new Date().toISOString()
    };
} async function extractTextFromPDF(file: File): Promise<string> {
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
                .map((item) => ('str' in item ? item.str : ''))
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        logger.warn('Failed to extract text from PDF:', error);
        return '';
    }
}

async function generateThumbnailFromPDF(file: File): Promise<Blob | null> {
    try {
        // Use PDF.js to render first page as thumbnail
        const pdfjsLib = await import('pdfjs-dist');

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const scale = 0.5; // Thumbnail scale
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.8);
        });
    } catch (error) {
        logger.warn('Failed to generate thumbnail from PDF:', error);
        return null;
    }
}

async function uploadToFirebase(
    fileItem: FileItem,
    metadata: Record<string, unknown>,
    textContent: string
): Promise<void> {
    // Upload the PDF file and metadata to Firebase
    const season = metadata.season as string;
    const validSeasons = ['spring', 'summer', 'fall', 'winter'];

    await firebaseNewsletterService.uploadNewsletter(
        fileItem.file,
        {
            title: metadata.filename as string || fileItem.name,
            publicationDate: metadata.uploadedAt as string,
            year: metadata.year as number,
            ...(validSeasons.includes(season) && { season: season as 'spring' | 'summer' | 'fall' | 'winter' }),
            tags: textContent ? ['imported', 'processed'] : ['imported'],
            featured: false,
        }
    );
}// Utility functions
function getFileStatusIcon(file: FileItem): string {
    switch (file.status) {
        case 'ready': return 'mdi-file-pdf-box';
        case 'processing': return 'mdi-loading';
        case 'completed': return 'mdi-check-circle';
        case 'error': return 'mdi-alert-circle';
        default: return 'mdi-file';
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
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>
