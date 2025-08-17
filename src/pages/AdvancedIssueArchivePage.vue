<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12">
          <!-- Header Card -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-bookshelf" class="q-mr-sm" />
                Newsletter Archive
              </div>
              <p class="text-body1">
                Browse through past issues of The Courier with advanced search and filtering.
                Find issues by content, filter by availability, and view with multiple source options.
              </p>

              <!-- Service Statistics -->
              <div v-if="hybridNewsletters.serviceStats.value" class="q-mt-md">
                <div class="row q-gutter-md text-center">
                  <div class="col">
                    <div class="text-h6 text-primary">{{
                      hybridNewsletters.serviceStats.value.totalNewsletters }}</div>
                    <div class="text-caption">Total Issues</div>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-positive">{{
                      hybridNewsletters.serviceStats.value.sourceCounts.hybrid }}</div>
                    <div class="text-caption">Multiple Sources</div>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-info">{{
                      hybridNewsletters.serviceStats.value.sourceCounts.local }}</div>
                    <div class="text-caption">Web Viewable</div>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-secondary">{{
                      hybridNewsletters.serviceStats.value.sourceCounts.drive }}</div>
                    <div class="text-caption">Archive Only</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Search and Filter Interface -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <!-- Main Search Bar -->
              <div class="row q-gutter-md q-mb-md">
                <div class="col-12 col-md-8">
                  <q-input v-model="searchQuery" label="Search newsletters by title, content, or tags..." outlined dense
                    :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }" clearable
                    @clear="searchQuery = ''">
                    <template v-slot:prepend>
                      <q-icon name="search" />
                    </template>
                    <template v-slot:append>
                      <q-btn flat dense round icon="tune" @click="showFilters = !showFilters" color="primary">
                        <q-tooltip>{{ showFilters ? 'Hide' : 'Show' }} Filters</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-md-4">
                  <q-select v-model="quickSort" :options="quickSortOptions" label="Quick Sort" outlined dense emit-value
                    map-options :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }">
                    <template v-slot:prepend>
                      <q-icon name="sort" />
                    </template>
                  </q-select>
                </div>
              </div>

              <!-- Advanced Filters (Collapsible) -->
              <q-slide-transition>
                <div v-show="showFilters">
                  <q-separator class="q-mb-md" />

                  <div class="text-subtitle2 q-mb-md text-weight-medium">
                    <q-icon name="filter_list" class="q-mr-xs" />
                    Filters
                  </div>

                  <div class="row q-gutter-md q-mb-md">
                    <!-- Year Filter -->
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-select v-model="filters.year" :options="yearFilterOptions" label="Year" outlined dense
                        clearable emit-value map-options
                        :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }">
                        <template v-slot:prepend>
                          <q-icon name="event" />
                        </template>
                      </q-select>
                    </div>

                    <!-- Source Availability Filter -->
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-select v-model="filters.availability" :options="availabilityOptions" label="Available As"
                        outlined dense clearable emit-value map-options
                        :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }">
                        <template v-slot:prepend>
                          <q-icon name="source" />
                        </template>
                      </q-select>
                    </div>

                    <!-- Page Count Filter -->
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-select v-model="filters.pageCount" :options="pageCountOptions" label="Page Count" outlined
                        dense clearable emit-value map-options
                        :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }">
                        <template v-slot:prepend>
                          <q-icon name="description" />
                        </template>
                      </q-select>
                    </div>

                    <!-- Actions Filter -->
                    <div class="col-12 col-sm-6 col-md-3">
                      <q-select v-model="filters.actions" :options="actionOptions" label="Actions" outlined dense
                        clearable emit-value map-options
                        :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }">
                        <template v-slot:prepend>
                          <q-icon name="play_circle" />
                        </template>
                      </q-select>
                    </div>
                  </div>

                  <!-- Filter Actions -->
                  <div class="row items-center">
                    <q-btn flat label="Clear All Filters" icon="clear_all" color="negative" size="sm"
                      @click="clearAllFilters" :disable="!hasActiveFilters" />

                    <q-space />

                    <!-- Active Filter Chips -->
                    <div v-if="hasActiveFilters" class="q-gutter-xs">
                      <q-chip v-if="filters.year" removable @remove="filters.year = null" color="primary"
                        text-color="white" dense>
                        Year: {{ filters.year }}
                      </q-chip>
                      <q-chip v-if="filters.availability" removable @remove="filters.availability = null"
                        color="secondary" text-color="white" dense>
                        {{availabilityOptions.find(o => o.value === filters.availability)?.label}}
                      </q-chip>
                      <q-chip v-if="filters.pageCount" removable @remove="filters.pageCount = null" color="info"
                        text-color="white" dense>
                        {{pageCountOptions.find(o => o.value === filters.pageCount)?.label}}
                      </q-chip>
                      <q-chip v-if="filters.actions" removable @remove="filters.actions = null" color="positive"
                        text-color="white" dense>
                        {{actionOptions.find(o => o.value === filters.actions)?.label}}
                      </q-chip>
                    </div>
                  </div>
                </div>
              </q-slide-transition>

              <!-- View Controls and Results -->
              <div class="row items-center q-mt-md">
                <q-btn-toggle v-model="groupByYear" :options="[
                  { label: 'Grid', value: false, icon: 'grid_view' },
                  { label: 'By Year', value: true, icon: 'view_list' }
                ]" color="primary" toggle-color="secondary" flat />

                <q-space />

                <!-- Results Summary -->
                <div class="text-body2" :class="greyTextClass">
                  <q-icon name="library_books" class="q-mr-xs" />
                  {{ filteredIssues.length }} of {{ allIssues.length }} newsletter{{ filteredIssues.length === 1 ? '' :
                    's' }}
                  <span v-if="searchQuery || hasActiveFilters" class="text-weight-medium">
                    (filtered)
                  </span>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Loading State -->
          <div v-if="isLoading" class="row justify-center q-pa-lg">
            <q-spinner-hourglass color="primary" size="3rem" />
            <div class="text-body1 q-ml-md">Loading newsletters...</div>
          </div>

          <!-- Error State -->
          <q-card v-else-if="error" flat bordered class="q-mb-md bg-negative text-white">
            <q-card-section>
              <div class="text-h6">
                <q-icon name="error" class="q-mr-sm" />
                Error Loading Newsletters
              </div>
              <p class="q-mb-none">{{ error }}</p>
            </q-card-section>
          </q-card>

          <!-- Results -->
          <div v-else-if="filteredIssues.length === 0" class="text-center q-pa-lg">
            <q-icon name="search_off" size="4rem" :class="greyTextClass" />
            <div class="text-h6 q-mt-md" :class="greyTextClass">
              No newsletters found
            </div>
            <div class="text-body1 q-mt-sm" :class="greyTextClass">
              Try adjusting your search or filter criteria
            </div>
          </div>

          <!-- Grid View -->
          <div v-else-if="!groupByYear" class="newsletter-grid">
            <div class="row q-gutter-md">
              <div v-for="issue in sortedIssues" :key="issue.id" class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                <AdvancedNewsletterCard :newsletter="issue" />
              </div>
            </div>
          </div>

          <!-- Year Group View -->
          <div v-else>
            <div v-for="yearGroup in sortedNewslettersByYear" :key="yearGroup.year" class="q-mb-xl">
              <!-- Year Header -->
              <q-card flat :class="cardClasses" class="q-mb-md">
                <q-card-section class="q-py-md">
                  <div class="row items-center">
                    <div class="text-h5 text-primary">{{ yearGroup.year }}</div>
                    <q-space />
                    <div class="text-body2" :class="greyTextClass">
                      {{ yearGroup.issues.length }} issue{{ yearGroup.issues.length === 1 ? '' : 's' }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Year Issues -->
              <div class="newsletter-grid">
                <div class="row q-gutter-md">
                  <div v-for="issue in yearGroup.issues" :key="issue.id"
                    class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <AdvancedNewsletterCard :newsletter="issue" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { useHybridNewsletters } from '../composables/useHybridNewsletters'
import AdvancedNewsletterCard from '../components/AdvancedNewsletterCard.vue'
import type { NewsletterMetadata } from '../services/newsletter-service'

const siteStore = useSiteStore()
const hybridNewsletters = useHybridNewsletters()

// UI state
const showFilters = ref(false)
const groupByYear = ref(false)
const searchQuery = ref('')
const quickSort = ref('date-desc')

// Filter object
const filters = reactive({
  year: null as number | null,
  availability: null as string | null,
  pageCount: null as string | null,
  actions: null as string | null
})

// Filter options
const quickSortOptions = [
  { label: 'Newest First', value: 'date-desc' },
  { label: 'Oldest First', value: 'date-asc' },
  { label: 'Title A-Z', value: 'title-asc' },
  { label: 'Title Z-A', value: 'title-desc' },
  { label: 'Most Pages', value: 'pages-desc' },
  { label: 'Fewest Pages', value: 'pages-asc' }
]

const availabilityOptions = [
  { label: 'Web Viewable', value: 'viewable' },
  { label: 'Downloadable', value: 'downloadable' },
  { label: 'Local Files Only', value: 'local-only' },
  { label: 'Cloud Files Only', value: 'cloud-only' },
  { label: 'Multiple Sources', value: 'multi-source' }
]

const pageCountOptions = [
  { label: '1-5 pages', value: '1-5' },
  { label: '6-10 pages', value: '6-10' },
  { label: '11-20 pages', value: '11-20' },
  { label: '20+ pages', value: '20+' }
]

const actionOptions = [
  { label: 'Can View Online', value: 'view' },
  { label: 'Can Download', value: 'download' },
  { label: 'Can Search Within', value: 'search' },
  { label: 'Has Thumbnail', value: 'thumbnail' }
]

// Computed properties
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

// Get newsletters from hybrid composable
const allIssues = computed(() => hybridNewsletters.newsletters.value)
const isLoading = computed(() => hybridNewsletters.loading.value)
const error = computed(() => hybridNewsletters.error.value)

// Year filter options
const yearFilterOptions = computed(() => {
  const years = new Set<number>()
  allIssues.value.forEach((issue: NewsletterMetadata) => {
    const date = new Date(issue.date)
    const year = isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()
    years.add(year)
  })
  return Array.from(years)
    .sort((a, b) => b - a)
    .map(year => ({ label: year.toString(), value: year }))
})

// Active filters check
const hasActiveFilters = computed(() => {
  return !!(filters.year || filters.availability || filters.pageCount || filters.actions)
})

// Helper functions for filtering
const hasLocalSource = (issue: NewsletterMetadata) => issue.localFile && issue.localFile.length > 0
const hasDriveSource = (issue: NewsletterMetadata) => issue.driveId && issue.driveId.length > 0

// Main filtering logic
const filteredIssues = computed(() => {
  let issues = [...allIssues.value]

  // Text search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    issues = issues.filter((issue: NewsletterMetadata) =>
      issue.title.toLowerCase().includes(query) ||
      issue.filename.toLowerCase().includes(query) ||
      (issue.topics && issue.topics.some((topic: string) => topic.toLowerCase().includes(query))) ||
      (issue.tags && issue.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    )
  }

  // Year filter
  if (filters.year) {
    issues = issues.filter((issue: NewsletterMetadata) => {
      const date = new Date(issue.date)
      const year = isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()
      return year === filters.year
    })
  }

  // Availability filter
  if (filters.availability) {
    issues = issues.filter((issue: NewsletterMetadata) => {
      const hasLocal = hasLocalSource(issue)
      const hasDrive = hasDriveSource(issue)

      switch (filters.availability) {
        case 'viewable':
          return hasLocal // Can view online if has local source
        case 'downloadable':
          return hasLocal || hasDrive // Can download if has any source
        case 'local-only':
          return hasLocal && !hasDrive
        case 'cloud-only':
          return hasDrive && !hasLocal
        case 'multi-source':
          return hasLocal && hasDrive
        default:
          return true
      }
    })
  }

  // Page count filter
  if (filters.pageCount) {
    issues = issues.filter((issue: NewsletterMetadata) => {
      const pageCount = issue.pages || 0
      switch (filters.pageCount) {
        case '1-5':
          return pageCount >= 1 && pageCount <= 5
        case '6-10':
          return pageCount >= 6 && pageCount <= 10
        case '11-20':
          return pageCount >= 11 && pageCount <= 20
        case '20+':
          return pageCount > 20
        default:
          return true
      }
    })
  }

  // Actions filter
  if (filters.actions) {
    issues = issues.filter((issue: NewsletterMetadata) => {
      switch (filters.actions) {
        case 'view':
          return hasLocalSource(issue)
        case 'download':
          return hasLocalSource(issue) || hasDriveSource(issue)
        case 'search':
          return hasLocalSource(issue) // Only local files can be searched within
        case 'thumbnail':
          return !!(issue.thumbnailPath)
        default:
          return true
      }
    })
  }

  return issues
})

