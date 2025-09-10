<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import { useRoleAuth } from '../composables/useRoleAuth';
import type { NewsItem, ClassifiedAd } from '../types/core/content.types';
import { logger } from '../utils/logger';
import UnifiedContentList from '../components/UnifiedContentList.vue';
import { useSiteTheme } from '../composables/useSiteTheme';
import { formatDate as formatDateUtil, sortByDateDesc } from '../utils/date-formatter';
import { UI_ICONS } from '../constants/ui-icons';

// Following copilot instructions: Use centralized logging, unified types, proper TypeScript
const siteStore = useSiteStore();
const { isEditor } = useRoleAuth();

// Theme system for consistent icons and colors - PROPER ARCHITECTURE
const { getContentIcon, getCategoryIcon, colors } = useSiteTheme();

// Loading state from store
const isLoading = computed(() => siteStore.isLoading);

// State for filters, search, and sorting - following copilot instructions: STRICT TYPESCRIPT
const searchQuery = ref<string>('');
const selectedCategory = ref<string>('all');
const sortBy = ref<string>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');
const showDialog = ref<boolean>(false);
const selectedItem = ref<NewsItem | ClassifiedAd | null>(null);

// View toggle - following copilot instructions: Enhanced UI patterns
const viewMode = ref<'list' | 'card'>('list');

// Debug viewMode changes
watch(viewMode, (newMode, oldMode) => {
  logger.debug('View mode changed:', { from: oldMode, to: newMode });
}, { immediate: true });

// Dynamic categories from actual data with icons - following copilot instructions: Dynamic content discovery
const allCategories = computed((): string[] => {
  const categories = new Set<string>();

  // Get categories from actual data
  [...siteStore.newsItems, ...siteStore.classifieds].forEach(item => {
    if (item.category) {
      categories.add(item.category);
    }
  });

  return Array.from(categories).sort();
});

// Category options with icons for dropdown
const categoryOptions = computed(() => {
  const options: Array<{
    label: string;
    value: string;
    icon: string;
    color: string;
  }> = [
    {
      label: 'All Categories',
      value: 'all',
      icon: UI_ICONS.filter,
      color: 'grey'
    }
  ];

  // Add each category with its proper icon and color from theme system
  allCategories.value.forEach(cat => {
    // Determine content type for icon lookup
    let contentType = 'article'; // default
    let themeCategory = cat;

    if (cat === 'announcement') {
      contentType = 'announcement';
      themeCategory = 'community'; // announcement.community in theme
    } else if (cat === 'event') {
      contentType = 'event';
      themeCategory = 'meeting'; // default event mapping
    } else if (['for-sale', 'services', 'wanted', 'free', 'housing'].includes(cat)) {
      contentType = 'classified';
      // Map kebab-case to theme camelCase
      const classifiedMap: Record<string, string> = {
        'for-sale': 'forSale',
        'services': 'services',
        'wanted': 'wanted',
        'free': 'free',
        'housing': 'housing'
      };
      themeCategory = classifiedMap[cat] || 'forSale';
    } else if (cat === 'news') {
      contentType = 'article';
      themeCategory = 'news'; // article.news
    }

    const categoryConfig = getCategoryIcon(contentType, themeCategory);

    options.push({
      label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
      value: cat,
      icon: categoryConfig.icon,
      color: categoryConfig.color
    });
  });

  return options;
});

// Sort by options with icons
const sortByOptions = computed(() => [
  {
    label: 'Date',
    value: 'date',
    icon: UI_ICONS.calendar,
    color: colors.primary
  },
  {
    label: 'Title',
    value: 'title',
    icon: 'mdi-sort-alphabetical-variant',
    color: colors.primary
  }
]);

// Sort order options with icons
const sortOrderOptions = computed(() => [
  {
    label: 'Newest First',
    value: 'desc',
    icon: 'mdi-sort-calendar-descending',
    color: colors.primary
  },
  {
    label: 'Oldest First',
    value: 'asc',
    icon: 'mdi-sort-calendar-ascending',
    color: colors.primary
  }
]);

// Unified content items - NO MORE ARTIFICIAL CONTENT TYPE SEPARATION
const unifiedContent = computed(() => {
  const content: Array<NewsItem | ClassifiedAd> = [];

  logger.debug('Building unified content:', {
    newsItemsCount: siteStore.newsItems.length,
    classifiedsCount: siteStore.classifieds.length
  });

  // Add all news items
  content.push(...siteStore.newsItems);

  // Add all classified ads
  content.push(...siteStore.classifieds);

  logger.debug('Unified content result:', { totalItems: content.length });
  return content;
});

