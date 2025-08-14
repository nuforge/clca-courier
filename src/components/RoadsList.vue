<template>
  <q-card class="roads-list-card">
    <q-card-section>
      <div class="text-h6 q-mb-md">Roads</div>

      <!-- Search input -->
      <q-input v-model="searchQuery" outlined dense placeholder="Search roads..." class="q-mb-md">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
        <template v-slot:append>
          <q-icon v-if="searchQuery" name="clear" class="cursor-pointer" @click="searchQuery = ''" />
        </template>
      </q-input>

      <!-- Statistics -->
      <div class="road-statistics q-mb-md">
        <q-chip square color="primary" text-color="white" icon="analytics">
          Total: {{ statistics.totalRoads }}
        </q-chip>
        <q-chip square color="positive" text-color="white" icon="check_circle">
          Selected: {{ props.selectedRoadIds?.length || 0 }}
        </q-chip>
        <q-chip v-if="searchQuery" square color="info" text-color="white" icon="filter_alt">
          Filtered: {{ statistics.filteredCount }}
        </q-chip>
      </div>

      <!-- Selection controls -->
      <div class="selection-controls q-mb-md">
        <q-btn flat dense color="primary" icon="select_all" label="Select All" @click="selectAllVisible"
          :disable="filteredRoads.length === 0" />
        <q-btn flat dense color="negative" icon="clear_all" label="Clear All" @click="clearAllSelections"
          :disable="(props.selectedRoadIds?.length || 0) === 0" />
      </div>
    </q-card-section>

    <q-separator />

    <!-- Roads list -->
    <q-card-section class="roads-list-section">
      <q-scroll-area style="height: 400px;">
        <q-list>
          <q-item v-for="road in filteredRoads" :key="road.id" clickable v-ripple :class="{
            'road-item-selected': props.selectedRoadIds?.includes(road.id) || false,
            'road-item-hovered': hoveredRoadId === road.id
          }" @click="toggleRoadSelection(road.id)" @mouseenter="onRoadHover(road.id)"
            @mouseleave="onRoadLeave(road.id)">
            <q-item-section side>
              <q-checkbox :model-value="props.selectedRoadIds?.includes(road.id) || false"
                @update:model-value="toggleRoadSelection(road.id)" color="primary" />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ road.name }}</q-item-label>
              <q-item-label caption>{{ road.id }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn flat round dense icon="center_focus_strong" size="sm" @click.stop="focusOnRoad(road.id)"
                class="focus-btn">
                <q-tooltip>Focus on map</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>

          <q-item v-if="filteredRoads.length === 0">
            <q-item-section>
              <q-item-label class="text-grey-6">
                {{ searchQuery ? 'No roads match your search' : 'No roads loaded' }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Road } from '../composables/useInteractiveMap';

interface Props {
  roads: Road[];
  selectedRoadIds?: string[];
  hoveredRoadId?: string | null;
  statistics?: {
    totalRoads: number;
    selectedCount: number;
    filteredCount: number;
  };
}

interface Emits {
  (e: 'roadSelected', roadId: string): void;
  (e: 'roadDeselected', roadId: string): void;
  (e: 'multipleSelected', roadIds: string[]): void;
  (e: 'allCleared'): void;
  (e: 'roadHover', roadId: string): void;
  (e: 'roadLeave', roadId: string): void;
  (e: 'focusRoad', roadId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  selectedRoadIds: () => [],
  hoveredRoadId: null,
  statistics: () => ({
    totalRoads: 0,
    selectedCount: 0,
    filteredCount: 0
  })
});

const emit = defineEmits<Emits>();

// Search functionality
const searchQuery = ref('');

// Computed properties
const filteredRoads = computed(() => {
  if (!searchQuery.value) return props.roads;

  const query = searchQuery.value.toLowerCase();
  return props.roads.filter(
    (road) =>
      road.name.toLowerCase().includes(query) ||
      road.id.toLowerCase().includes(query)
  );
});

// Enhanced statistics that include search results
const statistics = computed(() => ({
  ...props.statistics,
  filteredCount: filteredRoads.value.length
}));

// Methods
const toggleRoadSelection = (roadId: string) => {
  if (props.selectedRoadIds?.includes(roadId)) {
    emit('roadDeselected', roadId);
  } else {
    emit('roadSelected', roadId);
  }
};

const selectAllVisible = () => {
  const visibleIds = filteredRoads.value.map(road => road.id);
  const currentSelections = props.selectedRoadIds || [];
  const newSelections = visibleIds.filter(id => !currentSelections.includes(id));
  if (newSelections.length > 0) {
    emit('multipleSelected', [...currentSelections, ...newSelections]);
  }
};

const clearAllSelections = () => {
  emit('allCleared');
};

const onRoadHover = (roadId: string) => {
  emit('roadHover', roadId);
};

const onRoadLeave = (roadId: string) => {
  emit('roadLeave', roadId);
};

const focusOnRoad = (roadId: string) => {
  emit('focusRoad', roadId);
};

// Watch for search changes to update filtered count
watch(searchQuery, () => {
  // The filteredCount is automatically updated through the computed property
});
</script>

<style scoped>
.roads-list-card {
  min-width: 300px;
  max-width: 400px;
}

.road-statistics {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.selection-controls {
  display: flex;
  gap: 8px;
}

.roads-list-section {
  padding: 0;
}

.road-item-selected {
  background-color: rgba(25, 118, 210, 0.1);
  border-left: 4px solid #1976d2;
}

.road-item-hovered {
  background-color: rgba(25, 118, 210, 0.05);
}

.focus-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.focus-btn:hover {
  opacity: 1;
}

.q-item {
  transition: background-color 0.2s ease;
}

.q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
