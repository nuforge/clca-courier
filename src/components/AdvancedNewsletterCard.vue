<template>
  <q-card class="newsletter-card full-height" flat>
    <!-- Header with title and date -->
    <q-card-section class="q-pb-sm">
      <div class="row items-start justify-between">
        <div class="col-12">
          <div class="text-h6 q-mb-xs line-clamp-2 text-break">{{ newsletter.title }}</div>
          <div class="text-subtitle2 text-grey-6">
            {{ formatDate(newsletter.date) }}
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- Thumbnail preview with advanced fallback system -->
    <q-card-section class="q-pa-sm">
      <div class="thumbnail-container">
        <div class="newsletter-thumbnail-wrapper" :class="{ 'no-sources': !hasLocalSource && !hasDriveSource }"
          @click="openWebViewer">
          <!-- Local thumbnail (highest priority) -->
          <q-img v-if="localThumbnailUrl && !thumbnailError.local" :src="localThumbnailUrl"
            :alt="`${newsletter.title} cover`" class="rounded-borders newsletter-thumbnail" loading="lazy" fit="cover"
            :ratio="1 / 1.3" @error="onLocalThumbnailError">
            <!-- Hover overlay -->
            <div class="absolute-full newsletter-overlay flex flex-center">
              <q-btn round color="primary" icon="visibility" size="lg" class="overlay-btn">
                <q-tooltip>{{ viewTooltipText }}</q-tooltip>
              </q-btn>
            </div>
          </q-img>

          <!-- Generated thumbnail from content (medium priority) -->
          <div v-else-if="generatedThumbnail && !thumbnailError.generated"
            class="generated-thumbnail rounded-borders newsletter-thumbnail"
            :style="{ backgroundImage: `url(${generatedThumbnail})` }">
            <div class="absolute-full newsletter-overlay flex flex-center">
              <q-btn round color="primary" icon="visibility" size="lg" class="overlay-btn">
                <q-tooltip>{{ viewTooltipText }}</q-tooltip>
              </q-btn>
            </div>
            <!-- Loading indicator for generation -->
            <div v-if="isGeneratingThumbnail" class="absolute-full flex flex-center bg-black-50">
              <q-spinner color="white" size="2rem" />
            </div>
          </div>

          <!-- Fallback thumbnail (lowest priority) -->
          <div v-else class="fallback-thumbnail rounded-borders newsletter-thumbnail flex flex-center column">
            <q-icon name="description" size="3rem" class="text-grey-5" />
            <div class="text-caption text-grey-6 q-mt-sm">{{ newsletter.title }}</div>
            <div class="text-caption text-grey-7">{{ formatDate(newsletter.date) }}</div>

            <!-- Hover overlay -->
            <div class="absolute-full newsletter-overlay flex flex-center">
              <q-btn round color="primary" icon="visibility" size="lg" class="overlay-btn">
                <q-tooltip>{{ viewTooltipText }}</q-tooltip>
              </q-btn>
            </div>

            <!-- Generate thumbnail button -->
            <div class="absolute-bottom-right q-pa-sm">
              <q-btn v-if="canGenerateThumbnail && !isGeneratingThumbnail" round size="sm" color="secondary"
                icon="auto_awesome" @click.stop="generateThumbnail" class="generate-thumb-btn">
                <q-tooltip>Generate Thumbnail</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- Newsletter metadata -->
    <q-card-section class="q-py-sm">
      <div class="row items-center justify-between text-body2 text-grey-7">
        <div class="col-12">
          <div class="row items-center q-gutter-md">
            <div v-if="validPageCount" class="flex items-center no-wrap">
              <q-icon name="description" size="sm" class="q-mr-xs" />
              <span class="text-nowrap">{{ validPageCount }} pages</span>
            </div>

            <div v-if="displayFileSize" class="flex items-center no-wrap">
              <q-icon name="storage" size="sm" class="q-mr-xs" />
              <span class="text-nowrap">{{ displayFileSize }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tags and Topics -->
      <div v-if="newsletter.tags && newsletter.tags.length > 0" class="q-mt-sm">
        <div class="row q-gutter-xs">
          <q-chip v-for="tag in newsletter.tags.slice(0, 3)" :key="tag" dense size="sm" outline color="primary"
            class="text-caption">
            {{ tag }}
          </q-chip>
          <q-chip v-if="newsletter.tags.length > 3" dense size="sm" outline color="grey" class="text-caption">
            +{{ newsletter.tags.length - 3 }} more
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <!-- Actions -->
    <q-card-actions align="around" class="q-pt-none">
      <!-- View button - always primary action if local source available -->
      <q-btn v-if="hasLocalSource" flat color="primary" icon="visibility" label="View" size="sm" @click="openWebViewer"
        class="col">
        <q-tooltip>View in PDF viewer</q-tooltip>
      </q-btn>

      <!-- Download button logic based on available sources -->
      <!-- If both local and drive available, show high-quality drive download -->
      <q-btn v-if="hasDriveSource" flat color="info" icon="cloud_download"
        :label="hasLocalSource ? 'High Quality' : 'Download'" size="sm" @click="downloadFromDrive" class="col">
        <q-tooltip>Download from Google Drive</q-tooltip>
      </q-btn>

      <!-- Local download only if drive is not available -->
      <q-btn v-if="hasLocalSource && !hasDriveSource" flat color="secondary" icon="download" label="Download" size="sm"
        @click="downloadLocal" class="col">
        <q-tooltip>Download local version</q-tooltip>
      </q-btn>

      <!-- If only drive source available, provide view option via Drive -->
      <q-btn v-if="hasDriveSource && !hasLocalSource" flat color="primary" icon="open_in_new" label="View" size="sm"
        @click="downloadFromDrive" class="col">
        <q-tooltip>View in Google Drive</q-tooltip>
      </q-btn>

      <!-- More Options Menu -->
      <q-btn-dropdown flat color="grey-7" icon="more_vert" dropdown-icon="" auto-close class="col-auto">
        <q-list>
          <!-- Newsletter Details -->
          <q-item clickable @click="showDetails = true">
            <q-item-section avatar>
              <q-icon name="info" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Details</q-item-label>
              <q-item-label caption>View metadata and info</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Copy Link -->
          <q-item clickable @click="copyLink">
            <q-item-section avatar>
              <q-icon name="link" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Copy Link</q-item-label>
              <q-item-label caption>Copy shareable URL</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Check File Availability -->
          <q-item v-if="props.newsletter.localFile" clickable @click="validateLocalFile"
            :disable="fileValidation.isValidating">
            <q-item-section avatar>
              <q-icon :name="fileValidation.isValidating ? 'hourglass_empty' : 'refresh'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ fileValidation.isValidating ? 'Checking...' : 'Check Availability' }}</q-item-label>
              <q-item-label caption>Verify if local file still exists</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </q-card-actions>

    <!-- Details Dialog -->
    <q-dialog v-model="showDetails">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="info" color="primary" text-color="white" />
          <span class="q-ml-sm text-h6">Newsletter Details</span>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-sm">
            <div><strong>Title:</strong> {{ newsletter.title }}</div>
            <div><strong>Date:</strong> {{ formatDate(newsletter.date) }}</div>
            <div v-if="validPageCount"><strong>Pages:</strong> {{ validPageCount }}</div>
            <div><strong>Filename:</strong> {{ newsletter.filename }}</div>
            <div v-if="displayFileSize"><strong>File Size:</strong> {{ displayFileSize }}</div>
            <div v-if="newsletter.publishDate">
              <strong>Published:</strong> {{ formatDate(newsletter.publishDate) }}
            </div>
            <div v-if="newsletter.topics?.length">
              <strong>Topics:</strong> {{ newsletter.topics.join(', ') }}
            </div>
            <div v-if="newsletter.tags?.length">
              <strong>Tags:</strong> {{ newsletter.tags.join(', ') }}
            </div>
            <div v-if="hasLocalSource || hasDriveSource">
              <strong>Available Sources:</strong>
              <div class="q-mt-xs q-gutter-xs">
                <q-chip v-if="hasLocalSource" dense size="sm" color="primary" text-color="white">
                  Local
                  <q-tooltip v-if="fileValidation.lastChecked">
                    Last verified: {{ fileValidation.lastChecked.toLocaleTimeString() }}
                  </q-tooltip>
                </q-chip>
                <q-chip v-if="hasDriveSource" dense size="sm" color="secondary" text-color="white">Google Drive</q-chip>
              </div>
            </div>

            <!-- File validation status -->
            <div v-if="props.newsletter.localFile">
              <strong>Local File Status:</strong>
              <div class="q-mt-xs">
                <q-badge v-if="fileValidation.isValidating" color="orange" icon="hourglass_empty" label="Checking..." />
                <q-badge v-else-if="fileValidation.localFileExists === true" color="green" icon="check_circle"
                  label="Available" />
                <q-badge v-else-if="fileValidation.localFileExists === false" color="red" icon="error"
                  label="Not found" />
                <q-badge v-else color="grey" icon="help" label="Not checked" />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { date, useQuasar } from 'quasar'
import { usePdfThumbnails } from '../composables/usePdfThumbnails'
import { usePdfViewer } from '../composables/usePdfViewer'
import { getPublicPath } from '../utils/path-utils'
import { convertToViewUrl } from '../utils/googleDriveUtils'
import { validatePdfFile } from '../utils/pdfValidator'
import type { NewsletterMetadata } from '../services/newsletter-service'
import { logger } from '../utils/logger'

interface Props {
  newsletter: NewsletterMetadata
  showSourceIndicators?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSourceIndicators: false
})

