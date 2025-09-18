<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- Header Card -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-bookshelf" class="q-mr-sm" />
                {{ t(TRANSLATION_KEYS.NEWSLETTER.ARCHIVE) }}
              </div>
              <p class="text-body1">
                {{ t('newsletter.archiveDescription') || 'Browse through past issues of The Courier with Firebase-powered search and filtering. All content is dynamically loaded from our cloud database with real-time updates.' }}
              </p>

              <!-- Service Statistics -->
              <div v-if="stats" class="q-mt-md">
                <div class="row text-center q-col-gutter-sm">
                  <div class="col">
                    <div class="text-h6 text-primary">{{ stats.totalNewsletters }}</div>
                    <div class="text-caption">{{ t('newsletter.totalIssues') || 'Total Issues' }}</div>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-positive">{{ stats.sourceCounts.firebase }}</div>
                    <div class="text-caption">{{ t('newsletter.firebaseStorage') || 'Firebase Storage' }}</div>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-info">{{ stats.publishedThisYear }}</div>
                    <div class="text-caption">{{ t('newsletter.publishedThisYear') || 'Published This Year' }}</div>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-secondary">{{ stats.availableYears.length }}</div>
                    <div class="text-caption">{{ t('newsletter.yearsAvailable') || 'Years Available' }}</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Search and Filter Interface using BaseContentFilters -->
          <BaseContentFilters
            :filter-config="filterConfig"
            :search-placeholder="t(TRANSLATION_KEYS.NEWSLETTER.SEARCH_CONTENT) || 'Search newsletters by title, content, tags, year, or month...'"
            :sort-options="sortOptions"
            v-model="currentFilters"
            v-model:search-query="searchInput"
            v-model:sort-by="sortBy"
            @filter-change="onFilterChange"
            @search-change="onSearchInput"
            @sort-change="onSortChange"
            class="q-mb-md"
          />

          <!-- Search Results Info -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section class="q-py-sm">
              <div class="row items-center">
                <div class="col-auto">
                  <div class="text-subtitle2 text-weight-medium q-mr-md">{{ t('newsletter.searchLabel') || 'Newsletter search:' }}</div>
                  <q-chip color="primary" text-color="white" icon="cloud" size="sm">
                    {{ t('newsletter.realTimeDatabase') || 'Real-time Cloud Database' }}
                  </q-chip>
                </div>
                <q-space />
                <div v-if="searchResults && searchResults.searchStats.indexedPdfs > 0" class="col-auto text-caption text-grey-6">
                  {{ t('newsletter.pdfsIndexed', { count: searchResults.searchStats.indexedPdfs }) || `${searchResults.searchStats.indexedPdfs} PDFs indexed` }}
                </div>
                <div v-if="isSearching" class="col-auto text-caption text-primary">
                  <q-spinner size="14px" class="q-mr-xs" />
                  {{ t(TRANSLATION_KEYS.SEARCH.SEARCHING) }}
                </div>
              </div>

              <!-- Search suggestions -->
              <div v-if="searchSuggestions.length > 0 && searchInput" class="q-mt-sm"
                role="listbox" :aria-label="t('newsletter.searchSuggestions') || 'Search suggestions'">
                <q-chip v-for="suggestion in searchSuggestions" :key="suggestion" clickable size="sm" color="grey-3"
                  text-color="dark" class="q-mr-xs q-mb-xs" @click="applySuggestion(suggestion)" :tabindex="0"
                  @keydown.enter="applySuggestion(suggestion)" role="option">
                  <q-icon name="lightbulb" size="14px" class="q-mr-xs" />
                  {{ suggestion }}
                </q-chip>
              </div>

              <!-- Quick Filter Buttons -->
              <div class="row q-mt-sm q-gutter-sm">
                <q-btn outline  color="primary" size="sm" @click="applyQuickFilter('featured')"
                  :label="t('newsletter.featured') + ' (' + (quickFilterOptions?.featured?.length || 0) + ')'"
                  :aria-label="t('newsletter.featuredAriaLabel', { count: quickFilterOptions?.featured?.length || 0 }) || `Show only featured newsletters, ${quickFilterOptions?.featured?.length || 0} available`" />
                <q-btn outline  color="secondary" size="sm" @click="applyQuickFilter('currentYear')"
                  :label="t('newsletter.thisYear') + ' (' + (quickFilterOptions?.currentYear?.length || 0) + ')'"
                  :aria-label="t('newsletter.thisYearAriaLabel', { count: quickFilterOptions?.currentYear?.length || 0 }) || `Show current year newsletters, ${quickFilterOptions?.currentYear?.length || 0} available`" />
                <q-btn outline  color="accent" size="sm" @click="applyQuickFilter('recentlyAdded')"
                  :label="t('newsletter.recent') || 'Recent'" :aria-label="t('newsletter.recentAriaLabel') || 'Show recently added newsletters'" />
              </div>

              <!-- View Controls and Results -->
              <div class="row items-center q-mt-md">
                <div class="col-auto">
                  <q-btn-toggle v-model="groupByYear" :options="[
                    { label: 'Grid', value: false, icon: 'grid_view', slot: 'grid' },
                    { label: 'By Year', value: true, icon: 'view_list', slot: 'year' }
                  ]" color="primary" toggle-color="secondary" flat
                    :aria-label="'Switch view mode, currently ' + (groupByYear ? 'year grouped' : 'grid') + ' view'" />
                </div>

                <q-space />

                <!-- Enhanced Results Summary -->
                <div class="col-auto">
                  <div class="text-body2" :class="greyTextClass">
                    <q-icon name="library_books" class="q-mr-xs" />
                    <span class="text-weight-medium">{{ filteredNewsletters.length }}</span>
                    of {{ newsletters.length }} newsletter{{ filteredNewsletters.length === 1 ? '' : 's' }}

                    <span v-if="searchInput || hasActiveFilters" class="text-weight-medium text-primary">
                      (filtered)
                    </span>

                    <!-- Search performance indicator -->
                    <span v-if="searchResults?.searchStats?.searchTime" class="q-ml-sm text-caption">
                      • {{ searchResults.searchStats.searchTime }}ms
                    </span>
                  </div>

                  <!-- Accessibility summary -->
                  <div v-if="stats?.accessibility && filteredNewsletters.length > 0"
                    class="text-caption text-grey-6 q-mt-xs">
                    <q-icon name="accessibility" size="12px" class="q-mr-xs" />
                    {{ Math.round((stats.accessibility.withDescriptions / stats.totalNewsletters) * 100) }}% have
                    descriptions,
                    {{ Math.round((stats.accessibility.withSearchableText / stats.totalNewsletters) * 100) }}%
                    searchable
                  </div>
                </div>
              </div>

              <div class="text-caption text-grey-6 q-mt-sm">
                {{ t('newsletter.poweredByFirebase') || 'Powered by Firebase Firestore with real-time updates and full-text search' }}
                <span v-if="stats?.accessibility">
                  • {{ t('newsletter.searchableTextCount', { searchable: stats.accessibility.withSearchableText, total: stats.totalNewsletters }) || `${stats.accessibility.withSearchableText} of ${stats.totalNewsletters} have searchable text` }}
                </span>
              </div>
            </q-card-section>
          </q-card>

          <!-- Loading State -->
          <div v-if="isLoading" class="row justify-center q-pa-lg">
            <q-spinner-hourglass color="primary" size="3rem" />
            <div class="text-body1 q-ml-md">Loading newsletters from Firebase...</div>
          </div>

          <!-- Error State -->
          <q-card v-else-if="error" flat bordered class="q-mb-md bg-negative text-white">
            <q-card-section>
              <div class="text-h6">
                <q-icon name="error" class="q-mr-sm" />
                Error Loading Newsletters
              </div>
              <p class="q-mb-none">{{ error }}</p>
              <q-btn flat color="white" label="Retry" @click="retryLoad" class="q-mt-sm" />
            </q-card-section>
          </q-card>

          <!-- No Results -->
          <div v-else-if="!hasResults" class="text-center q-pa-lg">
            <q-icon name="search_off" size="4rem" :class="greyTextClass" />
            <div class="text-h6 q-mt-md" :class="greyTextClass">
              No newsletters found
            </div>
            <div class="text-body1 q-mt-sm" :class="greyTextClass">
              {{ getEmptyMessage() }}
            </div>

            <!-- Helpful suggestions -->
            <div v-if="searchInput || hasActiveFilters" class="q-mt-md">
              <div class="text-body2 q-mb-sm">Try:</div>
              <div class="row justify-center ">
                <q-btn v-if="searchInput" outline size="sm" color="primary" @click="searchInput = ''; onSearchInput()"
                  label="Clear Search" />
                <q-btn v-if="hasActiveFilters" outline size="sm" color="secondary" @click="clearAllFilters"
                  label="Clear Filters" />
                <q-btn outline size="sm" color="accent" @click="applyQuickFilter('featured')" label="View Featured" />
              </div>
            </div>

            <!-- Search suggestions based on available content -->
            <div v-if="!searchInput && !hasActiveFilters && stats?.availableTags.length" class="q-mt-md">
              <div class="text-body2 q-mb-sm">Popular topics:</div>
              <div class="row justify-center ">
                <q-chip v-for="tag in stats.availableTags.slice(0, 6)" :key="tag" clickable size="sm" color="grey-3"
                  text-color="dark" class="q-mr-xs q-mb-xs" @click="searchInput = tag; onSearchInput()">
                  {{ tag }}
                </q-chip>
              </div>
            </div>
          </div>

          <!-- Newsletter Content using BaseContentList -->
          <div v-else-if="!groupByYear">
            <BaseContentList
              :items="sortedNewsletters"
              variant="grid"
              :loading="isLoading"
              :empty-message="getEmptyMessage()"
            >
              <template #item="{ item }">
                <NewsletterCard
                  :newsletter="item as UnifiedNewsletter"
                  :show-admin-controls="isAdmin"
                  @metadata-updated="onNewsletterMetadataUpdated"
                  @refresh-needed="onRefreshNeeded"
                />
              </template>
            </BaseContentList>
          </div>

          <!-- Year Group View -->
          <div v-else>
            <div v-for="yearGroup in newslettersByYear" :key="yearGroup.year" class="q-mb-xl">
              <!-- Year Header -->
              <q-card flat :class="cardClasses" class="q-mb-md">
                <q-card-section class="q-py-md">
                  <div class="row items-center">
                    <div class="text-h5 text-primary">{{ yearGroup.year }}</div>
                    <q-space />
                    <div class="text-body2" :class="greyTextClass">
                      {{ yearGroup.newsletters.length }} issue{{ yearGroup.newsletters.length ===
                        1 ? '' : 's' }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Year Issues using BaseContentList -->
              <BaseContentList
                :items="yearGroup.newsletters"
                variant="grid"
                :loading="false"
                :empty-message="`No newsletters found for ${yearGroup.year}`"
              >
                <template #item="{ item }">
                  <NewsletterCard
                    :newsletter="item as UnifiedNewsletter"
                    :show-admin-controls="isAdmin"
                    @metadata-updated="onNewsletterMetadataUpdated"
                    @refresh-needed="onRefreshNeeded"
                  />
                </template>
              </BaseContentList>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from '../composables/useTheme';
import { useFirebaseNewsletterArchive } from '../composables/useFirebaseNewsletterArchive';
import { type NewsletterMetadata } from '../services/firebase-firestore.service';
import type { UnifiedNewsletter } from '../types/core/newsletter.types';
import NewsletterCard from '../components/NewsletterCard.vue';
import BaseContentList from '../components/BaseContentList.vue';
import BaseContentFilters, { type FilterConfig, type FilterState } from '../components/BaseContentFilters.vue';
import { useRoleAuth } from '../composables/useRoleAuth';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';

// Local interfaces for enhanced features
interface AccessibilityReport {
  totalIssues: number;
  issues: string[];
  complianceRate: number;
}

// Store
const { cardClasses, textClasses } = useTheme();

// Translation function
const { t } = useI18n();

// Archive composable
const {
  newsletters,
  filteredNewsletters,
  sortedNewsletters,
  newslettersByYear,
  searchResults,
  isLoading,
  isSearching,
  error,
  stats,
  hasResults,
  hasActiveFilters,
  yearFilterOptions,
  quickFilterOptions,
  loadNewsletters,
  debouncedSearch,
  updateFilters,
  clearFilters,
  getSearchSuggestions,
  validateAccessibility
} = useFirebaseNewsletterArchive();

// UI state
const groupByYear = ref(false);
const searchInput = ref('');
const sortBy = ref<'relevance' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'pages-desc' | 'pages-asc'>('date-desc');

// Enhanced state for search and accessibility
const searchSuggestions = ref<string[]>([]);
const accessibilityReport = ref<AccessibilityReport | null>(null);

// Filter state for BaseContentFilters
const currentFilters = ref<FilterState>({
  year: null,
  month: null,
  pageCount: null,
  featured: false,
  hasDescription: null,
  hasSearchableText: null,
  hasThumbnail: null
});

// Additional theme computed properties
const greyTextClass = computed(() => textClasses.value.secondary);

// Admin access check - use proper role-based authorization
const { isEditor } = useRoleAuth();
const isAdmin = computed(() => isEditor.value);

// Filter options
const sortOptions = computed(() => [
  { label: t(TRANSLATION_KEYS.SEARCH.SORT_BY), value: 'relevance' },
  { label: t(TRANSLATION_KEYS.SEARCH.SORT_DATE_DESC), value: 'date-desc' },
  { label: t(TRANSLATION_KEYS.SEARCH.SORT_DATE_ASC), value: 'date-asc' },
  { label: t(TRANSLATION_KEYS.SEARCH.SORT_TITLE_ASC), value: 'title-asc' },
  { label: t(TRANSLATION_KEYS.SEARCH.SORT_TITLE_DESC), value: 'title-desc' },
  { label: t('newsletter.sortMostPages') || 'Most Pages', value: 'pages-desc' },
  { label: t('newsletter.sortFewestPages') || 'Fewest Pages', value: 'pages-asc' }
]);

const monthOptions = computed(() => [
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.JANUARY), value: 1 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.FEBRUARY), value: 2 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.MARCH), value: 3 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.APRIL), value: 4 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.MAY), value: 5 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.JUNE), value: 6 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.JULY), value: 7 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.AUGUST), value: 8 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.SEPTEMBER), value: 9 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.OCTOBER), value: 10 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.NOVEMBER), value: 11 },
  { label: t(TRANSLATION_KEYS.DATES.MONTHS.DECEMBER), value: 12 }
]);


