<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { useHybridNewsletters } from '../composables/useHybridNewsletters'
import HybridNewsletterCard from '../components/HybridNewsletterCard.vue'
import type { NewsletterMetadata } from '../services/newsletter-service'

const siteStore = useSiteStore()
const hybridNewsletters = useHybridNewsletters()

// UI state
const groupByYear = ref(false)
const sortBy = ref<'date' | 'title' | 'pages' | 'size'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')
const searchQuery = ref('')
const showAdvancedSearch = ref(false)

// Computed property for card theme classes
const cardClasses = computed(() => {
  // Use specific classes that ensure proper theming for all child components
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

// Filtered and sorted issues
const filteredIssues = computed(() => {
  let issues = rawIssues.value;

  // Apply simple search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    issues = issues.filter((issue: NewsletterMetadata) =>
      issue.title.toLowerCase().includes(query) ||
      issue.filename.toLowerCase().includes(query) ||
      (issue.topics && issue.topics.some((topic: string) => topic.toLowerCase().includes(query))) ||
      (issue.tags && issue.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    );
  }

  // Apply sorting
  issues = [...issues].sort((a, b) => {
    let comparison = 0;

    switch (sortBy.value) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'pages':
        comparison = a.pages - b.pages;
        break;
      case 'size': {
        // Parse file sizes for comparison
        const sizeA = parseFileSize(a.fileSize || '0');
        const sizeB = parseFileSize(b.fileSize || '0');
        comparison = sizeA - sizeB;
        break;
      }
    }

    return sortOrder.value === 'desc' ? -comparison : comparison;
  });

  return issues;
});

const archivedIssues = computed(() => filteredIssues.value)

const issuesByYear = computed(() => {
  const grouped: Record<string, NewsletterMetadata[]> = {};
  filteredIssues.value.forEach((issue: NewsletterMetadata) => {
    const year = new Date(issue.date).getFullYear().toString();
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(issue);
  });
  return grouped;
});

// Sort options
const sortOptions = [
  { label: 'Date', value: 'date' },
  { label: 'Title', value: 'title' },
  { label: 'Pages', value: 'pages' },
  { label: 'File Size', value: 'size' }
];

// Helper function to parse file sizes for sorting
const parseFileSize = (sizeStr: string): number => {
  if (!sizeStr || sizeStr === 'Unknown') return 0;

  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
  if (!match || !match[1] || !match[2]) return 0;

  const numStr = match[1];
  const unit = match[2];
  const num = parseFloat(numStr);

  switch (unit.toUpperCase()) {
    case 'B': return num;
    case 'KB': return num * 1024;
    case 'MB': return num * 1024 * 1024;
    case 'GB': return num * 1024 * 1024 * 1024;
    default: return 0;
  }
};

// Responsive grid classes based on screen size and available width
const getResponsiveClasses = (): string => {
  // Improved responsive grid for better space utilization with 4-5 columns max
  return 'col-12 col-xs-6 col-sm-4 col-md-4 col-lg-3 col-xl-3';
};

onMounted(async () => {
  // Load hybrid newsletters
  await initialize();
})

async function initialize() {
  console.log('🔄 Loading hybrid newsletters...');
  await hybridNewsletters.loadNewsletters();
  console.log('✅ Hybrid newsletters loaded successfully');
}

