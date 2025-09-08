<template>
  <q-card class="q-mb-lg">
    <q-card-section>
      <div class="row q-gutter-md">
        <div class="col-12 col-md-4">
          <q-input v-model="localFilters.searchText" label="Search newsletters..." outlined dense clearable
            debounce="300" @update:model-value="updateSearch">
            <template v-slot:prepend>
              <q-icon name="mdi-magnify" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-2">
          <q-select v-model="localFilters.filterYear" :options="availableYears" label="Filter by Year" outlined dense
            clearable @update:model-value="updateFilters" />
        </div>
        <div class="col-12 col-md-2">
          <q-select v-model="localFilters.filterSeason" :options="availableSeasons" label="Filter by Season" outlined
            dense clearable @update:model-value="updateFilters" />
        </div>
        <div class="col-12 col-md-2">
          <q-select v-model="localFilters.filterMonth" :options="availableMonths" option-label="label"
            option-value="value" label="Filter by Month" outlined dense clearable emit-value map-options
            @update:model-value="updateFilters" />
        </div>
        <div class="col-12 col-md-2">
          <q-btn color="primary" icon="mdi-filter-remove" label="Clear Filters" outlined @click="clearFilters" />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { NewsletterFilters } from '../../types/core/content-management.types';

// =============================================
// PROPS & EMITS - CLEAN INTERFACE
// =============================================

interface Props {
  filters: NewsletterFilters;
  availableYears: (number | undefined)[];
  availableSeasons: (string | undefined)[];
  availableMonths: Array<{ label: string; value: number }>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:filters': [filters: Partial<NewsletterFilters>];
  'clear-filters': [];
}>();

// =============================================
// LOCAL STATE - CONTROLLED INPUTS
// =============================================

const localFilters = ref<NewsletterFilters>({ ...props.filters });

// =============================================
// WATCHERS - SYNC WITH PARENT
// =============================================

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

// =============================================
// METHODS - EMIT CHANGES
// =============================================

function updateSearch(): void {
  emit('update:filters', { searchText: localFilters.value.searchText });
}

function updateFilters(): void {
  emit('update:filters', {
    filterYear: localFilters.value.filterYear,
    filterSeason: localFilters.value.filterSeason,
    filterMonth: localFilters.value.filterMonth
  });
}

function clearFilters(): void {
  localFilters.value = {
    searchText: '',
    filterYear: null,
    filterSeason: null,
    filterMonth: null
  };
  emit('clear-filters');
}
</script>
