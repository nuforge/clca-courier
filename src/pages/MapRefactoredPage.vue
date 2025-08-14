<template>
  <q-page class="fit">
    <!-- Full Screen Map Container -->
    <div class="absolute-full">
      <InteractiveMapSVGRefactored ref="mapRef" class="fit" />

      <!-- Roads Panel - Collapsible Overlay -->
      <div class="map-overlay roads-overlay" :class="{ 'collapsed': !roadsExpanded }">
        <div class="overlay-header" @click="roadsExpanded = !roadsExpanded">
          <q-icon name="alt_route" size="sm" class="q-mr-sm" />
          <span class="text-subtitle1">Roads ({{ sortedAndFilteredRoads.length }})</span>
          <q-space />
          <div class="text-caption text-grey-6" v-if="state.selectedRoadIds?.length && roadsExpanded">
            {{ state.selectedRoadIds.length }} selected
          </div>
          <q-icon :name="roadsExpanded ? 'expand_less' : 'expand_more'" />
        </div>

        <div class="overlay-content" v-show="roadsExpanded">
          <!-- Search input -->
          <q-input v-model="searchQuery" outlined dense placeholder="Search roads..." class="q-mb-md">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
            <template v-slot:append>
              <q-icon v-if="searchQuery" name="clear" class="cursor-pointer" @click="searchQuery = ''" />
            </template>
          </q-input>

          <!-- Sort and Selection controls -->
          <div class="row q-gutter-sm q-mb-md">
            <q-select v-model="sortBy" :options="sortOptions" option-label="label" option-value="value" emit-value
              map-options dense outlined label="Sort by" class="col" />
            <q-btn flat dense :icon="sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'" @click="toggleSortOrder"
              :title="`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`" />
          </div>

          <!-- Selection controls -->
          <div class="row q-gutter-sm q-mb-md">
            <q-btn flat dense color="primary" icon="select_all" label="Select All" @click="selectAllVisible"
              :disable="sortedAndFilteredRoads.length === 0" size="sm" />
            <q-btn flat dense color="negative" icon="clear_all" label="Clear" @click="clearSelection"
              :disable="(state.selectedRoadIds?.length || 0) === 0" size="sm" />
            <q-btn flat dense color="secondary" icon="shuffle" label="Random" @click="selectRandomRoad" size="sm" />
          </div>

          <!-- Roads List -->
          <div class="roads-list-container">
            <q-list dense>
              <q-item v-for="(road, index) in sortedAndFilteredRoads" :key="`road-${index}`" clickable
                :active="state.selectedRoadIds?.includes(road.id)" @click="selectRoad(road.id)" class="road-list-item">
                <q-item-section side>
                  <q-checkbox :model-value="state.selectedRoadIds?.includes(road.id) || false"
                    @update:model-value="() => selectRoad(road.id)" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ road.name }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="location_on" :color="state.selectedRoadIds?.includes(road.id) ? 'primary' : 'grey'" />
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
        </div>
      </div>

      <!-- Map Controls - Positioned with Zoom Controls -->
      <div class="map-controls-with-zoom">
        <q-btn round color="primary" icon="settings" size="sm" @click="controlsExpanded = !controlsExpanded"
          :class="{ 'active': controlsExpanded }" class="controls-toggle-btn" />

        <q-card v-show="controlsExpanded" class="controls-popup">
          <q-card-section class="q-pb-sm">
            <div class="text-subtitle1 q-mb-md flex items-center">
              <q-icon name="tune" class="q-mr-sm" />
              Map Controls
            </div>

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
                    <q-item-label caption>Selected</q-item-label>
                    <q-item-label>{{ state.selectedRoadIds?.length || 0 }} roads</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>
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

// UI state for collapsible panels
const roadsExpanded = ref(true);
const controlsExpanded = ref(false);

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
/* Roads Overlay Panel */
.roads-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 350px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  /* Higher than drawer */
  transition: all 0.3s ease;
  max-height: calc(100vh - 120px);
  overflow: hidden;
}

.roads-overlay.collapsed {
  height: 48px;
}

.overlay-header {
  padding: 12px 16px;
  background: rgba(25, 118, 210, 0.1);
  border-bottom: 1px solid rgba(25, 118, 210, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;
}

.overlay-header:hover {
  background: rgba(25, 118, 210, 0.15);
}

.overlay-content {
  padding: 16px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.roads-list-container {
  height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

/* Map Controls - Positioned with Zoom Controls */
.map-controls-with-zoom {
  position: absolute;
  bottom: 16px;
  right: 74px;
  /* Position to the left of zoom controls */
  z-index: 1000;
  /* Higher than drawer */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.controls-toggle-btn {
  transition: all 0.2s ease;
}

.controls-toggle-btn.active {
  background-color: rgba(25, 118, 210, 0.9) !important;
  transform: rotate(180deg);
}

.controls-popup {
  position: absolute;
  bottom: 48px;
  /* Position above the settings button (button height + gap) */
  right: 0;
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark mode support */
.body--dark .roads-overlay,
.body--dark .controls-popup {
  background: rgba(30, 30, 30, 0.95);
  color: white;
}

.body--dark .overlay-header {
  background: rgba(144, 202, 249, 0.1);
  border-bottom-color: rgba(144, 202, 249, 0.2);
}

.body--dark .overlay-header:hover {
  background: rgba(144, 202, 249, 0.15);
}

.body--dark .roads-list-container {
  border-color: rgba(255, 255, 255, 0.1);
}

/* Responsive design */
@media (max-width: 768px) {
  .roads-overlay {
    width: calc(100vw - 32px);
    left: 16px;
    right: 16px;
  }

  .controls-popup {
    width: 250px;
  }
}

@media (max-width: 480px) {
  .roads-overlay {
    width: calc(100vw - 16px);
    left: 8px;
    right: 8px;
  }

  .controls-popup {
    width: 220px;
  }

  .map-controls-with-zoom {
    bottom: 60px;
    right: 66px;
    /* Adjust for mobile zoom controls */
  }
}
</style>
