/**
 * Interactive Map Types
 * Consolidated from useInteractiveMap.ts and related files
 */

/**
 * Road element in the interactive map
 */
export interface Road {
  id: string;
  name: string;
  pathData: string;
  element?: SVGPathElement | undefined;
  group?: SVGGElement | undefined;
  // Additional properties for enhanced functionality
  category?: 'main' | 'court' | 'lane' | 'drive' | 'trail' | 'way' | 'run' | 'circle' | 'terrace';
  estimatedLength?: number;
  connectedRoads?: string[];
  // Backward compatibility properties
  color?: string;
  strokeWidth?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

/**
 * Map theme configuration
 */
export interface RoadTheme {
  id: string;
  name: string;
  strokeColor: string;
  strokeWidth: number;
  hoverColor: string;
  selectedColor: string;
}

/**
 * Legacy map theme interface for backward compatibility
 * @deprecated Use RoadTheme interface instead
 */
export interface LegacyMapTheme {
  name: string;
  defaultColor: string;
  highlightColor: string;
  selectedColor: string;
  defaultStrokeWidth: number;
  highlightStrokeWidth: number;
}

/**
 * Unified map theme type supporting both new and legacy formats
 */
export type MapTheme = RoadTheme & Partial<LegacyMapTheme>;

/**
 * Map interaction state
 */
export interface MapInteractionState {
  selectedRoadId: string | null;
  selectedRoadIds: string[]; // Support for multiple selections
  hoveredRoadId: string | null;
  zoomLevel: number;
  panX: number;
  panY: number;
}

/**
 * SVG road parser options
 */
export interface RoadParserOptions {
  ignoreGroups?: boolean;
  nameExtraction?: 'id' | 'data-name' | 'title';
}

/**
 * Parsed road data from SVG
 */
export interface ParsedRoad {
  id: string;
  name: string;
  pathData: string;
  element: SVGPathElement;
  group?: SVGGElement;
}

/**
 * Map statistics
 */
export interface MapStatistics {
  totalRoads: number;
  selectedRoads: number;
  roadsByCategory: Record<string, number>;
  averageRoadLength: number;
}

/**
 * Road search criteria
 */
export interface RoadSearchCriteria {
  query?: string;
  category?: Road['category'];
  selected?: boolean;
  highlighted?: boolean;
}

/**
 * Map viewport configuration
 */
export interface MapViewport {
  width: number;
  height: number;
  viewBox: string;
  centerX: number;
  centerY: number;
  scale: number;
}

/**
 * Road tooltip configuration
 */
export interface RoadTooltipConfig {
  enabled: boolean;
  showOnHover: boolean;
  position: 'mouse' | 'road-center' | 'fixed';
  content: string[];
}

/**
 * Map interaction preferences
 */
export interface MapInteractionPreferences {
  enableTooltips: boolean;
  autoHighlightOnHover: boolean;
  multiSelectEnabled: boolean;
  zoomOnDoubleClick: boolean;
  panOnDrag: boolean;
}
