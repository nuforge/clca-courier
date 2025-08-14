import { ref, reactive, computed, watch } from 'vue';
import { useMapStore } from '../stores/map-store';
import { SVGRoadParser } from '../utils/svgRoadParser';

export interface Road {
  id: string;
  name: string;
  pathData: string;
  element?: SVGPathElement | undefined;
  group?: SVGGElement | undefined;
  // Backward compatibility properties
  color?: string;
  strokeWidth?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

export interface RoadTheme {
  id: string;
  name: string;
  strokeColor: string;
  strokeWidth: number;
  hoverColor: string;
  selectedColor: string;
}

// Backward compatibility interface for old MapTheme structure
export interface LegacyMapTheme {
  name: string;
  defaultColor: string;
  highlightColor: string;
  selectedColor: string;
  defaultStrokeWidth: number;
  highlightStrokeWidth: number;
}

// Backward compatibility alias - maintain both structures
export type MapTheme = RoadTheme & Partial<LegacyMapTheme>;

export interface MapInteractionState {
  selectedRoadId: string | null;
  selectedRoadIds: string[]; // Support for multiple selections
  hoveredRoadId: string | null;
  zoomLevel: number;
  panX: number;
  panY: number;
}

// Predefined themes for testing with backward compatibility
const themeList: MapTheme[] = [
  {
    id: 'default',
    name: 'Default',
    strokeColor: '#323232',
    strokeWidth: 4, // Increased for easier interaction
    hoverColor: '#007bff',
    selectedColor: '#28a745',
    // Backward compatibility properties
    defaultColor: '#323232',
    highlightColor: '#007bff',
    defaultStrokeWidth: 4,
    highlightStrokeWidth: 6,
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    strokeColor: '#e74c3c',
    strokeWidth: 5, // Increased for easier interaction
    hoverColor: '#f39c12',
    selectedColor: '#27ae60',
    // Backward compatibility properties
    defaultColor: '#e74c3c',
    highlightColor: '#f39c12',
    defaultStrokeWidth: 5,
    highlightStrokeWidth: 7,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    strokeColor: '#3498db',
    strokeWidth: 4.5, // Increased for easier interaction
    hoverColor: '#2ecc71',
    selectedColor: '#9b59b6',
    // Backward compatibility properties
    defaultColor: '#3498db',
    highlightColor: '#2ecc71',
    defaultStrokeWidth: 4.5,
    highlightStrokeWidth: 6.5,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    strokeColor: '#f39c12',
    strokeWidth: 4, // Increased for easier interaction
    hoverColor: '#e67e22',
    selectedColor: '#c0392b',
    // Backward compatibility properties
    defaultColor: '#f39c12',
    highlightColor: '#e67e22',
    defaultStrokeWidth: 4,
    highlightStrokeWidth: 6,
  },
];

export function useInteractiveMap() {
  const mapStore = useMapStore();
  const roadParser = new SVGRoadParser();

  // Reactive state
  const state = reactive<MapInteractionState>({
    selectedRoadId: null,
    selectedRoadIds: [], // Support for multiple selections
    hoveredRoadId: null,
    zoomLevel: 1,
    panX: 0,
    panY: 0,
  });

  const currentTheme = ref<RoadTheme>(themeList[0]!);
  const searchQuery = ref('');
  const showTooltip = ref(false);
  const tooltipPosition = ref({ x: 0, y: 0 });
  const tooltipContent = ref('');

  // Roads will be populated when SVG is ready
  const roads = ref<Road[]>([]);
  const isRoadsLoaded = ref(false);
  const svgElement = ref<SVGSVGElement | null>(null);

  // Computed properties
  const filteredRoads = computed(() => {
    if (!searchQuery.value) return roads.value;

    const query = searchQuery.value.toLowerCase();
    return roads.value.filter(
      (road) => road.name.toLowerCase().includes(query) || road.id.toLowerCase().includes(query),
    );
  });

  const selectedRoad = computed(() => {
    if (!state.selectedRoadId) return null;
    return roads.value.find((road) => road.id === state.selectedRoadId) || null;
  });

  const hoveredRoad = computed(() => {
    if (!state.hoveredRoadId) return null;
    return roads.value.find((road) => road.id === state.hoveredRoadId) || null;
  });

  const availableThemes = computed(() => themeList);

  const roadStatistics = computed(() => {
    return {
      totalRoads: roads.value.length,
      selectedCount: state.selectedRoadIds.length,
      filteredCount: filteredRoads.value.length,
    };
  });

  // Methods
  const initializeSVGParser = async (svg: SVGSVGElement) => {
    svgElement.value = svg;
    roadParser.setSVGElement(svg);

    // Add a small delay to ensure SVG is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    loadRoadsFromSVG();
  };

  const loadRoadsFromSVG = () => {
    try {
      console.log('Loading roads from SVG...');
      const parsedRoads = roadParser.parseRoads();
      console.log('Parsed roads:', parsedRoads);

      roads.value = parsedRoads.map((parsedRoad) => ({
        id: parsedRoad.id,
        name: parsedRoad.name,
        pathData: parsedRoad.pathData,
        element: parsedRoad.element,
        group: parsedRoad.group,
        // Backward compatibility properties
        color: currentTheme.value.strokeColor,
        strokeWidth: currentTheme.value.strokeWidth,
        isSelected: false,
        isHighlighted: false,
      }));

      isRoadsLoaded.value = true;
      console.log(`Successfully loaded ${roads.value.length} roads from SVG`);

      // Validate the SVG structure and log any issues
      const validation = validateSVGStructure();
      if (!validation.isValid) {
        console.warn('SVG structure validation issues:', validation.issues);
      } else {
        console.log('SVG structure validation passed');
      }
    } catch (error) {
      console.error('Failed to load roads from SVG:', error);
      isRoadsLoaded.value = false;
    }
  };

  // Update backward compatibility properties
  const updateRoadProperties = () => {
    roads.value.forEach((road) => {
      road.isSelected = state.selectedRoadIds.includes(road.id);
      road.isHighlighted = state.hoveredRoadId === road.id;

      if (road.isSelected) {
        road.color = currentTheme.value.selectedColor;
        road.strokeWidth = currentTheme.value.strokeWidth + 2;
      } else if (road.isHighlighted) {
        road.color = currentTheme.value.hoverColor;
        road.strokeWidth = currentTheme.value.strokeWidth + 1;
      } else {
        road.color = currentTheme.value.strokeColor;
        road.strokeWidth = currentTheme.value.strokeWidth;
      }
    });
  };

  const selectRoad = (roadId: string | null) => {
    // Store previous selection for history
    if (state.selectedRoadId) {
      mapStore.setSelectedRoad(state.selectedRoadId);
    }

    state.selectedRoadId = roadId;

    // Update the multiple selections array for single selection
    if (roadId) {
      state.selectedRoadIds = [roadId];
    } else {
      state.selectedRoadIds = [];
    }

    updateRoadProperties();

    if (roadId) {
      applyRoadStyles(roadId, 'selected');
    }

    // Clear previous road styles
    roads.value.forEach((road) => {
      if (road.id !== roadId && road.element) {
        applyRoadStyles(road.id, 'default');
      }
    });
  };

  // New method for multiple road selection
  const selectMultipleRoads = (roadIds: string[]) => {
    state.selectedRoadIds = [...roadIds];
    state.selectedRoadId = roadIds.length > 0 ? roadIds[0] || null : null;

    updateRoadProperties();

    // Apply styles to all selected roads
    roads.value.forEach((road) => {
      if (roadIds.includes(road.id)) {
        applyRoadStyles(road.id, 'selected');
      } else {
        applyRoadStyles(road.id, 'default');
      }
    });
  };

  // Toggle a single road in the multiple selection
  const toggleRoadSelection = (roadId: string) => {
    const currentlySelected = state.selectedRoadIds.includes(roadId);

    if (currentlySelected) {
      // Remove from selection
      state.selectedRoadIds = state.selectedRoadIds.filter((id) => id !== roadId);
      applyRoadStyles(roadId, 'default');
    } else {
      // Add to selection
      state.selectedRoadIds = [...state.selectedRoadIds, roadId];
      applyRoadStyles(roadId, 'selected');
    }

    // Update single selection reference
    state.selectedRoadId =
      state.selectedRoadIds.length > 0 ? state.selectedRoadIds[0] || null : null;
    updateRoadProperties();
  };

  // Clear all selections
  const clearAllSelections = () => {
    const previouslySelected = [...state.selectedRoadIds];
    state.selectedRoadIds = [];
    state.selectedRoadId = null;

    // Reset styles for previously selected roads
    previouslySelected.forEach((roadId) => {
      applyRoadStyles(roadId, 'default');
    });

    updateRoadProperties();
  };

  const hoverRoad = (roadId: string | null) => {
    state.hoveredRoadId = roadId;
    updateRoadProperties();

    if (roadId && roadId !== state.selectedRoadId) {
      applyRoadStyles(roadId, 'hover');
    }
  };

  const clearHover = () => {
    if (state.hoveredRoadId && state.hoveredRoadId !== state.selectedRoadId) {
      applyRoadStyles(state.hoveredRoadId, 'default');
    }
    state.hoveredRoadId = null;
    updateRoadProperties();
  };

  const applyRoadStyles = (roadId: string, style: 'default' | 'hover' | 'selected') => {
    const road = roads.value.find((r) => r.id === roadId);
    if (!road?.element) return;

    const theme = currentTheme.value;

    switch (style) {
      case 'hover':
        road.element.style.stroke = theme.hoverColor;
        road.element.style.strokeWidth = String(theme.strokeWidth + 1);
        road.element.style.filter = 'brightness(1.2)';
        break;
      case 'selected':
        road.element.style.stroke = theme.selectedColor;
        road.element.style.strokeWidth = String(theme.strokeWidth + 2);
        road.element.style.filter = 'brightness(1.1)';
        break;
      case 'default':
      default:
        road.element.style.stroke = theme.strokeColor;
        road.element.style.strokeWidth = String(theme.strokeWidth);
        road.element.style.filter = 'none';
        break;
    }
  };

  const applyTheme = (theme: RoadTheme) => {
    currentTheme.value = theme;
    updateRoadProperties();

    // Apply theme to all roads
    roads.value.forEach((road) => {
      if (road.id === state.selectedRoadId) {
        applyRoadStyles(road.id, 'selected');
      } else if (road.id === state.hoveredRoadId) {
        applyRoadStyles(road.id, 'hover');
      } else {
        applyRoadStyles(road.id, 'default');
      }
    });
  };

  const resetMap = () => {
    state.selectedRoadId = null;
    state.selectedRoadIds = [];
    state.hoveredRoadId = null;
    state.zoomLevel = 1;
    state.panX = 0;
    state.panY = 0;
    updateRoadProperties();

    // Reset all road styles
    roads.value.forEach((road) => {
      applyRoadStyles(road.id, 'default');
    });
  };

  const zoomIn = () => {
    state.zoomLevel = Math.min(state.zoomLevel * 1.2, 5);
  };

  const zoomOut = () => {
    state.zoomLevel = Math.max(state.zoomLevel / 1.2, 0.5);
  };

  const centerMap = () => {
    state.panX = 0;
    state.panY = 0;
    state.zoomLevel = 1;
  };

  const showRoadTooltip = (roadId: string, x: number, y: number) => {
    const road = roads.value.find((r) => r.id === roadId);
    if (road) {
      tooltipContent.value = road.name;
      tooltipPosition.value = { x, y };
      showTooltip.value = true;
    }
  };

  const hideTooltip = () => {
    showTooltip.value = false;
  };

  const getRandomRoad = (): Road | null => {
    if (roads.value.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * roads.value.length);
    return roads.value[randomIndex] || null;
  };

  const findRoadsByName = (name: string): Road[] => {
    const query = name.toLowerCase();
    return roads.value.filter((road) => road.name.toLowerCase().includes(query));
  };

  // Helper methods for backward compatibility
  const getRoadPath = (roadId: string): string => {
    const road = roads.value.find((r) => r.id === roadId);
    return road?.pathData || '';
  };

  const getRoadLabelPosition = (): { x: number; y: number } => {
    // Simple implementation - return center of viewBox
    return { x: 1000, y: 900 };
  };

  const validateSVGStructure = () => {
    return roadParser.validateSVGStructure();
  };

  const getRoadParser = () => roadParser;

  // Watch for theme changes
  watch(currentTheme, () => {
    // Store theme preference if needed
    // Theme change handled automatically by reactive system
  });

  // Backward compatibility properties for old components
  const selectedRoadId = computed(() => state.selectedRoadId);
  const hoveredRoadId = computed(() => state.hoveredRoadId);
  const themes = computed(() => availableThemes.value);
  const highlightedRoad = computed(() => hoveredRoad.value);

  // Backward compatibility methods
  const setTheme = applyTheme;
  const clearSelectionCompat = () => selectRoad(null);
  const searchRoadsCompat = findRoadsByName;
  const findIntersectionsCompat = () => []; // Placeholder for backward compatibility
  const highlightRoadCompat = hoverRoad; // Alias for highlightRoad method

  return {
    // State
    state,
    currentTheme,
    searchQuery,
    showTooltip,
    tooltipPosition,
    tooltipContent,
    roads,
    isRoadsLoaded,
    svgElement,

    // Computed
    filteredRoads,
    selectedRoad,
    hoveredRoad,
    availableThemes,
    roadStatistics,

    // Backward compatibility aliases
    selectedRoadId,
    hoveredRoadId,
    themes,
    highlightedRoad,
    setTheme,
    clearSelection: clearSelectionCompat,
    searchRoads: searchRoadsCompat,
    findIntersections: findIntersectionsCompat,
    highlightRoad: highlightRoadCompat,

    // Methods
    initializeSVGParser,
    loadRoadsFromSVG,
    selectRoad,
    selectMultipleRoads,
    toggleRoadSelection,
    clearAllSelections,
    hoverRoad,
    clearHover,
    applyRoadStyles,
    applyTheme,
    resetMap,
    zoomIn,
    zoomOut,
    centerMap,
    showRoadTooltip,
    hideTooltip,
    getRandomRoad,
    findRoadsByName,
    getRoadPath,
    getRoadLabelPosition,
    validateSVGStructure,
    getRoadParser,
    updateRoadProperties,
  };
}
