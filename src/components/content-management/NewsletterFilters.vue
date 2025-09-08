<!--
  Newsletter Filters Component
  Handles search and filtering functionality for newsletters
-->
<template>
    <q-card class="q-mb-lg">
        <q-card-section>
            <div class="row q-gutter-md">
                <div class="col-12 col-md-4">
                    <q-input v-model="localFilters.searchText" label="Search newsletters..." outlined dense clearable
                        debounce="300" @update:model-value="updateFilters">
                        <template v-slot:prepend>
                            <q-icon name="mdi-magnify" />
                        </template>
                    </q-input>
                </div>
                <div class="col-12 col-md-2">
                    <q-select v-model="localFilters.filterYear" :options="availableYears" label="Filter by Year"
                        outlined dense clearable @update:model-value="updateFilters" />
                </div>
                <div class="col-12 col-md-2">
                    <q-select v-model="localFilters.filterSeason" :options="availableSeasons" label="Filter by Season"
                        outlined dense clearable @update:model-value="updateFilters" />
                </div>
                <div class="col-12 col-md-2">
                    <q-select v-model="localFilters.filterMonth" :options="availableMonths" option-label="label"
                        option-value="value" label="Filter by Month" outlined dense clearable emit-value map-options
                        @update:model-value="updateFilters" />
                </div>
                <div class="col-12 col-md-2">
                    <q-btn color="secondary" icon="mdi-filter-remove" label="Clear Filters" @click="clearAllFilters"
                        outlined class="full-width" />
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ContentManagementNewsletter } from '../../types';

interface FilterOptions {
    searchText: string;
    filterYear: number | null;
    filterSeason: string | null;
    filterMonth: number | null;
}

interface Props {
    newsletters: ContentManagementNewsletter[];
    filters: FilterOptions;
}

interface Emits {
    (e: 'update:filters', filters: FilterOptions): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local filters to prevent immediate updates during typing
const localFilters = ref<FilterOptions>({ ...props.filters });

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
    localFilters.value = { ...newFilters };
}, { deep: true });

// Computed filter options based on available data
const availableYears = computed(() => {
    const years = [...new Set(props.newsletters.map(n => n.year))].sort((a, b) => b - a);
    return years;
});

const availableSeasons = computed(() => {
    const seasons = [...new Set(props.newsletters.map(n => n.season).filter(Boolean))].sort();
    return seasons;
});

const availableMonths = computed(() => {
    const months = [...new Set(props.newsletters
        .map(n => n.month)
        .filter(Boolean)
    )].sort((a, b) => a! - b!);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return months.map(monthNum => ({
        value: monthNum,
        label: monthNames[monthNum! - 1]
    }));
});

// Update filters function
const updateFilters = (): void => {
    emit('update:filters', { ...localFilters.value });
};

// Clear all filters
const clearAllFilters = (): void => {
    localFilters.value = {
        searchText: '',
        filterYear: null,
        filterSeason: null,
        filterMonth: null
    };
    updateFilters();
};
</script>
