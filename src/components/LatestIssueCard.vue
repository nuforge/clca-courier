<template>
    <q-card v-if="latestIssue" :class="cardClasses" class="cursor-pointer hover-card q-mb-md latest-issue-card"
        @click="openLatestIssue">
        <q-card-section class="text-center q-pa-md">
            <div class="text-h6 q-mb-md text-weight-medium">
                <q-icon name="mdi-newspaper" class="q-mr-sm" />
                Latest Issue
            </div>

            <!-- Thumbnail -->
            <div class="thumbnail-container q-mb-sm">
                <div v-if="thumbnail" class="thumbnail-wrapper">
                    <q-img :src="thumbnail" :alt="latestIssue.title" class="thumbnail-image" fit="contain" />
                </div>
                <div v-else-if="loadingThumbnail" class="thumbnail-placeholder">
                    <q-spinner color="primary" size="2em" />
                    <div class="text-caption q-mt-sm">Loading...</div>
                </div>
                <div v-else class="thumbnail-placeholder">
                    <q-icon name="mdi-file-pdf-box" size="3em" color="red-6" />
                </div>
            </div>

            <div class="text-weight-medium">{{ latestIssue.title }}</div>
            <div class="text-caption" :class="greyTextClass">{{ latestIssue.date }}</div>
            <div class="text-caption q-mt-sm">{{ latestIssue.pages }} pages</div>

            <q-btn color="primary" label="Read Now" icon="mdi-eye" size="sm" class="q-mt-md full-width"
                @click.stop="openLatestIssue" />
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfViewer } from '../composables/usePdfViewer'
import { usePdfThumbnails } from '../composables/usePdfThumbnails'

const siteStore = useSiteStore()
const { openDocument } = usePdfViewer()
const { getThumbnail } = usePdfThumbnails()

// Get the latest issue from the store
const latestIssue = computed(() => siteStore.latestIssue)

// Thumbnail management
const thumbnail = ref<string | null>(null)
const loadingThumbnail = ref(false)

// Computed styles
const cardClasses = computed(() => {
    if (siteStore.isDarkMode) {
        return 'bg-dark text-white q-dark'
    } else {
        return 'bg-white text-dark'
    }
})

const greyTextClass = computed(() =>
    siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
)

// Load thumbnail for the latest issue
const loadThumbnail = async () => {
    if (!latestIssue.value) return

    loadingThumbnail.value = true
    try {
        const thumbnailData = await getThumbnail(latestIssue.value.url)
        if (thumbnailData) {
            thumbnail.value = thumbnailData
        }
    } catch (error) {
        console.error('Failed to load thumbnail for latest issue:', error)
    } finally {
        loadingThumbnail.value = false
    }
}

// Open the latest issue in the PDF viewer
const openLatestIssue = () => {
    if (latestIssue.value) {
        openDocument(latestIssue.value)
    }
}

// Load thumbnail when component mounts
onMounted(() => {
    if (latestIssue.value) {
        void loadThumbnail()
    }
})
</script>

<style lang="scss" scoped>
.latest-issue-card {
    max-width: 200px;
    transition: all 0.3s ease;
}

.hover-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.thumbnail-container {
    height: 120px;
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin: 0 auto;
}

.thumbnail-wrapper {
    position: relative;
    display: inline-block;
}

.thumbnail-image {
    width: 60px;
    height: 90px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-placeholder {
    height: 90px;
    width: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}
</style>
