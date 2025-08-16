<template>
    <div class="publication-hub-container">
        <!-- Header -->
        <div class="hub-header">
            <div class="header-content">
                <h1 class="hub-title">
                    <q-icon name="book" class="q-mr-md" />
                    Publication Hub
                </h1>
                <p class="hub-subtitle">
                    Manage your publication files using Google Drive with seamless thumbnail generation
                </p>
            </div>
        </div>

        <!-- Main Dashboard -->
        <div class="hub-dashboard">
            <div class="dashboard-main">
                <!-- Upload Section -->
                <q-card class="upload-section q-mb-md">
                    <q-card-section>
                        <div class="section-title">
                            <q-icon name="cloud_upload" color="primary" class="q-mr-sm" />
                            <span>Upload Content</span>
                        </div>
                        <p class="text-body2 q-mb-md">
                            Upload files to Google Drive directly from this dashboard
                        </p>

                        <!-- Upload Area -->
                        <div ref="uploadArea" class="upload-area" :class="{ 'upload-area-active': isDragOver }"
                            @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
                            @drop.prevent="handleDrop" @click="triggerFileSelect">
                            <div v-if="!isUploading" class="upload-content">
                                <q-icon :name="uploadIcon" size="4rem" color="primary" class="q-mb-md" />
                                <h3 class="text-h6 q-mb-sm">{{ uploadText }}</h3>
                                <p class="text-body2 text-grey-6">
                                    or click to browse your computer
                                </p>
                                <p class="text-caption text-grey-5 q-mt-md">
                                    <q-icon name="info" size="sm" class="q-mr-xs" />
                                    Files will be uploaded to your Google Drive
                                </p>
                                <q-btn color="primary" icon="upload" label="Select Files" class="q-mt-md"
                                    @click.stop="triggerFileSelect" />
                            </div>
                            <div v-else class="upload-content">
                                <q-spinner-dots color="primary" size="4rem" class="q-mb-md" />
                                <h3 class="text-h6 q-mb-sm">Uploading files...</h3>
                                <p class="text-body2 text-grey-6">
                                    Please wait while we upload to Google Drive
                                </p>
                                <q-linear-progress v-model="uploadProgress" color="primary" class="q-mt-md"
                                    style="height: 6px" />
                            </div>
                        </div>

                        <!-- Upload Instructions -->
                        <div class="upload-instructions q-mt-lg">
                            <h4 class="text-h6 q-mb-md">
                                <q-icon name="help" color="secondary" class="q-mr-sm" />
                                Upload Instructions
                            </h4>
                            <q-list dense>
                                <q-item v-for="(step, index) in uploadSteps" :key="index">
                                    <q-item-section avatar>
                                        <q-avatar :color="step.completed ? 'positive' : 'grey-4'" text-color="white"
                                            size="sm">
                                            {{ index + 1 }}
                                        </q-avatar>
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ step.text }}</q-item-label>
                                    </q-item-section>
                                    <q-item-section side v-if="step.completed">
                                        <q-icon name="check" color="positive" />
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </div>
                    </q-card-section>
                </q-card>

                <!-- PDF Thumbnails Section -->
                <q-card class="thumbnails-section q-mb-md">
                    <q-card-section>
                        <div class="section-title">
                            <q-icon name="picture_as_pdf" color="primary" class="q-mr-sm" />
                            <span>PDF Thumbnails</span>
                            <q-space />
                            <q-btn flat round icon="refresh" color="primary" @click="refreshThumbnails"
                                :loading="thumbnailsLoading" />
                        </div>
                        <p class="text-body2 q-mb-md">
                            Automatically generated previews of your PDF files
                        </p>

                        <!-- Thumbnail Grid -->
                        <div class="thumbnail-grid">
                            <div v-for="file in pdfFiles" :key="file.id" class="thumbnail-card"
                                @click="previewFile(file)">
                                <div class="thumbnail-container">
                                    <img v-if="file.thumbnail && !thumbnailErrors[file.id]" :src="file.thumbnail"
                                        :alt="file.name" class="thumbnail-image"
                                        @error="handleThumbnailError(file.id)" />
                                    <div v-else-if="thumbnailErrors[file.id]" class="thumbnail-placeholder error">
                                        <q-icon name="error" size="2rem" color="negative" />
                                        <span class="text-caption">Failed to load</span>
                                    </div>
                                    <div v-else class="thumbnail-placeholder loading">
                                        <q-spinner color="primary" size="2rem" />
                                        <span class="text-caption">Generating...</span>
                                    </div>
                                </div>
                                <div class="thumbnail-details">
                                    <div class="thumbnail-title">{{ file.name }}</div>
                                    <div class="thumbnail-meta">
                                        <span>{{ file.size }}</span>
                                        <span>{{ formatDate(file.uploaded) }}</span>
                                    </div>
                                    <div class="thumbnail-tags">
                                        <q-chip v-for="tag in file.tags" :key="tag" dense color="blue-1"
                                            text-color="blue-8" size="sm">
                                            {{ tag }}
                                        </q-chip>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div v-if="pdfFiles.length === 0" class="empty-state">
                            <q-icon name="description" size="4rem" color="grey-4" class="q-mb-md" />
                            <h4 class="text-h6 text-grey-6">No PDF files found</h4>
                            <p class="text-body2 text-grey-5">
                                Upload some PDF files to see thumbnails here
                            </p>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Sidebar -->
            <div class="dashboard-sidebar">
                <!-- Storage Stats -->
                <q-card class="stats-card q-mb-md">
                    <q-card-section>
                        <div class="section-title">
                            <q-icon name="storage" color="accent" class="q-mr-sm" />
                            <span>Storage Stats</span>
                        </div>
                        <div class="stats-content">
                            <div class="stat-item">
                                <span class="stat-label">Total Files</span>
                                <span class="stat-value">{{ storageStats.totalFiles }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total Size</span>
                                <span class="stat-value">{{ storageStats.totalSize }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">PDF Files</span>
                                <span class="stat-value">{{ storageStats.filesByType.pdf || 0 }}</span>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>

                <!-- Recent Activity -->
                <q-card class="activity-card">
                    <q-card-section>
                        <div class="section-title">
                            <q-icon name="history" color="info" class="q-mr-sm" />
                            <span>Recent Activity</span>
                        </div>
                        <q-list dense v-if="recentFiles.length > 0">
                            <q-item v-for="file in recentFiles" :key="file.id">
                                <q-item-section avatar>
                                    <q-icon :name="getFileIcon(file.type)" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="text-caption">{{ file.name }}</q-item-label>
                                    <q-item-label caption>{{ formatDate(file.uploaded) }}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                        <div v-else class="text-center text-grey-5">
                            <q-icon name="inbox" size="2rem" class="q-mb-sm" />
                            <p class="text-body2">No recent activity</p>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <!-- Hidden File Input -->
        <input ref="fileInput" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
            style="display: none" @change="handleFileSelect" />

        <!-- File Preview Dialog -->
        <q-dialog v-model="previewDialog" maximized>
            <q-card v-if="selectedFile">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">{{ selectedFile.name }}</div>
                    <q-space />
                    <q-btn icon="close" flat round dense @click="previewDialog = false" />
                </q-card-section>
                <q-card-section class="q-pa-none" style="flex: 1">
                    <iframe v-if="selectedFile.webViewLink" :src="selectedFile.webViewLink" width="100%" height="100%"
                        frameborder="0" />
                </q-card-section>
            </q-card>
        </q-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { googleDriveThumbnailService } from '../services/google-drive-thumbnail-service'
import { fileMetadataStorage, type StoredFileMetadata } from '../services/file-metadata-storage'

// Reactive data
const files = ref<StoredFileMetadata[]>([])
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const thumbnailsLoading = ref(false)
const thumbnailErrors = ref<Record<string, boolean>>({})
const previewDialog = ref(false)
const selectedFile = ref<StoredFileMetadata | null>(null)
const storageStats = ref({
    totalFiles: 0,
    totalSize: '0 B',
    filesByType: {} as Record<string, number>
})

// Refs
const uploadArea = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()

// Computed properties
const pdfFiles = computed(() => files.value.filter(file => file.type === 'pdf'))
const recentFiles = computed(() =>
    [...files.value]
        .sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
        .slice(0, 5)
)

const uploadIcon = computed(() => isDragOver.value ? 'file_download' : 'cloud_upload')
const uploadText = computed(() =>
    isDragOver.value ? 'Drop files here' : 'Drag & Drop files here'
)

// Upload steps for instructions
const uploadSteps = ref([
    { text: 'Click "Select Files" or drag files into the upload area', completed: false },
    { text: 'Files will be automatically uploaded to Google Drive', completed: false },
    { text: 'Add tags and descriptions after uploading (optional)', completed: false },
    { text: 'Files will appear in your publication dashboard', completed: false }
])

// Lifecycle
onMounted(async () => {
    await loadStoredFiles()
    await updateStorageStats()
    await generateThumbnails()
})

// Methods
async function loadStoredFiles() {
    try {
        files.value = await fileMetadataStorage.getAllFiles()
    } catch (error) {
        console.error('Failed to load stored files:', error)
    }
}

async function updateStorageStats() {
    try {
        storageStats.value = await fileMetadataStorage.getStorageStats()
    } catch (error) {
        console.error('Failed to load storage stats:', error)
    }
}

async function generateThumbnails() {
    if (pdfFiles.value.length === 0) return

    thumbnailsLoading.value = true

    for (const file of pdfFiles.value) {
        if (!file.thumbnail) {
            try {
                const thumbnail = await googleDriveThumbnailService.getThumbnail(file)

                // Update the file with the thumbnail
                await fileMetadataStorage.updateFile(file.id, { thumbnail })

                // Update local state
                const fileIndex = files.value.findIndex(f => f.id === file.id)
                if (fileIndex !== -1) {
                    files.value[fileIndex].thumbnail = thumbnail
                }
            } catch (error) {
                console.error(`Failed to generate thumbnail for ${file.name}:`, error)
                thumbnailErrors.value[file.id] = true
            }
        }
    }

    thumbnailsLoading.value = false
}

async function refreshThumbnails() {
    // Clear existing thumbnails
    for (const file of pdfFiles.value) {
        await fileMetadataStorage.updateFile(file.id, { thumbnail: undefined })
    }

    // Clear errors and regenerate
    thumbnailErrors.value = {}
    await loadStoredFiles()
    await generateThumbnails()
}

function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragOver.value = false
}

async function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragOver.value = false

    const files = Array.from(event.dataTransfer?.files || [])
    await processFiles(files)
}

