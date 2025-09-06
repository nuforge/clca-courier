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
                                Browse through past issues of The Courier with Firebase-powered search and filtering.
                                All content is dynamically loaded from our cloud database with real-time updates.
                            </p>

                            <!-- Service Statistics -->
                            <div v-if="stats" class="q-mt-md">
                                <div class="row text-center">
                                    <div class="col q-pa-md">
                                        <div class="text-h6 text-primary">{{ stats.totalNewsletters }}</div>
                                        <div class="text-caption">Total Issues</div>
                                    </div>
                                    <div class="col q-pa-md">
                                        <div class="text-h6 text-positive">{{ stats.sourceCounts.firebase }}</div>
                                        <div class="text-caption">Firebase Storage</div>
                                    </div>
                                    <div class="col">
                                        <div class="text-h6 text-info">{{ stats.publishedThisYear }}</div>
                                        <div class="text-caption">Published This Year</div>
                                    </div>
                                    <div class="col">
                                        <div class="text-h6 text-secondary">{{ stats.availableYears.length }}</div>
                                        <div class="text-caption">Years Available</div>
                                    </div>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Search and Filter Interface -->
                    <q-card flat :class="cardClasses" class="q-mb-md">
                        <q-card-section>
                            <!-- Search Mode Information -->
                            <div class="row items-center q-mb-md">
                                <div class="text-subtitle2 text-weight-medium q-mr-md">Firebase Search:</div>
                                <q-chip color="primary" text-color="white" icon="cloud">
                                    Real-time Cloud Database
                                </q-chip>
                                <q-space />
                                <div v-if="searchResults && searchResults.searchStats.indexedPdfs > 0"
                                    class="text-caption text-grey-6">
                                    {{ searchResults.searchStats.indexedPdfs }} PDFs indexed
                                </div>
                                <div v-if="isSearching" class="text-caption text-primary">
                                    <q-spinner size="14px" class="q-mr-xs" />
                                    Searching...
                                </div>
                            </div>

                            <!-- Main Search Bar -->
                            <div class="row q-mb-md">
                                <div class="col-12 col-md-8 q-pa-md">
                                    <q-input v-model="searchInput"
                                        label="Search newsletters by title, content, tags, year, or season..."
                                        outlined dense
                                        :class="{ 'bg-grey-1': !isDarkMode, 'bg-grey-9': isDarkMode }"
                                        clearable
                                        :loading="isSearching"
                                        @update:model-value="onSearchInput"
                                        @keydown.enter="handleSearchSubmit"
                                        :aria-label="'Search through ' + (stats?.totalNewsletters || 0) + ' newsletters'"
                                        role="searchbox"
                                        aria-expanded="false"
                                        :aria-describedby="searchInput ? 'search-suggestions' : undefined">
                                        <template v-slot:prepend>
                                            <q-icon name="find_in_page" />
                                        </template>
                                        <template v-slot:append>
                                            <q-btn
                                                v-if="!isSearching && searchInput"
                                                flat dense round
                                                icon="send"
                                                @click="handleSearchSubmit"
                                                :aria-label="'Search for: ' + searchInput"
                                            />
                                            <q-btn flat dense round icon="tune" @click="showFilters = !showFilters"
                                                color="primary">
                                                <q-tooltip>{{ showFilters ? 'Hide' : 'Show' }} Filters</q-tooltip>
                                            </q-btn>
                                        </template>
                                    </q-input>

                                    <!-- Search suggestions -->
                                    <div
                                        v-if="searchSuggestions.length > 0 && searchInput"
                                        id="search-suggestions"
                                        class="q-mt-xs"
                                        role="listbox"
                                        aria-label="Search suggestions"
                                    >
                                        <q-chip
                                            v-for="suggestion in searchSuggestions"
                                            :key="suggestion"
                                            clickable
                                            size="sm"
                                            color="grey-3"
                                            text-color="dark"
                                            class="q-mr-xs q-mb-xs"
                                            @click="applySuggestion(suggestion)"
                                            :tabindex="0"
                                            @keydown.enter="applySuggestion(suggestion)"
                                            role="option"
                                        >
                                            <q-icon name="lightbulb" size="14px" class="q-mr-xs" />
                                            {{ suggestion }}
                                        </q-chip>
                                    </div>

                                    <div class="text-caption text-grey-6 q-mt-xs">
                                        Powered by Firebase Firestore with real-time updates and full-text search
                                        <span v-if="stats?.accessibility">
                                            • {{ stats.accessibility.withSearchableText }} of {{ stats.totalNewsletters }} have searchable text
                                        </span>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4 q-pa-md">
                                    <!-- Quick Filter Buttons -->
                                    <div class="row q-gutter-xs q-mb-md">
                                        <q-btn
                                            outline
                                            dense
                                            color="primary"
                                            size="sm"
                                            @click="applyQuickFilter('featured')"
                                            :label="'Featured (' + (quickFilters?.featured?.length || 0) + ')'"
                                            :aria-label="'Show only featured newsletters, ' + (quickFilters?.featured?.length || 0) + ' available'"
                                        />
                                        <q-btn
                                            outline
                                            dense
                                            color="secondary"
                                            size="sm"
                                            @click="applyQuickFilter('currentYear')"
                                            :label="'This Year (' + (quickFilters?.currentYear?.length || 0) + ')'"
                                            :aria-label="'Show current year newsletters, ' + (quickFilters?.currentYear?.length || 0) + ' available'"
                                        />
                                        <q-btn
                                            outline
                                            dense
                                            color="accent"
                                            size="sm"
                                            @click="applyQuickFilter('recentlyAdded')"
                                            label="Recent"
                                            aria-label="Show recently added newsletters"
                                        />
                                    </div>

                                    <q-select v-model="sortBy" :options="sortOptions" label="Sort By" outlined dense
                                        emit-value map-options
                                        :class="{ 'bg-grey-1': !isDarkMode, 'bg-grey-9': isDarkMode }"
                                        @update:model-value="onSortChange"
                                        aria-label="Sort newsletters by different criteria">
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

                                    <div class="row q-mb-md">
                                        <!-- Year Filter -->
                                        <div class="col-12 col-sm-6 col-md-3 q-pa-md">
                                            <q-select v-model="filters.year" :options="yearFilterOptions" label="Year"
                                                outlined dense clearable emit-value map-options
                                                :class="{ 'bg-grey-1': !isDarkMode, 'bg-grey-9': isDarkMode }"
                                                @update:model-value="onFilterChange">
                                                <template v-slot:prepend>
                                                    <q-icon name="event" />
                                                </template>
                                            </q-select>
                                        </div>

                                        <!-- Season Filter -->
                                        <div class="col-12 col-sm-6 col-md-3 q-pa-md">
                                            <q-select v-model="filters.season" :options="seasonOptions" label="Season"
                                                outlined dense clearable emit-value map-options
                                                :class="{ 'bg-grey-1': !isDarkMode, 'bg-grey-9': isDarkMode }"
                                                @update:model-value="onFilterChange">
                                                <template v-slot:prepend>
                                                    <q-icon name="wb_sunny" />
                                                </template>
                                            </q-select>
                                        </div>

                                        <!-- Page Count Filter -->
                                        <div class="col-12 col-sm-6 col-md-3 q-pa-md">
                                            <q-select v-model="filters.pageCount" :options="pageCountOptions"
                                                label="Page Count" outlined dense clearable emit-value map-options
                                                :class="{ 'bg-grey-1': !isDarkMode, 'bg-grey-9': isDarkMode }"
                                                @update:model-value="onFilterChange">
                                                <template v-slot:prepend>
                                                    <q-icon name="description" />
                                                </template>
                                            </q-select>
                                        </div>

                                        <!-- Featured Filter -->
                                        <div class="col-12 col-sm-6 col-md-3 q-pa-md">
                                            <q-toggle v-model="filters.featured" label="Featured Only" color="primary"
                                                @update:model-value="onFilterChange"
                                                aria-label="Show only featured newsletters" />
                                        </div>
                                    </div>

                                    <!-- Accessibility and Content Filters Row -->
                                    <div class="row q-mb-md">
                                        <!-- Accessibility Filters -->
                                        <div class="col-12 col-sm-6 col-md-3 q-pa-md">
                                            <q-toggle
                                                v-model="filters.hasDescription"
                                                label="With Descriptions"
                                                color="purple"
                                                @update:model-value="onFilterChange"
                                                aria-label="Show only newsletters with descriptions for screen readers"
                                            />
                                        </div>

                                        <div class="col-12 col-sm-6 col-md-3 q-pa-md">
                                            <q-toggle
                                                v-model="filters.hasSearchableText"
                                                label="Text Searchable"
                                                color="orange"
                                                @update:model-value="onFilterChange"
                                                aria-label="Show only newsletters with searchable text content"
                                            />
                                        </div>

                                        <div class="col-12 col-sm-6 col-md-3 q-pa-md">
                                            <q-toggle
                                                v-model="filters.hasThumbnail"
                                                label="With Thumbnails"
                                                color="teal"
                                                @update:model-value="onFilterChange"
                                                aria-label="Show only newsletters with preview thumbnails"
                                            />
                                        </div>

                                        <!-- Accessibility Info -->
                                        <div class="col-12 col-sm-6 col-md-3 q-pa-md">
                                            <div v-if="stats?.accessibility" class="text-caption text-grey-6">
                                                <div><strong>Accessibility:</strong></div>
                                                <div>{{ stats.accessibility.withDescriptions }}/{{ stats.totalNewsletters }} descriptions</div>
                                                <div>{{ stats.accessibility.withSearchableText }}/{{ stats.totalNewsletters }} searchable</div>
                                                <div>{{ stats.accessibility.withThumbnails }}/{{ stats.totalNewsletters }} thumbnails</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Active Filter Chips -->
                                    <div class="row items-center">
                                        <q-btn flat label="Clear All Filters" icon="clear_all" color="negative"
                                            size="sm" @click="clearAllFilters" :disable="!hasActiveFilters" />

                                        <!-- DEBUG: Temporary button to debug newsletter loading -->
                                        <q-btn flat label="Debug All Data" icon="bug_report" color="warning"
                                            size="sm" @click="debugLoadAllNewsletters" class="q-ml-sm" />

                                        <q-space />

                                        <!-- Active Filter Chips -->
                                        <div v-if="hasActiveFilters" class="q-gutter-xs" role="list" aria-label="Active filters">
                                            <q-chip v-if="filters.year" removable
                                                @remove="filters.year = null; onFilterChange()" color="primary"
                                                text-color="white" dense role="listitem">
                                                Year: {{ filters.year }}
                                            </q-chip>
                                            <q-chip v-if="filters.season" removable
                                                @remove="filters.season = null; onFilterChange()" color="secondary"
                                                text-color="white" dense role="listitem">
                                                Season: {{seasonOptions.find(o => o.value === filters.season)?.label}}
                                            </q-chip>
                                            <q-chip v-if="filters.pageCount" removable
                                                @remove="filters.pageCount = null; onFilterChange()" color="info"
                                                text-color="white" dense role="listitem">
                                                {{pageCountOptions.find(o => o.value === filters.pageCount)?.label}}
                                            </q-chip>
                                            <q-chip v-if="filters.featured" removable
                                                @remove="filters.featured = false; onFilterChange()" color="positive"
                                                text-color="white" dense role="listitem">
                                                Featured
                                            </q-chip>
                                            <q-chip v-if="filters.hasDescription" removable
                                                @remove="filters.hasDescription = undefined; onFilterChange()" color="purple"
                                                text-color="white" dense role="listitem">
                                                With Descriptions
                                            </q-chip>
                                            <q-chip v-if="filters.hasSearchableText" removable
                                                @remove="filters.hasSearchableText = undefined; onFilterChange()" color="orange"
                                                text-color="white" dense role="listitem">
                                                Text Searchable
                                            </q-chip>
                                            <q-chip v-if="filters.hasThumbnail" removable
                                                @remove="filters.hasThumbnail = undefined; onFilterChange()" color="teal"
                                                text-color="white" dense role="listitem">
                                                With Thumbnails
                                            </q-chip>
                                            <q-chip v-if="searchInput" removable
                                                @remove="searchInput = ''; onSearchInput()" color="accent"
                                                text-color="white" dense role="listitem">
                                                Search: "{{ searchInput }}"
                                            </q-chip>
                                        </div>
                                    </div>
                                </div>
                            </q-slide-transition>

                            <!-- View Controls and Results -->
                            <div class="row items-center q-mt-md">
                                <div class="col-auto">
                                    <q-btn-toggle
                                        v-model="groupByYear"
                                        :options="[
                                            { label: 'Grid', value: false, icon: 'grid_view', slot: 'grid' },
                                            { label: 'By Year', value: true, icon: 'view_list', slot: 'year' }
                                        ]"
                                        color="primary"
                                        toggle-color="secondary"
                                        flat
                                        :aria-label="'Switch view mode, currently ' + (groupByYear ? 'year grouped' : 'grid') + ' view'"
                                    />
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
                                    <div v-if="stats?.accessibility && filteredNewsletters.length > 0" class="text-caption text-grey-6 q-mt-xs">
                                        <q-icon name="accessibility" size="12px" class="q-mr-xs" />
                                        {{ Math.round((stats.accessibility.withDescriptions / stats.totalNewsletters) * 100) }}% have descriptions,
                                        {{ Math.round((stats.accessibility.withSearchableText / stats.totalNewsletters) * 100) }}% searchable
                                    </div>
                                </div>
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
                            <span v-if="searchInput">
                                No results for "<strong>{{ searchInput }}</strong>"
                            </span>
                            <span v-else-if="hasActiveFilters">
                                No newsletters match your current filters
                            </span>
                            <span v-else>
                                No newsletters are currently available
                            </span>
                        </div>

                        <!-- Helpful suggestions -->
                        <div v-if="searchInput || hasActiveFilters" class="q-mt-md">
                            <div class="text-body2 q-mb-sm">Try:</div>
                            <div class="row justify-center q-gutter-xs">
                                <q-btn
                                    v-if="searchInput"
                                    outline
                                    size="sm"
                                    color="primary"
                                    @click="searchInput = ''; onSearchInput()"
                                    label="Clear Search"
                                />
                                <q-btn
                                    v-if="hasActiveFilters"
                                    outline
                                    size="sm"
                                    color="secondary"
                                    @click="clearAllFilters"
                                    label="Clear Filters"
                                />
                                <q-btn
                                    outline
                                    size="sm"
                                    color="accent"
                                    @click="applyQuickFilter('featured')"
                                    label="View Featured"
                                />
                            </div>
                        </div>

                        <!-- Search suggestions based on available content -->
                        <div v-if="!searchInput && !hasActiveFilters && stats?.availableTags.length" class="q-mt-md">
                            <div class="text-body2 q-mb-sm">Popular topics:</div>
                            <div class="row justify-center q-gutter-xs">
                                <q-chip
                                    v-for="tag in stats.availableTags.slice(0, 6)"
                                    :key="tag"
                                    clickable
                                    size="sm"
                                    color="grey-3"
                                    text-color="dark"
                                    class="q-mr-xs q-mb-xs"
                                    @click="searchInput = tag; onSearchInput()"
                                >
                                    {{ tag }}
                                </q-chip>
                            </div>
                        </div>
                    </div>

                    <!-- Grid View -->
                    <div v-else-if="!groupByYear" class="newsletter-grid">
                        <div class="row">
                            <div v-for="newsletter in sortedNewsletters" :key="newsletter.id"
                                class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-md">
                                <FirebaseNewsletterCard :newsletter="newsletter" />
                            </div>
                        </div>
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

                            <!-- Year Issues -->
                            <div class="newsletter-grid">
                                <div class="row">
                                    <div v-for="newsletter in yearGroup.newsletters" :key="newsletter.id"
                                        class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-md">
                                        <FirebaseNewsletterCard :newsletter="newsletter" />
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
import { ref, computed, watch, onMounted } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import { useFirebaseNewsletterArchive } from '../composables/useFirebaseNewsletterArchive';
import FirebaseNewsletterCard from '../components/FirebaseNewsletterCard.vue';
import type { NewsletterMetadata } from '../services/firebase-firestore.service';