// Sorted issues based on quick sort selection
const sortedIssues = computed(() => {
  const issues = [...filteredIssues.value]
  const [field, direction] = quickSort.value.split('-')

  return issues.sort((a: NewsletterMetadata, b: NewsletterMetadata) => {
    let comparison = 0

    switch (field) {
      case 'date': {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime()
        const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime()
        comparison = timeA - timeB
        break
      }
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'pages':
        comparison = (a.pages || 0) - (b.pages || 0)
        break
    }

    return direction === 'desc' ? -comparison : comparison
  })
})

// Grouped by year for alternative view
const sortedNewslettersByYear = computed(() => {
  const grouped = new Map<number, NewsletterMetadata[]>()

  sortedIssues.value.forEach((issue: NewsletterMetadata) => {
    const date = new Date(issue.date)
    const year = isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()

    if (!grouped.has(year)) {
      grouped.set(year, [])
    }
    grouped.get(year)!.push(issue)
  })

  return Array.from(grouped.entries())
    .map(([year, issues]) => ({ year, issues }))
    .sort((a, b) => b.year - a.year)
})

// Actions
const clearAllFilters = () => {
  filters.year = null
  filters.availability = null
  filters.pageCount = null
  filters.actions = null
  searchQuery.value = ''
}

// Initialize on mount
onMounted(() => {
  void hybridNewsletters.loadNewsletters()
})
</script>

<style scoped>
.newsletter-grid {
  min-height: 200px;
}
</style>