function triggerFileSelect() {
    fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const selectedFiles = Array.from(target.files || [])
    await processFiles(selectedFiles)

    // Reset file input
    target.value = ''
}

async function processFiles(selectedFiles: File[]) {
    if (selectedFiles.length === 0) return

    isUploading.value = true
    uploadProgress.value = 0

    const totalFiles = selectedFiles.length
    let processedFiles = 0

    for (const file of selectedFiles) {
        try {
            // Simulate upload process (in real implementation, this would upload to Google Drive)
            await simulateUpload(file)

            // Create metadata for storage
            const fileMetadata: StoredFileMetadata = {
                id: generateFileId(),
                name: file.name,
                type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
                size: formatFileSize(file.size),
                uploaded: new Date().toISOString(),
                tags: ['uploaded'],
                mimeType: file.type,
                webViewLink: `https://drive.google.com/file/d/${generateFileId()}/view`,
                webContentLink: `https://drive.google.com/uc?id=${generateFileId()}`
            }

            // Store in IndexedDB
            await fileMetadataStorage.storeFile(fileMetadata)

            // Add to local state
            files.value.unshift(fileMetadata)

            processedFiles++
            uploadProgress.value = (processedFiles / totalFiles) * 100

            // Update upload steps
            if (processedFiles === 1) {
                uploadSteps.value[0].completed = true
                uploadSteps.value[1].completed = true
            }
            if (processedFiles === totalFiles) {
                uploadSteps.value[2].completed = true
                uploadSteps.value[3].completed = true
            }

        } catch (error) {
            console.error(`Failed to process file ${file.name}:`, error)
        }
    }

    // Update stats
    await updateStorageStats()

    // Generate thumbnails for new PDFs
    await nextTick()
    await generateThumbnails()

    isUploading.value = false

    // Reset upload steps after a delay
    setTimeout(() => {
        uploadSteps.value.forEach(step => step.completed = false)
    }, 3000)
}

