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
                Browse through past issues of The Courier with advanced search, filtering, and hybrid hosting.
                Enjoy fast local access for viewing and high-quality downloads from our archive.
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
                    <div class="text-caption">Hybrid Sources</div>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-info">{{
                      hybridNewsletters.serviceStats.value.sourceCounts.local }}</div>
                    <div class="text-caption">Local Only</div>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-secondary">{{
                      hybridNewsletters.serviceStats.value.sourceCounts.drive }}</div>
                    <div class="text-caption">Drive Only</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Advanced Search and Filters Card -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <!-- Search Toggle -->
              <div class="row items-center q-mb-md">
                <q-btn-toggle v-model="useAdvancedSearch" :options="[
                  { label: 'Simple Search', value: false },
                  { label: 'Advanced Search', value: true }
                ]" color="primary" toggle-color="secondary" class="q-mr-md" />

                <q-space />

                <!-- Source Filter Toggle -->
                <q-btn-toggle v-model="sourceFilter" :options="[
                  { label: 'All', value: 'all' },
                  { label: 'Local', value: 'local' },
                  { label: 'Cloud', value: 'drive' },
                  { label: 'Hybrid', value: 'hybrid' }
                ]" color="secondary" toggle-color="primary" class="q-mr-md" />
              </div>

              <!-- Simple Search -->
              <div v-if="!useAdvancedSearch">
                <q-input v-model="searchQuery" label="Search newsletters..." outlined dense class="q-mb-md"
                  :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }" clearable>
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>

              <!-- Advanced Search -->
              <div v-else class="advanced-search">
                <div class="row q-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input v-model="advancedSearch.title" label="Title contains..." outlined dense
                      :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }" clearable />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input v-model="advancedSearch.content" label="Content contains..." outlined dense
                      :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }" clearable />
                  </div>
                </div>
                <div class="row q-gutter-md q-mt-sm">
                  <div class="col-12 col-md-4">
                    <q-select v-model="advancedSearch.year" label="Year" outlined dense :options="availableYears"
                      clearable :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-select v-model="advancedSearch.contentType" label="Type" outlined dense
                      :options="contentTypeOptions" clearable
                      :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="advancedSearch.tags" label="Tags (comma-separated)" outlined dense
                      :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }" clearable />
                  </div>
                </div>
              </div>

              <!-- View Controls -->
              <div class="row items-center q-mt-md q-gutter-md">
                <q-btn-toggle v-model="groupByYear" :options="[
                  { label: 'List View', value: false },
                  { label: 'Group by Year', value: true }
                ]" color="primary" toggle-color="secondary" />

                <q-select v-model="sortBy" :options="sortOptions" outlined dense style="min-width: 120px"
                  :class="{ 'bg-grey-1': !siteStore.isDarkMode, 'bg-grey-9': siteStore.isDarkMode }" />

                <q-btn-toggle v-model="sortOrder" :options="[
                  { label: 'Desc', value: 'desc' },
                  { label: 'Asc', value: 'asc' }
                ]" color="primary" toggle-color="secondary" />

                <q-space />

                <!-- Results Count -->
                <div class="text-body2" :class="greyTextClass">
                  {{ filteredIssues.length }} issue{{ filteredIssues.length === 1 ? '' : 's' }}
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

          <!-- List View -->
          <!-- List View -->
          <div v-else-if="!groupByYear" class="newsletter-grid">
            <div class="row q-gutter-md">
              <div v-for="issue in sortedIssues" :key="issue.id" class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                <AdvancedNewsletterCard :newsletter="issue" :show-source-indicators="true" />
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
                    <AdvancedNewsletterCard :newsletter="issue" :show-source-indicators="true" />
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
import { ref, computed, onMounted } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { useHybridNewsletters } from '../composables/useHybridNewsletters'
import AdvancedNewsletterCard from '../components/AdvancedNewsletterCard.vue'
import type { NewsletterMetadata } from '../services/newsletter-service'

const siteStore = useSiteStore()
const hybridNewsletters = useHybridNewsletters()

// UI state
const groupByYear = ref(false)
const sortBy = ref<'date' | 'title' | 'pages' | 'size'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')
const useAdvancedSearch = ref(false)
const sourceFilter = ref<'all' | 'local' | 'drive' | 'hybrid'>('all')

// Simple search
const searchQuery = ref('')

// Advanced search
const advancedSearch = ref({
  title: '',
  content: '',
  year: null as number | null,
  contentType: null as string | null,
  tags: ''
})

// Sort and filter options
const sortOptions = [
  { label: 'Date', value: 'date' },
  { label: 'Title', value: 'title' },
  { label: 'Pages', value: 'pages' },
  { label: 'Size', value: 'size' }
]

