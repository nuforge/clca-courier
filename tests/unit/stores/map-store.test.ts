import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMapStore } from '../../../src/stores/map-store';
import type { Road, RoadTheme } from '../../../src/types/components/map.types';

// Mock external dependencies
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}));

// Mock geolocation for location-based features
const mockGeolocation = vi.hoisted(() => ({
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
}));

// Apply mocks
vi.mock('../../../src/utils/logger', () => ({
  logger: mockLogger
}));

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

describe('Map Store Integration', () => {
  let store: ReturnType<typeof useMapStore>;

  // Sample test data factories
  const createSampleRoad = (overrides: Partial<Road> = {}): Road => ({
    id: 'road-1',
    name: 'Main Street',
    pathData: 'M 10 10 L 100 100',
    category: 'main',
    estimatedLength: 500,
    connectedRoads: ['road-2'],
    color: '#333333',
    strokeWidth: 2,
    isSelected: false,
    isHighlighted: false,
    ...overrides
  });

  const createSampleRoadTheme = (overrides: Partial<RoadTheme> = {}): RoadTheme => ({
    id: 'theme-1',
    name: 'Default Theme',
    strokeColor: '#333333',
    strokeWidth: 2,
    hoverColor: '#ff6666',
    selectedColor: '#ff0000',
    ...overrides
  });

  beforeEach(() => {
    // Create fresh Pinia instance
    setActivePinia(createPinia());
    store = useMapStore();

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset store if reset method exists
    if (store.reset) {
      store.reset();
    }
  });

    describe('Store Initialization', () => {
    it('should initialize with default values', () => {
      const store = useMapStore();

      expect(store.selectedRoadId).toBeNull();
      expect(store.highlightedRoadId).toBeNull();
      expect(store.searchQuery).toBe('');
      expect(store.isInfoPanelOpen).toBe(false);
      expect(store.mapZoom).toBe(1);
      expect(store.mapCenter).toEqual({ x: 0, y: 0 });
      expect(store.selectionHistory).toEqual([]);
      expect(store.historyIndex).toBe(-1);
    });

    it('should initialize user preferences with defaults', () => {
      const store = useMapStore();

      expect(store.userPreferences).toEqual({
        autoHighlight: true,
        showLabels: true,
        showIntersections: true,
        animateTransitions: true,
      });
    });

    it('should initialize computed properties correctly', () => {
      const store = useMapStore();

      expect(store.hasSelection).toBe(false);
      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);
    });

    it('should provide all required store methods', () => {
      const store = useMapStore();

      expect(typeof store.setSelectedRoad).toBe('function');
      expect(typeof store.setHighlightedRoad).toBe('function');
      expect(typeof store.setSearchQuery).toBe('function');
      expect(typeof store.toggleInfoPanel).toBe('function');
      expect(typeof store.closeInfoPanel).toBe('function');
      expect(typeof store.clearSelection).toBe('function');
      expect(typeof store.undo).toBe('function');
      expect(typeof store.redo).toBe('function');
      expect(typeof store.setZoom).toBe('function');
      expect(typeof store.setMapCenter).toBe('function');
      expect(typeof store.updateUserPreference).toBe('function');
      expect(typeof store.reset).toBe('function');
    });
  });

  describe('Map Configuration Management', () => {
    it('should set and update map zoom level', () => {
      const store = useMapStore();

      store.setZoom(1.5);
      expect(store.mapZoom).toBe(1.5);

      store.setZoom(2.5);
      expect(store.mapZoom).toBe(2.5);
    });

    it('should constrain zoom level within valid range', () => {
      const store = useMapStore();

      // Test minimum constraint
      store.setZoom(0.1);
      expect(store.mapZoom).toBe(0.5);

      // Test maximum constraint
      store.setZoom(5.0);
      expect(store.mapZoom).toBe(3);

      // Test valid values
      store.setZoom(1.0);
      expect(store.mapZoom).toBe(1.0);

      store.setZoom(2.0);
      expect(store.mapZoom).toBe(2.0);
    });

    it('should set and update map center coordinates', () => {
      const store = useMapStore();

      const newCenter = { x: 100, y: 200 };
      store.setMapCenter(newCenter);
      expect(store.mapCenter).toEqual(newCenter);

      const anotherCenter = { x: -50, y: 75 };
      store.setMapCenter(anotherCenter);
      expect(store.mapCenter).toEqual(anotherCenter);
    });

    it('should update user preferences individually', () => {
      const store = useMapStore();

      store.updateUserPreference('autoHighlight', false);
      expect(store.userPreferences.autoHighlight).toBe(false);
      expect(store.userPreferences.showLabels).toBe(true); // Others unchanged

      store.updateUserPreference('showIntersections', false);
      expect(store.userPreferences.showIntersections).toBe(false);
      expect(store.userPreferences.animateTransitions).toBe(true); // Others unchanged
    });

    it('should maintain preference object integrity', () => {
      const store = useMapStore();
      const initialPrefs = { ...store.userPreferences };

      store.updateUserPreference('showLabels', false);

      expect(Object.keys(store.userPreferences)).toEqual(Object.keys(initialPrefs));
      expect(store.userPreferences.showLabels).toBe(false);
      expect(store.userPreferences.autoHighlight).toBe(initialPrefs.autoHighlight);
      expect(store.userPreferences.showIntersections).toBe(initialPrefs.showIntersections);
      expect(store.userPreferences.animateTransitions).toBe(initialPrefs.animateTransitions);
    });
  });

    describe('Marker Management', () => {
    it('should set selected road and update history', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      expect(store.selectedRoadId).toBe('road-1');
      expect(store.selectionHistory).toEqual(['road-1']);
      expect(store.historyIndex).toBe(0);
      expect(store.hasSelection).toBe(true);
      expect(store.isInfoPanelOpen).toBe(true);
    });

    it('should handle multiple road selections with history', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-2');
      store.setSelectedRoad('road-3');

      expect(store.selectedRoadId).toBe('road-3');
      expect(store.selectionHistory).toEqual(['road-1', 'road-2', 'road-3']);
      expect(store.historyIndex).toBe(2);
    });

    it('should not add duplicate selections to history', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-1'); // Same road

      expect(store.selectedRoadId).toBe('road-1');
      expect(store.selectionHistory).toEqual(['road-1']);
      expect(store.historyIndex).toBe(0);
    });

    it('should set and clear highlighted road', () => {
      const store = useMapStore();

      store.setHighlightedRoad('road-highlight');
      expect(store.highlightedRoadId).toBe('road-highlight');

      store.setHighlightedRoad(null);
      expect(store.highlightedRoadId).toBeNull();
    });

    it('should clear all selections and states', () => {
      const store = useMapStore();

      // Set up some state
      store.setSelectedRoad('road-1');
      store.setHighlightedRoad('road-2');

      store.clearSelection();

      expect(store.selectedRoadId).toBeNull();
      expect(store.highlightedRoadId).toBeNull();
      expect(store.isInfoPanelOpen).toBe(false);
      expect(store.hasSelection).toBe(false);
    });

    it('should handle null road selection properly', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      store.setSelectedRoad(null);

      expect(store.selectedRoadId).toBeNull();
      expect(store.hasSelection).toBe(false);
      // History should not be affected by null selections
      expect(store.selectionHistory).toEqual(['road-1']);
    });
  });

    describe('Layer Management', () => {
    it('should manage search query state', () => {
      const store = useMapStore();

      store.setSearchQuery('main street');
      expect(store.searchQuery).toBe('main street');

      store.setSearchQuery('');
      expect(store.searchQuery).toBe('');
    });

    it('should handle info panel state management', () => {
      const store = useMapStore();

      expect(store.isInfoPanelOpen).toBe(false);

      store.toggleInfoPanel();
      expect(store.isInfoPanelOpen).toBe(true);

      store.toggleInfoPanel();
      expect(store.isInfoPanelOpen).toBe(false);
    });

    it('should close info panel independently', () => {
      const store = useMapStore();

      store.toggleInfoPanel(); // Open
      expect(store.isInfoPanelOpen).toBe(true);

      store.closeInfoPanel();
      expect(store.isInfoPanelOpen).toBe(false);

      store.closeInfoPanel(); // Should handle already closed
      expect(store.isInfoPanelOpen).toBe(false);
    });

    it('should open info panel when road is selected', () => {
      const store = useMapStore();

      expect(store.isInfoPanelOpen).toBe(false);

      store.setSelectedRoad('road-1');
      expect(store.isInfoPanelOpen).toBe(true);
    });

    it('should maintain panel state independence from selection', () => {
      const store = useMapStore();

      store.toggleInfoPanel(); // Manually open
      expect(store.isInfoPanelOpen).toBe(true);

      store.setSelectedRoad('road-1'); // This also opens, but should remain open
      expect(store.isInfoPanelOpen).toBe(true);

      store.clearSelection(); // This closes
      expect(store.isInfoPanelOpen).toBe(false);
    });

    it('should handle complex layer interaction scenarios', () => {
      const store = useMapStore();

      // Set up complex state
      store.setSearchQuery('test query');
      store.setSelectedRoad('road-1');
      store.setHighlightedRoad('road-2');

      expect(store.searchQuery).toBe('test query');
      expect(store.selectedRoadId).toBe('road-1');
      expect(store.highlightedRoadId).toBe('road-2');
      expect(store.isInfoPanelOpen).toBe(true);

      // Clear should reset selections but not search
      store.clearSelection();
      expect(store.searchQuery).toBe('test query'); // Preserved
      expect(store.selectedRoadId).toBeNull();
      expect(store.highlightedRoadId).toBeNull();
      expect(store.isInfoPanelOpen).toBe(false);
    });
  });

  describe('User Location Handling', () => {
    it('should handle undo operations correctly', () => {
      const store = useMapStore();

      expect(store.canUndo).toBe(false);

      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-2');
      store.setSelectedRoad('road-3');

      expect(store.canUndo).toBe(true);
      expect(store.selectedRoadId).toBe('road-3');

      store.undo();
      expect(store.selectedRoadId).toBe('road-2');
      expect(store.historyIndex).toBe(1);

      store.undo();
      expect(store.selectedRoadId).toBe('road-1');
      expect(store.historyIndex).toBe(0);
    });

    it('should handle redo operations correctly', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-2');
      store.undo();

      expect(store.canRedo).toBe(true);
      expect(store.selectedRoadId).toBe('road-1');

      store.redo();
      expect(store.selectedRoadId).toBe('road-2');
      expect(store.canRedo).toBe(false);
    });

    it('should prevent undo when at beginning of history', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      expect(store.canUndo).toBe(false); // Only one item, can't undo

      store.undo(); // Should not change state since canUndo is false
      expect(store.selectedRoadId).toBe('road-1'); // Should remain unchanged
      expect(store.canUndo).toBe(false);
    });    it('should prevent redo when at end of history', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      expect(store.canRedo).toBe(false);

      // Redo should not change state
      const beforeRedo = store.selectedRoadId;
      store.redo();
      expect(store.selectedRoadId).toBe(beforeRedo);
    });

    it('should truncate history on new selection after undo', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-2');
      store.setSelectedRoad('road-3');
      store.undo(); // Back to road-2
      store.undo(); // Back to road-1

      // New selection should truncate history
      store.setSelectedRoad('road-4');

      expect(store.selectionHistory).toEqual(['road-1', 'road-4']);
      expect(store.historyIndex).toBe(1);
      expect(store.canRedo).toBe(false);
    });

    it('should handle complex undo/redo scenarios', () => {
      const store = useMapStore();

      // Build history
      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-2');
      store.setSelectedRoad('road-3');

      // Navigate backwards
      store.undo(); // road-2
      store.undo(); // road-1

      // Navigate forwards
      store.redo(); // road-2

      expect(store.selectedRoadId).toBe('road-2');
      expect(store.canUndo).toBe(true);
      expect(store.canRedo).toBe(true);
    });
  });

  describe('Map Interaction Handling', () => {
    it('should handle rapid selection changes efficiently', () => {
      const store = useMapStore();

      // Rapid selections
      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-2');
      store.setSelectedRoad('road-3');
      store.setSelectedRoad('road-4');
      store.setSelectedRoad('road-5');

      expect(store.selectedRoadId).toBe('road-5');
      expect(store.selectionHistory).toEqual(['road-1', 'road-2', 'road-3', 'road-4', 'road-5']);
      expect(store.historyIndex).toBe(4);
    });

    it('should handle simultaneous selection and highlighting', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-selected');
      store.setHighlightedRoad('road-highlighted');

      expect(store.selectedRoadId).toBe('road-selected');
      expect(store.highlightedRoadId).toBe('road-highlighted');
      expect(store.hasSelection).toBe(true);
    });

    it('should handle zoom boundaries properly', () => {
      const store = useMapStore();

      // Test extreme values
      store.setZoom(-10);
      expect(store.mapZoom).toBe(0.5);

      store.setZoom(100);
      expect(store.mapZoom).toBe(3);

      // Test boundary values
      store.setZoom(0.5);
      expect(store.mapZoom).toBe(0.5);

      store.setZoom(3);
      expect(store.mapZoom).toBe(3);
    });

    it('should handle coordinate updates efficiently', () => {
      const store = useMapStore();

      const coordinates = [
        { x: 0, y: 0 },
        { x: 100, y: 200 },
        { x: -50, y: -75 },
        { x: 999.99, y: 888.88 }
      ];

      coordinates.forEach(coord => {
        store.setMapCenter(coord);
        expect(store.mapCenter).toEqual(coord);
      });
    });

    it('should maintain state consistency during interactions', () => {
      const store = useMapStore();

      // Complex interaction sequence
      store.setSearchQuery('test search');
      store.setSelectedRoad('road-1');
      store.setHighlightedRoad('road-2');
      store.setZoom(2.5);
      store.setMapCenter({ x: 100, y: 200 });
      store.updateUserPreference('autoHighlight', false);

      // Verify all states maintained
      expect(store.searchQuery).toBe('test search');
      expect(store.selectedRoadId).toBe('road-1');
      expect(store.highlightedRoadId).toBe('road-2');
      expect(store.mapZoom).toBe(2.5);
      expect(store.mapCenter).toEqual({ x: 100, y: 200 });
      expect(store.userPreferences.autoHighlight).toBe(false);
      expect(store.isInfoPanelOpen).toBe(true);
      expect(store.hasSelection).toBe(true);
    });
  });

  describe('Search and Filtering', () => {
    it('should handle search query updates', () => {
      const store = useMapStore();

      const queries = ['main st', 'highway 101', 'intersection alpha', ''];

      queries.forEach(query => {
        store.setSearchQuery(query);
        expect(store.searchQuery).toBe(query);
      });
    });

    it('should handle special characters in search queries', () => {
      const store = useMapStore();

      const specialQueries = [
        'Route 66 & Main St.',
        'N/A - Unknown Road',
        '123 Main St. (Apt #456)',
        'Road with "quotes" and spaces'
      ];

      specialQueries.forEach(query => {
        store.setSearchQuery(query);
        expect(store.searchQuery).toBe(query);
      });
    });

    it('should handle empty and whitespace search queries', () => {
      const store = useMapStore();

      store.setSearchQuery('   ');
      expect(store.searchQuery).toBe('   ');

      store.setSearchQuery('');
      expect(store.searchQuery).toBe('');

      store.setSearchQuery('\t\n');
      expect(store.searchQuery).toBe('\t\n');
    });

    it('should maintain search query independence from selections', () => {
      const store = useMapStore();

      store.setSearchQuery('persistent query');
      store.setSelectedRoad('road-1');
      store.setHighlightedRoad('road-2');
      store.clearSelection();

      expect(store.searchQuery).toBe('persistent query');
    });

    it('should handle search state during reset operations', () => {
      const store = useMapStore();

      store.setSearchQuery('test query');
      store.setSelectedRoad('road-1');

      store.reset();

      expect(store.searchQuery).toBe('');
      expect(store.selectedRoadId).toBeNull();
    });
  });

  describe('Map Bounds and Viewport', () => {
    it('should handle map center coordinates properly', () => {
      const store = useMapStore();

      const testCoordinates = [
        { x: 0, y: 0 },
        { x: 100.5, y: 200.7 },
        { x: -150, y: -300 },
        { x: 999999, y: 888888 }
      ];

      testCoordinates.forEach(coord => {
        store.setMapCenter(coord);
        expect(store.mapCenter.x).toBe(coord.x);
        expect(store.mapCenter.y).toBe(coord.y);
      });
    });

    it('should handle decimal precision in coordinates', () => {
      const store = useMapStore();

      const preciseCoord = { x: 123.456789, y: 987.654321 };
      store.setMapCenter(preciseCoord);

      expect(store.mapCenter.x).toBe(123.456789);
      expect(store.mapCenter.y).toBe(987.654321);
    });

    it('should handle coordinate updates during zoom changes', () => {
      const store = useMapStore();

      store.setMapCenter({ x: 100, y: 200 });
      store.setZoom(2.0);

      expect(store.mapCenter).toEqual({ x: 100, y: 200 });
      expect(store.mapZoom).toBe(2.0);

      store.setZoom(1.5);
      expect(store.mapCenter).toEqual({ x: 100, y: 200 }); // Should remain unchanged
    });

    it('should handle viewport state consistency', () => {
      const store = useMapStore();

      // Set up viewport state
      store.setMapCenter({ x: 300, y: 400 });
      store.setZoom(1.8);
      store.setSelectedRoad('road-1');

      // Viewport should remain consistent during other operations
      store.setHighlightedRoad('road-2');
      store.setSearchQuery('test');
      store.updateUserPreference('showLabels', false);

      expect(store.mapCenter).toEqual({ x: 300, y: 400 });
      expect(store.mapZoom).toBe(1.8);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid zoom values gracefully', () => {
      const store = useMapStore();

      // The actual implementation uses Math.max/min which handles NaN by passing it through
      store.setZoom(NaN);
      expect(store.mapZoom).toBeNaN(); // NaN passes through Math.max/min

      store.setZoom(Infinity);
      expect(store.mapZoom).toBe(3); // Should clamp to maximum

      store.setZoom(-Infinity);
      expect(store.mapZoom).toBe(0.5); // Should clamp to minimum
    });    it('should handle invalid coordinate values gracefully', () => {
      const store = useMapStore();

      // Test invalid coordinates
      store.setMapCenter({ x: NaN, y: 100 });
      expect(store.mapCenter.x).toBeNaN();
      expect(store.mapCenter.y).toBe(100);

      store.setMapCenter({ x: Infinity, y: -Infinity });
      expect(store.mapCenter.x).toBe(Infinity);
      expect(store.mapCenter.y).toBe(-Infinity);
    });

    it('should handle null and undefined road IDs', () => {
      const store = useMapStore();

      store.setSelectedRoad('road-1');
      expect(store.selectedRoadId).toBe('road-1');

      store.setSelectedRoad(null);
      expect(store.selectedRoadId).toBeNull();

      store.setHighlightedRoad(null);
      expect(store.highlightedRoadId).toBeNull();
    });

    it('should recover from corrupted state gracefully', () => {
      const store = useMapStore();

      // Simulate corrupted state and recovery
      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-2');

      // Reset should clean up everything
      store.reset();

      expect(store.selectedRoadId).toBeNull();
      expect(store.highlightedRoadId).toBeNull();
      expect(store.searchQuery).toBe('');
      expect(store.isInfoPanelOpen).toBe(false);
      expect(store.mapZoom).toBe(1);
      expect(store.mapCenter).toEqual({ x: 0, y: 0 });
      expect(store.selectionHistory).toEqual([]);
      expect(store.historyIndex).toBe(-1);
    });

    it('should handle edge cases in history navigation', () => {
      const store = useMapStore();

      // Try operations on empty history
      store.undo();
      expect(store.selectedRoadId).toBeNull();

      store.redo();
      expect(store.selectedRoadId).toBeNull();

      // Build minimal history and test boundaries
      store.setSelectedRoad('road-1');
      expect(store.canUndo).toBe(false); // Single item, can't undo

      store.undo(); // Should not change anything since canUndo is false
      expect(store.selectedRoadId).toBe('road-1'); // Should remain unchanged

      store.undo(); // Should not crash, no effect
      expect(store.selectedRoadId).toBe('road-1'); // Should remain unchanged

      // Add second item to enable undo
      store.setSelectedRoad('road-2');
      expect(store.canUndo).toBe(true);

      store.undo(); // Now should work
      expect(store.selectedRoadId).toBe('road-1');

      store.redo(); // Should work
      expect(store.selectedRoadId).toBe('road-2');

      store.redo(); // Should not crash, no effect since at end
      expect(store.selectedRoadId).toBe('road-2');
    });
  });

  describe('Computed Properties', () => {
    it('should compute hasSelection correctly', () => {
      const store = useMapStore();

      expect(store.hasSelection).toBe(false);

      store.setSelectedRoad('road-1');
      expect(store.hasSelection).toBe(true);

      store.setSelectedRoad(null);
      expect(store.hasSelection).toBe(false);

      store.setSelectedRoad('road-2');
      expect(store.hasSelection).toBe(true);

      store.clearSelection();
      expect(store.hasSelection).toBe(false);
    });

    it('should compute canUndo correctly', () => {
      const store = useMapStore();

      expect(store.canUndo).toBe(false);

      store.setSelectedRoad('road-1');
      expect(store.canUndo).toBe(false); // Only one item, at current position

      store.setSelectedRoad('road-2');
      expect(store.canUndo).toBe(true); // Can go back to previous

      store.undo();
      expect(store.canUndo).toBe(false); // Back at beginning
    });

    it('should compute canRedo correctly', () => {
      const store = useMapStore();

      expect(store.canRedo).toBe(false);

      store.setSelectedRoad('road-1');
      store.setSelectedRoad('road-2');
      expect(store.canRedo).toBe(false); // At current position

      store.undo();
      expect(store.canRedo).toBe(true); // Can go forward

      store.redo();
      expect(store.canRedo).toBe(false); // Back at end
    });

    it('should maintain computed property reactivity', () => {
      const store = useMapStore();

      // Test reactive updates
      const initialHasSelection = store.hasSelection;
      const initialCanUndo = store.canUndo;
      const initialCanRedo = store.canRedo;

      expect(initialHasSelection).toBe(false);
      expect(initialCanUndo).toBe(false);
      expect(initialCanRedo).toBe(false);

      store.setSelectedRoad('road-1');

      expect(store.hasSelection).not.toBe(initialHasSelection);
      expect(store.hasSelection).toBe(true);

      store.setSelectedRoad('road-2');

      expect(store.canUndo).not.toBe(initialCanUndo);
      expect(store.canUndo).toBe(true);
    });
  });

  describe('Performance Optimizations', () => {
    it('should handle rapid zoom updates efficiently', () => {
      const store = useMapStore();

      // Rapid zoom changes
      const zoomLevels = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0];

      zoomLevels.forEach(zoom => {
        store.setZoom(zoom);
        expect(store.mapZoom).toBe(zoom);
      });

      expect(store.mapZoom).toBe(2.0);
    });

    it('should handle rapid coordinate updates efficiently', () => {
      const store = useMapStore();

      // Rapid coordinate changes
      for (let i = 0; i < 100; i++) {
        store.setMapCenter({ x: i, y: i * 2 });
      }

      expect(store.mapCenter).toEqual({ x: 99, y: 198 });
    });

    it('should handle large selection history efficiently', () => {
      const store = useMapStore();

      // Build large history
      for (let i = 0; i < 1000; i++) {
        store.setSelectedRoad(`road-${i}`);
      }

      expect(store.selectionHistory).toHaveLength(1000);
      expect(store.selectedRoadId).toBe('road-999');
      expect(store.historyIndex).toBe(999);

      // Test navigation through large history
      store.undo();
      expect(store.selectedRoadId).toBe('road-998');

      store.redo();
      expect(store.selectedRoadId).toBe('road-999');
    });

    it('should handle preference updates efficiently', () => {
      const store = useMapStore();

      const preferences: Array<keyof typeof store.userPreferences> = [
        'autoHighlight', 'showLabels', 'showIntersections', 'animateTransitions'
      ];

      // Rapid preference updates
      for (let i = 0; i < 100; i++) {
        const prefIndex = i % preferences.length;
        const pref = preferences[prefIndex]!; // Non-null assertion since we know it exists
        store.updateUserPreference(pref, i % 2 === 0);
      }

      // Should still work correctly
      expect(typeof store.userPreferences.autoHighlight).toBe('boolean');
      expect(typeof store.userPreferences.showLabels).toBe('boolean');
      expect(typeof store.userPreferences.showIntersections).toBe('boolean');
      expect(typeof store.userPreferences.animateTransitions).toBe('boolean');
    });
  });
});