const $q = useQuasar()

// UI state
const showDetails = ref(false)

// Thumbnail management
const { getThumbnail, regenerateThumbnail } = usePdfThumbnails()
const pdfViewer = usePdfViewer()

// State
const generatedThumbnail = ref<string | null>(null)
const isGeneratingThumbnail = ref(false)
const thumbnailError = ref({
  local: false,
  generated: false
})

// File validation state
const fileValidation = ref({
  localFileExists: null as boolean | null,
  isValidating: false,
  lastChecked: null as Date | null
})

// Computed properties for source detection
const hasLocalSource = computed(() => {
  const hasFileProperty = props.newsletter.localFile && props.newsletter.localFile.length > 0

  // TEMPORARILY DISABLED: File validation causes issues in development
  // During development, trust the metadata rather than HTTP validation
  if (import.meta.env.DEV) {
    return hasFileProperty
  }

  // In production, use validated result if available
  if (fileValidation.value.localFileExists === null) {
    return hasFileProperty
  }

  // Use validated result
  return hasFileProperty && fileValidation.value.localFileExists
})

const hasDriveSource = computed(() =>
  props.newsletter.driveId && props.newsletter.driveId.length > 0
)

const canGenerateThumbnail = computed(() =>
  hasLocalSource.value && !generatedThumbnail.value && !isGeneratingThumbnail.value
)

