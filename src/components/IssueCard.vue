<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteStore } from '../stores/site-store-simple'
import { usePdfViewer } from '../composables/usePdfViewer'
import type { PdfDocument } from '../composables/usePdfViewer'

interface Props {
  issue: PdfDocument
  thumbnail?: string | undefined
  isLoading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'regenerate-thumbnail': [issue: PdfDocument, event?: Event]
}>()

const router = useRouter()
const siteStore = useSiteStore()
const { openDocument } = usePdfViewer()

// Computed property for card theme classes
const cardClasses = computed(() => {
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

const greyTextClass = computed(() =>
  siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
)

function handleCardClick() {
  // Navigate to issue details page
  void router.push(`/archive/${props.issue.id}`)
}

function handlePdfClick(event: Event) {
  event.stopPropagation() // Prevent card click
  openDocument(props.issue)
}

function handleRegenerateThumbnail(event: Event) {
  event.stopPropagation() // Prevent card click
  emit('regenerate-thumbnail', props.issue, event)
}
</script>

<template>
  <q-card :class="cardClasses" class="cursor-pointer hover-card" @click="handleCardClick">
    <q-card-section class="text-center">

      <div class="text-weight-medium">{{ issue.title }}</div>
      <!-- Thumbnail or placeholder -->
      <div class="thumbnail-container q-mb-sm">
        <div v-if="thumbnail" class="thumbnail-wrapper">
          <q-img :src="thumbnail" :alt="issue.title" class="thumbnail-image" fit="contain" />
          <div class="thumbnail-overlay" @click="handlePdfClick">
            <q-icon name="mdi-eye" size="2em" color="white" />
            <div class="text-white text-weight-medium q-mt-xs">View PDF</div>
          </div>
          <q-btn flat dense size="xs" icon="mdi-refresh" color="primary" @click="handleRegenerateThumbnail"
            class="thumbnail-refresh-btn" title="Regenerate thumbnail">
            <q-tooltip>Regenerate thumbnail</q-tooltip>
          </q-btn>
        </div>
        <div v-else-if="isLoading" class="thumbnail-placeholder">
          <q-spinner color="primary" size="2em" />
          <div class="text-caption q-mt-sm">Generating thumbnail...</div>
        </div>
        <div v-else class="thumbnail-placeholder">
          <q-icon name="mdi-file-pdf-box" size="3em" color="red-6" />
          <q-btn flat dense size="sm" icon="mdi-refresh" color="primary" @click="handleRegenerateThumbnail"
            class="q-mt-xs" title="Generate thumbnail">
            <q-tooltip>Generate thumbnail</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div class="text-caption" :class="greyTextClass">{{ issue.date }}</div>

    </q-card-section>
  </q-card>
</template>

<style scoped>
.hover-card {
  transition: all 0.3s ease;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.thumbnail-container {
  min-height: 140px;
  max-height: 200px;
  min-width: 100px;
  max-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 0 auto;
}

.thumbnail-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
}

.thumbnail-image {
  max-width: 200px;
  max-height: 200px;
  min-width: 60px;
  min-height: 80px;
  width: auto;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 4px;
  cursor: pointer;
}

.thumbnail-wrapper:hover .thumbnail-overlay {
  opacity: 1;
}

.thumbnail-refresh-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  min-height: 20px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.thumbnail-wrapper:hover .thumbnail-refresh-btn {
  opacity: 1;
}
</style>
