<template>
    <q-page padding>
        <div class="q-pa-md">
            <div class="row justify-center">
                <div class="col-12 col-md-10 col-lg-8">
                    <div class="text-h4 text-center q-mb-lg">External Image Demo</div>
                    <div class="text-body1 text-center q-mb-xl text-grey-7">
                        This page demonstrates the external image caching system for CORS-enabled external hosting
                        services.
                    </div>

                    <!-- URL Input Section -->
                    <q-card class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Test External Image URL</div>
                            <q-input v-model="testImageUrl" label="Image URL (Direct URL, Dropbox, etc.)"
                                placeholder="https://example.com/image.jpg" outlined class="q-mb-md">
                                <template v-slot:append>
                                    <q-btn icon="mdi-refresh" flat round @click="loadTestImage"
                                        :loading="testImageState.isLoading.value" />
                                </template>
                            </q-input>

                            <!-- Quick Test URLs -->
                            <div class="row q-gutter-sm q-mb-md">
                                <q-btn size="sm" outline label="Your Google Drive Image"
                                    @click="testImageUrl = googleDriveUrl" />
                                <q-btn size="sm" outline label="Random Placeholder"
                                    @click="testImageUrl = 'https://picsum.photos/800/600'" />
                            </div>

                            <!-- Image Options -->
                            <q-expansion-item icon="mdi-cog" label="Image Options" class="q-mb-md">
                                <q-card>
                                    <q-card-section>
                                        <div class="row q-gutter-md">
                                            <div class="col">
                                                <q-input v-model.number="imageOptions.maxWidth" type="number"
                                                    label="Max Width" outlined />
                                            </div>
                                            <div class="col">
                                                <q-input v-model.number="imageOptions.maxHeight" type="number"
                                                    label="Max Height" outlined />
                                            </div>
                                            <div class="col">
                                                <q-slider v-model="imageOptions.quality" :min="0.1" :max="1" :step="0.1"
                                                    label label-always color="primary" />
                                                <div class="text-caption text-center">Quality: {{ imageOptions.quality
                                                }}</div>
                                            </div>
                                        </div>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                        </q-card-section>
                    </q-card>

                    <!-- Test Image Display -->
                    <q-card class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Test Result</div>

                            <div v-if="testImageState.isLoading.value" class="text-center q-pa-lg">
                                <q-circular-progress :value="testImageState.loadProgress.value" size="50px"
                                    color="primary" show-value />
                                <div class="q-mt-md">Loading image... {{ Math.round(testImageState.loadProgress.value)
                                }}%</div>
                            </div>

                            <div v-else-if="testImageState.hasError.value" class="text-center q-pa-lg">
                                <q-icon name="mdi-alert-circle" size="3rem" color="negative" />
                                <div class="q-mt-md text-negative">Failed to load image</div>
                                <div class="text-caption">{{ testImageState.error.value?.message }}</div>
                                <q-btn label="Retry" icon="mdi-refresh" color="primary" outline class="q-mt-md"
                                    @click="testImageState.reload()" />
                            </div>

                            <div v-else-if="testImageState.imageUrl.value" class="text-center">
                                <img :src="testImageState.imageUrl.value" alt="Test Image"
                                    style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
                                <div class="q-mt-md">
                                    <q-btn icon="mdi-download" label="Download Cached Image" color="primary" outline
                                        @click="downloadCachedImage" />
                                </div>
                            </div>

                            <div v-else class="text-center q-pa-lg text-grey-5">
                                Enter an image URL above to test the caching system
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Cache Statistics -->
                    <q-card class="q-mb-lg">
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Cache Statistics</div>
                            <div class="row q-gutter-md">
                                <div class="col-auto">
                                    <q-circular-progress :value="cacheUsagePercentage" size="80px" :thickness="0.2"
                                        color="primary" track-color="grey-3" show-value />
                                    <div class="text-center text-caption">Storage Used</div>
                                </div>
                                <div class="col">
                                    <q-list>
                                        <q-item>
                                            <q-item-section>
                                                <q-item-label>Cached Images</q-item-label>
                                                <q-item-label caption>{{ cacheStats.count }} images</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item>
                                            <q-item-section>
                                                <q-item-label>Total Cache Size</q-item-label>
                                                <q-item-label caption>{{ formatFileSize(cacheStats.totalSize)
                                                }}</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                        <q-item v-if="cacheStats.oldestEntry">
                                            <q-item-section>
                                                <q-item-label>Oldest Entry</q-item-label>
                                                <q-item-label caption>{{ new
                                                    Date(cacheStats.oldestEntry).toLocaleString() }}</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                    </q-list>
                                </div>
                            </div>
                            <div class="q-mt-md">
                                <q-btn icon="mdi-refresh" label="Refresh Stats" color="primary" outline
                                    @click="refreshCacheStats" :loading="loadingStats" />
                                <q-btn icon="mdi-delete" label="Clear Cache" color="negative" outline class="q-ml-md"
                                    @click="clearCache" />
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Hero Component Demo -->
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Hero Component Demo</div>
                            <div class="text-body2 q-mb-md text-grey-7">
                                This demonstrates the HeroSection component using your Google Drive image:
                            </div>
                        </q-card-section>
                    </q-card>

                    <div class="q-mt-md" style="border-radius: 8px; overflow: hidden;">
                        <HeroSection :background-image="googleDriveUrl" title="Demo Hero Section"
                            subtitle="Using Google Drive image with caching" height="400px" variant="centered"
                            :overlay="true" overlay-color="rgba(0, 100, 150, 0.3)" :actions="heroActions"
                            :image-options="{
                                maxWidth: 1920,
                                maxHeight: 1080,
                                quality: 0.8
                            }" />
                    </div>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useExternalImage } from '../composables/useExternalImage';
