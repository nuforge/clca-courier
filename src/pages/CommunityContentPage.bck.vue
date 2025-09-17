<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useContentStore } from '../stores/content-store';
import { useTheme } from '../composables/useTheme';
import { useI18n } from 'vue-i18n';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
// import { useRoleAuth } from '../composables/useRoleAuth'; // Preserved for future admin features
import type { ContentDoc } from '../types/core/content.types';
import { contentUtils } from '../types/core/content.types';
import { logger } from '../utils/logger';
import { normalizeDate } from '../utils/date-formatter';
import ContentCard from '../components/ContentCard.vue';
import { useSiteTheme } from '../composables/useSiteTheme';
import { UI_ICONS } from '../constants/ui-icons';

// Following copilot instructions: Use centralized logging, unified types, proper TypeScript
const contentStore = useContentStore();
const { t } = useI18n();
// const { isEditor } = useRoleAuth(); // Preserved for future admin features
const { cardClasses, isDarkMode } = useTheme();

// Theme system for consistent icons and colors
const { getContentIcon } = useSiteTheme();

// Loading state from store
const isLoading = computed(() => contentStore.isLoading);

// State for filters, search, and sorting
const searchQuery = ref<string>('');
const selectedCategory = ref<string>('all');
const sortBy = ref<string>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');
const showDialog = ref<boolean>(false);
const selectedItem = ref<ContentDoc | null>(null);

// View toggle
const viewMode = ref<'list' | 'card'>('list');