// Local interfaces for enhanced features
interface QuickFilterOptions {
    currentYear: NewsletterMetadata[];
    lastYear: NewsletterMetadata[];
    featured: NewsletterMetadata[];
    withDescriptions: NewsletterMetadata[];
    recentlyAdded: NewsletterMetadata[];
}

interface AccessibilityReport {
    totalIssues: number;
    issues: string[];
    complianceRate: number;
}

// Store
const siteStore = useSiteStore();

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
    loadNewsletters,
    debouncedSearch,
    updateFilters,
    clearFilters,
    getQuickFilterOptions,
    getSearchSuggestions,
    validateAccessibility
} = useFirebaseNewsletterArchive();

// UI state
const showFilters = ref(false);
const groupByYear = ref(false);
const searchInput = ref('');
const sortBy = ref<'relevance' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'pages-desc' | 'pages-asc'>('date-desc');

// Enhanced state for search and accessibility
const searchSuggestions = ref<string[]>([]);
const quickFilters = ref<QuickFilterOptions | null>(null);
const accessibilityReport = ref<AccessibilityReport | null>(null);

// Enhanced filters with accessibility options
const filters = ref({
    year: null as number | null,
    season: null as string | null,
    pageCount: null as string | null,
    featured: false,
    hasDescription: undefined as boolean | undefined,
    hasSearchableText: undefined as boolean | undefined,
    hasThumbnail: undefined as boolean | undefined
});

