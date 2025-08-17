<template>
  <div class="advanced-search">
    <!-- Main Search Bar -->
    <q-card flat :class="cardClasses" class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="mdi-magnify" class="q-mr-sm" />
          Advanced Search
          <q-chip v-if="searchStats.totalResults > 0" color="primary" text-color="white" class="q-ml-sm">
            {{ searchStats.totalResults }} results
          </q-chip>
        </div>

        <!-- Primary Search Input -->
        <q-input v-model="searchQuery" outlined placeholder="Search by title, description, or content..." clearable
          :loading="isSearching" :bg-color="isDarkMode ? 'grey-9' : 'white'" class="q-mb-md"
          @keyup.enter="performSearchAction">
          <template v-slot:prepend>
            <q-icon name="mdi-magnify" />
          </template>
          <template v-slot:append>
            <q-btn round dense flat icon="mdi-cog" @click="showAdvancedOptions = !showAdvancedOptions"
              :color="showAdvancedOptions ? 'primary' : 'grey-6'">
              <q-tooltip>Advanced Search Options</q-tooltip>
            </q-btn>
          </template>
        </q-input>

        <!-- Quick Action Buttons -->
        <div class="row q-gutter-sm q-mb-md">
          <q-btn color="primary" label="Search" icon="mdi-magnify" :loading="isSearching" @click="performSearchAction"
            :disable="(!searchFilters.query || !searchFilters.query.trim()) && !hasActiveFilters" />
          <q-btn outline color="primary" label="Clear" icon="mdi-close" @click="clearSearchAction"
            :disable="!hasSearchResults && !hasActiveFilters" />
          <q-btn v-if="searchStats.cachedIssues > 0" outline color="orange"
            :label="`Clear Cache (${searchStats.cachedIssues})`" icon="mdi-delete" @click="clearContentCacheAction">
            <q-tooltip>Clear cached PDF content to free memory</q-tooltip>
          </q-btn>
        </div>

        <!-- Advanced Options Expansion -->
        <q-slide-transition>
          <div v-show="showAdvancedOptions">
            <q-separator class="q-mb-md" />
            <div class="text-subtitle1 q-mb-md">Advanced Filters</div>

            <div class="row q-col-gutter-md">
              <!-- Content Search Toggle -->
              <div class="col-12">
                <q-toggle v-model="searchFilters.includeContent" label="Search inside PDF content" color="primary"
                  left-label />
                <div class="text-caption text-grey-6 q-mt-xs">
                  <q-icon name="mdi-information" size="xs" class="q-mr-xs" />
                  Searches text content within PDF files (slower but more comprehensive)
                  <br>
                  <q-icon name="mdi-alert" size="xs" class="q-mr-xs" />
                  <em>Note: Google Drive PDFs are currently searched by title/description only due to browser security
                    limitations</em>
                </div>
              </div>

              <!-- Date Range -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 q-mb-sm">Date Range</div>
                <div class="row q-gutter-sm">
                  <div class="col">
                    <q-input v-model="dateRangeStart" type="date" outlined dense label="From"
                      :bg-color="isDarkMode ? 'grey-9' : 'white'" />
                  </div>
                  <div class="col">
                    <q-input v-model="dateRangeEnd" type="date" outlined dense label="To"
                      :bg-color="isDarkMode ? 'grey-9' : 'white'" />
                  </div>
                </div>
              </div>

              <!-- Page Count Range -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 q-mb-sm">Page Count</div>
                <div class="row q-gutter-sm">
                  <div class="col">
                    <q-input v-model.number="searchFilters.minPages" type="number" outlined dense label="Min pages"
                      :bg-color="isDarkMode ? 'grey-9' : 'white'" min="1" />
                  </div>
                  <div class="col">
                    <q-input v-model.number="searchFilters.maxPages" type="number" outlined dense label="Max pages"
                      :bg-color="isDarkMode ? 'grey-9' : 'white'" min="1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-slide-transition>

        <!-- Search Error -->
        <q-banner v-if="searchError" class="bg-negative text-white q-mt-md" rounded>
          <template v-slot:avatar>
            <q-icon name="mdi-alert" />
          </template>
          <div>
            <strong>Search Error</strong><br>
            {{ searchError }}
          </div>
          <template v-slot:action>
            <q-btn flat color="white" label="Retry" @click="performSearchAction" />
          </template>
        </q-banner>

        <!-- Search Stats -->
        <div v-if="searchStats.totalResults > 0" class="q-mt-md">
          <div class="row q-gutter-md text-caption text-grey-6">
            <div>
              <q-icon name="mdi-file-document" size="xs" class="q-mr-xs" />
              {{ searchStats.totalResults }} result{{ searchStats.totalResults !== 1 ? 's' : '' }}
            </div>
            <div v-if="searchStats.hasContentMatches">
              <q-icon name="mdi-text-search" size="xs" class="q-mr-xs" />
              Content matches found
            </div>
            <div v-if="searchStats.averageScore > 0">
              <q-icon name="mdi-star" size="xs" class="q-mr-xs" />
              Avg relevance: {{ searchStats.averageScore.toFixed(1) }}
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Search Results -->
    <div v-if="hasSearchResults" class="search-results">
      <div class="text-h6 q-mb-md">Search Results</div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="result in searchResults" :key="result.id">
          <enhanced-search-result-card :result="result" :search-terms="getSearchTerms()"
            @click="$emit('open-issue', result)" @regenerate-thumbnail="$emit('regenerate-thumbnail', result)" />
        </div>
      </div>
    </div>

    <!-- No Results -->
    <q-card v-else-if="searchFilters.query && searchFilters.query.trim() && !isSearching" flat :class="cardClasses">
      <q-card-section class="text-center">
        <q-icon name="mdi-magnify-close" size="4em" color="grey-5" />
        <div class="text-h6 q-mt-md text-grey-6">No Results Found</div>
        <div class="text-body2 q-mt-sm text-grey-6">
          Try adjusting your search terms or filters
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { useAdvancedSearch, type SearchResult } from '../composables/useAdvancedSearch'
import EnhancedSearchResultCard from './EnhancedSearchResultCard.vue'
import type { IssueWithGoogleDrive } from '../types/google-drive-content'