// Filtered and sorted content - following copilot instructions: Boolean filter logic patterns
const filteredContent = computed(() => {
  let filtered = unifiedContent.value;

  logger.debug('Starting content filtering:', {
    totalItems: filtered.length,
    searchQuery: searchQuery.value,
    selectedCategory: selectedCategory.value
  });

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item => {
      const title = item.title.toLowerCase();
      const searchableText = 'content' in item ? item.content.toLowerCase() :
                            'description' in item ? item.description.toLowerCase() : '';
      return title.includes(query) || searchableText.includes(query);
    });
  }

  // Category filter - following copilot instructions: Proper handling of filter states
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(item => item.category === selectedCategory.value);
  }

  // Sort content - following copilot instructions: Custom sort function patterns
  const sorted = filtered.sort((a, b) => {
    let comparison = 0;

    if (sortBy.value === 'date') {
      const dateA = 'date' in a ? a.date : 'datePosted' in a ? a.datePosted : '';
      const dateB = 'date' in b ? b.date : 'datePosted' in b ? b.datePosted : '';

      // Use appropriate sort function based on sort order
      if (sortOrder.value === 'desc') {
        comparison = sortByDateDesc(dateA, dateB); // newest first
      } else {
        comparison = -sortByDateDesc(dateA, dateB); // oldest first (reverse of desc)
      }
    } else if (sortBy.value === 'title') {
      comparison = a.title.localeCompare(b.title);

      // Apply sort order for title sorting
      if (sortOrder.value === 'desc') {
        comparison = -comparison; // Z to A
      }
      // else keep as-is for asc (A to Z)
    }

    return comparison;
  });

  logger.debug('Filtered content result:', {
    filteredItems: sorted.length,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  });
  return sorted;
});

// Featured content - following copilot instructions: Boolean filter logic for featured items
const featuredContent = computed(() =>
  filteredContent.value.filter(item => item.featured === true).slice(0, 3)
);

// Theme classes - following copilot instructions: Theme awareness
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

// Admin check - following copilot instructions: Role-based access patterns
const isAdmin = computed(() => isEditor.value);

// Event handlers - following copilot instructions: Proper TypeScript typing
function showItemDetail(item: NewsItem | ClassifiedAd): void {
  selectedItem.value = item;
  showDialog.value = true;
}

function clearFilters(): void {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  sortBy.value = 'date';
  sortOrder.value = 'desc';
}

// Helper function to determine item type
function isNewsItem(item: NewsItem | ClassifiedAd): item is NewsItem {
  return 'content' in item;
}

function isClassifiedAd(item: NewsItem | ClassifiedAd): item is ClassifiedAd {
  return 'description' in item && 'contact' in item;
}

// Format date helper - following copilot instructions: Centralized date management patterns
function formatDate(dateString: string): string {
  return formatDateUtil(dateString, 'LONG');
}

// Helper functions using PROPER THEME ARCHITECTURE
function getItemIcon(item: NewsItem | ClassifiedAd) {
  if (isClassifiedAd(item)) {
    return getCategoryIcon('classified', item.category);
  } else {
    // Let theme system handle content type mapping from category
    return getContentIcon(item.category);
  }
}

function getItemColor(item: NewsItem | ClassifiedAd) {
  return getItemIcon(item).color;
}

function formatCategoryName(category: string): string {
  return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/-/g, ' ');
}