// Theme computed properties
const isDarkMode = computed(() => siteStore.isDarkMode);
const cardClasses = computed(() => {
    if (siteStore.isDarkMode) {
        return 'bg-dark text-white q-dark';
    } else {
        return 'bg-white text-dark';
    }
});

const greyTextClass = computed(() =>
    siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
);

// Filter options
const sortOptions = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Newest First', value: 'date-desc' },
    { label: 'Oldest First', value: 'date-asc' },
    { label: 'Title A-Z', value: 'title-asc' },
    { label: 'Title Z-A', value: 'title-desc' },
    { label: 'Most Pages', value: 'pages-desc' },
    { label: 'Fewest Pages', value: 'pages-asc' }
];

const seasonOptions = [
    { label: 'Spring', value: 'spring' },
    { label: 'Summer', value: 'summer' },
    { label: 'Fall', value: 'fall' },
    { label: 'Winter', value: 'winter' }
];

const pageCountOptions = [
    { label: '1-5 pages', value: '1-5' },
    { label: '6-10 pages', value: '6-10' },
    { label: '11-20 pages', value: '11-20' },
    { label: '20+ pages', value: '20+' }
];

// Methods
const onSearchInput = () => {
    debouncedSearch(searchInput.value);
};

const onFilterChange = () => {
    const filterUpdate: Record<string, unknown> = {};

    if (filters.value.year) filterUpdate.year = filters.value.year;
    if (filters.value.season) filterUpdate.season = filters.value.season;
    if (filters.value.pageCount) filterUpdate.pageCount = filters.value.pageCount;
    if (filters.value.featured) filterUpdate.featured = filters.value.featured;

    filterUpdate.sortBy = sortBy.value;

    void updateFilters(filterUpdate);
}; const onSortChange = () => {
    void updateFilters({
        sortBy: sortBy.value
    });
};

