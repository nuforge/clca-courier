<template>
  <div class="google-drive-image-browser q-pa-md">
    <div class="row q-gutter-md">
      <!-- Authentication Section -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Google Drive Integration</div>
            <div class="text-subtitle2">
              Authenticate with Google Drive to access your images
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-gutter-md items-center">
              <q-btn v-if="!isAuthenticated" @click="authenticate" :loading="isLoading" color="primary"
                icon="mdi-google-drive" label="Connect to Google Drive" />

              <div v-else class="row q-gutter-sm items-center">
                <q-icon name="mdi-check-circle" color="green" size="sm" />
                <span class="text-positive">Connected to Google Drive</span>
                <q-btn @click="signOut" color="negative" flat label="Disconnect" />
              </div>
            </div>

            <div v-if="error" class="text-negative q-mt-sm">
              {{ error }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Search Section -->
      <div v-if="isAuthenticated" class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Search Images</div>
            <div class="row q-gutter-md q-mt-sm">
              <div class="col">
                <q-input v-model="searchQuery" label="Search for images" placeholder="Enter search query..."
                  @keyup.enter="searchImages" clearable>
                  <template v-slot:append>
                    <q-btn @click="searchImages" :loading="isLoading" color="primary" icon="mdi-magnify" flat round />
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Image Grid Section -->
      <div v-if="isAuthenticated && images.length > 0" class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Images ({{ images.length }})</div>
            <div class="row q-gutter-md q-mt-sm">
              <div v-for="image in images" :key="image.id" class="col-xs-12 col-sm-6 col-md-4 col-lg-3">
                <q-card class="image-card">
                  <div class="image-container">
                    <img :src="getThumbnailUrl(image.id)" :alt="image.name" class="image-thumbnail"
                      @error="onImageError" @load="onImageLoad" />
                    <div class="image-overlay">
                      <q-btn @click="previewImage(image)" color="white" text-color="primary" icon="mdi-eye" size="sm"
                        round />
                      <q-btn @click="downloadImage(image)" color="white" text-color="primary" icon="mdi-download"
                        size="sm" round />
                      <q-btn @click="copyImageUrl(image)" color="white" text-color="primary" icon="mdi-link" size="sm"
                        round />
                    </div>
                  </div>

                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-weight-medium ellipsis">
                      {{ image.name }}
                    </div>
                    <div class="text-caption text-grey">
                      {{ formatFileSize(parseInt(image.size || '0')) }}
                    </div>
                    <div class="text-caption text-grey">
                      {{ formatDate(image.modifiedTime) }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="col-12 text-center q-pa-xl">
        <q-spinner-dots size="50px" color="primary" />
        <div class="q-mt-sm">Loading images...</div>
      </div>

      <!-- Empty State -->
      <div v-if="isAuthenticated && !isLoading && images.length === 0" class="col-12 text-center q-pa-xl">
        <q-icon name="mdi-image-off" size="64px" color="grey-5" />
        <div class="q-mt-sm text-grey-6">
          No images found. Try searching for specific images.
        </div>
      </div>
    </div>

    <!-- Image Preview Dialog -->
    <q-dialog v-model="previewDialog" maximized>
      <q-card v-if="selectedImage">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedImage.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-none flex flex-center">
          <img :src="getDirectUrl(selectedImage.id)" :alt="selectedImage.name"
            style="max-width: 100%; max-height: 80vh; object-fit: contain;" />
        </q-card-section>

        <q-card-actions align="center">
          <q-btn @click="downloadImage(selectedImage)" color="primary" icon="mdi-download" label="Download" />
          <q-btn @click="copyImageUrl(selectedImage)" color="primary" icon="mdi-link" label="Copy URL" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useGoogleDrive } from 'src/composables/useGoogleDrive';
import type { GoogleDriveFileInfo } from 'src/services/google-drive-browser-service';

const $q = useQuasar();
const googleDrive = useGoogleDrive();

// Component state
const searchQuery = ref('');
const images = ref<GoogleDriveFileInfo[]>([]);
const selectedImage = ref<GoogleDriveFileInfo | null>(null);
const previewDialog = ref(false);

// Computed properties
const isAuthenticated = computed(() => googleDrive.isAuthenticated.value);
const isLoading = computed(() => googleDrive.isLoading.value);
const error = computed(() => googleDrive.error.value);

// Initialize Google Drive
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
const authenticate = async () => {
  try {
    const success = await googleDrive.authenticate();
    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Successfully connected to Google Drive',
        position: 'top',
      });
      // Load some initial images
      await searchImages();
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to connect to Google Drive',
      position: 'top',
    });
  }
};

const signOut = async () => {
  try {
    await googleDrive.signOut();
    images.value = [];
    $q.notify({
      type: 'info',
      message: 'Disconnected from Google Drive',
      position: 'top',
    });
  } catch {
    console.error('Sign out error');
    $q.notify({
      type: 'negative',
      message: 'Sign out failed',
      position: 'top',
    });
  }
};

const searchImages = async () => {
  if (!isAuthenticated.value) return;

  try {
    const results = await googleDrive.searchImages(searchQuery.value || undefined);
    images.value = results;

    if (results.length === 0) {
      $q.notify({
        type: 'info',
        message: 'No images found for your search',
        position: 'top',
      });
    }
  } catch (err) {
    console.error('Search error:', err);
    $q.notify({
      type: 'negative',
      message: 'Failed to search images',
      position: 'top',
    });
  }
};

const previewImage = (image: GoogleDriveFileInfo) => {
  selectedImage.value = image;
  previewDialog.value = true;
};

const downloadImage = async (image: GoogleDriveFileInfo) => {
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
        message: `Downloaded ${image.name}`,
        position: 'top',
      });
    }
  } catch (err) {
    console.error('Download error:', err);
    $q.notify({
      type: 'negative',
      message: 'Failed to download image',
      position: 'top',
    });
  }
};

const copyImageUrl = (image: GoogleDriveFileInfo) => {
  const url = getDirectUrl(image.id);
  void navigator.clipboard.writeText(url).then(() => {
    $q.notify({
      type: 'positive',
      message: 'Image URL copied to clipboard',
      position: 'top',
    });
  });
};

const getThumbnailUrl = (fileId: string): string => {
  return googleDrive.getFileUrls(fileId).thumbnail;
};

const getDirectUrl = (fileId: string): string => {
  return googleDrive.getFileUrls(fileId).direct;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString();
};

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.warn('Failed to load image:', img.src);
};

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.log('Image loaded successfully:', img.src);
};
</script>

<style lang="scss" scoped>
.google-drive-image-browser {
  max-width: 1200px;
  margin: 0 auto;
}

.image-card {
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);

    .image-overlay {
      opacity: 1;
    }
  }
}

.image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.image-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
