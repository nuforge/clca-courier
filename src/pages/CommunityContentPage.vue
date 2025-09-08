<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import { useRoleAuth } from '../composables/useRoleAuth';
import { useRoute, useRouter } from 'vue-router';
import type { NewsItem, ClassifiedAd } from '../types/core/content.types';
import { logger } from '../utils/logger';
import UnifiedContentList from '../components/UnifiedContentList.vue';

// Following copilot instructions: Use centralized logging, unified types, proper TypeScript
const siteStore = useSiteStore();
const { isEditor } = useRoleAuth();
const route = useRoute();
const router = useRouter();

// State for filters, search, and sorting - following copilot instructions: STRICT TYPESCRIPT
const searchQuery = ref<string>('');
const selectedCategory = ref<string>('all');
const sortBy = ref<string>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');
const showDialog = ref<boolean>(false);
const selectedItem = ref<NewsItem | ClassifiedAd | null>(null);

// Content type filter
const contentType = ref<'all' | 'news' | 'classifieds'>('all');

// View toggle - following copilot instructions: Enhanced UI patterns
const viewMode = ref<'list' | 'card'>('list');

// Categories for filtering - following copilot instructions: Dynamic content discovery
const allCategories = computed(() => {
  const newsCategories = ['news', 'announcement', 'event'];
  const classifiedCategories = ['for-sale', 'services', 'wanted', 'free'];
  return [...newsCategories, ...classifiedCategories];
});

// Unified content items - following copilot instructions: Unified Newsletter types (adapting pattern)
const unifiedContent = computed(() => {
  const content: Array<(NewsItem | ClassifiedAd) & { contentType: 'news' | 'classifieds' }> = [];

  // Add news items with content type marker
  if (contentType.value === 'all' || contentType.value === 'news') {
    siteStore.newsItems.forEach(item => {
      content.push({ ...item, contentType: 'news' as const });
    });
  }

  // Add classified ads with content type marker
  if (contentType.value === 'all' || contentType.value === 'classifieds') {
    siteStore.classifieds.forEach(item => {
      content.push({ ...item, contentType: 'classifieds' as const });
    });
  }

  return content;
});

// Filtered and sorted content - following copilot instructions: Boolean filter logic patterns
const filteredContent = computed(() => {
  let filtered = unifiedContent.value;

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
  return filtered.sort((a, b) => {
    let comparison = 0;

    if (sortBy.value === 'date') {
      const dateA = new Date('date' in a ? a.date : 'datePosted' in a ? a.datePosted : '');
      const dateB = new Date('date' in b ? b.date : 'datePosted' in b ? b.datePosted : '');
      comparison = dateA.getTime() - dateB.getTime();
    } else if (sortBy.value === 'title') {
      comparison = a.title.localeCompare(b.title);
    }

    return sortOrder.value === 'desc' ? -comparison : comparison;
  });
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
  contentType.value = 'all';
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
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    logger.warn('Date formatting error:', error);
    return dateString;
  }
}

// Initialize content - following copilot instructions: Async promise handling
onMounted((): void => {
  // Set initial filter from URL query params
  const typeParam = route.query.type as string;
  if (typeParam === 'news' || typeParam === 'classifieds') {
    contentType.value = typeParam;
  }

  void siteStore.loadInitialData().then(() => {
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
        <div class="col-12 col-md-10 col-lg-8">
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

                <!-- Content Type Filter -->
                <div class="col-12 col-md-2">
                  <q-select
                    v-model="contentType"
                    :options="[
                      { label: 'All Content', value: 'all' },
                      { label: 'News & Updates', value: 'news' },
                      { label: 'Classifieds', value: 'classifieds' }
                    ]"
                    label="Content Type"
                    outlined
                    dense
                    emit-value
                    map-options
                  />
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
          <div v-if="featuredContent.length > 0" class="q-mb-xl">
            <div class="text-h5 q-mb-md">Featured Content</div>
            <UnifiedContentList
              :items="featuredContent"
              variant="featured"
              @item-click="showItemDetail"
            />
          </div>

          <!-- All Content List -->
          <div class="text-h5 q-mb-md">
            {{ contentType === 'news' ? 'News & Updates' :
               contentType === 'classifieds' ? 'Classifieds & Ads' : 'All Content' }}
          </div>

          <UnifiedContentList
            :items="filteredContent"
            :variant="viewMode"
            empty-message="No content found"
            empty-icon="search_off"
            @item-click="showItemDetail"
          />          <!-- All Content List -->
          <div class="text-h5 q-mb-md">
            {{ contentType === 'news' ? 'News & Updates' :
               contentType === 'classifieds' ? 'Classifieds & Ads' : 'All Content' }}
          </div>

          <q-card :class="cardClasses">
            <q-card-section v-if="filteredContent.length === 0" class="text-center">
              <q-icon name="search_off" size="48px" :class="greyTextClass" />
              <div class="text-h6 q-mt-md" :class="greyTextClass">No content found</div>
              <div class="text-body2" :class="greyTextClass">
                Try adjusting your search or filter criteria
              </div>
            </q-card-section>

            <q-card-section v-else>
              <q-list separator>
                <q-item
                  v-for="item in filteredContent"
                  :key="item.id"
                  clickable
                  @click="showItemDetail(item)"
                >
                  <q-item-section avatar>
                    <q-avatar
                      :color="isNewsItem(item) ? 'primary' : 'secondary'"
                      text-color="white"
                      :icon="isNewsItem(item) ? 'mdi-newspaper' : 'mdi-tag'"
                    />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ item.title }}</q-item-label>
                    <q-item-label caption class="q-mt-xs">
                      {{ item.category.toUpperCase().replace('-', ' ') }} •
                      {{ formatDate(isNewsItem(item) ? item.date : item.datePosted) }}
                      <span v-if="isNewsItem(item)"> • By {{ item.author }}</span>
                      <span v-if="isClassifiedAd(item) && item.price"> • {{ item.price }}</span>
                    </q-item-label>
                    <q-item-label class="q-mt-sm text-body2">
                      {{ isNewsItem(item) ? item.summary : item.description }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-icon name="chevron_right" color="grey" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
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

        <q-card-section v-if="selectedItem && isNewsItem(selectedItem)">
          <div class="text-overline text-primary q-mb-sm">
            {{ selectedItem.category.toUpperCase() }}
          </div>
          <div class="text-caption q-mb-md" :class="greyTextClass">
            By {{ selectedItem.author }} • {{ formatDate(selectedItem.date) }}
          </div>
          <div class="text-body1" style="white-space: pre-line;">
            {{ selectedItem.content }}
          </div>
        </q-card-section>

        <q-card-section v-else-if="selectedItem && isClassifiedAd(selectedItem)">
          <div class="text-overline text-secondary q-mb-sm">
            {{ selectedItem.category.toUpperCase().replace('-', ' ') }}
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
              <q-icon name="phone" class="q-mr-xs" />
              <a :href="`tel:${selectedItem.contact.phone}`">{{ selectedItem.contact.phone }}</a>
            </div>
            <div v-if="selectedItem.contact.email" class="q-mb-xs">
              <q-icon name="email" class="q-mr-xs" />
              <a :href="`mailto:${selectedItem.contact.email}`">{{ selectedItem.contact.email }}</a>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
