<template>
  <div class="lightweight-test-page q-pa-md">
    <div class="row q-gutter-md">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">🚀 Lightweight PDF Processing Test</div>
            <div class="text-subtitle2 text-grey-7">Testing fast loading with smart caching</div>
          </q-card-section>

          <q-card-section>
            <!-- Search Interface -->
            <div class="row q-gutter-md items-center q-mb-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="searchQuery"
                  placeholder="Search newsletters (instant results)..."
                  outlined
                  clearable
                  @clear="clearSearch"
                  @keyup.enter="performSearch"
                >
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-3">
                <q-btn-toggle
                  v-model="searchMode"
                  no-caps
                  unelevated
                  toggle-color="primary"
                  :options="[
                    { label: 'Fast', value: 'lightweight' },
                    { label: 'Content', value: 'content' }
                  ]"
                  @update:model-value="onSearchModeChange"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-btn
                  color="primary"
                  label="Search"
                  @click="performSearch"
                  :loading="isSearching"
                  :disable="!searchQuery || searchQuery.length < 2"
                />
              </div>
            </div>

            <!-- Statistics -->
            <div class="row q-gutter-md q-mb-md">
              <div class="col">
                <q-chip color="primary" text-color="white" icon="description">
                  {{ newsletters.length }} Newsletters
                </q-chip>
              </div>
              <div class="col">
                <q-chip color="positive" text-color="white" icon="cached">
                  {{ processingStats.processed }} Processed
                </q-chip>
              </div>
              <div class="col">
                <q-chip color="orange" text-color="white" icon="hourglass_empty">
                  {{ processingStats.processing }} Processing
                </q-chip>
              </div>
              <div class="col">
                <q-chip color="grey" text-color="white" icon="pending">
                  {{ processingStats.pending }} Pending
                </q-chip>
              </div>
            </div>

            <!-- Search Results -->
            <div v-if="searchResults.length > 0" class="q-mb-md">
              <div class="text-subtitle1 q-mb-sm">
                Search Results ({{ searchResults.length }})
                <q-chip v-if="searchStats.searchTime > 0" size="sm" color="grey-3">
                  {{ searchStats.searchTime }}ms
                </q-chip>
              </div>

              <div class="row q-gutter-sm">
                <div
                  v-for="result in searchResults.slice(0, 6)"
                  :key="result.id"
                  class="col-12 col-md-6"
                >
                  <q-card flat bordered>
                    <q-card-section class="q-pa-sm">
                      <div class="text-subtitle2">{{ result.title }}</div>
                      <div class="text-caption text-grey-6">
                        {{ result.filename }} • {{ result.pages }} pages
                        <q-chip
                          v-if="result.isProcessed"
                          size="xs"
                          color="positive"
                          text-color="white"
                        >
                          Rich Data
                        </q-chip>
                        <q-chip
                          v-else-if="result.isProcessing"
                          size="xs"
                          color="orange"
                          text-color="white"
                        >
                          Processing
                        </q-chip>
                      </div>
                      <div v-if="result.topics && result.topics.length > 0" class="q-mt-xs">
                        <q-chip
                          v-for="topic in result.topics.slice(0, 3)"
                          :key="topic"
                          size="xs"
                          color="grey-3"
                        >
                          {{ topic }}
                        </q-chip>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- All Newsletters -->
            <div class="text-subtitle1 q-mb-sm">All Newsletters</div>
            <div class="row q-gutter-sm">
              <div
                v-for="newsletter in newsletters.slice(0, 12)"
                :key="newsletter.id"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
              >
                <q-card flat bordered>
                  <q-card-section class="q-pa-sm">
                    <div class="text-subtitle2">{{ newsletter.title }}</div>
                    <div class="text-caption text-grey-6">
                      {{ newsletter.date }} • {{ newsletter.pages }} pages
                    </div>
                    <div class="q-mt-xs">
                      <q-chip
                        v-if="newsletter.isProcessed"
                        size="xs"
                        color="positive"
                        text-color="white"
                        icon="check"
                      >
                        Processed
                      </q-chip>
                      <q-chip
                        v-else-if="newsletter.isProcessing"
                        size="xs"
                        color="orange"
                        text-color="white"
                        icon="hourglass_empty"
                      >
                        Processing
                      </q-chip>
                      <q-chip
                        v-else
                        size="xs"
                        color="grey"
                        text-color="white"
                        icon="pending"
                      >
                        Pending
                      </q-chip>
                    </div>
                    <div v-if="newsletter.topics && newsletter.topics.length > 0" class="q-mt-xs">
                      <q-chip
                        v-for="topic in newsletter.topics.slice(0, 2)"
                        :key="topic"
                        size="xs"
                        color="grey-3"
                      >
                        {{ topic }}
                      </q-chip>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { lightweightNewsletterService } from '../services/lightweight-newsletter-service';
