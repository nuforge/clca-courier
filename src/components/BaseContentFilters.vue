<!--
  Base Content Filters Component

  A reusable filtering interface that works with both NewsletterMetadata and ContentDoc items.
  Built following the Week 3 migration guide with strict TypeScript and Quasar-only styling.

  Features:
  - Generic filter configuration support
  - Search input with debounced updates
  - Multiple filter types (select, toggle, date range)
  - Active filter chips display
  - Clear all filters functionality
  - Uses only Quasar components and utility classes (NO custom CSS)
-->
<template>
  <q-card flat class="base-content-filters">
    <q-card-section>
      <!-- Search Input -->
      <div class="row q-mb-md">
        <div class="col-12 col-md-8 q-pa-sm">
          <q-input
            v-model="internalSearchQuery"
            :label="searchPlaceholder"
            outlined
            dense
            clearable
            debounce="300"
            @update:model-value="onSearchInput"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Sort Controls -->
        <div class="col-12 col-md-4 q-pa-sm">
          <q-select
            v-model="internalSortBy"
            :options="sortOptions"
            label="Sort By"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="onSortChange"
          >
            <template v-slot:prepend>
              <q-icon name="sort" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- Filter Controls -->
      <div v-if="filterConfig.showFilters" class="row q-mb-md">
        <!-- Year Filter -->
        <div v-if="filterConfig.yearOptions" class="col-12 col-sm-6 col-md-3 q-pa-sm">
          <q-select
            v-model="internalFilters.year"
            :options="filterConfig.yearOptions"
            label="Year"
            outlined
            dense
            clearable
            emit-value
            map-options
            @update:model-value="onFilterChange"
          >
            <template v-slot:prepend>
              <q-icon name="event" />
            </template>
          </q-select>
        </div>

        <!-- Month Filter -->
        <div v-if="filterConfig.monthOptions" class="col-12 col-sm-6 col-md-3 q-pa-sm">
          <q-select
            v-model="internalFilters.month"
            :options="filterConfig.monthOptions"
            label="Month"
            outlined
            dense
            clearable
            emit-value
            map-options
            @update:model-value="onFilterChange"
          >
            <template v-slot:prepend>
              <q-icon name="calendar_month" />
            </template>
          </q-select>
        </div>

        <!-- Tag Filter -->
        <div v-if="filterConfig.tagOptions" class="col-12 col-sm-6 col-md-3 q-pa-sm">
          <q-select
            v-model="internalFilters.tags"
            :options="filterConfig.tagOptions"
            label="Tags"
            outlined
            dense
            clearable
            multiple
            emit-value
            map-options
            @update:model-value="onFilterChange"
          >
            <template v-slot:prepend>
              <q-icon name="tag" />
            </template>
          </q-select>
        </div>

        <!-- Status Filter (for ContentDoc) -->
        <div v-if="filterConfig.statusOptions" class="col-12 col-sm-6 col-md-3 q-pa-sm">
          <q-select
            v-model="internalFilters.status"
            :options="filterConfig.statusOptions"
            label="Status"
            outlined
            dense
            clearable
            emit-value
            map-options
            @update:model-value="onFilterChange"
          >
            <template v-slot:prepend>
              <q-icon name="flag" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- Toggle Filters -->
      <div v-if="filterConfig.toggleFilters" class="row q-mb-md">
        <div
          v-for="toggle in filterConfig.toggleFilters"
          :key="toggle.key"
          class="col-12 col-sm-6 col-md-3 q-pa-sm"
        >
          <q-toggle
            v-model="internalFilters[toggle.key]"
            :label="toggle.label"
            :color="toggle.color || 'primary'"
            @update:model-value="onFilterChange"
          />
        </div>
      </div>

      <!-- Active Filter Chips -->
      <div v-if="hasActiveFilters" class="row items-center q-mt-md">
        <div class="col-auto">
          <q-btn
            flat
            label="Clear All"
            icon="clear_all"
            color="negative"
            size="sm"
            @click="clearAllFilters"
          />
        </div>

        <q-space />

        <div class="col-auto">
          <div class="row q-gutter-xs">
            <!-- Search Chip -->
            <q-chip
              v-if="internalSearchQuery"
              removable
              @remove="clearSearch"
              color="accent"
              text-color="white"
              dense
            >
              Search: "{{ internalSearchQuery }}"
            </q-chip>

            <!-- Year Chip -->
            <q-chip
              v-if="internalFilters.year"
              removable
              @remove="internalFilters.year = null; onFilterChange()"
              color="primary"
              text-color="white"
              dense
            >
              Year: {{ internalFilters.year }}
            </q-chip>

            <!-- Month Chip -->
            <q-chip
              v-if="internalFilters.month"
              removable
              @remove="internalFilters.month = null; onFilterChange()"
              color="secondary"
              text-color="white"
              dense
            >
              Month: {{ getMonthLabel(internalFilters.month) }}
            </q-chip>

            <!-- Tags Chips -->
            <q-chip
              v-for="tag in (internalFilters.tags || [])"
              :key="tag"
              removable
              @remove="removeTag(tag)"
              color="info"
              text-color="white"
              dense
            >
              {{ tag }}
            </q-chip>

            <!-- Status Chip -->
            <q-chip
              v-if="internalFilters.status"
              removable
              @remove="internalFilters.status = null; onFilterChange()"
              color="positive"
              text-color="white"
              dense
            >
              Status: {{ internalFilters.status }}
            </q-chip>

            <!-- Toggle Filter Chips -->
            <q-chip
              v-for="(value, key) in internalFilters"
              :key="key"
              v-if="typeof value === 'boolean' && value === true"
              removable
              @remove="internalFilters[key] = false; onFilterChange()"
              color="purple"
              text-color="white"
              dense
            >
              {{ getToggleLabel(key) }}
            </q-chip>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

