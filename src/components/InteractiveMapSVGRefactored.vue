<template>
  <div :class="['interactive-map-container', backgroundClasses.card, borderClasses.light]">
    <div class="map-content">
      <!-- SVG Container with static template -->
      <div ref="mapContainer" class="map-svg-container">
        <!-- Static SVG template for initial loading -->
        <svg class="original-map-template" width="100%" height="100%" :viewBox="MAP_VIEWBOX"
          xmlns="http://www.w3.org/2000/svg" :style="{
            display: isRoadsLoaded ? 'none' : 'block',
            opacity: isRoadsLoaded ? 0 : 1
          }">
          <g :transform="MAP_TRANSFORM">
            <g v-for="road in ROAD_DATA" :key="`template-${road.id}`" :id="road.id">
              <path :d="road.pathData" stroke="#323232" stroke-width="2" fill="none" />
            </g>
          </g>
        </svg>

        <!-- Interactive overlay SVG -->
        <svg v-if="isRoadsLoaded" ref="interactiveSvgRef" class="interactive-map-svg" width="100%" height="100%"
          :viewBox="MAP_VIEWBOX" xmlns="http://www.w3.org/2000/svg" :style="{
            transform: `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomLevel})`,
            transition: 'transform 0.3s ease'
          }" @wheel.prevent="handleWheel" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
          @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">

          <!-- Layer 1: Render unselected, non-hovered roads first (bottom layer) -->
          <g class="unselected-roads-layer" :transform="MAP_TRANSFORM">
            <g v-for="road in unselectedRoads" :key="`unselected-${road.id}`" :id="road.id" :data-road-name="road.name"
              class="road-group">
              <!-- Invisible hit area for easier clicking -->
              <path :d="road.pathData" stroke="transparent" stroke-width="30" fill="none" class="road-hit-area"
                style="cursor: pointer; pointer-events: stroke;" @click.stop="handleRoadClick(road.id)"
                @mouseenter="handleRoadMouseEnter(road.id, $event)" @mouseleave="handleRoadMouseLeave(road.id)" />
              <!-- Visible road path -->
              <path :d="road.pathData" :stroke="getRoadStroke(road.id)" :stroke-width="getRoadStrokeWidth(road.id)"
                fill="none" class="road-path" style="pointer-events: none;" />
            </g>
          </g>

          <!-- Layer 2: Render selected roads (middle layer) -->
          <g class="selected-roads-layer" transform="matrix(1,0,0,1,-591.034,-160.657)">
            <g v-for="road in selectedRoads" :key="`selected-${road.id}`" :id="`selected-${road.id}`"
              :data-road-name="road.name" class="road-group">
              <!-- Invisible hit area for easier clicking -->
              <path :d="road.pathData" stroke="transparent" stroke-width="30" fill="none" class="road-hit-area"
                style="cursor: pointer; pointer-events: stroke;" @click.stop="handleRoadClick(road.id)"
                @mouseenter="handleRoadMouseEnter(road.id, $event)" @mouseleave="handleRoadMouseLeave(road.id)" />
              <!-- Visible road path -->
              <path :d="road.pathData" :stroke="getRoadStroke(road.id)" :stroke-width="getRoadStrokeWidth(road.id)"
                fill="none" class="road-path road-selected" style="pointer-events: none;" :class="{
                  'road-hovered': state.hoveredRoadId === road.id
                }" />
            </g>
          </g>

          <!-- Layer 3: Render hovered unselected road (top layer) -->
          <g v-if="hoveredUnselectedRoad" class="hovered-road-layer" transform="matrix(1,0,0,1,-591.034,-160.657)">
            <g :key="`hovered-${hoveredUnselectedRoad.id}`" :id="`hovered-${hoveredUnselectedRoad.id}`"
              :data-road-name="hoveredUnselectedRoad.name" class="road-group">
              <!-- Invisible hit area for easier clicking -->
              <path :d="hoveredUnselectedRoad.pathData" stroke="transparent" stroke-width="30" fill="none"
                class="road-hit-area" style="cursor: pointer; pointer-events: stroke;"
                @click.stop="handleRoadClick(hoveredUnselectedRoad.id)"
                @mouseenter="handleRoadMouseEnter(hoveredUnselectedRoad.id, $event)"
                @mouseleave="handleRoadMouseLeave(hoveredUnselectedRoad.id)" />
              <!-- Visible road path -->
              <path :d="hoveredUnselectedRoad.pathData" :stroke="getRoadStroke(hoveredUnselectedRoad.id)"
                :stroke-width="getRoadStrokeWidth(hoveredUnselectedRoad.id)" fill="none" class="road-path road-hovered"
                style="pointer-events: none;" />
            </g>
          </g>
        </svg>
      </div>

      <!-- Loading indicator -->
      <div v-if="!isRoadsLoaded" class="loading-overlay">
        <q-spinner-dots size="2em" color="primary" />
        <p>Loading interactive map...</p>
        <p class="text-caption">Parsing {{ roadCount }} roads...</p>
      </div>

      <!-- Road tooltip -->
      <Transition name="tooltip">
        <div v-if="showTooltip && tooltipContent" :class="[
          'road-tooltip',
          'q-pa-sm',
          'text-weight-medium',
          'shadow-4',
          backgroundClasses.surface,
          textClasses.primary,
          borderClasses.light
        ]" :style="{
          left: tooltipPosition.x + 'px',
          top: tooltipPosition.y + 'px'
        }" @click="handleTooltipSelection">
          {{ tooltipContent }}
        </div>
      </Transition>

      <!-- Zoom controls -->
      <div class="zoom-controls">
        <q-btn round color="primary" icon="add" size="sm" @click="zoomIn" :disable="state.zoomLevel >= 5" />
        <q-btn round color="primary" icon="remove" size="sm" @click="zoomOut" :disable="state.zoomLevel <= 0.5" />
        <q-btn round color="secondary" icon="center_focus_strong" size="sm" @click="centerMap" title="Center Map" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue';