// Filter configuration for BaseContentFilters
const filterConfig = computed<FilterConfig>(() => ({
  showFilters: true,
  yearOptions: yearFilterOptions.value,
  monthOptions: monthOptions.value,
  toggleFilters: [
    { key: 'featured', label: t('newsletter.featuredOnly') || 'Featured Only', color: 'primary' },
    { key: 'hasDescription', label: 'With Descriptions', color: 'purple' },
    { key: 'hasSearchableText', label: 'Text Searchable', color: 'orange' },
    { key: 'hasThumbnail', label: 'With Thumbnails', color: 'teal' }
  ]
}));

// Methods
const onSearchInput = () => {
  debouncedSearch(searchInput.value);
};

const onFilterChange = (newFilters: FilterState) => {
  const filterUpdate: Record<string, unknown> = {};

  if (newFilters.year) filterUpdate.year = newFilters.year;
  if (newFilters.month) filterUpdate.month = newFilters.month;
  if (newFilters.pageCount) filterUpdate.pageCount = newFilters.pageCount;
  if (newFilters.featured !== undefined) filterUpdate.featured = newFilters.featured;
  if (newFilters.hasDescription !== undefined) filterUpdate.hasDescription = newFilters.hasDescription;
  if (newFilters.hasSearchableText !== undefined) filterUpdate.hasSearchableText = newFilters.hasSearchableText;
  if (newFilters.hasThumbnail !== undefined) filterUpdate.hasThumbnail = newFilters.hasThumbnail;

  filterUpdate.sortBy = sortBy.value;

  void updateFilters(filterUpdate);
};