// Dynamic categories from actual ContentDoc data
const allCategories = computed((): string[] => {
  const categories = new Set<string>();

  contentStore.contentItems.forEach(item => {
    const contentType = contentUtils.getContentType(item);
    if (contentType) {
      categories.add(contentType);
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
      label: t(TRANSLATION_KEYS.COMMUNITY.FILTERS.ALL_CATEGORIES),
      value: 'all',
      icon: UI_ICONS.filter,
      color: 'grey'
    }
  ];

  allCategories.value.forEach(cat => {
    const categoryConfig = getContentIcon(cat);
    options.push({
      label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
      value: cat,
      icon: categoryConfig.icon,
      color: categoryConfig.color
    });
  });

  return options;
});

// Sort options for dropdown
const sortOptions = computed(() => [
  {
    label: t(TRANSLATION_KEYS.COMMUNITY.FILTERS.SORT_NEWEST_FIRST),
    value: 'desc',
    icon: 'mdi-sort-calendar-descending'
  },
  {
    label: t(TRANSLATION_KEYS.COMMUNITY.FILTERS.SORT_OLDEST_FIRST),
    value: 'asc',
    icon: 'mdi-sort-calendar-ascending'
  }
]);

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

// Featured content
const featuredContent = computed(() =>
  filteredContent.value.filter(item => item.tags.includes('featured')).slice(0, 3)
);

// Theme classes
const greyTextClass = computed(() =>
  isDarkMode.value ? 'text-grey-4' : 'text-grey-7'
);

// Admin check (preserved for future use)
// const isAdmin = computed(() => isEditor.value);

// Event handlers
function showItemDetail(item: ContentDoc): void {
  selectedItem.value = item;
  showDialog.value = true;
}

function clearFilters(): void {
  searchQuery.value = '';
  selectedCategory.value = 'all';
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

// Lifecycle
onMounted((): void => {
  void contentStore.loadInitialData().then(() => {
    logger.debug('Community content page initialized successfully');
  }).catch((error: unknown) => {
    logger.error('Error initializing community content page:', error);
  });
});
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Header Section -->
      <div class="row justify-between items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-my-none">{{ t(TRANSLATION_KEYS.COMMUNITY.TITLE) }}</h1>
          <p class="text-body2" :class="greyTextClass">
            {{ t(TRANSLATION_KEYS.COMMUNITY.SUBTITLE) }}
          </p>
        </div>

        <!-- View Toggle -->
        <div class="col-auto">
          <q-btn-toggle
            v-model="viewMode"
            toggle-color="primary"
            :options="[
              { label: 'List', value: 'list', icon: 'mdi-view-list' },
              { label: 'Cards', value: 'card', icon: 'mdi-view-grid' }
            ]"
            dense
            outline
          />
        </div>
      </div>

      <!-- Filters Section -->
      <q-card :class="cardClasses" class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- Search -->
            <div class="col-12 col-md-4">
              <q-input
                v-model="searchQuery"
                placeholder="Search content..."
                outlined
                clearable
                dense
              >
                <template v-slot:prepend>
                  <q-icon name="mdi-magnify" />
                </template>
              </q-input>
            </div>

            <!-- Category Filter -->
            <div class="col-12 col-md-3">
              <q-select
                v-model="selectedCategory"
                :options="categoryOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                label="Category"
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
              </q-select>
            </div>

            <!-- Sort -->
            <div class="col-12 col-md-3">
              <q-select
                v-model="sortOrder"
                :options="sortOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                label="Sort by"
              />
            </div>

            <!-- Clear Filters -->
            <div class="col-12 col-md-2">
              <q-btn
                @click="clearFilters"
                outline
                color="grey"
                label="Clear"
                class="full-width"
                dense
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center q-py-xl">
        <q-spinner size="48px" color="primary" />
        <div class="q-mt-md">Loading content...</div>
      </div>

      <!-- Content List -->
      <div v-else-if="filteredContent.length > 0">
        <!-- Featured Content (if any) -->
        <div v-if="featuredContent.length > 0" class="q-mb-lg">
          <h5 class="text-h6 q-mb-md">Featured Content</h5>
          <div class="row q-col-gutter-md">
            <div
              v-for="item in featuredContent"
              :key="item.id"
              class="col-12 col-md-4"
            >
              <ContentCard
                :content="item"
                variant="featured"
                @click="showItemDetail"
              />
            </div>
          </div>
        </div>

        <!-- All Content -->
        <div>
          <h5 class="text-h6 q-mb-md">
            All Content ({{ filteredContent.length }})
          </h5>

          <!-- Grid View -->
          <div v-if="viewMode === 'card'" class="row q-col-gutter-md">
            <div
              v-for="item in filteredContent"
              :key="item.id"
              class="col-12 col-md-6 col-lg-4"
            >
              <ContentCard
                :content="item"
                variant="card"
                @click="showItemDetail"
              />
            </div>
          </div>

          <!-- List View -->
          <div v-else>
            <ContentCard
              v-for="item in filteredContent"
              :key="item.id"
              :content="item"
              variant="list"
              class="q-mb-md"
              @click="showItemDetail"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <q-card v-else :class="cardClasses">
        <q-card-section class="text-center q-py-xl">
          <q-icon name="mdi-inbox-outline" size="64px" :class="greyTextClass" />
          <div class="text-h6 q-mt-md" :class="greyTextClass">
            No content found
          </div>
          <div class="text-body2" :class="greyTextClass">
            Try adjusting your search or filter criteria
          </div>
          <q-btn
            @click="clearFilters"
            color="primary"
            outline
            label="Clear Filters"
            class="q-mt-md"
          />
        </q-card-section>
      </q-card>

      <!-- Content Detail Dialog -->
      <q-dialog v-model="showDialog" maximized>
        <q-card v-if="selectedItem" :class="cardClasses">
          <q-toolbar>
            <q-toolbar-title>
              {{ selectedItem.title }}
            </q-toolbar-title>
            <q-btn flat round dense icon="mdi-close" @click="showDialog = false" />
          </q-toolbar>

          <q-card-section>
            <div class="text-overline q-mb-sm">
              {{ formatCategoryName(getContentTypeFromItem(selectedItem)) }}
            </div>
            <div class="text-body2 q-mb-md" :class="greyTextClass">
              By {{ selectedItem.authorName }} •
              {{ getDateFromItem(selectedItem).toLocaleDateString() }}
            </div>
            <div class="text-body1">
              {{ selectedItem.description }}
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<style scoped>
.full-width {
  width: 100%;
}
</style>