/**
 * Filter option interface
 */
export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

/**
 * Toggle filter configuration
 */
export interface ToggleFilter {
  key: string;
  label: string;
  color?: string;
}

/**
 * Filter configuration interface
 */
export interface FilterConfig {
  showFilters?: boolean;
  yearOptions?: FilterOption[];
  monthOptions?: FilterOption[];
  tagOptions?: FilterOption[];
  statusOptions?: FilterOption[];
  toggleFilters?: ToggleFilter[];
}

/**
 * Filter state interface - flexible to support both NewsletterMetadata and ContentDoc filtering
 */
export interface FilterState {
  year?: number | null;
  month?: number | null;
  tags?: string[] | null;
  status?: string | null;
  [key: string]: unknown; // Allow additional filter properties
}

/**
 * Component props interface
 */
interface Props {
  filterConfig: FilterConfig;
  searchPlaceholder?: string;
  sortOptions?: FilterOption[];
  modelValue?: FilterState;
  searchQuery?: string;
  sortBy?: string;
}

/**
 * Component emits interface
 */
interface Emits {
  (e: 'update:modelValue', value: FilterState): void;
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:sortBy', value: string): void;
  (e: 'filter-change', filters: FilterState): void;
  (e: 'search-change', query: string): void;
  (e: 'sort-change', sortBy: string): void;
}

// Props and emits with strict typing
const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search content...',
  sortOptions: () => [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Date (Newest)', value: 'date-desc' },
    { label: 'Date (Oldest)', value: 'date-asc' },
    { label: 'Title (A-Z)', value: 'title-asc' },
    { label: 'Title (Z-A)', value: 'title-desc' }
  ],
  modelValue: () => ({}),
  searchQuery: '',
  sortBy: 'date-desc'
});

const emit = defineEmits<Emits>();

// Internal state
const internalFilters = ref<FilterState>({ ...props.modelValue });
const internalSearchQuery = ref(props.searchQuery);
const internalSortBy = ref(props.sortBy);

// Computed properties
const hasActiveFilters = computed(() => {
  return (
    internalSearchQuery.value ||
    internalFilters.value.year ||
    internalFilters.value.month ||
    (internalFilters.value.tags && internalFilters.value.tags.length > 0) ||
    internalFilters.value.status ||
    Object.entries(internalFilters.value).some(([key, value]) =>
      typeof value === 'boolean' && value === true &&
      !['year', 'month', 'tags', 'status'].includes(key)
    )
  );
});

// Helper methods
const getMonthLabel = (month: number | null): string => {
  if (!month) return '';
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || '';
};

const getToggleLabel = (key: string): string => {
  const toggle = props.filterConfig.toggleFilters?.find(t => t.key === key);
  return toggle?.label || key;
};

// Event handlers
const onSearchInput = (value: string) => {
  emit('update:searchQuery', value);
  emit('search-change', value);
};

const onSortChange = (value: string) => {
  emit('update:sortBy', value);
  emit('sort-change', value);
};

const onFilterChange = () => {
  emit('update:modelValue', { ...internalFilters.value });
  emit('filter-change', { ...internalFilters.value });
};

const removeTag = (tagToRemove: string) => {
  if (internalFilters.value.tags) {
    internalFilters.value.tags = internalFilters.value.tags.filter(tag => tag !== tagToRemove);
    onFilterChange();
  }
};

const clearSearch = () => {
  internalSearchQuery.value = '';
  onSearchInput('');
};

const clearAllFilters = () => {
  internalFilters.value = {};
  internalSearchQuery.value = '';
  internalSortBy.value = 'date-desc';

  emit('update:modelValue', {});
  emit('update:searchQuery', '');
  emit('update:sortBy', 'date-desc');
  emit('filter-change', {});
  emit('search-change', '');
  emit('sort-change', 'date-desc');
};

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    internalFilters.value = { ...newValue };
  },
  { deep: true }
);

watch(
  () => props.searchQuery,
  (newValue) => {
    internalSearchQuery.value = newValue;
  }
);

watch(
  () => props.sortBy,
  (newValue) => {
    internalSortBy.value = newValue;
  }
);
</script>

<style scoped>
.base-content-filters {
  border-radius: 8px;
}
</style>
