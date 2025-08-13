import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useMapStore = defineStore('map', () => {
  // State
  const selectedRoadId = ref<string | null>(null);
  const highlightedRoadId = ref<string | null>(null);
  const searchQuery = ref('');
  const isInfoPanelOpen = ref(false);
  const mapZoom = ref(1);
  const mapCenter = ref({ x: 0, y: 0 });

  // History for undo/redo functionality
  const selectionHistory = ref<string[]>([]);
  const historyIndex = ref(-1);

  // User preferences
  const userPreferences = ref({
    autoHighlight: true,
    showLabels: true,
    showIntersections: true,
    animateTransitions: true,
  });

  // Computed
  const hasSelection = computed(() => selectedRoadId.value !== null);
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < selectionHistory.value.length - 1);

  // Actions
  const setSelectedRoad = (roadId: string | null) => {
    if (roadId !== selectedRoadId.value) {
      // Add to history
      if (roadId) {
        selectionHistory.value = selectionHistory.value.slice(0, historyIndex.value + 1);
        selectionHistory.value.push(roadId);
        historyIndex.value = selectionHistory.value.length - 1;
      }

      selectedRoadId.value = roadId;

      if (roadId) {
        isInfoPanelOpen.value = true;
      }
    }
  };

  const setHighlightedRoad = (roadId: string | null) => {
    highlightedRoadId.value = roadId;
  };

  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
  };

  const toggleInfoPanel = () => {
    isInfoPanelOpen.value = !isInfoPanelOpen.value;
  };

  const closeInfoPanel = () => {
    isInfoPanelOpen.value = false;
  };

  const clearSelection = () => {
    selectedRoadId.value = null;
    highlightedRoadId.value = null;
    isInfoPanelOpen.value = false;
  };

  const undo = () => {
    if (canUndo.value) {
      historyIndex.value--;
      selectedRoadId.value = selectionHistory.value[historyIndex.value] || null;
    }
  };

  const redo = () => {
    if (canRedo.value) {
      historyIndex.value++;
      selectedRoadId.value = selectionHistory.value[historyIndex.value] || null;
    }
  };

  const setZoom = (zoom: number) => {
    mapZoom.value = Math.max(0.5, Math.min(3, zoom));
  };

  const setMapCenter = (center: { x: number; y: number }) => {
    mapCenter.value = center;
  };

  const updateUserPreference = (key: keyof typeof userPreferences.value, value: boolean) => {
    userPreferences.value[key] = value;
  };

  // Reset all state
  const reset = () => {
    selectedRoadId.value = null;
    highlightedRoadId.value = null;
    searchQuery.value = '';
    isInfoPanelOpen.value = false;
    mapZoom.value = 1;
    mapCenter.value = { x: 0, y: 0 };
    selectionHistory.value = [];
    historyIndex.value = -1;
  };

  return {
    // State
    selectedRoadId,
    highlightedRoadId,
    searchQuery,
    isInfoPanelOpen,
    mapZoom,
    mapCenter,
    selectionHistory,
    historyIndex,
    userPreferences,

    // Computed
    hasSelection,
    canUndo,
    canRedo,

    // Actions
    setSelectedRoad,
    setHighlightedRoad,
    setSearchQuery,
    toggleInfoPanel,
    closeInfoPanel,
    clearSelection,
    undo,
    redo,
    setZoom,
    setMapCenter,
    updateUserPreference,
    reset,
  };
});