// Thumbnail URLs with priority system
const localThumbnailUrl = computed(() => {
  if (props.newsletter.thumbnailPath) {
    return getPublicPath(`thumbnails/${props.newsletter.thumbnailPath}`)
  }

  // Generate thumbnail path from filename
  if (hasLocalSource.value) {
    const filename = props.newsletter.filename
    const thumbnailName = filename.replace('.pdf', '.jpg')
    return getPublicPath(`thumbnails/${thumbnailName}`)
  }

  return null
})

// Tooltip text for view buttons
const viewTooltipText = computed(() => {
  if (hasLocalSource.value) return 'View Newsletter'
  if (hasDriveSource.value) return 'View from Cloud'
  return 'Newsletter not available'
})

// File size and page validation
const validPageCount = computed(() => {
  const pages = props.newsletter.pages
  return pages && pages > 0 ? pages : null
})

const displayFileSize = computed(() => {
  return props.newsletter.fileSize || null
})

// Methods
const formatDate = (dateString: string): string => {
  try {
    const parsedDate = new Date(dateString)
    return date.formatDate(parsedDate, 'MMMM YYYY')
  } catch {
    return dateString
  }
}

const onLocalThumbnailError = () => {
  logger.debug('Local thumbnail failed to load, trying generation')
  thumbnailError.value.local = true

  // Try to generate thumbnail if possible
  if (canGenerateThumbnail.value) {
    void generateThumbnail()
  }
}