import { useInteractiveMap } from '../composables/useInteractiveMap';
import { useTheme } from '../composables/useTheme';
import { ROAD_DATA, MAP_VIEWBOX, MAP_TRANSFORM } from '../constants/mapSvgData';

// Theme management
const {
  backgroundClasses,
  borderClasses,
  textClasses
} = useTheme();

// Use the new composable
const {
  state,
  currentTheme,
  roads,
  isRoadsLoaded,
  selectedRoad,
  showTooltip,
  tooltipPosition,
  tooltipContent,
  roadStatistics,
  availableThemes,
  searchQuery,
  filteredRoads,
  initializeSVGParser,
  selectRoad,
  selectMultipleRoads,
  toggleRoadSelection,
  clearAllSelections,
  hoverRoad,
  clearHover,
  zoomIn,
  zoomOut,
  centerMap,
  showRoadTooltip,
  hideTooltip,
  validateSVGStructure,
  applyTheme,
  getRandomRoad
} = useInteractiveMap();

// Template refs
const mapContainer = ref<HTMLElement>();
const mapSvgRef = ref<SVGSVGElement>();
const interactiveSvgRef = ref<SVGSVGElement>();

// Mouse interaction state
const isDragging = ref(false);
const lastMousePos = ref({ x: 0, y: 0 });

// Computed properties
const roadCount = computed(() => roads.value.length);

// Separate roads into selected and unselected for proper layering
const selectedRoads = computed(() =>
  roads.value.filter(road => state.selectedRoadIds.includes(road.id))
);

const unselectedRoads = computed(() =>
  roads.value.filter(road => !state.selectedRoadIds.includes(road.id) && state.hoveredRoadId !== road.id)
);

const hoveredUnselectedRoad = computed(() =>
  state.hoveredRoadId && !state.selectedRoadIds.includes(state.hoveredRoadId)
    ? roads.value.find(road => road.id === state.hoveredRoadId)
    : null
);

// Initialize the map when the SVG is mounted
const onMapSVGMounted = async () => {
  await nextTick();

  if (mapSvgRef.value) {
    const svgElement = mapSvgRef.value;

    if (svgElement) {
      console.log('Found SVG element, initializing parser...');
      await initializeSVGParser(svgElement);

      // Validate structure
      const validation = validateSVGStructure();
      if (!validation.isValid) {
        console.warn('SVG structure validation issues:', validation.issues);
      }
    } else {
      console.error('SVG element not found');
    }
  } else {
    console.error('SVG ref not available');
  }
};

// Initialize the map when component is mounted
onMounted(async () => {
  // Use nextTick to ensure the SVG element is fully rendered
  await nextTick();
  await onMapSVGMounted();
});

// Mouse event handlers
const handleWheel = (event: WheelEvent) => {
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  const newZoom = Math.max(0.5, Math.min(5, state.zoomLevel + delta));
  state.zoomLevel = newZoom;
};

const handleMouseDown = (event: MouseEvent) => {
  isDragging.value = true;
  lastMousePos.value = { x: event.clientX, y: event.clientY };
};

const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    const deltaX = event.clientX - lastMousePos.value.x;
    const deltaY = event.clientY - lastMousePos.value.y;

    state.panX += deltaX;
    state.panY += deltaY;

    lastMousePos.value = { x: event.clientX, y: event.clientY };
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseLeave = () => {
  isDragging.value = false;
  clearHover();
  hideTooltip();
};

// Handle tooltip click to select the currently hovered road
const handleTooltipSelection = () => {
  if (state.hoveredRoadId) {
    console.log('Tooltip clicked for road:', state.hoveredRoadId);
    handleRoadClick(state.hoveredRoadId);
    hideTooltip(); // Hide tooltip after selection
  }
};

// Road interaction handlers
const handleRoadClick = (roadId: string) => {
  console.log('Road clicked:', roadId);
  toggleRoadSelection(roadId);
};

