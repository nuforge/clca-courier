<template>
  <q-page class="map-page">
    <div class="page-header">
      <h1 class="page-title">Interactive Community Map</h1>
      <p class="page-subtitle">
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
        <q-card class="controls-card">
          <q-card-section class="card-header">
            <div class="text-h6">Map Controls</div>
          </q-card-section>

          <q-card-section>
            <!-- Theme Selector -->
            <div class="control-group">
              <label class="control-label">Theme:</label>
              <q-select v-model="selectedTheme" :options="availableThemes" option-label="name" option-value="id"
                emit-value map-options dense @update:model-value="onThemeChange" />
            </div>

            <!-- Search Roads -->
            <div class="control-group">
              <label class="control-label">Search Roads:</label>
              <q-input v-model="searchQuery" placeholder="Search by road name..." dense clearable
                @input="onSearchChange">
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <!-- Quick Actions -->
            <div class="control-group">
              <label class="control-label">Quick Actions:</label>
              <div class="action-buttons">
                <q-btn color="primary" label="Random Road" size="sm" @click="selectRandomRoad" />
                <q-btn color="secondary" label="Center Map" size="sm" @click="centerMap" />
                <q-btn color="negative" label="Clear Selection" size="sm" @click="clearSelection" />
              </div>
            </div>

            <!-- Map Statistics -->
            <div class="control-group">
              <label class="control-label">Statistics:</label>
              <div class="stats-display">
                <div class="stat-item">
                  <span class="stat-label">Total Roads:</span>
                  <span class="stat-value">{{ roadStatistics.totalRoads }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Loaded:</span>
                  <span class="stat-value">{{ isRoadsLoaded ? 'Yes' : 'Loading...' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Selected:</span>
                  <span class="stat-value">{{ selectedRoad?.name || 'None' }}</span>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Road List -->
        <q-card class="roads-list-card">
          <q-card-section class="card-header">
            <div class="text-h6">Roads ({{ filteredRoads.length }})</div>
          </q-card-section>

          <q-card-section class="roads-list-section">
            <q-list dense>
              <q-item v-for="road in filteredRoads.slice(0, 20)" :key="road.id" clickable
                :active="state.selectedRoadId === road.id" @click="selectRoad(road.id)" class="road-list-item">
                <q-item-section>
                  <q-item-label>{{ road.name }}</q-item-label>
                  <q-item-label caption>{{ road.id }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="location_on" :color="state.selectedRoadId === road.id ? 'primary' : 'grey'" />
                </q-item-section>
              </q-item>

              <q-item v-if="filteredRoads.length > 20">
                <q-item-section>
                  <q-item-label class="text-grey-6">
                    ... and {{ filteredRoads.length - 20 }} more roads
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useInteractiveMap } from '../composables/useInteractiveMap';
import InteractiveMapSVGRefactored from '../components/InteractiveMapSVGRefactored.vue';

// Use the refactored composable
const {
  state,
  currentTheme,
  searchQuery,
  isRoadsLoaded,
  filteredRoads,
  selectedRoad,
  roadStatistics,
  availableThemes,
  selectRoad,
  applyTheme,
  centerMap,
  getRandomRoad
} = useInteractiveMap();

// Template refs
const mapRef = ref<InstanceType<typeof InteractiveMapSVGRefactored>>();

// Local state
const selectedTheme = ref(currentTheme.value.id);

// Methods
const onThemeChange = (themeId: string) => {
  const theme = availableThemes.value.find(t => t.id === themeId);
  if (theme) {
    applyTheme(theme);
  }
};

const onSearchChange = () => {
  // Search is reactive through the computed filteredRoads
};

const selectRandomRoad = () => {
  const randomRoad = getRandomRoad();
  if (randomRoad) {
    selectRoad(randomRoad.id);
  }
};

const clearSelection = () => {
  selectRoad(null);
};
</script>

<style scoped>
.map-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 2.5rem;
  color: #1976d2;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
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
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls-card,
.roads-list-card {
  height: fit-content;
}

.card-header {
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.control-group {
  margin-bottom: 16px;
}

.control-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-display {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
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
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 500;
  color: #333;
}

.roads-list-section {
  max-height: 300px;
  overflow-y: auto;
}

.road-list-item {
  border-radius: 4px;
  margin-bottom: 2px;
}

.road-list-item:hover {
  background: #f5f5f5;
}

.architecture-info {
  margin-top: 32px;
}

.info-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #bbdefb;
}

.info-card ul {
  margin: 16px 0;
  padding-left: 20px;
}

.info-card li {
  margin-bottom: 8px;
  color: #2e7d32;
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
}
</style>
