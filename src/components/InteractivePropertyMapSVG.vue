<template>
  <div :class="['interactive-property-map-container', backgroundClasses.card, borderClasses.light]">
    <div class="map-content">
      <!-- SVG Container with square map -->
      <div ref="mapContainer" class="map-svg-container">

        <!-- Interactive overlay SVG -->
        <svg v-if="isLotsLoaded" ref="interactiveSvgRef" class="interactive-property-map-svg" width="100%" height="100%"
          viewBox="0 0 2350 1900" xmlns="http://www.w3.org/2000/svg" :style="{
            transform: `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomLevel})`,
            transition: 'transform 0.3s ease'
          }" @wheel.prevent="handleWheel" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
          @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">

          <!-- Layer 1: Render unselected, non-hovered lots first (bottom layer) -->
          <g class="unselected-lots-layer">
            <g v-for="lot in unselectedLots" :key="`unselected-${lot.id}`" :id="lot.id" :data-lot-number="lot.number"
              class="lot-group">
              <!-- Invisible hit area for easier clicking -->
              <path :d="lot.pathData" stroke="transparent" stroke-width="5" :fill="getLotFill(lot.id)"
                fill-opacity="0.1" class="lot-hit-area" style="cursor: pointer; pointer-events: all;"
                @click.stop="handleLotClick(lot.id)" @mouseenter="handleLotMouseEnter(lot.id, $event)"
                @mouseleave="handleLotMouseLeave(lot.id)" />
              <!-- Visible lot path -->
              <path :d="lot.pathData" :stroke="getLotStroke(lot.id)" :stroke-width="getLotStrokeWidth(lot.id)"
                :fill="getLotFill(lot.id)" fill-opacity="0.3" class="lot-path" style="pointer-events: none;" />
            </g>
          </g>

          <!-- Layer 2: Render selected lots (middle layer) -->
          <g class="selected-lots-layer">
            <g v-for="lot in selectedLots" :key="`selected-${lot.id}`" :id="`selected-${lot.id}`"
              :data-lot-number="lot.number" class="lot-group">
              <!-- Invisible hit area for easier clicking -->
              <path :d="lot.pathData" stroke="transparent" stroke-width="5" :fill="getLotFill(lot.id)"
                fill-opacity="0.1" class="lot-hit-area" style="cursor: pointer; pointer-events: all;"
                @click.stop="handleLotClick(lot.id)" @mouseenter="handleLotMouseEnter(lot.id, $event)"
                @mouseleave="handleLotMouseLeave(lot.id)" />
              <!-- Visible lot path -->
              <path :d="lot.pathData" :stroke="getLotStroke(lot.id)" :stroke-width="getLotStrokeWidth(lot.id)"
                :fill="getLotFill(lot.id)" fill-opacity="0.6" class="lot-path lot-selected"
                style="pointer-events: none;" :class="{
                  'lot-hovered': state.hoveredLotId === lot.id
                }" />
            </g>
          </g>

          <!-- Layer 3: Render hovered unselected lot (top layer) -->
          <g v-if="hoveredUnselectedLot" class="hovered-lot-layer">
            <g :key="`hovered-${hoveredUnselectedLot.id}`" :id="`hovered-${hoveredUnselectedLot.id}`"
              :data-lot-number="hoveredUnselectedLot.number" class="lot-group">
              <!-- Invisible hit area for easier clicking -->
              <path :d="hoveredUnselectedLot.pathData" stroke="transparent" stroke-width="5"
                :fill="getLotFill(hoveredUnselectedLot.id)" fill-opacity="0.1" class="lot-hit-area"
                style="cursor: pointer; pointer-events: all;" @click.stop="handleLotClick(hoveredUnselectedLot.id)"
                @mouseenter="handleLotMouseEnter(hoveredUnselectedLot.id, $event)"
                @mouseleave="handleLotMouseLeave(hoveredUnselectedLot.id)" />
              <!-- Visible lot path -->
              <path :d="hoveredUnselectedLot.pathData" :stroke="getLotStroke(hoveredUnselectedLot.id)"
                :stroke-width="getLotStrokeWidth(hoveredUnselectedLot.id)" :fill="getLotFill(hoveredUnselectedLot.id)"
                fill-opacity="0.5" class="lot-path lot-hovered" style="pointer-events: none;" />
            </g>
          </g>
        </svg>
      </div>

      <!-- Loading indicator -->
      <div v-if="!isLotsLoaded" class="loading-overlay">
        <q-spinner-dots size="2em" color="primary" />
        <p>Loading interactive property map...</p>
        <p class="text-caption">Parsing {{ lotCount }} property lots...</p>
      </div>

      <!-- Lot tooltip -->
      <Transition name="tooltip">
        <div v-if="showTooltip && tooltipContent" :class="[
          'lot-tooltip',
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
import { useInteractivePropertyMap, type PropertyLot } from '../composables/useInteractivePropertyMap';
import { useTheme } from '../composables/useTheme';

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
  searchLots,
  debugFindLot
} = useInteractivePropertyMap();

// Template refs
const mapContainer = ref<HTMLElement>();
const interactiveSvgRef = ref<SVGSVGElement>();

// Mouse interaction state
const isDragging = ref(false);
const lastMousePos = ref({ x: 0, y: 0 });

// Computed properties
const lotCount = computed(() => lots.value.length);

// Separate lots into selected and unselected for proper layering
const selectedLots = computed(() =>
  lots.value.filter((lot: PropertyLot) => state.selectedLotIds.includes(lot.id))
);