import { externalImageService } from '../services/external-image-service';
import { formatFileSize } from '../utils/imageUtils';
import HeroSection from '../components/HeroSection.vue';

// Test image state
const testImageUrl = ref('');
const googleDriveUrl = 'https://picsum.photos/800/600?random=2'; // Working test URL
// const googleDriveUrl = 'https://drive.google.com/file/d/14M00bRp3NxPG2d1Itj-E9WAmmB_C6vWh/view?usp=drive_link'; // Your original Google Drive URL (CORS blocked)

// Image options
const imageOptions = ref({
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.9
});

// Test image composable
const testImageState = useExternalImage(
    testImageUrl,
    {
        lazy: true,
        ...imageOptions.value
    }
);

// Cache statistics
const cacheStats = ref({ count: 0, totalSize: 0, oldestEntry: undefined as number | undefined });
const loadingStats = ref(false);
const maxCacheSize = 50 * 1024 * 1024; // 50MB

// Hero actions for demo
const heroActions = [
    {
        label: 'Learn More',
        icon: 'mdi-information',
        color: 'primary',
        onClick: () => console.log('Learn more clicked')
    },
    {
        label: 'Contact',
        icon: 'mdi-phone',
        color: 'secondary',
        outline: true,
        onClick: () => console.log('Contact clicked')
    }
];

// Computed properties
const cacheUsagePercentage = computed(() => {
    return Math.min(100, (cacheStats.value.totalSize / maxCacheSize) * 100);
});

// Methods
async function loadTestImage() {
    if (!testImageUrl.value) return;
    await testImageState.load();
}

async function downloadCachedImage() {
    if (!testImageState.imageUrl.value) return;

    try {
        const response = await fetch(testImageState.imageUrl.value);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cached-image-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to download image:', error);
    }
}

async function refreshCacheStats() {
    loadingStats.value = true;
    try {
        const stats = await externalImageService.getCacheStats();
        cacheStats.value = {
            count: stats.count,
            totalSize: stats.totalSize,
            oldestEntry: stats.oldestEntry
        };
    } catch (error) {
        console.error('Failed to get cache stats:', error);
    } finally {
        loadingStats.value = false;
    }
}

async function clearCache() {
    try {
        await externalImageService.clearCache();
        await refreshCacheStats();
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
}

// Initialize
onMounted(() => {
    void refreshCacheStats();
    testImageUrl.value = googleDriveUrl;
});
</script>

<style scoped lang="scss">
.demo-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
