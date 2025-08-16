<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSiteStore } from '../stores/site-store-simple'
import { useDynamicGoogleDriveIssues } from '../composables/useDynamicGoogleDriveIssues'
import GoogleDriveIssueCard from '../components/GoogleDriveIssueCard.vue'
import type { IssueWithGoogleDrive } from '../types/google-drive-content'

const siteStore = useSiteStore()
const dynamicIssues = useDynamicGoogleDriveIssues()

// UI state
const groupByYear = ref(false)
const sortBy = ref<'date' | 'title' | 'pages' | 'size'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')
const searchQuery = ref('')
const showPopupInstructions = ref(false)

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

// Get issues from dynamic Google Drive composable - NO OAUTH - USES SPECIFIC FILE IDS
const rawIssues = computed(() => dynamicIssues.issues.value)
const isLoading = computed(() => dynamicIssues.loading.value)
const error = computed(() => dynamicIssues.error.value)

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
  // Load simple Google Drive issues - no authentication needed!
  await initialize();
})

function regenerateIssueThumbnail(issue: IssueWithGoogleDrive, event?: Event) {
  if (event) {
    event.stopPropagation(); // Prevent card click
  }

  try {
    console.log('Thumbnail regeneration not needed for simple version:', issue.title);
    // In simple version, no thumbnail regeneration needed
  } catch (error) {
    console.error('Error in thumbnail function for', issue.title, error);
  }
}

async function initialize() {
  console.log('🔄 Loading dynamic Google Drive issues (NO OAUTH - SPECIFIC FILE IDS)...');
  await dynamicIssues.loadIssues();
  console.log('✅ Dynamic issues loaded successfully');
}