const contentTypeOptions = [
  { label: 'Newsletter', value: 'newsletter' },
  { label: 'Special Edition', value: 'special' },
  { label: 'Annual Report', value: 'annual' }
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
const rawIssues = computed(() => hybridNewsletters.newsletters.value)
const isLoading = computed(() => hybridNewsletters.loading.value)
const error = computed(() => hybridNewsletters.error.value)

// Available years for filter
const availableYears = computed(() => {
  const years = new Set<number>()
  rawIssues.value.forEach((issue: NewsletterMetadata) => {
    const year = new Date(issue.date).getFullYear()
    years.add(year)
  })
  return Array.from(years).sort((a, b) => b - a)
})

// Source-filtered issues
const sourceFilteredIssues = computed(() => {
  if (sourceFilter.value === 'all') return rawIssues.value

  return rawIssues.value.filter((issue: NewsletterMetadata) => {
    const hasLocal = issue.localFile && issue.localFile.length > 0
    const hasDrive = issue.driveId && issue.driveId.length > 0

    switch (sourceFilter.value) {
      case 'local':
        return hasLocal && !hasDrive
      case 'drive':
        return hasDrive && !hasLocal
      case 'hybrid':
        return hasLocal && hasDrive
      default:
        return true
    }
  })
})

// Search-filtered issues
const filteredIssues = computed(() => {
  let issues = sourceFilteredIssues.value

  if (useAdvancedSearch.value) {
    // Advanced search filtering
    if (advancedSearch.value.title.trim()) {
      const titleQuery = advancedSearch.value.title.toLowerCase()
      issues = issues.filter((issue: NewsletterMetadata) =>
        issue.title.toLowerCase().includes(titleQuery)
      )
    }

    if (advancedSearch.value.content.trim()) {
      const contentQuery = advancedSearch.value.content.toLowerCase()
      issues = issues.filter((issue: NewsletterMetadata) =>
        issue.title.toLowerCase().includes(contentQuery) ||
        issue.filename.toLowerCase().includes(contentQuery) ||
        (issue.topics && issue.topics.some((topic: string) => topic.toLowerCase().includes(contentQuery))) ||
        (issue.tags && issue.tags.some((tag: string) => tag.toLowerCase().includes(contentQuery)))
      )
    }

    if (advancedSearch.value.year) {
      issues = issues.filter((issue: NewsletterMetadata) =>
        new Date(issue.date).getFullYear() === advancedSearch.value.year
      )
    }

    if (advancedSearch.value.contentType) {
      issues = issues.filter((issue: NewsletterMetadata) =>
        issue.contentType === advancedSearch.value.contentType
      )
    }

    if (advancedSearch.value.tags.trim()) {
      const tagQueries = advancedSearch.value.tags.toLowerCase().split(',').map(tag => tag.trim())
      issues = issues.filter((issue: NewsletterMetadata) =>
        tagQueries.some(tagQuery =>
          issue.tags && issue.tags.some((tag: string) => tag.toLowerCase().includes(tagQuery))
        )
      )
    }
  } else {
    // Simple search filtering
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      issues = issues.filter((issue: NewsletterMetadata) =>
        issue.title.toLowerCase().includes(query) ||
        issue.filename.toLowerCase().includes(query) ||
        (issue.topics && issue.topics.some((topic: string) => topic.toLowerCase().includes(query))) ||
        (issue.tags && issue.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      )
    }
  }

  return issues
})

// Sorted issues
const sortedIssues = computed(() => {
  return [...filteredIssues.value].sort((a: NewsletterMetadata, b: NewsletterMetadata) => {
    let comparison = 0

    switch (sortBy.value) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'pages':
        comparison = (a.pages || 0) - (b.pages || 0)
        break
      case 'size': {
        // Parse file size strings for comparison
        const parseSize = (sizeStr: string): number => {
          if (!sizeStr) return 0
          const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)?/i)
          if (!match || !match[1]) return 0

          const size = parseFloat(match[1])
          const unit = (match[2] || 'B').toUpperCase()

          const multipliers: Record<string, number> = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
          }

          return size * (multipliers[unit] || 1)
        }

        comparison = parseSize(a.fileSize || '') - parseSize(b.fileSize || '')
        break
      }
      default:
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
    }

    return sortOrder.value === 'desc' ? -comparison : comparison
  })
})

// Grouped by year with sorting applied within each year
const sortedNewslettersByYear = computed(() => {
  const groups = new Map<number, NewsletterMetadata[]>()

  filteredIssues.value.forEach((issue: NewsletterMetadata) => {
    const year = new Date(issue.date).getFullYear()
    if (!groups.has(year)) {
      groups.set(year, [])
    }
    groups.get(year)?.push(issue)
  })

  // Sort issues within each year group
  groups.forEach((issues) => {
    issues.sort((a: NewsletterMetadata, b: NewsletterMetadata) => {
      let comparison = 0

      switch (sortBy.value) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'pages':
          comparison = (a.pages || 0) - (b.pages || 0)
          break
        case 'size': {
          const parseSize = (sizeStr: string): number => {
            if (!sizeStr) return 0
            const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)?/i)
            if (!match || !match[1]) return 0

            const size = parseFloat(match[1])
            const unit = (match[2] || 'B').toUpperCase()

            const multipliers: Record<string, number> = {
              'B': 1,
              'KB': 1024,
              'MB': 1024 * 1024,
              'GB': 1024 * 1024 * 1024,
              'TB': 1024 * 1024 * 1024 * 1024
            }

            return size * (multipliers[unit] || 1)
          }

          comparison = parseSize(a.fileSize || '') - parseSize(b.fileSize || '')
          break
        }
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      }

      return sortOrder.value === 'desc' ? -comparison : comparison
    })
  })

  return Array.from(groups.entries())
    .map(([year, issues]) => ({ year, issues }))
    .sort((a, b) => b.year - a.year)
})

// Initialize data
onMounted(() => {
  void hybridNewsletters.loadNewsletters()
})
</script>

<style scoped>
.newsletter-grid {
  min-height: 200px;
}

.advanced-search {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 16px;
}

.q-dark .advanced-search {
  border-color: rgba(255, 255, 255, 0.28);
}
</style>
