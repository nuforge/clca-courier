<!--
  Base Content List Component

  A reusable content listing component that handles both NewsletterMetadata and ContentDoc items.
  Built following the Week 3 migration guide with strict TypeScript and Quasar-only styling.

  Features:
  - Generic item type support (NewsletterMetadata, ContentDoc, or any object with id)
  - Configurable layout modes (list, grid, compact)
  - Scoped slots for flexible item rendering
  - Pagination support
  - Loading and empty states
  - Uses only Quasar components and utility classes (NO custom CSS)
-->
<template>
  <div class="base-content-list">
    <!-- Loading State -->
    <div v-if="loading" class="row justify-center q-pa-lg">
      <q-spinner-hourglass color="primary" size="3rem" />
      <div class="text-body1 q-ml-md">Loading content...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="text-center q-pa-lg">
      <q-icon name="search_off" size="4rem" class="text-grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">
        {{ emptyMessage || 'No content found' }}
      </div>
    </div>

    <!-- Content List -->
    <div v-else>
      <!-- Grid Layout -->
      <div v-if="variant === 'grid'" class="row q-col-gutter-md">
        <div
          v-for="(item, index) in paginatedItems"
          :key="getItemId(item)"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <slot
            name="item"
            :item="item"
            :index="index"
          >
            <!-- Fallback content if no slot provided -->
            <q-card class="q-pa-md">
              <div class="text-body1">{{ getItemTitle(item) }}</div>
            </q-card>
          </slot>
        </div>
      </div>

      <!-- List Layout -->
      <div v-else-if="variant === 'list'" class="column q-gutter-sm">
        <div
          v-for="(item, index) in paginatedItems"
          :key="getItemId(item)"
        >
          <slot
            name="item"
            :item="item"
            :index="index"
          >
            <!-- Fallback content if no slot provided -->
            <q-card flat bordered class="q-pa-md">
              <div class="text-body1">{{ getItemTitle(item) }}</div>
            </q-card>
          </slot>
        </div>
      </div>

      <!-- Compact Layout -->
      <div v-else class="column q-gutter-xs">
        <div
          v-for="(item, index) in paginatedItems"
          :key="getItemId(item)"
          class="q-pa-sm"
        >
          <slot
            name="item"
            :item="item"
            :index="index"
          >
            <!-- Fallback content if no slot provided -->
            <div class="text-body2">{{ getItemTitle(item) }}</div>
          </slot>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && totalPages > 1" class="row justify-center q-mt-lg">
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          :max-pages="6"
          boundary-links
          color="primary"
          @update:model-value="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { UnifiedNewsletter } from '../types/core/newsletter.types';

/**
 * Generic item type - supports both NewsletterMetadata and ContentDoc
 */
type BaseItem = {
  id: string;
  title?: string;
} & Record<string, unknown>;

/**
 * Pagination configuration interface
 */
export interface PaginationConfig {
  page: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Component props interface - accepts either BaseItem or UnifiedNewsletter
 */
interface Props {
  items: (BaseItem | UnifiedNewsletter)[];
  variant?: 'list' | 'grid' | 'compact';
  emptyMessage?: string;
  loading?: boolean;
  pagination?: PaginationConfig | null;
}

/**
 * Component emits interface
 */
interface Emits {
  (e: 'page-change', page: number): void;
}

// Props and emits with strict typing
const props = withDefaults(defineProps<Props>(), {
  variant: 'grid',
  emptyMessage: 'No content found',
  loading: false,
  pagination: null
});

const emit = defineEmits<Emits>();

// Internal pagination state
const currentPage = ref(props.pagination?.page || 1);

// Computed properties
const totalPages = computed(() => {
  if (!props.pagination) return 1;
  return Math.ceil(props.pagination.totalItems / props.pagination.itemsPerPage);
});

const paginatedItems = computed(() => {
  if (!props.pagination) return props.items;

  const start = (currentPage.value - 1) * props.pagination.itemsPerPage;
  const end = start + props.pagination.itemsPerPage;
  return props.items.slice(start, end);
});

// Helper methods
const getItemId = (item: BaseItem | UnifiedNewsletter): string => {
  return item.id;
};

const getItemTitle = (item: BaseItem | UnifiedNewsletter): string => {
  return item.title || item.id || 'Untitled';
};

// Event handlers
const onPageChange = (page: number) => {
  currentPage.value = page;
  emit('page-change', page);
};

// Watch for pagination prop changes
watch(
  () => props.pagination?.page,
  (newPage) => {
    if (newPage !== undefined) {
      currentPage.value = newPage;
    }
  }
);
</script>

<style scoped>
.base-content-list {
  min-height: 200px;
}
</style>