const generateThumbnail = async () => {
  if (!hasLocalSource.value || isGeneratingThumbnail.value) return

  try {
    isGeneratingThumbnail.value = true
    logger.debug('Generating thumbnail for:', props.newsletter.title)

    const pdfUrl = getPublicPath(`issues/${props.newsletter.localFile}`)
    const thumbnail = await regenerateThumbnail(pdfUrl)

    if (thumbnail) {
      generatedThumbnail.value = thumbnail
      logger.success('Generated thumbnail for:', props.newsletter.title)
    } else {
      thumbnailError.value.generated = true
      logger.warn('Failed to generate thumbnail for:', props.newsletter.title)
    }
  } catch (error) {
    logger.error('Error generating thumbnail:', error)
    thumbnailError.value.generated = true
  } finally {
    isGeneratingThumbnail.value = false
  }
}

const openWebViewer = () => {
  // Try local source first - use URL from newsletter metadata
  if (props.newsletter.localFile && props.newsletter.url) {
    console.log('Opening PDF with URL:', props.newsletter.url)
    console.log('Newsletter data:', props.newsletter)

    // Use the URL from newsletter metadata (already properly constructed)
    pdfViewer.openDocument({
      id: props.newsletter.id,
      title: props.newsletter.title,
      date: props.newsletter.date,
      pages: props.newsletter.pages || 0,
      url: props.newsletter.url, // Use the URL from metadata
      filename: props.newsletter.filename
    })
    return
  }

  // Fallback to cloud version if available
  if (hasDriveSource.value) {
    logger.info('Using cloud version as fallback for viewing:', props.newsletter.title)

    // Convert Google Drive ID to direct view URL for PDF viewer using utility
    const driveViewUrl = convertToViewUrl(`https://drive.google.com/file/d/${props.newsletter.driveId}/view`)

    pdfViewer.openDocument({
      id: props.newsletter.id,
      title: props.newsletter.title,
      date: props.newsletter.date,
      pages: props.newsletter.pages || 0,
      url: driveViewUrl,
      filename: props.newsletter.filename
    })
    return
  }

  // No sources available - provide user feedback
  logger.warn('No local or cloud source available for viewing:', props.newsletter.title)

  $q.notify({
    type: 'warning',
    message: 'Newsletter not available for viewing',
    caption: 'This newsletter is currently not available in local storage or cloud.',
    icon: 'warning',
    position: 'bottom',
    timeout: 3000
  })
}

const downloadFromDrive = () => {
  if (!hasDriveSource.value) {
    logger.warn('No Google Drive source available')
    return
  }

  // Open Google Drive download URL in new tab
  const driveDownloadUrl = `https://drive.google.com/file/d/${props.newsletter.driveId}/view`
  window.open(driveDownloadUrl, '_blank')
}

const downloadLocal = () => {
  if (!hasLocalSource.value) {
    logger.warn('No local source available for download')
    return
  }

  // Create download link for local file
  const pdfUrl = getPublicPath(`issues/${props.newsletter.localFile}`)
  const link = document.createElement('a')
  link.href = pdfUrl
  link.download = props.newsletter.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const copyLink = async () => {
  try {
    const url = hasLocalSource.value
      ? `${window.location.origin}/archive?view=${props.newsletter.filename}`
      : `https://drive.google.com/file/d/${props.newsletter.driveId}/view`

    await navigator.clipboard.writeText(url)

    $q.notify({
      type: 'positive',
      message: 'Link copied to clipboard!',
      position: 'bottom'
    })
  } catch (error) {
    logger.error('Failed to copy link:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to copy link',
      position: 'bottom'
    })
  }
}

