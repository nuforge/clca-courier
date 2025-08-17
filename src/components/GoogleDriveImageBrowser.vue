<template>
    <q-card>
        <q-card-section>
            <div class="text-h6 q-mb-md">
                <q-icon name="mdi-google-drive" class="q-mr-sm" />
                Google Drive Image Browser
            </div>

            <!-- Authentication Section -->
            <div v-if="!isAuthenticated()" class="q-mb-md">
                <q-banner class="bg-blue-1 text-blue-8" rounded>
                    <template v-slot:avatar>
                        <q-icon name="mdi-information" color="blue" />
                    </template>
                    <div class="text-body2">
                        Connect to Google Drive to browse and search your images.
                    </div>
                    <template v-slot:action>
                        <q-btn color="primary" label="Connect to Google Drive" @click="handleAuthenticate"
                            :loading="isLoading()" />
                    </template>
                </q-banner>
            </div>

            <!-- Connected State -->
            <div v-else class="q-mb-md">
                <div class="row items-center q-mb-md">
                    <q-icon name="mdi-check-circle" color="green" class="q-mr-sm" />
                    <span class="text-body1">Connected to Google Drive</span>
                    <q-space />
                    <q-btn color="grey-8" outline size="sm" label="Sign Out" @click="handleSignOut" />
                </div>

                <!-- Search Controls -->
                <div class="row q-gutter-md q-mb-md">
                    <div class="col-12 col-md-6">
                        <q-input v-model="searchQuery" label="Search images" placeholder="Enter search terms..."
                            clearable @keyup.enter="handleSearch">
                            <template v-slot:append>
                                <q-btn icon="search" flat @click="handleSearch" :loading="isLoading()" />
                            </template>
                        </q-input>
                    </div>
                    <div class="col-12 col-md-4">
                        <q-select v-model="selectedFolders" :options="folderOptions" label="Search in folders" multiple
                            clearable emit-value map-options />
                    </div>
                </div>

                <div class="row q-gutter-sm q-mb-md">
                    <q-btn color="primary" label="Search Images" @click="handleSearch" :loading="isLoading()"
                        :disable="!searchQuery" />
                    <q-btn color="secondary" outline label="Browse All Images" @click="handleBrowseAll"
                        :loading="isLoading()" />
                    <q-btn color="grey-8" outline label="Clear Results" @click="clearResults"
                        :disable="images.length === 0" />
                </div>
            </div>

            <!-- Error Display -->
            <div v-if="error()" class="q-mb-md">
                <q-banner class="bg-red-1 text-red-8" rounded>
                    <template v-slot:avatar>
                        <q-icon name="mdi-alert" color="red" />
                    </template>
                    {{ error() }}
                </q-banner>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading()" class="text-center q-py-md">
                <q-spinner-dots size="50px" color="primary" />
                <div class="text-body2 q-mt-sm">Loading images from Google Drive...</div>
            </div>

            <!-- Results -->
            <div v-if="!isLoading() && images.length > 0" class="q-mb-md">
                <div class="text-subtitle1 q-mb-sm">
                    Found {{ images.length }} image(s)
                </div>

                <div class="row q-gutter-md">
                    <div v-for="image in images" :key="image.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
                        <q-card flat bordered>
                            <q-img :src="getThumbnailUrl(image)" :alt="image.name" ratio="1" class="cursor-pointer"
                                @click="openImage(image)">
                                <template v-slot:loading>
                                    <div class="absolute-full flex flex-center">
                                        <q-spinner-cube size="50px" color="primary" />
                                    </div>
                                </template>
                                <template v-slot:error>
                                    <div class="absolute-full flex flex-center bg-grey-3">
                                        <q-icon name="mdi-image-broken" size="50px" color="grey-6" />
                                    </div>
                                </template>
                            </q-img>

                            <q-card-section class="q-pa-sm">
                                <div class="text-caption text-weight-medium ellipsis" :title="image.name">
                                    {{ image.name }}
                                </div>
                                <div class="text-caption text-grey-6">
                                    {{ formatFileSize(image.size) }}
                                </div>
                            </q-card-section>

                            <q-card-actions align="right" class="q-pa-sm">
                                <q-btn size="sm" flat icon="mdi-eye" @click="openImage(image)" />
                                <q-btn size="sm" flat icon="mdi-download" @click="downloadImage(image)" />
                                <q-btn size="sm" flat icon="mdi-link" @click="copyImageUrl(image)" />
                            </q-card-actions>
                        </q-card>
                    </div>
                </div>
            </div>

            <!-- No Results -->
            <div v-if="!isLoading() && isAuthenticated() && images.length === 0 && hasSearched"
                class="text-center q-py-lg">
                <q-icon name="mdi-image-off" size="64px" color="grey-5" />
                <div class="text-body1 text-grey-6 q-mt-md">No images found</div>
                <div class="text-body2 text-grey-5">Try adjusting your search terms or browse all images</div>
            </div>
        </q-card-section>
    </q-card>

    <!-- Image Preview Dialog -->
    <q-dialog v-model="showImageDialog" maximized>
        <q-card v-if="selectedImage">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ selectedImage.name }}</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-none">
                <q-img :src="getDirectUrl(selectedImage)" :alt="selectedImage.name" fit="contain"
                    style="max-height: 80vh">
                    <template v-slot:loading>
                        <div class="absolute-full flex flex-center">
                            <q-spinner-cube size="50px" color="primary" />
                        </div>
                    </template>
                </q-img>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat label="Download" icon="mdi-download" @click="downloadImage(selectedImage)" />
                <q-btn flat label="Copy URL" icon="mdi-link" @click="copyImageUrl(selectedImage)" />
                <q-btn flat label="Close" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useGoogleDrive } from 'src/composables/useGoogleDrive';