import { useAdvancedSearch } from '../composables/useAdvancedSearch';

// Services
const {
  isSearching,
  searchResults: advancedSearchResults,
  searchStats,
  performSearch: performAdvancedSearch,
  clearSearch: clearAdvancedSearch,
  updateFilters
} = useAdvancedSearch();

// Local state
const newsletters = ref<any[]>([]);
const searchQuery = ref('');
const searchMode = ref<'lightweight' | 'content'>('lightweight');
const searchResults = ref<any[]>([]);
const isLoading = ref(true);
const processingStats = ref({
  total: 0,
  processed: 0,
  processing: 0,
  pending: 0
});

// Load newsletters on mount
onMounted(async () => {
  console.log('[LightweightTest] Starting newsletter load...');
  const startTime = Date.now();

  try {
    newsletters.value = await lightweightNewsletterService.getNewsletters();
    processingStats.value = lightweightNewsletterService.getProcessingStats();

    const loadTime = Date.now() - startTime;
    console.log(`[LightweightTest] ✅ Loaded ${newsletters.value.length} newsletters in ${loadTime}ms`);

    // Update stats periodically as background processing completes
    const statsInterval = setInterval(() => {
      processingStats.value = lightweightNewsletterService.getProcessingStats();

      // Stop updating when all processing is complete
      if (processingStats.value.processing === 0 && processingStats.value.pending === 0) {
        clearInterval(statsInterval);
      }
    }, 2000);

  } catch (error) {
    console.error('[LightweightTest] Failed to load newsletters:', error);
  } finally {
    isLoading.value = false;
  }
});

// Search functionality
const performSearch = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }

  console.log(`[LightweightTest] Searching: "${searchQuery.value}" (mode: ${searchMode.value})`);
  const startTime = Date.now();

  try {
    if (searchMode.value === 'lightweight') {
      // Use lightweight newsletter service search
      searchResults.value = await lightweightNewsletterService.searchNewsletters(searchQuery.value);

      console.log(`[LightweightTest] Lightweight search completed: ${searchResults.value.length} results`);
    } else {
      // Use advanced search with content
      updateFilters({ includeContent: true });

      // Convert newsletters to format expected by advanced search
      const searchableIssues = newsletters.value.map((newsletter, index) => ({
        id: newsletter.id,
        title: newsletter.title,
        date: newsletter.date,
        pages: newsletter.pages,
        filename: newsletter.filename,
        status: 'local' as const,
        syncStatus: 'synced' as const,
        url: newsletter.url,
        description: newsletter.title,
        fileSize: newsletter.fileSize,
        thumbnailUrl: newsletter.thumbnailUrl,
        tags: newsletter.topics || [],
        category: newsletter.contentType,
      }));

      await performAdvancedSearch(searchableIssues, searchQuery.value);
      searchResults.value = advancedSearchResults.value.map(r => r.issue);
    }

    console.log(`[LightweightTest] Found ${searchResults.value.length} results in ${Date.now() - startTime}ms`);

  } catch (error) {
    console.error('[LightweightTest] Search failed:', error);
    searchResults.value = [];
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  clearAdvancedSearch();
};

const onSearchModeChange = (mode: 'lightweight' | 'content') => {
  updateFilters({ includeContent: mode === 'content' });

  if (searchQuery.value && searchQuery.value.length >= 2) {
    performSearch();
  }
};

// Auto-search with debouncing
let searchTimeout: NodeJS.Timeout;
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (newQuery && newQuery.length >= 2) {
      performSearch();
    } else {
      searchResults.value = [];
    }
  }, 300);
});
</script>