// Initialize content - following copilot instructions: Async promise handling
onMounted((): void => {
  void siteStore.loadInitialData().then(() => {
    logger.debug('Community content page initialized successfully');
  }).catch((error: unknown) => {
    logger.error('Error initializing community content page:', error);
  });
});
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8">
          <!-- Header Section -->
          <q-card flat :class="cardClasses" class="q-mb-md">
            <q-card-section>
              <div class="row items-center q-gutter-md">
                <div class="col">
                  <div class="text-h4 q-mb-md">
                    <q-icon :name="getContentIcon('article').icon" :color="getContentIcon('article').color" class="q-mr-sm" />
                    Community Content
                  </div>
                  <p class="text-body1">
                    Stay informed with the latest news, updates, classifieds, and community announcements.
                    Use the filters below to find exactly what you're looking for.
                  </p>
                </div>
                <div class="col-auto">
                  <q-btn :color="colors.primary" :icon="UI_ICONS.create" label="Submit Content"
                    @click="$router.push('/contribute/submit')" class="q-mr-sm" />
                  <q-btn v-if="isAdmin" :color="colors.secondary" :icon="getContentIcon('announcement').icon" label="Manage Content"
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
                      <q-icon :name="UI_ICONS.search" />
                    </template>
                  </q-input>
                </div>

                <!-- Category Filter -->
                <div class="col-12 col-md-3">
                  <q-select
                    v-model="selectedCategory"
                    :options="categoryOptions"
                    label="Category"
                    outlined
                    dense
                    emit-value
                    map-options
                  >
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template v-slot:selected-item="scope">
                      <div class="flex items-center">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color" class="q-mr-sm" />
                        {{ scope.opt.label }}
                      </div>
                    </template>
                  </q-select>
                </div>

                <!-- Sort By -->
                <div class="col-12 col-md-2">
                  <q-select
                    v-model="sortBy"
                    :options="sortByOptions"
                    label="Sort By"
                    outlined
                    dense
                    emit-value
                    map-options
                  >
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template v-slot:selected-item="scope">
                      <div class="flex items-center">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color" class="q-mr-sm" />
                        {{ scope.opt.label }}
                      </div>
                    </template>
                  </q-select>
                </div>

                <!-- Sort Order -->
                <div class="col-12 col-md-2">
                  <q-select
                    v-model="sortOrder"
                    :options="sortOrderOptions"
                    label="Order"
                    outlined
                    dense
                    emit-value
                    map-options
                  >
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template v-slot:selected-item="scope">
                      <div class="flex items-center">
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color" class="q-mr-sm" />
                        {{ scope.opt.label }}
                      </div>
                    </template>
                  </q-select>
                </div>
              </div>

                            <!-- Filter Actions -->
              <div class="row q-mt-md items-center">
                <div class="col">
                  <q-btn
                    flat
                    :color="colors.primary"
                    :icon="UI_ICONS.clear"
                    label="Clear All Filters"
                    @click="clearFilters"
                    size="sm"
                  />
                  <q-chip
                    v-if="filteredContent.length !== unifiedContent.length"
                    :color="colors.primary"
                    text-color="white"
                    class="q-ml-sm"
                  >
                    {{ filteredContent.length }} of {{ unifiedContent.length }} items
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-btn-toggle
                    v-model="viewMode"
                    :toggle-color="colors.primary"
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
          <div v-if="!isLoading && featuredContent.length > 0" class="q-mb-xl">
            Featured Content Section
            <div class="text-h5 q-mb-md">Featured Content</div>
            <UnifiedContentList
              :items="featuredContent"
              variant="featured"
              @item-click="showItemDetail"
            />
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center q-py-xl">
            Loading State
            <q-spinner-dots size="50px" :color="colors.primary" />
            <div class="text-h6 q-mt-md">Loading content...</div>
          </div>

          <!-- All Content List -->
          <div v-else>
            <div class="text-h5 q-mb-md">
              Community Content
            </div>
            <UnifiedContentList
              :items="filteredContent"
              :variant="viewMode"
              empty-message="No content found"
              :empty-icon="UI_ICONS.searchOff"
              @item-click="showItemDetail"
            />

            <!-- Debug info -->
            <div class="q-mt-md text-caption text-grey">
              Debug: {{ filteredContent.length }} items, viewMode: {{ viewMode }}
              <br>Categories: {{ filteredContent.map(item => item.category).join(', ') }}
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
          <q-btn :icon="UI_ICONS.close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedItem && isNewsItem(selectedItem)">
          <div class="text-overline q-mb-sm" :class="`text-${getItemColor(selectedItem)}`">
            <q-icon :name="getItemIcon(selectedItem).icon" size="sm" class="q-mr-xs" />
            {{ formatCategoryName(selectedItem.category) }}
          </div>
          <div class="text-caption q-mb-md" :class="greyTextClass">
            By {{ selectedItem.author }} • {{ formatDate(selectedItem.date) }}
          </div>
          <div class="text-body1" style="white-space: pre-line;">
            {{ selectedItem.content }}
          </div>
        </q-card-section>

        <q-card-section v-else-if="selectedItem && isClassifiedAd(selectedItem)">
          <div class="text-overline q-mb-sm" :class="`text-${getItemColor(selectedItem)}`">
            <q-icon :name="getItemIcon(selectedItem).icon" size="sm" class="q-mr-xs" />
            {{ formatCategoryName(selectedItem.category) }}
          </div>
          <div class="text-caption q-mb-md" :class="greyTextClass">
            Posted {{ formatDate(selectedItem.datePosted) }}
          </div>

          <div v-if="selectedItem.price" class="text-h6 text-green q-mb-md">
            {{ selectedItem.price }}
          </div>

          <div class="text-body1 q-mb-lg" style="white-space: pre-line;">
            {{ selectedItem.description }}
          </div>

          <!-- Contact Information -->
          <q-separator class="q-mb-md" />
          <div class="text-subtitle2 q-mb-sm">Contact Information</div>
          <div class="text-body2">
            <div class="q-mb-xs">
              <strong>{{ selectedItem.contact.name }}</strong>
            </div>
            <div v-if="selectedItem.contact.phone" class="q-mb-xs">
              <q-icon :name="UI_ICONS.phone" class="q-mr-xs" />
              <a :href="`tel:${selectedItem.contact.phone}`">{{ selectedItem.contact.phone }}</a>
            </div>
            <div v-if="selectedItem.contact.email" class="q-mb-xs">
              <q-icon :name="UI_ICONS.email" class="q-mr-xs" />
              <a :href="`mailto:${selectedItem.contact.email}`">{{ selectedItem.contact.email }}</a>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