</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="text-h4 q-mb-md">
                <q-icon name="mdi-bookshelf" class="q-mr-sm" />
                Issue Archive
              </div>
              <p class="text-body1">
                Browse through past issues of The Courier with our hybrid hosting system.
                Issues are available from both local web hosting and Google Drive archive,
                ensuring fast access and reliable downloads.
              </p>

              <!-- Status and controls -->
              <div class="row q-gutter-md q-mt-md" v-if="error || isLoading">
                <div class="col">
                  <!-- Loading state -->
                  <q-banner v-if="isLoading" class="bg-primary text-white" rounded>
                    <template v-slot:avatar>
                      <q-spinner-dots />
                    </template>
                    <div>
                      <strong>Loading Newsletter Archive...</strong><br>
                      Loading newsletters from both local and Google Drive sources.
                    </div>
                  </q-banner>

                  <!-- Error state -->
                  <q-banner v-else-if="error" class="bg-negative text-white" rounded>
                    <template v-slot:avatar>
                      <q-icon name="mdi-alert" />
                    </template>
                    <div>
                      <strong>Error Loading Newsletters</strong><br>
                      {{ error }}
                      <br><br>
                      <q-btn flat color="white" label="Retry" @click="initialize()" />
                    </div>
                  </q-banner>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat :class="cardClasses">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                Available Issues
                <q-chip v-if="archivedIssues.length > 0" color="primary" text-color="white" class="q-ml-sm">
                  {{ archivedIssues.length }} issues
                </q-chip>
              </div>
              <q-separator class="q-mb-md" />

              <!-- Simple Search and Filter Controls -->
              <div class="row q-col-gutter-md q-mb-md">
                <!-- Search -->
                <div class="col-12 col-md-6">
                  <q-input v-model="searchQuery" outlined placeholder="Search issues, topics, and tags..." clearable
                    :bg-color="siteStore.isDarkMode ? 'grey-9' : 'white'">
                    <template v-slot:prepend>
                      <q-icon name="mdi-magnify" />
                    </template>
                    <template v-slot:append>
                      <q-btn round dense flat icon="mdi-tune" @click="showAdvancedSearch = !showAdvancedSearch"
                        :color="showAdvancedSearch ? 'primary' : 'grey-6'">
                        <q-tooltip>Advanced Search</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </div>

                <!-- Sort Controls -->
                <div class="col-6 col-md-3">
                  <q-select v-model="sortBy" :options="sortOptions" outlined label="Sort by" emit-value map-options
                    :bg-color="siteStore.isDarkMode ? 'grey-9' : 'white'" />
                </div>

                <div class="col-6 col-md-3">
                  <q-btn-toggle v-model="sortOrder" toggle-color="primary" :options="[
                    { label: 'Asc', value: 'asc', icon: 'mdi-sort-ascending' },
                    { label: 'Desc', value: 'desc', icon: 'mdi-sort-descending' }
                  ]" outline />
                </div>
              </div>

              <!-- Group by year option -->
              <div class="q-mb-md" v-show="Object.keys(issuesByYear).length > 1">
                <q-toggle v-model="groupByYear" label="Group by year" color="primary" />
              </div>

              <!-- Advanced Search Placeholder -->
              <q-slide-transition>
                <div v-show="showAdvancedSearch" class="q-mb-md">
                  <q-card flat :class="cardClasses">
                    <q-card-section>
                      <div class="text-h6 q-mb-md">
                        <q-icon name="mdi-tune" class="q-mr-sm" />
                        Advanced Search
                        <q-chip color="orange" text-color="white" class="q-ml-sm">Coming Soon</q-chip>
                      </div>
                      <p class="text-body2">
                        Advanced search with PDF content scanning, date ranges, and relevance scoring will be available
                        soon.
                        Currently, use the search box above to find issues by title, topics, and tags.
                      </p>
                    </q-card-section>
                  </q-card>
                </div>
              </q-slide-transition>

              <!-- Show regular newsletter issues -->
              <div>
                <!-- Issues grouped by year -->
                <div v-if="groupByYear && Object.keys(issuesByYear).length > 1">
                  <div v-for="(yearIssues, year) in issuesByYear" :key="year" class="q-mb-lg">
                    <div class="text-h6 q-mb-md">{{ year }}</div>
                    <div class="row q-col-gutter-md">
                      <div :class="getResponsiveClasses()" v-for="newsletter in yearIssues" :key="newsletter.id">
                        <HybridNewsletterCard :newsletter="newsletter" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- All issues in chronological order -->
                <div v-else>
                  <div class="row q-col-gutter-md">
                    <div :class="getResponsiveClasses()" v-for="newsletter in archivedIssues" :key="newsletter.id">
                      <HybridNewsletterCard :newsletter="newsletter" />
                    </div>
                  </div>
                </div>

                <!-- Empty state -->
                <div class="text-center q-mt-lg" v-if="archivedIssues.length === 0 && !isLoading">
                  <q-icon name="mdi-bookshelf" size="4em" color="grey-5" />
                  <div :class="greyTextClass" class="q-mt-md">
                    <div class="text-h6">No Newsletter Issues Found</div>
                    <div class="q-mt-sm">
                      {{ error
                        ? 'There was an error loading the newsletter archive.'
                        : 'The newsletter archive appears to be empty.' }}
                    </div>
                    <div class="q-mt-md" v-if="error">
                      <q-btn color="primary" label="Refresh" @click="initialize()" />
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
/* Main page styles only - card styles moved to components */
</style>
