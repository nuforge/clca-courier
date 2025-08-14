<template>
  <q-page :class="['map-page', backgroundClasses.page]">
    <div class="page-header">
      <h1 :class="['page-title', textClasses.primary]">Interactive Community Map</h1>
      <p :class="['page-subtitle', textClasses.secondary]">
        Explore roads and neighborhoods in our community
      </p>
    </div>

    <div class="demo-container">
      <!-- Map Component -->
      <div class="map-section">
        <InteractiveMapSVGRefactored ref="mapRef" class="demo-map" />
      </div>

      <!-- Controls Panel -->
      <div class="controls-panel">
        <!-- Roads List Card -->
        <q-card :class="['roads-list-card', cardClasses]">
          <q-card-section :class="['card-header', backgroundClasses.surface, borderClasses.light]">
            <div :class="['text-h6', textClasses.primary]">Roads ({{ filteredRoads.length }})</div>
            <div :class="['text-caption', textClasses.secondary]" v-if="state.selectedRoadIds?.length">
              {{ state.selectedRoadIds.length }} selected
            </div>
          </q-card-section>

          <q-card-section>
            <!-- Search input -->
            <q-input v-model="searchQuery" outlined dense placeholder="Search roads..." class="q-mb-md">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <q-icon v-if="searchQuery" name="clear" class="cursor-pointer" @click="searchQuery = ''" />
              </template>
            </q-input>

            <!-- Selection controls -->
            <div class="selection-controls q-mb-md">
              <q-btn flat dense color="primary" icon="select_all" label="Select All" @click="selectAllVisible"
                :disable="filteredRoads.length === 0" />
              <q-btn flat dense color="negative" icon="clear_all" label="Clear All" @click="clearSelection"
                :disable="(state.selectedRoadIds?.length || 0) === 0" />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="roads-list-section">
            <q-scroll-area style="height: 300px;">
              <q-list dense>
                <q-item v-for="(road, index) in filteredRoads.slice(0, 20)" :key="`road-${index}`" clickable
                  :active="state.selectedRoadIds?.includes(road.id)" @click="selectRoad(road.id)"
                  class="road-list-item">
                  <q-item-section side>
                    <q-checkbox :model-value="state.selectedRoadIds?.includes(road.id) || false"
                      @update:model-value="() => selectRoad(road.id)" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ road.name }}</q-item-label>
                    <q-item-label caption>{{ road.id }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="location_on" :color="state.selectedRoadIds?.includes(road.id) ? 'primary' : 'grey'" />
                  </q-item-section>
                </q-item>

                <q-item v-if="filteredRoads.length > 20">
                  <q-item-section>
                    <q-item-label class="text-grey-6">
                      ... and {{ filteredRoads.length - 20 }} more roads
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="filteredRoads.length === 0 && isRoadsLoaded">
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
            </q-scroll-area>
          </q-card-section>
        </q-card>

        <!-- Map Controls Card -->
        <q-card :class="['controls-card', cardClasses]">
          <q-card-section :class="['card-header', backgroundClasses.surface, borderClasses.light]">
            <div :class="['text-h6', textClasses.primary]">Map Controls</div>
          </q-card-section>

          <q-card-section>
            <!-- Theme Selector -->
            <div class="control-group">
              <label :class="['control-label', textClasses.primary]">Theme:</label>
              <q-select v-model="selectedTheme" :options="availableThemes" option-label="name" option-value="id"
                emit-value map-options dense @update:model-value="onThemeChange" />
            </div>

            <!-- Search Roads -->
            <div class="control-group">
              <label :class="['control-label', textClasses.primary]">Search Roads:</label>
              <q-input v-model="searchQuery" placeholder="Search by road name..." dense clearable
                @input="onSearchChange">
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <!-- Quick Actions -->
            <div class="control-group">
              <label :class="['control-label', textClasses.primary]">Quick Actions:</label>
              <div class="action-buttons">
                <q-btn color="primary" label="Random Road" size="sm" @click="selectRandomRoad" />
                <q-btn color="secondary" label="Center Map" size="sm" @click="centerMap" />
                <q-btn color="negative" label="Clear All" size="sm" @click="clearSelection" />
              </div>
            </div>

            <!-- Map Statistics -->
            <div class="control-group">
              <label :class="['control-label', textClasses.primary]">Statistics:</label>
              <div :class="['stats-display', backgroundClasses.surface, borderClasses.light]">
                <div class="stat-item">
                  <span :class="['stat-label', textClasses.secondary]">Total Roads:</span>
                  <span :class="['stat-value', textClasses.primary]">{{ roadStatistics.totalRoads }}</span>
                </div>
                <div class="stat-item">
                  <span :class="['stat-label', textClasses.secondary]">Loaded:</span>
                  <span :class="['stat-value', textClasses.primary]">{{ isRoadsLoaded ? 'Yes' : 'Loading...' }}</span>
                </div>
                <div class="stat-item">
                  <span :class="['stat-label', textClasses.secondary]">Selected:</span>
                  <span :class="['stat-value', textClasses.primary]">{{ state.selectedRoadIds?.length || 0 }}
                    roads</span>
                </div>
              </div>
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
import { useTheme } from '../composables/useTheme';

// Theme management
const {
  cardClasses,
  textClasses,
  backgroundClasses,
  borderClasses
} = useTheme();

// Template refs
const mapRef = ref<InstanceType<typeof InteractiveMapSVGRefactored>>();

// Local state for the page controls
const selectedTheme = ref('default');
const searchQuery = ref('');

// Computed properties that access the map component's data
const availableThemes = computed(() => mapRef.value?.availableThemes || []);
const isRoadsLoaded = computed(() => mapRef.value?.isRoadsLoaded || false);
const roadStatistics = computed(() => mapRef.value?.roadStatistics || { totalRoads: 0, selectedCount: 0, filteredCount: 0 });
const state = computed(() => {
  const defaultState = { selectedRoadIds: [] as string[], selectedRoadId: null as string | null };
  return mapRef.value?.state || defaultState;
});

// Create our own filtered roads to avoid type issues
const filteredRoads = computed((): Road[] => {
  const roads = (mapRef.value?.roads || []) as Road[];
  if (!searchQuery.value) return roads;
  return roads.filter(road =>
    road.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    road.id?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
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
    const visibleIds = filteredRoads.value.slice(0, 20).map(road => road.id);
    const currentSelections: string[] = state.value.selectedRoadIds || [];
    const newSelections = visibleIds.filter(id => !currentSelections.includes(id));
    if (newSelections.length > 0) {
      mapRef.value.selectMultipleRoads([...currentSelections, ...newSelections]);
    }
  }
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
.map-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  transition: background-color 0.3s ease;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 2.5rem;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.page-subtitle {
  font-size: 1.1rem;
  margin: 0;
  transition: color 0.3s ease;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

/* Dark mode map shadow */
.body--dark .demo-map {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls-card,
.roads-list-card {
  height: fit-content;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.card-header {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.control-group {
  margin-bottom: 16px;
}

.control-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-display {
  padding: 12px;
  border-radius: 4px;
  border-width: 1px;
  border-style: solid;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.stat-value {
  font-weight: 500;
  transition: color 0.3s ease;
}

.roads-list-section {
  max-height: 300px;
  overflow-y: auto;
}

.road-list-item {
  border-radius: 4px;
  margin-bottom: 2px;
  transition: background-color 0.3s ease;
}

.road-list-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Dark mode hover state */
.body--dark .road-list-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.architecture-info {
  margin-top: 32px;
}

.info-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #bbdefb;
  transition: background 0.3s ease, border-color 0.3s ease;
}

/* Dark mode info card */
.body--dark .info-card {
  background: linear-gradient(135deg, #1e3a8a 0%, #581c87 100%);
  border: 1px solid #3b82f6;
}

.info-card ul {
  margin: 16px 0;
  padding-left: 20px;
}

.info-card li {
  margin-bottom: 8px;
  color: #2e7d32;
  transition: color 0.3s ease;
}

/* Dark mode info card text */
.body--dark .info-card li {
  color: #a7f3d0;
}

/* Selection controls */
.selection-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
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
  .map-demo-page {
    padding: 16px;
  }

  .page-title {
    font-size: 2rem;
  }

  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .selection-controls {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
