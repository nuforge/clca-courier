<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { useGoogleDrivePdfs } from '../composables/useGoogleDrivePdfs'
import GoogleDriveIssueCard from '../components/GoogleDriveIssueCard.vue'
import type { IssueWithGoogleDrive } from '../types/google-drive-content'

const siteStore = useSiteStore()
const googleDrivePdfs = useGoogleDrivePdfs()

// UI state
const groupByYear = ref(false)
const sortBy = ref<'date' | 'title' | 'pages' | 'size'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')
const searchQuery = ref('')

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

// Get issues from Google Drive composable
const rawIssues = computed(() => googleDrivePdfs.archivedIssues.value)
const isLoading = computed(() => googleDrivePdfs.state.value.isLoading)
const error = computed(() => googleDrivePdfs.state.value.error)
const thumbnails = computed(() => googleDrivePdfs.state.value.thumbnails)
const loadingThumbnails = computed(() => googleDrivePdfs.state.value.loadingThumbnails)

// Filtered and sorted issues
const filteredIssues = computed(() => {
  let issues = rawIssues.value;

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    issues = issues.filter(issue =>
      issue.title.toLowerCase().includes(query) ||
      issue.filename.toLowerCase().includes(query) ||
      (issue.description && issue.description.toLowerCase().includes(query))
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
  const grouped: Record<string, IssueWithGoogleDrive[]> = {};
  filteredIssues.value.forEach((issue) => {
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

onMounted(async () => {
  // Initialize Google Drive connection and load issues
  const success = await googleDrivePdfs.initialize()
  if (success) {
    // Load thumbnails for all issues
    await googleDrivePdfs.loadAllThumbnails()
  }
})

async function regenerateIssueThumbnail(issue: IssueWithGoogleDrive, event?: Event) {
  if (event) {
    event.stopPropagation(); // Prevent card click
  }

  try {
    console.log('Regenerating thumbnail for:', issue.title);
    await googleDrivePdfs.regenerateThumbnail(issue);
    console.log('Thumbnail regenerated successfully for:', issue.title);
  } catch (error) {
    console.error('Error regenerating thumbnail for', issue.title, error);
  }
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
                Browse through past issues of The Courier. Access previous newsletters, announcements,
                and community updates from our Google Drive archive.
              </p>

              <!-- Status and controls -->
              <div class="row q-gutter-md q-mt-md" v-if="error || isLoading">
                <div class="col">
                  <q-banner v-if="error && !error.includes('showing local files')" class="bg-negative text-white"
                    rounded>
                    <template v-slot:avatar>
                      <q-icon name="mdi-alert" />
                    </template>
                    {{ error }}
                  </q-banner>

                  <q-banner v-else-if="error && error.includes('showing local files')" class="bg-warning text-dark"
                    rounded>
                    <template v-slot:avatar>
                      <q-icon name="mdi-information" />
                    </template>
                    {{ error }}
                  </q-banner>

                  <q-banner v-if="isLoading" class="bg-info text-white" rounded>
                    <template v-slot:avatar>
                      <q-spinner-dots />
                    </template>
                    Loading issues from Google Drive...
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

              <!-- Search and Filter Controls -->
              <div class="row q-col-gutter-md q-mb-md">
                <!-- Search -->
                <div class="col-12 col-md-6">
                  <q-input v-model="searchQuery" outlined placeholder="Search issues..." clearable
                    :bg-color="siteStore.isDarkMode ? 'grey-9' : 'white'">
                    <template v-slot:prepend>
                      <q-icon name="mdi-magnify" />
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
              <div class="q-mb-md" v-if="Object.keys(issuesByYear).length > 1">
                <q-toggle v-model="groupByYear" label="Group by year" color="primary" />
              </div>

              <!-- Issues grouped by year -->
              <div v-if="groupByYear && Object.keys(issuesByYear).length > 1">
                <div v-for="(yearIssues, year) in issuesByYear" :key="year" class="q-mb-lg">
                  <div class="text-h6 q-mb-md">{{ year }}</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="issue in yearIssues" :key="issue.id">
                      <GoogleDriveIssueCard :issue="issue"
                        :thumbnail="thumbnails[issue.googleDriveFileId || issue.id.toString()]"
                        :is-loading="loadingThumbnails.has(issue.googleDriveFileId || issue.id.toString())"
                        :show-metadata="true" @regenerate-thumbnail="regenerateIssueThumbnail" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- All issues in chronological order -->
              <div v-else>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="issue in archivedIssues" :key="issue.id">
                    <GoogleDriveIssueCard :issue="issue"
                      :thumbnail="thumbnails[issue.googleDriveFileId || issue.id.toString()]"
                      :is-loading="loadingThumbnails.has(issue.googleDriveFileId || issue.id.toString())"
                      :show-metadata="true" @regenerate-thumbnail="regenerateIssueThumbnail" />
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div class="text-center q-mt-lg" v-if="archivedIssues.length === 0 && !isLoading">
                <q-icon name="mdi-bookshelf" size="4em" color="grey-5" />
                <div :class="greyTextClass" class="q-mt-md">
                  {{ error ? 'Unable to load issues from Google Drive' : 'No archived issues available yet' }}
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
/* Main page styles only - card styles moved to IssueCard component */
</style>
