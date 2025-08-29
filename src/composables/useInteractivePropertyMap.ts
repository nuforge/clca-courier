import { ref, reactive, computed } from 'vue';
import { SVGLotParser } from '../utils/svgLotParser';

export interface PropertyLot {
  id: string;
  number: string;
  pathData: string;
  section: string;
  element?: SVGPathElement | undefined;
  group?: SVGGElement | undefined;
  // Display properties
  color?: string;
  strokeWidth?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

export interface LotTheme {
  id: string;
  name: string;
  strokeColor: string;
  strokeWidth: number;
  hoverColor: string;
  selectedColor: string;
  fillColor: string;
}

export interface PropertyMapInteractionState {
  selectedLotId: string | null;
  selectedLotIds: string[]; // Support for multiple selections
  hoveredLotId: string | null;
  zoomLevel: number;
  panX: number;
  panY: number;
}

// Predefined themes for property lots
const themeList: LotTheme[] = [
  {
    id: 'default',
    name: 'Default',
    strokeColor: '#2c3e50',
    strokeWidth: 2,
    hoverColor: '#3498db',
    selectedColor: '#27ae60',
    fillColor: '#ecf0f1',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    strokeColor: '#e74c3c',
    strokeWidth: 2.5,
    hoverColor: '#f39c12',
    selectedColor: '#27ae60',
    fillColor: '#fadbd8',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    strokeColor: '#2980b9',
    strokeWidth: 2,
    hoverColor: '#1abc9c',
    selectedColor: '#8e44ad',
    fillColor: '#d6eaf8',
  },
  {
    id: 'forest',
    name: 'Forest',
    strokeColor: '#27ae60',
    strokeWidth: 2,
    hoverColor: '#f39c12',
    selectedColor: '#e74c3c',
    fillColor: '#d5f4e6',
  },
];

export function useInteractivePropertyMap() {
  // Core state management
  const state = reactive<PropertyMapInteractionState>({
    selectedLotId: null,
    selectedLotIds: [],
    hoveredLotId: null,
    zoomLevel: 1,
    panX: 0,
    panY: 0,
  });

  // Data state
  const lots = ref<PropertyLot[]>([]);
  const isLotsLoaded = ref(false);
  const parser = ref<SVGLotParser | null>(null);

  // Theme management
  const currentThemeId = ref('default');
  const availableThemes = ref(themeList);

  // UI state
  const showTooltip = ref(false);
  const tooltipPosition = ref({ x: 0, y: 0 });
  const tooltipContent = ref('');

  // Search functionality
  const searchQuery = ref('');

  // Computed properties
  const currentTheme = computed(
    () =>
      availableThemes.value.find((theme) => theme.id === currentThemeId.value) ||
      availableThemes.value[0],
  );

  const selectedLot = computed(() =>
    state.selectedLotId ? lots.value.find((lot) => lot.id === state.selectedLotId) : null,
  );

  const filteredLots = computed(() => {
    if (!searchQuery.value.trim()) return lots.value;

    const query = searchQuery.value.toLowerCase().trim();
    return lots.value.filter(
      (lot) =>
        lot.number.toLowerCase().includes(query) ||
        lot.section.toLowerCase().includes(query) ||
        lot.id.toLowerCase().includes(query),
    );
  });

  const lotStatistics = computed(() => ({
    total: lots.value.length,
    selected: state.selectedLotIds.length,
    sections: [...new Set(lots.value.map((lot) => lot.section))].length,
  }));

  // SVG parsing and initialization
  const initializeSVGParser = async (customSvgPath?: string) => {
    try {
      console.log('Initializing SVG parser for property lots...');
      parser.value = new SVGLotParser();

      // Load the square map SVG - use public path
      const svgPath = customSvgPath || '/conashaugh-map-square.svg';
      const response = await fetch(svgPath);

      if (!response.ok) {
        throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
      }

      const svgText = await response.text();

      // Parse the SVG content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svgText;
      const svgElement = tempDiv.querySelector('svg') as SVGSVGElement;

      if (!svgElement) {
        throw new Error('SVG element not found in loaded content');
      }

      parser.value.parseSVG(svgElement);
      lots.value = parser.value.getLots();

      console.log(`Loaded ${lots.value.length} property lots`);
      isLotsLoaded.value = true;

      return { success: true, count: lots.value.length };
    } catch (error) {
      console.error('Failed to initialize SVG parser:', error);
      return { success: false, error };
    }
  }; // Lot selection methods
  const selectLot = (lotId: string) => {
    const lot = lots.value.find((l) => l.id === lotId);
    if (lot) {
      state.selectedLotId = lotId;
      state.selectedLotIds = [lotId];
      console.log(`Selected lot: ${lot.number} (Section ${lot.section})`);
    }
  };

  const selectMultipleLots = (lotIds: string[]) => {
    state.selectedLotIds = [...lotIds];
    state.selectedLotId = lotIds.length > 0 ? lotIds[0] || null : null;
    console.log(`Selected ${lotIds.length} lots`);
  };

  const toggleLotSelection = (lotId: string) => {
    const index = state.selectedLotIds.indexOf(lotId);
    if (index >= 0) {
      // Deselect
      state.selectedLotIds.splice(index, 1);
      state.selectedLotId =
        state.selectedLotIds.length > 0 ? state.selectedLotIds[0] || null : null;
    } else {
      // Select
      state.selectedLotIds.push(lotId);
      state.selectedLotId = lotId;
    }
  };

  const clearAllSelections = () => {
    state.selectedLotIds = [];
    state.selectedLotId = null;
    state.hoveredLotId = null;
    console.log('Cleared all lot selections');
  };

  // Hover management
  const hoverLot = (lotId: string) => {
    state.hoveredLotId = lotId;
  };

  const clearHover = () => {
    state.hoveredLotId = null;
  };

  // Tooltip management
  const showLotTooltip = (lotId: string, x: number, y: number) => {
    const lot = lots.value.find((l) => l.id === lotId);
    if (lot) {
      tooltipContent.value = `Lot ${lot.number} - Section ${lot.section}`;
      tooltipPosition.value = { x, y };
      showTooltip.value = true;
    }
  };

  const hideTooltip = () => {
    showTooltip.value = false;
    tooltipContent.value = '';
  };

  // Map controls
  const zoomIn = () => {
    state.zoomLevel = Math.min(5, state.zoomLevel + 0.25);
  };

  const zoomOut = () => {
    state.zoomLevel = Math.max(0.5, state.zoomLevel - 0.25);
  };

  const centerMap = () => {
    state.panX = 0;
    state.panY = 0;
    state.zoomLevel = 1;
  };

  // Theme management
  const applyTheme = (themeId: string) => {
    const theme = availableThemes.value.find((t) => t.id === themeId);
    if (theme) {
      currentThemeId.value = themeId;
      console.log(`Applied theme: ${theme.name}`);
    }
  };

  // Validation
  const validateSVGStructure = () => {
    if (!parser.value) {
      return { isValid: false, issues: ['Parser not initialized'] };
    }

    const issues: string[] = [];

    if (lots.value.length === 0) {
      issues.push('No lots found in SVG');
    }

    const sectionsFound = [...new Set(lots.value.map((lot) => lot.section))];
    console.log(`Found sections: ${sectionsFound.join(', ')}`);

    return {
      isValid: issues.length === 0,
      issues,
      statistics: {
        totalLots: lots.value.length,
        sections: sectionsFound.length,
        sectionsFound,
      },
    };
  };

  // Utility methods
  const getRandomLot = () => {
    if (lots.value.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * lots.value.length);
    return lots.value[randomIndex];
  };

  const getLotsBySection = (section: string) => {
    return lots.value.filter((lot) => lot.section === section);
  };

  const searchLots = (query: string) => {
    searchQuery.value = query;
    return filteredLots.value;
  };

  return {
    // State
    state,
    currentTheme,
    lots,
    isLotsLoaded,
    selectedLot,
    showTooltip,
    tooltipPosition,
    tooltipContent,
    lotStatistics,
    availableThemes,
    searchQuery,
    filteredLots,

    // Methods
    initializeSVGParser,
    selectLot,
    selectMultipleLots,
    toggleLotSelection,
    clearAllSelections,
    hoverLot,
    clearHover,
    zoomIn,
    zoomOut,
    centerMap,
    showLotTooltip,
    hideTooltip,
    validateSVGStructure,
    applyTheme,
    getRandomLot,
    getLotsBySection,
    searchLots,

    // Debug methods
    debugFindLot: (searchTerm: string) =>
      parser.value ? parser.value.debugFindLot(searchTerm) : [],
  };
}