import type { GoogleDriveFile } from 'src/types/google-drive-content';

const $q = useQuasar();
const googleDrive = useGoogleDrive();

// Component state
const searchQuery = ref('');
const selectedFolders = ref<string[]>([]);
const images = ref<GoogleDriveFile[]>([]);
const hasSearched = ref(false);
const showImageDialog = ref(false);
const selectedImage = ref<GoogleDriveFile | null>(null);

// Folder options for search
const folderOptions = ref([
    { label: 'Content Folder', value: import.meta.env.VITE_GOOGLE_DRIVE_CONTENT_FOLDER_ID },
    { label: 'Images Folder', value: import.meta.env.VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID },
    { label: 'Issues Folder', value: import.meta.env.VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID },
    { label: 'Templates Folder', value: import.meta.env.VITE_GOOGLE_DRIVE_TEMPLATES_FOLDER_ID },
].filter(option => option.value && option.value !== 'Not configured'));

// Computed properties from composable
const isAuthenticated = googleDrive.isAuthenticated;
const isLoading = googleDrive.isLoading;
const error = googleDrive.error;

// Initialize Google Drive on component mount
onMounted(() => {
    const config = {
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    };

    if (config.apiKey && config.clientId) {
        googleDrive.initialize(config);
    } else {
        console.warn('Google Drive API credentials not configured');
    }
});

// Methods
const handleAuthenticate = async () => {
    try {
        const success = await googleDrive.authenticate();
        if (success) {
            $q.notify({
                type: 'positive',
                message: 'Successfully connected to Google Drive',
                position: 'top',
            });
        }
    } catch (error) {
        console.error('Failed to connect to Google Drive:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to connect to Google Drive',
            position: 'top',
        });
    }
};

const handleSignOut = async () => {
    try {
        await googleDrive.signOut();
        images.value = [];
        hasSearched.value = false;
        $q.notify({
            type: 'info',
            message: 'Disconnected from Google Drive',
            position: 'top',
        });
    } catch (error) {
        console.error('Failed to sign out:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to sign out',
            position: 'top',
        });
    }
};

const handleSearch = async () => {
    if (!searchQuery.value.trim()) {
        $q.notify({
            type: 'warning',
            message: 'Please enter search terms',
            position: 'top',
        });
        return;
    }

    try {
        const results = await googleDrive.searchImages(
            searchQuery.value,
            selectedFolders.value.length > 0 ? selectedFolders.value : undefined
        );
        images.value = results;
        hasSearched.value = true;

        if (results.length === 0) {
            $q.notify({
                type: 'info',
                message: 'No images found matching your search',
                position: 'top',
            });
        }
    } catch (error) {
        console.error('Search failed:', error);
        $q.notify({
            type: 'negative',
            message: 'Search failed',
            position: 'top',
        });
    }
};

const handleBrowseAll = async () => {
    try {
        const results = await googleDrive.searchImages(
            undefined,
            selectedFolders.value.length > 0 ? selectedFolders.value : undefined
        );
        images.value = results;
        hasSearched.value = true;

        if (results.length === 0) {
            $q.notify({
                type: 'info',
                message: 'No images found in selected folders',
                position: 'top',
            });
        }
    } catch (error) {
        console.error('Failed to browse images:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to browse images',
            position: 'top',
        });
    }
};

const clearResults = () => {
    images.value = [];
    hasSearched.value = false;
    searchQuery.value = '';
};

const getThumbnailUrl = (image: GoogleDriveFile): string => {
    return image.thumbnailLink || `https://drive.google.com/uc?id=${image.id}&export=download`;
};

const getDirectUrl = (image: GoogleDriveFile): string => {
    return image.webContentLink || image.thumbnailLink || `https://drive.google.com/uc?id=${image.id}&export=download`;
};

const openImage = (image: GoogleDriveFile) => {
    selectedImage.value = image;
    showImageDialog.value = true;
};

const downloadImage = async (image: GoogleDriveFile) => {
    try {
        const blob = await googleDrive.downloadFile(image.id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = image.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            $q.notify({
                type: 'positive',
                message: 'Image downloaded successfully',
                position: 'top',
            });
        }
    } catch (error) {
        console.error('Failed to download image:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to download image',
            position: 'top',
        });
    }
};

const copyImageUrl = async (image: GoogleDriveFile) => {
    try {
        const urlToCopy = getDirectUrl(image);

        await navigator.clipboard.writeText(urlToCopy);
        $q.notify({
            type: 'positive',
            message: 'Image URL copied to clipboard',
            position: 'top',
        });
    } catch (error) {
        console.error('Failed to copy URL:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to copy URL',
            position: 'top',
        });
    }
};

const formatFileSize = (sizeStr?: string): string => {
    if (!sizeStr) return 'Unknown size';
    const size = parseInt(sizeStr);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
</script>