const clearAllFilters = () => {
    filters.value = {
        year: null,
        season: null,
        pageCount: null,
        featured: false,
        hasDescription: undefined,
        hasSearchableText: undefined,
        hasThumbnail: undefined
    };
    searchInput.value = '';
    sortBy.value = 'date-desc';
    searchSuggestions.value = [];
    void clearFilters();
};

// Enhanced search and filter methods
const handleSearchSubmit = () => {
    if (searchInput.value.trim()) {
        void debouncedSearch(searchInput.value);
    }
};

const applySuggestion = (suggestion: string) => {
    searchInput.value = suggestion;
    searchSuggestions.value = [];
    void debouncedSearch(suggestion);
};

const applyQuickFilter = (filterType: string) => {
    if (!quickFilters.value) return;

    clearAllFilters();

    switch (filterType) {
        case 'featured':
            filters.value.featured = true;
            break;
        case 'currentYear':
            filters.value.year = new Date().getFullYear();
            break;
        case 'recentlyAdded':
            sortBy.value = 'date-desc';
            break;
    }

    onFilterChange();
};

// Update search suggestions when typing
watch(searchInput, (newValue) => {
    if (newValue && newValue.length >= 2) {
        searchSuggestions.value = getSearchSuggestions(newValue);
    } else {
        searchSuggestions.value = [];
    }
});

