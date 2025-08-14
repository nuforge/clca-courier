<template>
    <q-page class="q-pa-md">
        <div class="q-mb-lg">
            <h1 class="text-h3 q-mb-sm">Google Drive Integration Demo</h1>
            <p class="text-subtitle1 text-grey-7">
                This page demonstrates the Google Drive integration capabilities for accessing and managing images.
            </p>
        </div>

        <!-- Quick Test Section -->
        <div class="row q-gutter-lg">
            <div class="col-12 col-md-6">
                <q-card>
                    <q-card-section>
                        <div class="text-h6">Quick Test</div>
                        <div class="text-subtitle2 text-grey-7 q-mb-md">
                            Test loading images with Google Drive fallback
                        </div>

                        <div class="q-mb-md">
                            <q-input v-model="testImageUrl" label="Image URL" placeholder="Enter any image URL..."
                                clearable />
                        </div>

                        <div class="row q-gutter-sm">
                            <q-btn @click="testImageLoad" :loading="testLoading" color="primary" label="Test Load"
                                icon="mdi-image" />
                            <q-btn @click="clearTestImage" flat label="Clear" icon="mdi-close" />
                        </div>

                        <div v-if="testResult" class="q-mt-md">
                            <q-banner :class="testResult.success ? 'bg-green-1 text-green-8' : 'bg-red-1 text-red-8'"
                                rounded>
                                <template v-slot:avatar>
                                    <q-icon :name="testResult.success ? 'mdi-check-circle' : 'mdi-alert-circle'"
                                        :color="testResult.success ? 'green' : 'red'" />
                                </template>
                                <div>
                                    <strong>Source:</strong> {{ testResult.source }}<br>
                                    <strong>Cached:</strong> {{ testResult.cached ? 'Yes' : 'No' }}<br>
                                    <div v-if="testResult.error">
                                        <strong>Error:</strong> {{ testResult.error }}
                                    </div>
                                </div>
                            </q-banner>

                            <div v-if="testResult.success" class="q-mt-md">
                                <img :src="testResult.url" alt="Test image"
                                    style="max-width: 100%; max-height: 300px; object-fit: contain;"
                                    class="rounded-borders" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <div class="col-12 col-md-6">
                <q-card>
                    <q-card-section>
                        <div class="text-h6">Configuration Status</div>
                        <div class="q-mt-md">
                            <div class="row items-center q-mb-sm">
                                <q-icon :name="hasApiKey ? 'mdi-check-circle' : 'mdi-alert-circle'"
                                    :color="hasApiKey ? 'green' : 'orange'" class="q-mr-sm" />
                                <span>Google API Key: {{ hasApiKey ? 'Configured' : 'Missing' }}</span>
                            </div>

                            <div class="row items-center q-mb-sm">
                                <q-icon :name="hasClientId ? 'mdi-check-circle' : 'mdi-alert-circle'"
                                    :color="hasClientId ? 'green' : 'orange'" class="q-mr-sm" />
                                <span>Client ID: {{ hasClientId ? 'Configured' : 'Missing' }}</span>
                            </div>

                            <div class="row items-center q-mb-sm">
                                <q-icon :name="isServiceInitialized ? 'mdi-check-circle' : 'mdi-alert-circle'"
                                    :color="isServiceInitialized ? 'green' : 'orange'" class="q-mr-sm" />
                                <span>Service: {{ isServiceInitialized ? 'Initialized' : 'Not Initialized' }}</span>
                            </div>

                            <div v-if="!hasApiKey || !hasClientId" class="q-mt-md">
                                <q-banner class="bg-orange-1 text-orange-8" rounded>
                                    <template v-slot:avatar>
                                        <q-icon name="mdi-information" color="orange" />
                                    </template>
                                    Configure your Google Drive credentials in the <code>.env</code> file to enable full
                                    functionality.
                                </q-banner>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <!-- Google Drive Browser Component -->
        <div class="q-mt-lg">
            <GoogleDriveImageBrowser />
        </div>

        <!-- Sample URLs Section -->
        <div class="q-mt-lg">
            <q-card>
                <q-card-section>
                    <div class="text-h6">Sample Test URLs</div>
                    <div class="text-subtitle2 text-grey-7 q-mb-md">
                        Try these URLs to test the image loading system
                    </div>

                    <div class="q-gutter-sm">
                        <q-chip v-for="url in sampleUrls" :key="url.label" :label="url.label" clickable
                            @click="testImageUrl = url.url" color="primary" outline />
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Documentation Section -->
        <div class="q-mt-lg">
            <q-card>
                <q-card-section>
                    <div class="text-h6">Documentation</div>
                    <div class="q-mt-md">
                        <p>
                            This integration provides several key features:
                        </p>
                        <ul class="q-pl-md">
                            <li><strong>Automatic Fallback:</strong> When external images fail to load, the system can
                                search
                                Google Drive for alternatives</li>
                            <li><strong>Authenticated Access:</strong> Access private Google Drive files with user
                                permission
                            </li>
                            <li><strong>Advanced Caching:</strong> Images are cached locally using IndexedDB for
                                improved
                                performance</li>
                            <li><strong>Search Capabilities:</strong> Search across your Google Drive for specific
                                images</li>
                            <li><strong>Batch Operations:</strong> Download and process multiple images at once</li>
                        </ul>

                        <div class="q-mt-md">
                            <q-btn href="/GOOGLE_DRIVE_INTEGRATION.md" target="_blank" color="primary" outline
                                icon="mdi-book-open" label="View Full Documentation" />
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useExternalImageWithGoogleDrive } from 'src/composables/useExternalImageWithGoogleDrive';
import GoogleDriveImageBrowser from 'src/components/GoogleDriveImageBrowser.vue';
import type { ImageLoadResult } from 'src/composables/useExternalImageWithGoogleDrive';

