<template>
    <q-page class="q-pa-lg">
        <div class="row justify-center">
            <div class="col-12 col-md-10">
                <q-card>
                    <q-card-section>
                        <div class="text-h5 q-mb-md">Google Drive Public Access Test</div>
                        <p class="text-body2 text-grey-7">
                            This test checks if the Conashaugh Courier Google Drive folders are publicly accessible
                            without requiring OAuth authentication. This is the preferred approach for public content.
                        </p>
                    </q-card-section>

                    <q-card-section>
                        <div class="q-mb-md">
                            <div class="text-h6 q-mb-sm">Folder Access Test Results</div>

                            <q-list bordered>
                                <q-item v-for="(result, folderName) in testResults" :key="folderName">
                                    <q-item-section avatar>
                                        <q-icon :name="result.accessible ? 'check_circle' : 'error'"
                                            :color="result.accessible ? 'green' : 'red'" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ folderName }}</q-item-label>
                                        <q-item-label caption>
                                            {{ result.accessible ? 'Publicly accessible' : 'Access denied or private' }}
                                        </q-item-label>
                                        <q-item-label caption class="text-mono">
                                            {{ result.folderId }}
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side v-if="result.accessible">
                                        <q-btn size="sm" color="primary" label="List Files"
                                            @click="listFiles(result.folderId, String(folderName))"
                                            :loading="loadingFolder === result.folderId" />
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </div>

                        <div class="q-gutter-sm q-mb-md">
                            <q-btn color="info" label="Test API Key" @click="testApiKey" :loading="testing"
                                icon="key" />
                            <q-btn color="primary" label="Test All Folders" @click="testAllFolders" :loading="testing"
                                icon="folder" />
                            <q-btn color="secondary" label="Clear Results" @click="clearResults" flat />
                        </div>

                        <!-- Error Display -->
                        <div v-if="error" class="q-mt-md">
                            <q-banner class="bg-negative text-white" rounded>
                                <template v-slot:avatar>
                                    <q-icon name="error" />
                                </template>
                                {{ error }}
                            </q-banner>
                        </div>

                        <!-- File Listing -->
                        <div v-if="selectedFolder && files.length > 0" class="q-mt-md">
                            <div class="text-h6 q-mb-sm">Files in {{ selectedFolder.name }}</div>
                            <q-card flat bordered>
                                <q-card-section>
                                    <q-list>
                                        <q-item v-for="file in files" :key="file.id">
                                            <q-item-section avatar>
                                                <q-icon :name="getFileIcon(file.mimeType)"
                                                    :color="getFileColor(file.mimeType)" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label>{{ file.name }}</q-item-label>
                                                <q-item-label caption>{{ file.mimeType }}</q-item-label>
                                                <q-item-label caption>Modified: {{ formatDate(file.modifiedTime)
                                                }}</q-item-label>
                                            </q-item-section>
                                            <q-item-section side v-if="file.webViewLink">
                                                <q-btn size="sm" color="primary" label="View" type="a"
                                                    :href="file.webViewLink" target="_blank" />
                                            </q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-card-section>
                            </q-card>
                        </div>

                        <!-- Instructions -->
                        <div class="q-mt-lg">
                            <q-expansion-item icon="help" label="How to Make Folders Publicly Accessible"
                                header-class="text-primary">
                                <q-card>
                                    <q-card-section>
                                        <div class="text-body2">
                                            <p><strong>To make Google Drive folders publicly accessible:</strong></p>
                                            <ol>
                                                <li>Go to <a href="https://drive.google.com" target="_blank">Google
                                                        Drive</a></li>
                                                <li>Right-click on the folder you want to share</li>
                                                <li>Select "Share" or "Get link"</li>
                                                <li>Change the access to "Anyone with the link" → "Viewer"</li>
                                                <li>Copy the folder ID from the link (the long string after /folders/)
                                                </li>
                                            </ol>
                                            <p class="q-mt-md">
                                                <strong>Example:</strong><br>
                                                Link:
                                                https://drive.google.com/drive/folders/1Nmpr8U0D-rKafYV6VJLi2Jsk-iWu2AEY<br>
                                                Folder ID: <code>1Nmpr8U0D-rKafYV6VJLi2Jsk-iWu2AEY</code>
                                            </p>
                                        </div>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                        </div>
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