const onSortChange = () => {
  void updateFilters({
    sortBy: sortBy.value
  });
};

const clearAllFilters = () => {
  currentFilters.value = {
    year: null,
    month: null,
    pageCount: null,
    featured: false,
    hasDescription: null,
    hasSearchableText: null,
    hasThumbnail: null
  };
  searchInput.value = '';
  sortBy.value = 'date-desc';
  searchSuggestions.value = [];
  void clearFilters();
};

// Helper method for empty message
const getEmptyMessage = (): string => {
  if (searchInput.value) {
    return `No results for "${searchInput.value}"`;
  }
  if (hasActiveFilters.value) {
    return 'No newsletters match your current filters';
  }
  return 'No newsletters are currently available';
};


const applySuggestion = (suggestion: string) => {
  searchInput.value = suggestion;
  searchSuggestions.value = [];
  void debouncedSearch(suggestion);
};

const applyQuickFilter = (filterType: string) => {
  if (!quickFilterOptions.value) return;

  clearAllFilters();

  switch (filterType) {
    case 'featured':
      currentFilters.value.featured = true;
      break;
    case 'currentYear':
      currentFilters.value.year = new Date().getFullYear();
      break;
    case 'recentlyAdded':
      sortBy.value = 'date-desc';
      break;
  }

  onFilterChange(currentFilters.value);
};

