<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useContentStore } from '../stores/content-store';
import { useRoleAuth } from '../composables/useRoleAuth';
import { useRoute, useRouter } from 'vue-router';
import type { ContentDoc } from '../types/core/content.types';
import { logger } from '../utils/logger';
import UnifiedContentList from '../components/UnifiedContentList.vue';
import { normalizeDate } from '../utils/date-formatter';
import { contentUtils } from '../types/core/content.types';

// Following copilot instructions: Use centralized logging, unified types, proper TypeScript
const contentStore = useContentStore();
const { isEditor } = useRoleAuth();
const route = useRoute();
const router = useRouter();

// Loading state from store
const isLoading = computed(() => contentStore.isLoading);

// State for filters, search, and sorting - following copilot instructions: STRICT TYPESCRIPT
const searchQuery = ref<string>('');
const selectedCategory = ref<string>('all');
const sortBy = ref<string>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');
const showDialog = ref<boolean>(false);
const selectedItem = ref<ContentDoc | null>(null);

// Content type filter
const contentType = ref<'all' | 'news' | 'classifieds'>('all');

// View toggle - following copilot instructions: Enhanced UI patterns
const viewMode = ref<'list' | 'card'>('list');

// Debug viewMode changes
watch(viewMode, (newMode, oldMode) => {
  logger.debug('View mode changed:', { from: oldMode, to: newMode });
}, { immediate: true });

// Categories for filtering - following copilot instructions: Dynamic content discovery
const allCategories = computed(() => {
  const newsCategories = ['news', 'announcement', 'event'];
  const classifiedCategories = ['for-sale', 'services', 'wanted', 'free'];
  return [...newsCategories, ...classifiedCategories];
});

// Unified content items - following copilot instructions: Unified Newsletter types (adapting pattern)
const unifiedContent = computed(() => {
  const content: Array<(ContentDoc) & { contentType: 'news' | 'classifieds' }> = [];

  logger.debug('Building unified content:', {
    newsItemsCount: contentStore.newsItems.length,
    classifiedsCount: contentStore.classifieds.length,
    contentTypeFilter: contentType.value
  });

  // Add news items with content type marker
  if (contentType.value === 'all' || contentType.value === 'news') {
    contentStore.newsItems.forEach(item => {
      content.push({ ...item, contentType: 'news' as const });
    });
  }

  // Add classified ads with content type marker
  if (contentType.value === 'all' || contentType.value === 'classifieds') {
    contentStore.classifieds.forEach(item => {
      content.push({ ...item, contentType: 'classifieds' as const });
    });
  }

  logger.debug('Unified content result:', { totalItems: content.length });
  return content;
});

// Main content filtering and sorting
const filteredContent = computed(() => {
  let filtered = contentStore.contentItems;

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Apply category filter
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(item => {
      const contentType = contentUtils.getContentType(item);
      return contentType === selectedCategory.value;
    });
  }

  // Apply sorting
  if (sortBy.value === 'date') {
    filtered = filtered.sort((a, b) => {
      const aDate = normalizeDate(a.timestamps.published) || normalizeDate(a.timestamps.created);
      const bDate = normalizeDate(b.timestamps.published) || normalizeDate(b.timestamps.created);

      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;

      return sortOrder.value === 'desc'
        ? bDate.getTime() - aDate.getTime()
        : aDate.getTime() - bDate.getTime();
    });
  }

  return filtered;
});

const featuredContent = computed(() =>
  filteredContent.value.filter(item => item.tags.includes('featured')).slice(0, 3)
);

