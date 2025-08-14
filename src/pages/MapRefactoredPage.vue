<template>
  <q-page class="q-pa-lg">
    <div class="row justify-center">
      <div class="col-12" style="max-width: 1400px;">
        <!-- Page Header -->
        <div class="text-center q-mb-xl">
          <h1 class="text-h3 q-mb-sm">Interactive Community Map</h1>
          <p class="text-h6 text-grey-7 q-ma-none">
            Explore roads and neighborhoods in our community
          </p>
        </div>

        <div class="demo-container">
          <!-- Map Component -->
          <div class="map-section">
            <InteractiveMapSVGRefactored ref="mapRef" class="demo-map rounded-borders shadow-4" />
          </div>

          <!-- Controls Panel -->
          <div class="controls-panel">
            <!-- Roads List Card -->
            <q-card class="q-mb-md">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="text-h6 col">Roads ({{ sortedAndFilteredRoads.length }})</div>
                  <div class="text-caption text-grey-6" v-if="state.selectedRoadIds?.length">
                    {{ state.selectedRoadIds.length }} selected
                  </div>
                </div>

                <!-- Search input -->
                <q-input v-model="searchQuery" outlined dense placeholder="Search roads..." class="q-mb-md">
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                  <template v-slot:append>
                    <q-icon v-if="searchQuery" name="clear" class="cursor-pointer" @click="searchQuery = ''" />
                  </template>
                </q-input>

                <!-- Sort controls -->
                <div class="row q-gutter-sm q-mb-md">
                  <q-select v-model="sortBy" :options="sortOptions" option-label="label" option-value="value" emit-value
                    map-options dense outlined label="Sort by" class="col" />
                  <q-btn flat dense :icon="sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                    @click="toggleSortOrder" :title="`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`" />
                </div>

                <!-- Selection controls -->
                <div class="row q-gutter-sm q-mb-md">
                  <q-btn flat dense color="primary" icon="select_all" label="Select All" @click="selectAllVisible"
                    :disable="sortedAndFilteredRoads.length === 0" />
                  <q-btn flat dense color="negative" icon="clear_all" label="Clear All" @click="clearSelection"
                    :disable="(state.selectedRoadIds?.length || 0) === 0" />
                  <q-btn flat dense color="secondary" icon="shuffle" label="Random Road" @click="selectRandomRoad" />
                </div>
              </q-card-section>

              <q-separator />

              <div class="roads-list-container">
                <q-list dense>
                  <q-item v-for="(road, index) in sortedAndFilteredRoads" :key="`road-${index}`" clickable
                    :active="state.selectedRoadIds?.includes(road.id)" @click="selectRoad(road.id)"
                    class="road-list-item">
                    <q-item-section side>
                      <q-checkbox :model-value="state.selectedRoadIds?.includes(road.id) || false"
                        @update:model-value="() => selectRoad(road.id)" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ road.name }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="location_on"
                        :color="state.selectedRoadIds?.includes(road.id) ? 'primary' : 'grey'" />
                    </q-item-section>
                  </q-item>

                  <q-item v-if="sortedAndFilteredRoads.length === 0 && isRoadsLoaded">
                    <q-item-section>
                      <q-item-label class="text-grey-6">
                        {{ searchQuery ? 'No roads match your search' : 'No roads found' }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="!isRoadsLoaded">
                    <q-item-section>
                      <q-item-label class="text-grey-6">
                        Loading roads...
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card>

            <!-- Map Controls Card -->
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">Map Controls</div>

                <!-- Theme Selector -->
                <div class="q-mb-md">
                  <q-select v-model="selectedTheme" :options="availableThemes" option-label="name" option-value="id"
                    emit-value map-options dense outlined label="Theme" @update:model-value="onThemeChange" />
                </div>

                <!-- Map Statistics -->
                <div class="q-mb-md">
                  <div class="text-subtitle2 q-mb-sm">Statistics</div>
                  <q-list dense class="rounded-borders">
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Total Roads</q-item-label>
                        <q-item-label>{{ roadStatistics.totalRoads }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Loaded</q-item-label>
                        <q-item-label>{{ isRoadsLoaded ? 'Yes' : 'Loading...' }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Selected</q-item-label>
                        <q-item-label>{{ state.selectedRoadIds?.length || 0 }} roads</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <!-- Center Map Action -->
                <q-btn color="secondary" icon="center_focus_strong" label="Center Map" @click="centerMap"
                  class="full-width" />
              </q-card-section>
            </q-card>

          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import InteractiveMapSVGRefactored from '../components/InteractiveMapSVGRefactored.vue';
import type { Road } from '../composables/useInteractiveMap';

// Template refs
const mapRef = ref<InstanceType<typeof InteractiveMapSVGRefactored>>();

// Local state for the page controls
const selectedTheme = ref('default');
const searchQuery = ref('');
const sortBy = ref('name');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Sort options
const sortOptions = [
  { label: 'Name (A-Z)', value: 'name' },
  { label: 'Selected First', value: 'selected' },
];

// Computed properties that access the map component's data
const availableThemes = computed(() => mapRef.value?.availableThemes || []);
const isRoadsLoaded = computed(() => mapRef.value?.isRoadsLoaded || false);
const roadStatistics = computed(() => mapRef.value?.roadStatistics || { totalRoads: 0, selectedCount: 0, filteredCount: 0 });
const state = computed(() => {
  const defaultState = { selectedRoadIds: [] as string[], selectedRoadId: null as string | null };
  return mapRef.value?.state || defaultState;
});

// Create our own filtered and sorted roads
const filteredRoads = computed((): Road[] => {
  const roads = (mapRef.value?.roads || []) as Road[];
  if (!searchQuery.value) return roads;
  return roads.filter(road =>
    road.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    road.id?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const sortedAndFilteredRoads = computed((): Road[] => {
  const roads = [...filteredRoads.value];
  const selectedRoadIds = state.value.selectedRoadIds || [];

  roads.sort((a, b) => {
    if (sortBy.value === 'selected') {
      const aSelected = selectedRoadIds.includes(a.id);
      const bSelected = selectedRoadIds.includes(b.id);

      if (aSelected && !bSelected) return sortOrder.value === 'asc' ? -1 : 1;
      if (!aSelected && bSelected) return sortOrder.value === 'asc' ? 1 : -1;

      // If both have same selection status, sort by name
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder.value === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else {
      // Sort by name
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return sortOrder.value === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }
  });

  return roads;
});

// Methods that call the map component's methods
const onThemeChange = (themeId: string) => {
  const theme = availableThemes.value.find(t => t.id === themeId);
  if (theme && mapRef.value?.applyTheme) {
    mapRef.value.applyTheme(theme);
  }
};

const onSearchChange = () => {
  if (mapRef.value?.searchQuery !== undefined) {
    mapRef.value.searchQuery = searchQuery.value;
  }
};

const selectRandomRoad = () => {
  if (mapRef.value?.getRandomRoad) {
    const randomRoad = mapRef.value.getRandomRoad();
    if (randomRoad && mapRef.value?.selectRoad) {
      mapRef.value.selectRoad(randomRoad.id);
    }
  }
};

const clearSelection = () => {
  if (mapRef.value?.clearAllSelections) {
    mapRef.value.clearAllSelections();
  }
};

const centerMap = () => {
  if (mapRef.value?.centerMap) {
    mapRef.value.centerMap();
  }
};

const selectRoad = (roadId: string) => {
  if (mapRef.value?.toggleRoadSelection) {
    mapRef.value.toggleRoadSelection(roadId);
  }
};

const selectAllVisible = () => {
  if (mapRef.value?.selectMultipleRoads) {
    const visibleIds = sortedAndFilteredRoads.value.map(road => road.id);
    const currentSelections: string[] = state.value.selectedRoadIds || [];
    const newSelections = visibleIds.filter(id => !currentSelections.includes(id));
    if (newSelections.length > 0) {
      mapRef.value.selectMultipleRoads([...currentSelections, ...newSelections]);
    }
  }
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

// Watch for search query changes
watch(searchQuery, onSearchChange);

// Initialize theme selection when component mounts
onMounted(() => {
  // Wait a tick for the map component to be ready
  setTimeout(() => {
    if (mapRef.value?.currentTheme?.id) {
      selectedTheme.value = mapRef.value.currentTheme.id;
    }
  }, 100);
});
</script>

<style scoped>
.roads-list-container {
  height: 300px;
  overflow-y: auto;
}

.demo-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
  margin-bottom: 32px;
}

.map-section {
  min-height: 600px;
}

.demo-map {
  width: 100%;
  height: 600px;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Responsive design */
@media (max-width: 1024px) {
  .demo-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .controls-panel {
    order: -1;
  }
}

@media (max-width: 768px) {
  .demo-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