// File validation methods
const validateLocalFile = async (): Promise<boolean> => {
  if (!props.newsletter.localFile) {
    fileValidation.value.localFileExists = false
    return false
  }

  if (fileValidation.value.isValidating) {
    return fileValidation.value.localFileExists || false
  }

  fileValidation.value.isValidating = true

  try {
    const pdfUrl = getPublicPath(`issues/${props.newsletter.localFile}`)
    const validation = await validatePdfFile(pdfUrl)

    fileValidation.value.localFileExists = validation.isValid
    fileValidation.value.lastChecked = new Date()

    if (!validation.isValid) {
      logger.warn(`Local file validation failed for ${props.newsletter.filename}:`, validation.error)
    } else {
      logger.debug(`Local file validated successfully for ${props.newsletter.filename}`)
    }

    return validation.isValid
  } catch (error) {
    logger.error('Error validating local file:', error)
    fileValidation.value.localFileExists = false
    return false
  } finally {
    fileValidation.value.isValidating = false
  }
}

// TEMPORARILY DISABLED: File validation during development
// Revalidate file if it's been a while since last check
// const shouldRevalidateFile = (): boolean => {
//   if (!fileValidation.value.lastChecked) return true
//
//   const timeSinceCheck = Date.now() - fileValidation.value.lastChecked.getTime()
//   const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
//
//   return timeSinceCheck > fiveMinutes
// }

// Try to load existing thumbnail on mount
onMounted(async () => {
  // TEMPORARILY DISABLED: File validation during development
  // Only validate in production builds where static file serving is stable
  if (import.meta.env.PROD && props.newsletter.localFile && fileValidation.value.localFileExists === null) {
    await validateLocalFile()
  }

  if (hasLocalSource.value && !localThumbnailUrl.value) {
    try {
      const pdfUrl = getPublicPath(`issues/${props.newsletter.localFile}`)
      const thumbnail = await getThumbnail(pdfUrl)
      if (thumbnail) {
        generatedThumbnail.value = thumbnail
      }
    } catch {
      logger.debug('No cached thumbnail found for:', props.newsletter.title)
    }
  }
})
</script>

<style scoped>
.newsletter-card {
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.q-dark .newsletter-card {
  border-color: rgba(255, 255, 255, 0.28);
}

.newsletter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.thumbnail-container {
  aspect-ratio: 1 / 1.3;
  border-radius: 4px;
  overflow: hidden;
}

.newsletter-thumbnail-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
}

.newsletter-thumbnail-wrapper.no-sources {
  cursor: not-allowed;
  opacity: 0.7;
}

.newsletter-thumbnail-wrapper.no-sources:hover {
  opacity: 0.7;
}

.newsletter-thumbnail {
  width: 100%;
  height: 100%;
}

.generated-thumbnail {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.fallback-thumbnail {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #666;
  text-align: center;
  padding: 16px;
  position: relative;
}

.q-dark .fallback-thumbnail {
  background: linear-gradient(135deg, #424242 0%, #303030 100%);
  color: #bbb;
}

.newsletter-overlay {
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.newsletter-thumbnail-wrapper:hover .newsletter-overlay {
  opacity: 1;
}

.newsletter-thumbnail-wrapper.no-sources .newsletter-overlay {
  display: none;
}

.overlay-btn {
  transform: scale(0.8);
  transition: transform 0.3s ease;
}

.newsletter-thumbnail-wrapper:hover .overlay-btn {
  transform: scale(1);
}

.generate-thumb-btn {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fallback-thumbnail:hover .generate-thumb-btn {
  opacity: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-break {
  word-break: break-word;
}

.absolute-top-right {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}

.absolute-bottom-right {
  position: absolute;
  bottom: 0;
  right: 0;
}

.bg-black-50 {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