// Simple version - no authentication needed
function testAuthentication() {
  console.log('🎉 No authentication needed! Using dynamic Google Drive file fetching.');
  return true;
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
                Issue Archive & Google Drive Browser
              </div>
              <p class="text-body1">
                Browse through past issues of The Courier loaded directly from our Google Drive archive.
                This comprehensive browser provides access to all published issues with advanced search, sorting, and
                filtering capabilities.
              </p>

              <!-- Status and controls -->
              <div class="row q-gutter-md q-mt-md" v-if="error || isLoading">
                <div class="col">
                  <!-- Google Drive configuration error -->
                  <q-banner v-if="error && error.includes('not configured')" class="bg-warning text-dark" rounded>
                    <template v-slot:avatar>
                      <q-icon name="mdi-cloud-off" />
                    </template>
                    <div>
                      <strong>Google Drive Not Configured</strong><br>
                      {{ error }}
                      <br><br>
                      <small>To see issues from Google Drive, configure the following environment variables:</small>
                      <ul class="q-ma-none q-pl-md">
                        <li><code>VITE_GOOGLE_API_KEY</code></li>
                        <li><code>VITE_GOOGLE_CLIENT_ID</code></li>
                        <li><code>VITE_GOOGLE_DRIVE_ISSUES_FOLDER_ID</code></li>
                      </ul>
                    </div>
                  </q-banner>

                  <!-- Authentication error -->
                  <q-banner
                    v-else-if="error && (error.includes('authenticate') || error.includes('AUTHENTICATION_REQUIRED') || error.includes('POPUP_CLOSED') || error.includes('popup'))"
                    class="bg-warning text-dark" rounded>
                    <template v-slot:avatar>
                      <q-icon name="mdi-lock-alert" />
                    </template>
                    <div>
                      <strong>Authentication Issue</strong><br>
                      {{ error.includes('POPUP_CLOSED') ? 'Authentication popup was closed or blocked.' : error }}
                      <br><br>
                      <div class="q-mb-sm">
                        <strong>To fix this:</strong>
                        <ol class="q-ma-none q-pl-md">
                          <li>Allow popups for this website in your browser</li>
                          <li>Make sure you're not blocking third-party cookies</li>
                          <li>Try disabling ad blockers temporarily</li>
                          <li>Use a different browser if the issue persists</li>
                        </ol>
                      </div>
                      <div class="row q-gutter-sm">
                        <q-btn flat color="dark" label="Try Again" @click="initialize()" />
                        <q-btn flat color="dark" label="Instructions" @click="showPopupInstructions = true" />
                        <q-btn flat color="dark" label="Authenticate with Google" @click="testAuthentication()" />
                      </div>
                    </div>
                  </q-banner>

                  <!-- No issues found error -->
                  <q-banner v-else-if="error && error.includes('No issues found')" class="bg-info text-white" rounded>
                    <template v-slot:avatar>
                      <q-icon name="mdi-information" />
                    </template>
                    <div>
                      <strong>No Issues Found</strong><br>
                      {{ error }}
                      <br><br>
                      <small>Make sure PDF files are uploaded to the configured Google Drive folder.</small>
                    </div>
                  </q-banner>

                  <!-- General error -->
                  <q-banner v-else-if="error" class="bg-negative text-white" rounded>
                    <template v-slot:avatar>
                      <q-icon name="mdi-alert" />
                    </template>
                    <div>
                      <strong>Error Loading Issues</strong><br>
                      {{ error }}
                      <br><br>
                      <q-btn flat color="white" label="Retry" @click="initialize()" />
                    </div>
                  </q-banner>

                  <!-- Loading state -->
                  <q-banner v-if="isLoading" class="bg-primary text-white" rounded>
                    <template v-slot:avatar>
                      <q-spinner-dots />
                    </template>
                    <div>
                      <strong>Loading from Google Drive...</strong><br>
                      Connecting to Google Drive and loading PDF issues. This may take a moment.
                    </div>
                  </q-banner>

                  <!-- Not authenticated (but no error) -->
                  <q-banner v-else-if="!error && !isLoading && rawIssues.length === 0" class="bg-orange text-white"
                    rounded>
                    <template v-slot:avatar>
                      <q-icon name="mdi-google-drive" />
                    </template>
                    <div>
                      <strong>Google Drive Authentication Required</strong><br>
                      To view issues from Google Drive, you need to authenticate with your Google account.
                      <br><br>
                      <q-btn flat color="white" label="Authenticate with Google" @click="testAuthentication()" />
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
                      :key="issue.id"
                      :issue="issue"
                      :is-loading="false"
                      class="q-mb-md"
                    </div>
                  </div>
                </div>
              </div>

              <!-- All issues in chronological order -->
              <div v-else>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="issue in archivedIssues" :key="issue.id">
                    <GoogleDriveIssueCard :issue="issue" :show-metadata="true"
                      @regenerate-thumbnail="regenerateIssueThumbnail" />
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div class="text-center q-mt-lg" v-if="archivedIssues.length === 0 && !isLoading">
                <q-icon name="mdi-cloud-off" size="4em" color="grey-5" />
                <div :class="greyTextClass" class="q-mt-md">
                  <div class="text-h6">No Google Drive Issues Found</div>
                  <div class="q-mt-sm">
                    {{ error && !error.includes('not configured')
                      ? 'Check your Google Drive folder or try refreshing the page.'
                      : 'Configure Google Drive integration to see archived issues.' }}
                  </div>
                  <div class="q-mt-md" v-if="!error || !error.includes('not configured')">
                    <q-btn color="primary" label="Refresh" @click="initialize()" />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Popup Instructions Dialog -->
    <q-dialog v-model="showPopupInstructions">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Enable Popups for Google Authentication</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body2">
            <p>To authenticate with Google Drive, this site needs to open a popup window. Here's how to enable popups:
            </p>

            <div class="q-mb-md">
              <strong>Chrome:</strong>
              <ol>
                <li>Click the popup blocked icon in the address bar</li>
                <li>Select "Always allow popups from this site"</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>

            <div class="q-mb-md">
              <strong>Firefox:</strong>
              <ol>
                <li>Click the shield icon in the address bar</li>
                <li>Turn off "Enhanced Tracking Protection" for this site</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>

            <div class="q-mb-md">
              <strong>Safari:</strong>
              <ol>
                <li>Go to Safari > Preferences > Privacy</li>
                <li>Uncheck "Prevent cross-site tracking"</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>

            <p><strong>Note:</strong> If you're using an ad blocker, try disabling it temporarily for this site.</p>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Got it" color="primary" v-close-popup />
          <q-btn flat label="Try Again" color="primary" @click="showPopupInstructions = false; initialize()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
/* Main page styles only - card styles moved to IssueCard component */
</style>