// Props
interface Props {
  issues: IssueWithGoogleDrive[]
  autoSearch?: boolean // Whether to search automatically on input change
  debounceMs?: number   // Debounce delay for auto-search
}

const props = withDefaults(defineProps<Props>(), {
  autoSearch: true,
  debounceMs: 500
})

// Emits
const emit = defineEmits<{
  'open-issue': [issue: SearchResult]
  'regenerate-thumbnail': [issue: SearchResult]
  'search-results': [results: SearchResult[]]
}>()

// Stores and composables
const siteStore = useSiteStore()
const {
  isSearching,
  searchResults,
  filteredResults,
  searchError,
  searchFilters,
  searchStats,
  performSearch,
  clearSearch,
  clearContentCache,
  updateFilters
} = useAdvancedSearch()

// Local state
const showAdvancedOptions = ref(false)
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// Computed
const isDarkMode = computed(() => siteStore.isDarkMode)
const cardClasses = computed(() =>
  isDarkMode.value ? 'bg-dark text-white q-dark' : 'bg-white text-dark'
)

const hasSearchResults = computed(() => searchResults.value.length > 0)
const hasActiveFilters = computed(() =>
  searchFilters.value.dateRange.start !== null ||
  searchFilters.value.dateRange.end !== null ||
  searchFilters.value.minPages !== null ||
  searchFilters.value.maxPages !== null ||
  searchFilters.value.includeContent
)

// Date range string inputs (for easier binding)
const searchQuery = computed({
  get: () => searchFilters.value.query || '',
  set: (value: string) => {
    updateFilters({ query: value || '' })
  }
})

const dateRangeStart = computed({
  get: () => searchFilters.value.dateRange.start
    ? searchFilters.value.dateRange.start.toISOString().split('T')[0]
    : '',
  set: (value: string) => {
    updateFilters({
      dateRange: {
        ...searchFilters.value.dateRange,
        start: value ? new Date(value) : null
      }
    })
  }
})

const dateRangeEnd = computed({
  get: () => searchFilters.value.dateRange.end
    ? searchFilters.value.dateRange.end.toISOString().split('T')[0]
    : '',
  set: (value: string) => {
    updateFilters({
      dateRange: {
        ...searchFilters.value.dateRange,
        end: value ? new Date(value) : null
      }
    })
  }
})

// Methods
function getSearchTerms(): string[] {
  if (!searchFilters.value.query) return []

  return searchFilters.value.query
    .toLowerCase()
    .split(/\s+/)
    .filter((term: string) => term.length > 2)
}

async function performSearchAction() {
  if (!props.issues.length) return

  try {
    await performSearch(props.issues)
    emit('search-results', filteredResults.value)
  } catch (error) {
    console.error('Search failed:', error)
  }
}

function clearSearchAction() {
  clearSearch()
  emit('search-results', [])
}

function clearContentCacheAction() {
  clearContentCache()
}

// Auto-search with debouncing
function scheduleSearch() {
  if (!props.autoSearch) return

  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    if ((searchFilters.value.query && searchFilters.value.query.trim()) || hasActiveFilters.value) {
      void performSearchAction()
    } else {
      clearSearchAction()
    }
  }, props.debounceMs)
}

// Watch for changes and trigger auto-search
watch(
  () => searchFilters.value.query,
  () => {
    if (props.autoSearch) {
      scheduleSearch()
    }
  }
)

watch(
  () => [
    searchFilters.value.dateRange,
    searchFilters.value.minPages,
    searchFilters.value.maxPages,
    searchFilters.value.includeContent
  ],
  () => {
    if (props.autoSearch && ((searchFilters.value.query && searchFilters.value.query.trim()) || hasActiveFilters.value)) {
      scheduleSearch()
    }
  },
  { deep: true }
)

// Watch for issues changes and re-search if we have active search
watch(
  () => props.issues,
  () => {
    if (hasSearchResults.value || (searchFilters.value.query && searchFilters.value.query.trim())) {
      void performSearchAction()
    }
  }
)
</script>

<style scoped>
.advanced-search {
  width: 100%;
}

.search-results {
  margin-top: 1.5rem;
}

:deep(.q-field__control) {
  min-height: 40px;
}

:deep(.q-field--dense .q-field__control) {
  min-height: 32px;
}

:deep(mark) {
  background-color: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

:deep(.q-dark mark) {
  background-color: #664d03;
  color: #ffecb3;
}
</style>