// Theme classes - following copilot instructions: Theme awareness
const cardClasses = computed(() => {
  if (contentStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

// Admin check - following copilot instructions: Role-based access patterns
const isAdmin = computed(() => isEditor.value);

// Event handlers - following copilot instructions: Proper TypeScript typing
function showItemDetail(item: ContentDoc): void {
  selectedItem.value = item;
  showDialog.value = true;
}

function clearFilters(): void {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  contentType.value = 'all';
  sortBy.value = 'date';
  sortOrder.value = 'desc';
}


// Helper functions
function formatCategoryName(category: string): string {
  return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/-/g, ' ');
}

function getContentTypeFromItem(item: ContentDoc): string {
  return contentUtils.getContentType(item) || 'unknown';
}

function getDateFromItem(item: ContentDoc): Date {
  const publishedDate = normalizeDate(item.timestamps.published);
  const createdDate = normalizeDate(item.timestamps.created);
  return publishedDate || createdDate || new Date();
}

// Initialize content - following copilot instructions: Async promise handling
onMounted((): void => {
  // Set initial filter from URL query params
  const typeParam = route.query.type as string;
  if (typeParam === 'news' || typeParam === 'classifieds') {
    contentType.value = typeParam;
  }

  void contentStore.loadInitialData().then(() => {
    logger.debug('Community content page initialized successfully');
  }).catch((error: unknown) => {
    logger.error('Error initializing community content page:', error);
  });
});

// Watch for content type changes and update URL - following copilot instructions: Enhanced UI patterns
watch(contentType, (newType: string) => {
  // Update URL query params without navigation
  const query = { ...route.query };
  if (newType === 'all') {
    delete query.type;
  } else {
    query.type = newType;
  }

  void router.replace({ query }).catch((error: unknown) => {
    logger.warn('Failed to update URL query params:', error);
  });
});
</script><template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8 q-col-gutter-sm">
          <!-- Header Section -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-h4 q-mb-md">
                    <q-icon name="mdi-newspaper" class="q-mr-sm" />
                    Community Content
                  </div>
                  <p class="text-body1">
                    Stay informed with the latest news, updates, classifieds, and community announcements.
                    Use the filters below to find exactly what you're looking for.
                  </p>
                </div>
                <div class="col-auto">
                  <q-btn color="primary" icon="create" label="Submit Content"
                    @click="$router.push('/contribute/submit')" class="q-mr-sm" />
                  <q-btn v-if="isAdmin" color="secondary" icon="mdi-cog" label="Manage Content"
                    @click="$router.push('/admin/content')" outline />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Filters and Search Section -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="row q-col-gutter-md">
                <!-- Search -->
                <div class="col-12 col-md-4">
                  <q-input
                    v-model="searchQuery"
                    label="Search content..."
                    outlined
                    dense
                    clearable
                  >
                    <template v-slot:prepend>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </div>


                <!-- Category Filter -->
                <div class="col-12 col-md-2">
                  <q-select
                    v-model="selectedCategory"
                    :options="[
                      { label: 'All Categories', value: 'all' },
                      ...allCategories.map(cat => ({
                        label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
                        value: cat
                      }))
                    ]"
                    label="Category"
                    outlined
                    dense
                    emit-value
                    map-options
                  />
                </div>

                <!-- Sort By -->
                <div class="col-12 col-md-2">
                  <q-select
                    v-model="sortBy"
                    :options="[
                      { label: 'Date', value: 'date' },
                      { label: 'Title', value: 'title' }
                    ]"
                    label="Sort By"
                    outlined
                    dense
                    emit-value
                    map-options
                  />
                </div>

                <!-- Sort Order -->
                <div class="col-12 col-md-2">
                  <q-select
                    v-model="sortOrder"
                    :options="[
                      { label: 'Newest First', value: 'desc' },
                      { label: 'Oldest First', value: 'asc' }
                    ]"
                    label="Order"
                    outlined
                    dense
                    emit-value
                    map-options
                  />
                </div>
              </div>

                            <!-- Filter Actions -->
              <div class="row q-mt-md items-center">
                <div class="col">
                  <q-btn
                    flat
                    color="primary"
                    icon="clear"
                    label="Clear All Filters"
                    @click="clearFilters"
                    size="sm"
                  />
                  <q-chip
                    v-if="filteredContent.length !== unifiedContent.length"
                    color="primary"
                    text-color="white"
                    class="q-ml-sm"
                  >
                    {{ filteredContent.length }} of {{ unifiedContent.length }} items
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-btn-toggle
                    v-model="viewMode"
                    toggle-color="primary"
                    :options="[
                      { label: 'List', value: 'list', icon: 'view_list' },
                      { label: 'Cards', value: 'card', icon: 'view_module' }
                    ]"
                    size="sm"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Featured Content Section -->
          <div v-if="!isLoading && featuredContent.length > 0" class="q-col-gutter-sm">
            <div class="text-h5">Featured Content</div>
            <UnifiedContentList
              :items="featuredContent"
              @item-click="showItemDetail"
            />
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center q-py-xl">
            <q-spinner-dots size="50px" color="primary" />
            <div class="text-h6 q-mt-md">Loading content...</div>
          </div>

          <!-- All Content List -->
          <div v-else class="q-col-gutter-sm">

            <div class="text-h5">News & Updates</div>

            <UnifiedContentList
              :items="filteredContent"
              :variant="viewMode"
              empty-message="No content found"
              empty-icon="search_off"
              @item-click="showItemDetail"
            />

            <!-- Debug info -->
            <div class="q-mt-md text-caption text-grey">
              Debug: {{ filteredContent.length }} items, viewMode: {{ viewMode }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Detail Dialog -->
    <q-dialog v-model="showDialog" position="right" full-height>
      <q-card :class="cardClasses" style="width: 500px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedItem?.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>


        <q-card-section v-if="selectedItem">
            <div class="text-overline q-mb-sm">
              {{ formatCategoryName(getContentTypeFromItem(selectedItem)) }}
            </div>
            <div class="text-body2 q-mb-md" >
              By {{ selectedItem.authorName }} •
              {{ getDateFromItem(selectedItem).toLocaleDateString() }}
            </div>
            <div class="text-body1">
              {{ selectedItem.description }}
            </div>
          </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