const $q = useQuasar();
const imageService = useExternalImageWithGoogleDrive();

// Component state
const testImageUrl = ref('');
const testLoading = ref(false);
const testResult = ref<ImageLoadResult | null>(null);

// Configuration status
const hasApiKey = ref(false);
const hasClientId = ref(false);
const isServiceInitialized = ref(false);

// Sample URLs for testing
const sampleUrls = [
    {
        label: 'Valid Image',
        url: 'https://picsum.photos/400/300?random=1'
    },
    {
        label: 'Broken URL',
        url: 'https://example.com/nonexistent-image.jpg'
    },
    {
        label: 'Google Drive Sample',
        url: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view'
    },
    {
        label: 'CORS Blocked',
        url: 'https://cors-blocked-example.com/image.jpg'
    }
];

// Check configuration
onMounted(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    hasApiKey.value = !!(apiKey && apiKey !== 'your_api_key_here');
    hasClientId.value = !!(clientId && clientId !== 'your_client_id_here.apps.googleusercontent.com');

    if (hasApiKey.value && hasClientId.value) {
        try {
            imageService.initialize({
                enableGoogleDrive: true,
                googleDriveConfig: {
                    apiKey: apiKey,
                    clientId: clientId,
                },
            });
            isServiceInitialized.value = true;
        } catch (error) {
            console.error('Failed to initialize image service:', error);
            $q.notify({
                type: 'warning',
                message: 'Failed to initialize Google Drive service',
                position: 'top',
            });
        }
    }
});

// Test image loading
const testImageLoad = async () => {
    if (!testImageUrl.value) {
        $q.notify({
            type: 'warning',
            message: 'Please enter an image URL',
            position: 'top',
        });
        return;
    }

    testLoading.value = true;
    testResult.value = null;

    try {
        const options = {
            enableGoogleDrive: hasApiKey.value && hasClientId.value,
            maxWidth: 800,
            maxHeight: 600,
            quality: 0.9,
        };

        const result = await imageService.loadImage(testImageUrl.value, options);
        testResult.value = result;

        if (result.success) {
            $q.notify({
                type: 'positive',
                message: `Image loaded successfully from ${result.source}`,
                position: 'top',
            });
        } else {
            $q.notify({
                type: 'negative',
                message: `Failed to load image: ${result.error}`,
                position: 'top',
            });
        }
    } catch (error) {
        console.error('Image load test failed:', error);
        $q.notify({
            type: 'negative',
            message: 'Image load test failed',
            position: 'top',
        });
    } finally {
        testLoading.value = false;
    }
};

// Clear test image
const clearTestImage = () => {
    testImageUrl.value = '';
    testResult.value = null;
};
</script>

<style lang="scss" scoped>
.q-page {
    max-width: 1200px;
    margin: 0 auto;
}

code {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
}

ul {
    line-height: 1.6;
}
</style>