// Update search suggestions when typing
watch(searchInput, (newValue) => {
  if (newValue && newValue.length >= 2) {
    searchSuggestions.value = getSearchSuggestions(newValue);
  } else {
    searchSuggestions.value = [];
  }
});

// Load accessibility report on mount (quickFilters is now reactive)
onMounted(() => {
  accessibilityReport.value = validateAccessibility();
  // Load newsletters with admin mode if user is authenticated
  const includeUnpublished = isAdmin.value;
  void loadNewsletters(includeUnpublished);
});

const retryLoad = () => {
  const includeUnpublished = isAdmin.value;
  void loadNewsletters(includeUnpublished);
};

// Handle events from newsletter cards
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onNewsletterMetadataUpdated = async (_newsletterId: string, _updates: Partial<NewsletterMetadata>) => {
  // When metadata is updated, reload the newsletters to reflect changes
  // This ensures unpublished newsletters disappear from public view
  const includeUnpublished = isAdmin.value;
  await loadNewsletters(includeUnpublished);
};

const onRefreshNeeded = async () => {
  // When a card requests refresh (e.g., sync needed), reload newsletters
  const includeUnpublished = isAdmin.value;
  await loadNewsletters(includeUnpublished);
};

// Watch for sort changes
watch(sortBy, () => {
  onSortChange();
});

// Watch for authentication changes and reload if needed
watch(isAdmin, async (newIsAdmin, oldIsAdmin) => {
  // If admin status changed, reload with appropriate filters
  if (newIsAdmin !== oldIsAdmin) {
    const includeUnpublished = newIsAdmin;
    await loadNewsletters(includeUnpublished);
  }
});
</script>

<style scoped>
.newsletter-grid {
  min-height: 200px;
}
</style>
