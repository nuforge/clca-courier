<template>
  <q-page class="q-pa-lg">
    <div class="row justify-center">
      <div class="col-12 col-lg-10">
        <q-card>
          <q-card-section>
            <div class="text-h4 q-mb-md text-center">
              <q-icon name="cloud" class="q-mr-sm" color="primary" />
              Conashaugh Courier Content Management
            </div>
            <p class="text-body1 text-center text-grey-7 q-mb-lg">
              Direct access to publicly shared Google Drive content without authentication.
              This system demonstrates how to access newsletter issues, images, and templates
              from the Conashaugh Courier's Google Drive folders.
            </p>
          </q-card-section>

          <!-- Status Overview -->
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="dashboard" class="q-mr-sm" />
              Content Folders Status
            </div>

            <div class="row q-gutter-md">
              <div v-for="(status, folderName) in folderStatus" :key="folderName" class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered :class="status.accessible ? 'bg-green-1' : 'bg-red-1'">
                  <q-card-section class="text-center">
                    <q-icon :name="status.accessible ? 'check_circle' : 'error'"
                      :color="status.accessible ? 'green' : 'red'" size="2rem" class="q-mb-sm" />
                    <div class="text-subtitle2">{{ folderName }}</div>
                    <div class="text-caption text-grey-7">
                      {{ status.accessible ? 'Available' : 'Private' }}
                    </div>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      {{ status.fileCount || 0 }} files
                    </div>
                  </q-card-section>
                  <q-card-actions align="center" v-if="status.accessible">
                    <q-btn size="sm" color="primary" label="Browse"
                      @click="showFolderContents(folderName, status.folderId)"
                      :loading="loadingFolder === status.folderId" />
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </q-card-section>

          <!-- Action Buttons -->
          <q-card-section>
            <div class="q-gutter-sm text-center">
              <q-btn color="primary" label="Refresh All Content" @click="refreshAllContent" :loading="loading"
                icon="refresh" size="md" />
              <q-btn color="secondary" label="Test Configuration" @click="testConfiguration" :loading="loading"
                icon="settings" outline />
            </div>
          </q-card-section>

          <!-- Error Display -->
          <q-card-section v-if="error">
            <q-banner class="bg-negative text-white" rounded>
              <template v-slot:avatar>
                <q-icon name="error" />
              </template>
              <div class="text-subtitle2">Error</div>
              {{ error }}
            </q-banner>
          </q-card-section>

          <!-- Success Display -->
          <q-card-section v-if="successMessage">
            <q-banner class="bg-positive text-white" rounded>
              <template v-slot:avatar>
                <q-icon name="check_circle" />
              </template>
              {{ successMessage }}
            </q-banner>
          </q-card-section>
        </q-card>

        <!-- Folder Contents Dialog -->
        <q-dialog v-model="showContents" maximized>
          <q-card>
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">{{ selectedFolder?.name }} Contents</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section>
              <div v-if="folderFiles.length === 0" class="text-center q-pa-lg text-grey-6">
                <q-icon name="folder_open" size="4rem" class="q-mb-md" />
                <div class="text-h6">No files found</div>
                <div class="text-body2">This folder appears to be empty or private.</div>
              </div>

              <div v-else>
                <div class="text-body2 q-mb-md">
                  Found {{ folderFiles.length }} files in this folder
                </div>

                <q-list bordered separator>
                  <q-item v-for="file in folderFiles" :key="file.id" clickable @click="openFile(file)">
                    <q-item-section avatar>
                      <q-avatar :icon="getFileIcon(file.mimeType)" :color="getFileColor(file.mimeType)"
                        text-color="white" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ file.name }}</q-item-label>
                      <q-item-label caption>
                        {{ getFileTypeLabel(file.mimeType) }}
                      </q-item-label>
                      <q-item-label caption>
                        Modified: {{ formatDate(file.modifiedTime) }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <div class="q-gutter-xs">
                        <q-btn size="sm" color="primary" icon="open_in_new" label="View" @click.stop="openFile(file)"
                          v-if="file.webViewLink" />
                        <q-btn size="sm" color="secondary" icon="info" @click.stop="showFileInfo(file)" />
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card-section>
          </q-card>
        </q-dialog>

        <!-- How It Works Section -->
        <q-card class="q-mt-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="info" class="q-mr-sm" />
              How This Works
            </div>

            <q-expansion-item icon="security" label="No Authentication Required" header-class="text-primary">
              <q-card>
                <q-card-section>
                  <p>
                    This system uses <strong>public folder access</strong> instead of OAuth
                    authentication.
                    Users don't need to sign in or grant permissions because we're accessing
                    publicly
                    shared Google Drive folders directly.
                  </p>
                  <ul>
                    <li>✅ No "sign in with Google" popups</li>
                    <li>✅ No permission requests</li>
                    <li>✅ Works for all users immediately</li>
                    <li>✅ Fast and reliable</li>
                  </ul>
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-expansion-item icon="api" label="Direct API Access" header-class="text-primary">
              <q-card>
                <q-card-section>
                  <p>
                    The system uses the Google Drive API v3 with just an API key to access
                    publicly shared folders. This approach is:
                  </p>
                  <ul>
                    <li><strong>Simple:</strong> Only requires an API key, no OAuth setup</li>
                    <li><strong>Fast:</strong> Direct HTTP requests, no authentication overhead</li>
                    <li><strong>Reliable:</strong> No token expiration or refresh issues</li>
                    <li><strong>Secure:</strong> Only accesses explicitly shared content</li>
                  </ul>
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-expansion-item icon="folder" label="Content Organization" header-class="text-primary">
              <q-card>
                <q-card-section>
                  <p>Content is organized into dedicated folders:</p>
                  <ul>
                    <li><strong>Issues Folder:</strong> Newsletter PDFs and archives</li>
                    <li><strong>Images Folder:</strong> Photos, graphics, and media</li>
                    <li><strong>Templates Folder:</strong> Design templates and layouts</li>
                    <li><strong>Content Folder:</strong> General articles and documents</li>
                  </ul>
                  <p class="q-mt-md">
                    Each folder can be managed independently, with different access levels
                    and sharing settings as needed.
                  </p>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { GoogleDrivePublicAccess } from 'src/services/google-drive-public-access';

// Types
interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

interface FolderStatus {
  accessible: boolean;
  folderId: string;
  fileCount?: number;
}

const $q = useQuasar();

// Reactive state
const loading = ref(false);
const loadingFolder = ref<string | null>(null);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const folderStatus = ref<Record<string, FolderStatus>>({});
const showContents = ref(false);
const selectedFolder = ref<{ name: string; id: string } | null>(null);
const folderFiles = ref<GoogleDriveFile[]>([]);

// Services
let driveService: GoogleDrivePublicAccess | null = null;

// Configuration
const folderConfig = {
  'Issues': import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID || '1snuxUhhIfBuFF9cor6k8_tm6po8IHN7I',
  'Images': import.meta.env.VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID || '1ISopBJw2a3mx7gC6KQloqNrwj0Wo_9Sx',
  'Templates': import.meta.env.VITE_GOOGLE_DRIVE_TEMPLATES_FOLDER_ID || '1ixeT4kA2NhqrJRlAuBEw_fG7z0m-uBKy',
  'Content': import.meta.env.VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID || '1Nmpr8U0D-rKafYV6VJLi2Jsk-iWu2AEY',
};

// Initialize
onMounted(() => {
  if (import.meta.env.VITE_GOOGLE_API_KEY) {
    driveService = new GoogleDrivePublicAccess(import.meta.env.VITE_GOOGLE_API_KEY);
    void refreshAllContent();
  } else {
    error.value = 'Google API key not configured in environment variables';
  }
});

// Methods
const refreshAllContent = async () => {
  if (!driveService) return;

  loading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const newStatus: Record<string, FolderStatus> = {};

    for (const [name, folderId] of Object.entries(folderConfig)) {
      const accessible = await driveService.testFolderAccess(folderId);
      let fileCount = 0;

      if (accessible) {
        try {
          const files = await driveService.listFolderFiles(folderId);
          fileCount = files.length;
        } catch (e) {
          console.warn(`Could not count files in ${name}:`, e);
        }
      }

      newStatus[name] = { accessible, folderId, fileCount };
    }

    folderStatus.value = newStatus;
    successMessage.value = `Successfully checked ${Object.keys(folderConfig).length} folders`;

    $q.notify({
      type: 'positive',
      message: 'Content refreshed successfully',
      position: 'top'
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error.value = `Failed to refresh content: ${errorMessage}`;

    $q.notify({
      type: 'negative',
      message: 'Failed to refresh content',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

const testConfiguration = async () => {
  if (!driveService) return;

  loading.value = true;
  error.value = null;

  try {
    const apiTest = await driveService.testApiKey();

    if (apiTest.valid) {
      successMessage.value = 'Configuration is valid and working correctly';
      $q.notify({
        type: 'positive',
        message: 'Configuration test passed',
        position: 'top'
      });
    } else {
      error.value = `Configuration test failed: ${apiTest.error}`;
      $q.notify({
        type: 'negative',
        message: 'Configuration test failed',
        position: 'top'
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error.value = `Configuration test error: ${errorMessage}`;
  } finally {
    loading.value = false;
  }
};

const showFolderContents = async (folderName: string, folderId: string) => {
  if (!driveService) return;

  loadingFolder.value = folderId;
  selectedFolder.value = { name: folderName, id: folderId };
  folderFiles.value = [];

  try {
    const files = await driveService.listFolderFiles(folderId);
    folderFiles.value = files;
    showContents.value = true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    $q.notify({
      type: 'negative',
      message: `Failed to load folder contents: ${errorMessage}`,
      position: 'top'
    });
  } finally {
    loadingFolder.value = null;
  }
};

const openFile = (file: GoogleDriveFile) => {
  if (file.webViewLink) {
    window.open(file.webViewLink, '_blank');
  }
};

const showFileInfo = (file: GoogleDriveFile) => {
  $q.dialog({
    title: 'File Information',
    message: `
      <strong>Name:</strong> ${file.name}<br>
      <strong>Type:</strong> ${getFileTypeLabel(file.mimeType)}<br>
      <strong>Created:</strong> ${formatDate(file.createdTime)}<br>
      <strong>Modified:</strong> ${formatDate(file.modifiedTime)}<br>
      ${file.size ? `<strong>Size:</strong> ${formatFileSize(file.size)}<br>` : ''}
      <strong>ID:</strong> ${file.id}
    `,
    html: true
  });
};

// Utility functions
const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'picture_as_pdf';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('video')) return 'movie';
  if (mimeType.includes('folder')) return 'folder';
  if (mimeType.includes('document')) return 'description';
  if (mimeType.includes('spreadsheet')) return 'table_chart';
  if (mimeType.includes('presentation')) return 'slideshow';
  return 'insert_drive_file';
};

const getFileColor = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'red';
  if (mimeType.includes('image')) return 'purple';
  if (mimeType.includes('video')) return 'indigo';
  if (mimeType.includes('folder')) return 'orange';
  if (mimeType.includes('document')) return 'blue';
  if (mimeType.includes('spreadsheet')) return 'green';
  return 'grey';
};

const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'PDF Document';
  if (mimeType.includes('image')) return 'Image';
  if (mimeType.includes('video')) return 'Video';
  if (mimeType.includes('document')) return 'Document';
  if (mimeType.includes('spreadsheet')) return 'Spreadsheet';
  if (mimeType.includes('presentation')) return 'Presentation';
  return 'File';
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatFileSize = (sizeString: string): string => {
  const size = parseInt(sizeString);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
</script>

<style scoped>
.q-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.text-center {
  text-align: center;
}
</style>