// Load quick filters and accessibility report on mount
onMounted(() => {
    quickFilters.value = getQuickFilterOptions();
    accessibilityReport.value = validateAccessibility();
});

const retryLoad = () => {
    void loadNewsletters();
};

// DEBUG: Method to load all newsletters regardless of publication status
const debugLoadAllNewsletters = async () => {
    try {
        // Import the service instance to access debug method
        const { firebaseNewsletterService } = await import('../services/firebase-newsletter.service');

        console.log('🔍 DEBUG: Loading all newsletters from Firebase...');
        const allNewsletters = await firebaseNewsletterService.debugLoadAllNewsletters();

        console.log(`🔍 DEBUG: Retrieved ${allNewsletters.length} total newsletters`);
        console.log('🔍 DEBUG: Full data:', allNewsletters);

        // Show an alert with the results
        const published = allNewsletters.filter((n: NewsletterMetadata) => n.isPublished === true);
        const unpublished = allNewsletters.filter((n: NewsletterMetadata) => n.isPublished !== true);

        alert(`Debug Results:
Total newsletters in Firebase: ${allNewsletters.length}
Published (isPublished=true): ${published.length}
Unpublished or missing isPublished: ${unpublished.length}

Check browser console for detailed data.`);

    } catch (error) {
        console.error('🔍 DEBUG: Error loading all newsletters:', error);
        alert(`Debug Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Watch for sort changes
watch(sortBy, () => {
    onSortChange();
});
</script>

<style scoped>
.newsletter-grid {
    min-height: 200px;
}
</style>