const handleRoadMouseEnter = (roadId: string, event: MouseEvent) => {
  console.log('Road mouse enter:', roadId);
  hoverRoad(roadId);
  showRoadTooltip(roadId, event.clientX + 10, event.clientY - 10);
};

const handleRoadMouseLeave = (roadId: string) => {
  console.log('Road mouse leave:', roadId);
  if (state.hoveredRoadId === roadId) {
    clearHover();
    hideTooltip();
  }
};

// Style helpers
const getRoadStroke = (roadId: string): string => {
  if (state.selectedRoadIds.includes(roadId)) {
    return currentTheme.value.selectedColor;
  }
  if (state.hoveredRoadId === roadId) {
    return currentTheme.value.hoverColor;
  }
  return currentTheme.value.strokeColor;
};

const getRoadStrokeWidth = (roadId: string): number => {
  if (state.selectedRoadIds.includes(roadId)) {
    return currentTheme.value.strokeWidth + 2;
  }
  if (state.hoveredRoadId === roadId) {
    return currentTheme.value.strokeWidth + 1;
  }
  return currentTheme.value.strokeWidth;
};

// Expose methods for parent components
defineExpose({
  // Basic map controls
  selectRoad,
  selectMultipleRoads,
  toggleRoadSelection,
  clearAllSelections,
  centerMap,
  zoomIn,
  zoomOut,

  // Hover controls
  hoverRoad,
  clearHover,

  // Theme controls
  currentTheme,
  availableThemes,
  applyTheme,

  // Data access
  roads,
  selectedRoad,
  state,
  roadStatistics,
  isRoadsLoaded,

  // Search functionality
  searchQuery,
  filteredRoads,

  // Utility methods
  getRandomRoad
});
</script>

<style scoped>
.interactive-map-container {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

.map-content {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-svg-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.original-map-template {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  transition: opacity 0.5s ease;
}

.interactive-map-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: grab;
  transition: cursor 0.1s ease;
}

.interactive-map-svg:active {
  cursor: grabbing;
}

.road-group {
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Hit area for easier road selection */
.road-hit-area {
  stroke: transparent !important;
  stroke-width: 30px !important;
  fill: none !important;
  cursor: pointer !important;
  pointer-events: stroke !important;
  transition: stroke 0.2s ease;
}

/* Optional: Show subtle highlight on hover for better UX */
.road-hit-area:hover {
  stroke: rgba(25, 118, 210, 0.08) !important;
}

/* Ensure hit areas work well at different zoom levels */
.interactive-map-svg[style*="scale("] .road-hit-area {
  /* Adjust hit area size based on zoom for optimal usability */
  stroke-width: 24px !important;
}

/* Dark mode hit area hover */
.body--dark .road-hit-area:hover {
  stroke: rgba(144, 202, 249, 0.08) !important;
}

.unselected-roads-layer {
  z-index: 1;
}

.selected-roads-layer {
  z-index: 2;
}

.hovered-road-layer {
  z-index: 3;
}

.road-path {
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
  /* Ensure visible roads don't interfere with hit detection */
}

.road-selected {
  filter: brightness(1.1) drop-shadow(0 0 3px rgba(40, 167, 69, 0.5));
}

.road-hovered {
  filter: brightness(1.2) drop-shadow(0 0 2px rgba(0, 123, 255, 0.5));
}

/* Enhanced visual feedback for road groups on hover */
.road-group:hover .road-path {
  filter: brightness(1.1) drop-shadow(0 0 2px rgba(25, 118, 210, 0.4));
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
  gap: 16px;
  transition: background-color 0.3s ease;
}

/* Dark mode loading overlay */
.body--dark .loading-overlay {
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;
}

.road-tooltip {
  position: fixed;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 1000;
  max-width: 200px;
  pointer-events: auto !important;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
}

.road-tooltip:hover {
  transform: scale(1.02);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

/* Animation for smooth interactions */
@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.02);
  }
}

.road-selected .road-path {
  animation: pulse 3s infinite;
}

/* Dark mode specific adjustments */
.body--dark .road-selected {
  filter: brightness(1.3) drop-shadow(0 0 4px rgba(100, 255, 150, 0.6));
}

.body--dark .road-hovered {
  filter: brightness(1.4) drop-shadow(0 0 3px rgba(100, 200, 255, 0.6));
}

/* Enhanced dark mode hover feedback */
.body--dark .road-group:hover .road-path {
  filter: brightness(1.2) drop-shadow(0 0 2px rgba(144, 202, 249, 0.4));
}

/* Responsive design */
@media (max-width: 768px) {
  .interactive-map-container {
    flex-direction: column;
    height: auto;
  }

  .roads-sidebar {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #e0e0e0;
  }

  .map-content {
    height: 400px;
  }

  .zoom-controls {
    bottom: 8px;
    right: 8px;
    gap: 4px;
  }
}
</style>