const unselectedLots = computed(() =>
  lots.value.filter((lot: PropertyLot) => !state.selectedLotIds.includes(lot.id) && state.hoveredLotId !== lot.id)
);

const hoveredUnselectedLot = computed(() =>
  state.hoveredLotId && !state.selectedLotIds.includes(state.hoveredLotId)
    ? lots.value.find((lot: PropertyLot) => lot.id === state.hoveredLotId)
    : null
);

// Initialize the map when component is mounted
onMounted(async () => {
  await nextTick();
  await initializeSVGParser();

  // Validate structure
  const validation = validateSVGStructure();
  if (!validation.isValid) {
    console.warn('SVG structure validation issues:', validation.issues);
  }
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

// Handle tooltip click to select the currently hovered lot
const handleTooltipSelection = () => {
  if (state.hoveredLotId) {
    console.log('Tooltip clicked for lot:', state.hoveredLotId);
    handleLotClick(state.hoveredLotId);
    hideTooltip(); // Hide tooltip after selection
  }
};

// Lot interaction handlers
const handleLotClick = (lotId: string) => {
  console.log('Lot clicked:', lotId);
  toggleLotSelection(lotId);
};

const handleLotMouseEnter = (lotId: string, event: MouseEvent) => {
  console.log('Lot mouse enter:', lotId);
  hoverLot(lotId);
  showLotTooltip(lotId, event.clientX + 10, event.clientY - 10);
};

const handleLotMouseLeave = (lotId: string) => {
  console.log('Lot mouse leave:', lotId);
  if (state.hoveredLotId === lotId) {
    clearHover();
    hideTooltip();
  }
};

// Style helpers
const getLotStroke = (lotId: string): string => {
  const theme = currentTheme.value;
  if (!theme) return '#2c3e50'; // fallback color

  if (state.selectedLotIds.includes(lotId)) {
    return theme.selectedColor;
  }
  if (state.hoveredLotId === lotId) {
    return theme.hoverColor;
  }
  return theme.strokeColor;
};

const getLotStrokeWidth = (lotId: string): number => {
  const theme = currentTheme.value;
  if (!theme) return 2; // fallback width

  if (state.selectedLotIds.includes(lotId)) {
    return theme.strokeWidth + 1;
  }
  if (state.hoveredLotId === lotId) {
    return theme.strokeWidth + 0.5;
  }
  return theme.strokeWidth;
};

const getLotFill = (lotId: string): string => {
  const theme = currentTheme.value;
  if (!theme) return '#ecf0f1'; // fallback fill

  if (state.selectedLotIds.includes(lotId)) {
    return theme.selectedColor;
  }
  if (state.hoveredLotId === lotId) {
    return theme.hoverColor;
  }
  return theme.fillColor || theme.strokeColor;
};

// Expose methods for parent components
defineExpose({
  // Basic map controls
  selectLot,
  selectMultipleLots,
  toggleLotSelection,
  clearAllSelections,
  centerMap,
  zoomIn,
  zoomOut,

  // Hover controls
  hoverLot,
  clearHover,

  // Theme controls
  currentTheme,
  availableThemes,
  applyTheme,

  // Data access
  lots,
  selectedLot,
  state,
  lotStatistics,
  isLotsLoaded,

  // Search functionality
  searchQuery,
  filteredLots,
  searchLots,

  // Utility methods
  getRandomLot,
  debugFindLot
});
</script>

<style scoped>
.interactive-property-map-container {
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

.interactive-property-map-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: grab;
  transition: cursor 0.1s ease;
}

.interactive-property-map-svg:active {
  cursor: grabbing;
}

.lot-group {
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Hit area for easier lot selection */
.lot-hit-area {
  stroke: transparent !important;
  stroke-width: 2px !important;
  cursor: pointer !important;
  pointer-events: all !important;
  transition: all 0.2s ease;
}

/* Optional: Show subtle highlight on hover for better UX */
.lot-hit-area:hover {
  stroke: rgba(25, 118, 210, 0.2) !important;
  fill-opacity: 0.3 !important;
}

/* Dark mode hit area hover */
.body--dark .lot-hit-area:hover {
  stroke: rgba(144, 202, 249, 0.2) !important;
}

.unselected-lots-layer {
  z-index: 1;
}

.selected-lots-layer {
  z-index: 2;
}

.hovered-lot-layer {
  z-index: 3;
}

.lot-path {
  transition: all 0.2s ease;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.lot-selected {
  filter: brightness(1.1) drop-shadow(0 0 3px rgba(40, 167, 69, 0.5));
}

.lot-hovered {
  filter: brightness(1.2) drop-shadow(0 0 2px rgba(0, 123, 255, 0.5));
}

/* Enhanced visual feedback for lot groups on hover */
.lot-group:hover .lot-path {
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

.lot-tooltip {
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

.lot-tooltip:hover {
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

.lot-selected .lot-path {
  animation: pulse 3s infinite;
}

/* Dark mode specific adjustments */
.body--dark .lot-selected {
  filter: brightness(1.3) drop-shadow(0 0 4px rgba(100, 255, 150, 0.6));
}

.body--dark .lot-hovered {
  filter: brightness(1.4) drop-shadow(0 0 3px rgba(100, 200, 255, 0.6));
}

/* Enhanced dark mode hover feedback */
.body--dark .lot-group:hover .lot-path {
  filter: brightness(1.2) drop-shadow(0 0 2px rgba(144, 202, 249, 0.4));
}

/* Responsive design */
@media (max-width: 768px) {
  .interactive-property-map-container {
    flex-direction: column;
    height: auto;
  }

  .lots-sidebar {
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
