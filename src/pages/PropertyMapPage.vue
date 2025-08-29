<template>
  <q-page class="property-map-page">
    <div class="page-header q-mb-lg">
      <h3 class="text-h4 text-weight-bold q-mb-md">Interactive Property Map</h3>
      <p class="text-body1 text-grey-7 q-mb-lg">
        Search and explore property lots across different sections of Conashaugh Lakes
      </p>
    </div>

    <div class="map-controls-section q-mb-md">
      <q-card flat bordered class="q-pa-md">
        <div class="row q-gutter-md items-center">
          <!-- Search Input -->
          <div class="col-md-4 col-sm-6 col-xs-12">
            <q-input v-model="searchQuery" label="Search lots..." outlined dense clearable
              placeholder="Enter lot number or section" @input="handleSearch">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Section Filter -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-select v-model="selectedSection" :options="sectionOptions" label="Filter by Section" outlined dense
              clearable emit-value map-options @update:model-value="handleSectionFilter" />
          </div>

          <!-- Theme Selector -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-select v-model="currentThemeId" :options="themeOptions" label="Map Theme" outlined dense emit-value
              map-options @update:model-value="handleThemeChange" />
          </div>

          <!-- Clear All Button -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-btn color="secondary" outline label="Clear All" icon="clear_all" @click="clearAllSelections"
              :disable="!hasSelections" class="full-width" />
          </div>
        </div>

        <!-- Search Results Info -->
        <div v-if="searchQuery || selectedSection" class="q-mt-md">
          <q-chip color="primary" text-color="white" icon="info">
            {{ filteredLotsCount }} lots found
          </q-chip>
          <q-chip v-if="searchQuery" removable color="secondary" @remove="searchQuery = ''">
            Search: "{{ searchQuery }}"
          </q-chip>
          <q-chip v-if="selectedSection" removable color="accent" @remove="selectedSection = null">
            Section: {{ selectedSection }}
          </q-chip>
        </div>

        <!-- Debug Info -->
        <div class="q-mt-md">
          <q-chip color="orange" text-color="white" icon="bug_report">
            DEBUG: {{ lotStatistics.total }} total lots parsed
          </q-chip>
        </div>
      </q-card>
    </div>

    <div class="map-content-section">
      <q-card flat bordered>
        <div class="map-layout row">
          <!-- Main Map Area -->
          <div class="col-lg-9 col-md-8 col-sm-12 col-xs-12">
            <InteractivePropertyMapSVG ref="propertyMapRef" :key="mapKey" />
          </div>

          <!-- Sidebar with lot information -->
          <div class="col-lg-3 col-md-4 col-sm-12 col-xs-12 map-sidebar">
            <q-card flat bordered class="full-height">
              <q-card-section class="q-pb-none">
                <div class="text-h6 text-weight-bold">Property Information</div>
              </q-card-section>

              <!-- Statistics -->
              <q-card-section>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-number text-primary">{{ lotStatistics.total }}</div>
                    <div class="stat-label">Total Lots</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number text-secondary">{{ lotStatistics.selected }}</div>
                    <div class="stat-label">Selected</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number text-accent">{{ lotStatistics.sections }}</div>
                    <div class="stat-label">Sections</div>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <!-- Selected Lot Details -->
              <q-card-section v-if="selectedLot">
                <div class="text-subtitle2 text-weight-bold q-mb-sm">Selected Lot</div>
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <q-item-label>Lot Number</q-item-label>
                      <q-item-label caption>{{ selectedLot.number }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label>Section</q-item-label>
                      <q-item-label caption>{{ selectedLot.section }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label>ID</q-item-label>
                      <q-item-label caption>{{ selectedLot.id }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>

              <!-- Filtered Lots List -->
              <q-card-section v-if="filteredLots.length > 0 && filteredLots.length < 50">
                <div class="text-subtitle2 text-weight-bold q-mb-sm">
                  {{ searchQuery || selectedSection ? 'Filtered' : 'All' }} Lots ({{
                    filteredLots.length }})
                </div>
                <q-scroll-area style="height: 300px;">
                  <q-list dense>
                    <q-item v-for="lot in filteredLots.slice(0, 100)" :key="lot.id" clickable
                      :active="state.selectedLotIds.includes(lot.id)" @click="handleLotSelect(lot.id)">
                      <q-item-section>
                        <q-item-label>Lot {{ lot.number }}</q-item-label>
                        <q-item-label caption>{{ lot.section }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-icon
                          :name="state.selectedLotIds.includes(lot.id) ? 'check_circle' : 'radio_button_unchecked'"
                          :color="state.selectedLotIds.includes(lot.id) ? 'primary' : 'grey-5'" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-scroll-area>
              </q-card-section>

              <!-- Too many results message -->
              <q-card-section v-else-if="filteredLots.length >= 50">
                <q-banner class="text-center" rounded>
                  <div class="text-subtitle2">Too many results ({{ filteredLots.length }})</div>
                  <div class="text-caption">Please refine your search</div>
                </q-banner>
              </q-card-section>

              <q-separator />

              <!-- Debug Section -->
              <q-card-section>
                <div class="text-subtitle2 text-weight-bold q-mb-sm">Debug: Missing Lots</div>
                <q-btn-group flat>
                  <q-btn flat size="sm" label="Find 504" @click="debugSearch('504')" />
                  <q-btn flat size="sm" label="Find Seneca" @click="debugSearch('seneca')" />
                </q-btn-group>
                <div v-if="debugResults.length > 0" class="q-mt-sm">
                  <div class="text-caption">Found {{ debugResults.length }} matches:</div>
                  <q-list dense>
                    <q-item v-for="lot in debugResults" :key="lot.id">
                      <q-item-section>
                        <q-item-label caption>ID: {{ lot.id }}</q-item-label>
                        <q-item-label>Lot {{ lot.number }}</q-item-label>
                        <q-item-label caption>{{ lot.section }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import InteractivePropertyMapSVG from '../components/InteractivePropertyMapSVG.vue';
import type { PropertyLot, PropertyMapInteractionState, LotTheme } from '../composables/useInteractivePropertyMap';

// Component reference
const propertyMapRef = ref<InstanceType<typeof InteractivePropertyMapSVG>>();

// Local state
const searchQuery = ref('');
const selectedSection = ref<string | null>(null);
const currentThemeId = ref('default');
const mapKey = ref(0); // For forcing component refresh
const debugResults = ref<PropertyLot[]>([]);

// Computed properties from the map component
const state = computed(() => propertyMapRef.value?.state || {
  selectedLotIds: [],
  hoveredLotId: null,
  selectedLotId: null,
  zoomLevel: 1,
  panX: 0,
  panY: 0
} as PropertyMapInteractionState);
const lots = computed(() => propertyMapRef.value?.lots || []);
const selectedLot = computed(() => propertyMapRef.value?.selectedLot || null);
const lotStatistics = computed(() => propertyMapRef.value?.lotStatistics || { total: 0, selected: 0, sections: 0 });
const availableThemes = computed(() => propertyMapRef.value?.availableThemes || []);

// Search and filter logic
const filteredLots = computed(() => {
  let filtered = lots.value as PropertyLot[];

  // Apply text search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((lot: PropertyLot) =>
      lot.number.toLowerCase().includes(query) ||
      lot.section.toLowerCase().includes(query) ||
      lot.id.toLowerCase().includes(query)
    );
  }

  // Apply section filter
  if (selectedSection.value) {
    filtered = filtered.filter((lot: PropertyLot) => lot.section === selectedSection.value);
  }

  return filtered;
});

const filteredLotsCount = computed(() => filteredLots.value.length);

// Options for selects
const sectionOptions = computed(() => {
  const sections = [...new Set((lots.value as PropertyLot[]).map((lot: PropertyLot) => lot.section))].sort();
  return sections.map(section => ({
    label: `Section ${section}`,
    value: section
  }));
});

const themeOptions = computed(() =>
  (availableThemes.value as LotTheme[]).map((theme: LotTheme) => ({
    label: theme.name,
    value: theme.id
  }))
);

const hasSelections = computed(() => state.value.selectedLotIds.length > 0);

// Event handlers
const handleSearch = () => {
  // Search is reactive through computed property
  console.log('Searching for:', searchQuery.value);
};

const handleSectionFilter = () => {
  console.log('Filtering by section:', selectedSection.value);
};

const handleThemeChange = (themeId: string) => {
  if (propertyMapRef.value?.applyTheme) {
    propertyMapRef.value.applyTheme(themeId);
  }
};

const handleLotSelect = (lotId: string) => {
  if (propertyMapRef.value?.toggleLotSelection) {
    propertyMapRef.value.toggleLotSelection(lotId);
  }
};

const clearAllSelections = () => {
  if (propertyMapRef.value?.clearAllSelections) {
    propertyMapRef.value.clearAllSelections();
  }
  searchQuery.value = '';
  selectedSection.value = null;
};

// Debug method to find specific lots
const debugSearch = (searchTerm: string) => {
  if (propertyMapRef.value?.debugFindLot) {
    debugResults.value = propertyMapRef.value.debugFindLot(searchTerm);
    console.log(`Debug search for "${searchTerm}":`, debugResults.value);
  } else {
    console.log('Debug search not available');
    debugResults.value = [];
  }
};

// Watch for search query changes to update the map component
watch(searchQuery, (newQuery) => {
  if (propertyMapRef.value?.searchLots) {
    propertyMapRef.value.searchLots(newQuery);
  }
});

onMounted(() => {
  console.log('Property map page mounted');
});
</script>

<style scoped>
.property-map-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
}

.map-layout {
  min-height: 600px;
}

.map-sidebar {
  border-left: 1px solid #e0e0e0;
  background: #fafafa;
}

.full-height {
  height: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  text-align: center;
}

.stat-item {
  padding: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* Dark mode adjustments */
.body--dark .map-sidebar {
  border-left-color: #333;
  background: #1e1e1e;
}

/* Responsive design */
@media (max-width: 1023px) {
  .map-layout {
    flex-direction: column;
  }

  .map-sidebar {
    border-left: none;
    border-top: 1px solid #e0e0e0;
    min-height: 400px;
  }

  .body--dark .map-sidebar {
    border-top-color: #333;
  }
}

@media (max-width: 768px) {
  .property-map-page {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-number {
    font-size: 20px;
  }
}
</style>