// Type for Google Drive file (matching the service interface)
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

const $q = useQuasar();

// Reactive variables
const testing = ref(false);
const loadingFolder = ref<string | null>(null);
const error = ref<string | null>(null);
const testResults = ref<{ [key: string]: { accessible: boolean; folderId: string } }>({});
const files = ref<GoogleDriveFile[]>([]);
const selectedFolder = ref<{ name: string; id: string } | null>(null);

// Google Drive service
let driveService: GoogleDrivePublicAccess | null = null;

// Folder configuration using environment variables
const folderConfig = {
    'Content Folder': import.meta.env.VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID || '1Nmpr8U0D-rKafYV6VJLi2Jsk-iWu2AEY',
    'Issues Folder': import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID || '1snuxUhhIfBuFF9cor6k8_tm6po8IHN7I',
    'Images Folder': import.meta.env.VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID || '1ISopBJw2a3mx7gC6KQloqNrwj0Wo_9Sx',
    'Templates Folder': import.meta.env.VITE_GOOGLE_DRIVE_TEMPLATES_FOLDER_ID || '1jbe4zWDWvC5curxtZ_5kyy8bUREMKVEG',
    'Public Folder': import.meta.env.VITE_GOOGLE_DRIVE_PUBLIC_FOLDER_ID || '1saSXnh9kkD_KNVwqusaz3i9YP46NZmIz'
}; onMounted(() => {
    if (import.meta.env.VITE_GOOGLE_API_KEY) {
        driveService = new GoogleDrivePublicAccess(import.meta.env.VITE_GOOGLE_API_KEY);
    }
});

const testApiKey = async () => {
    if (!driveService) {
        error.value = 'Google API key not configured';
        return;
    }

    testing.value = true;
    error.value = null;

    try {
        const result = await driveService.testApiKey();

        if (result.valid) {
            $q.notify({
                type: 'positive',
                message: 'API key is valid and working!',
            });
        } else {
            error.value = `API key test failed: ${result.error}`;
            $q.notify({
                type: 'negative',
                message: `API key invalid: ${result.error}`,
            });
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        error.value = errorMessage;

        $q.notify({
            type: 'negative',
            message: `API key test failed: ${errorMessage}`,
        });
    } finally {
        testing.value = false;
    }
};

const testAllFolders = async () => {
    if (!driveService) {
        error.value = 'Google API key not configured';
        return;
    }

    testing.value = true;
    error.value = null;
    testResults.value = {};

    try {
        for (const [name, folderId] of Object.entries(folderConfig)) {
            const accessible = await driveService.testFolderAccess(folderId);
            testResults.value[name] = { accessible, folderId };
        }

        $q.notify({
            type: 'positive',
            message: 'Folder access tests completed',
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        error.value = errorMessage;

        $q.notify({
            type: 'negative',
            message: `Test failed: ${errorMessage}`,
        });
    } finally {
        testing.value = false;
    }
};

const listFiles = async (folderId: string, folderName: string) => {
    if (!driveService) return;

    loadingFolder.value = folderId;
    error.value = null;
    files.value = [];

    try {
        const fileList = await driveService.listFolderFiles(folderId);
        files.value = fileList;
        selectedFolder.value = { name: folderName, id: folderId };

        $q.notify({
            type: 'positive',
            message: `Found ${fileList.length} files in ${folderName}`,
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        error.value = errorMessage;

        $q.notify({
            type: 'negative',
            message: `Failed to list files: ${errorMessage}`,
        });
    } finally {
        loadingFolder.value = null;
    }
};

const clearResults = () => {
    testResults.value = {};
    files.value = [];
    selectedFolder.value = null;
    error.value = null;
};

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
    return 'grey';
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
};
</script>

<style scoped>
.text-mono {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
}
</style>