async function simulateUpload(file: File): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
}

function generateFileId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    } else if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    } else if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    } else {
        return `${bytes} B`
    }
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString()
}

function getFileIcon(fileType: string): string {
    const icons: Record<string, string> = {
        'pdf': 'picture_as_pdf',
        'doc': 'description',
        'docx': 'description',
        'xls': 'table_chart',
        'xlsx': 'table_chart',
        'ppt': 'slideshow',
        'pptx': 'slideshow',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image'
    }
    return icons[fileType] || 'insert_drive_file'
}

function handleThumbnailError(fileId: string) {
    thumbnailErrors.value[fileId] = true
}

function previewFile(file: StoredFileMetadata) {
    selectedFile.value = file
    previewDialog.value = true
}
</script>

<style scoped>
.publication-hub-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.hub-header {
    background: linear-gradient(135deg, var(--q-primary), var(--q-secondary));
    color: white;
    padding: 2rem;
    border-radius: 16px;
    margin-bottom: 2rem;
    text-align: center;
}

.hub-title {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hub-subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    max-width: 800px;
    margin: 0 auto;
}

.hub-dashboard {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
}

@media (min-width: 992px) {
    .hub-dashboard {
        grid-template-columns: 1fr 350px;
    }
}

.section-title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.upload-area {
    border: 2px dashed #e0e0e0;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    background: #fafafa;
    transition: all 0.3s ease;
    cursor: pointer;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.upload-area:hover,
.upload-area-active {
    border-color: var(--q-primary);
    background: rgba(25, 118, 210, 0.05);
}

.upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.upload-instructions {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
}

.thumbnail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.thumbnail-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
}

.thumbnail-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.thumbnail-container {
    height: 150px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.thumbnail-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.thumbnail-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.thumbnail-details {
    padding: 1rem;
}

.thumbnail-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.thumbnail-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.5rem;
}

.thumbnail-tags {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.empty-state {
    text-align: center;
    padding: 2rem;
}

.stats-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stat-label {
    color: #666;
    font-size: 0.875rem;
}

.stat-value {
    font-weight: 600;
    font-size: 1.125rem;
}
</style>
