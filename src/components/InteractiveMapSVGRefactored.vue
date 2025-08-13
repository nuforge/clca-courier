<template>
  <div class="interactive-map-container">
    <!-- SVG Container with original MapSVG as template -->
    <div ref="mapContainer" class="map-svg-container">
      <!-- Original MapSVG component as template -->
      <MapSVG ref="mapSvgRef" class="original-map-template" :style="{
        display: isRoadsLoaded ? 'none' : 'block',
        opacity: isRoadsLoaded ? 0 : 1
      }" />

      <!-- Interactive overlay SVG -->
      <svg v-if="isRoadsLoaded" ref="interactiveSvgRef" class="interactive-map-svg" width="100%" height="100%"
        viewBox="0 0 2000 1800" xmlns="http://www.w3.org/2000/svg" :style="{
          transform: `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomLevel})`,
          transition: 'transform 0.3s ease'
        }" @wheel.prevent="handleWheel" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
        @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">
        <!-- Render roads dynamically from parsed data -->
        <g v-for="road in roads" :key="road.id" :id="road.id" :data-road-name="road.name" class="road-group"
          transform="matrix(1,0,0,1,-591.034,-160.657)" @click="selectRoad(road.id)"
          @mouseenter="handleRoadMouseEnter(road.id, $event)" @mouseleave="handleRoadMouseLeave(road.id)">
          <path :d="road.pathData" :stroke="getRoadStroke(road.id)" :stroke-width="getRoadStrokeWidth(road.id)"
            fill="none" class="road-path" :class="{
              'road-selected': state.selectedRoadId === road.id,
              'road-hovered': state.hoveredRoadId === road.id
            }" />
        </g>
      </svg>
    </div>

    <!-- Loading indicator -->
    <div v-if="!isRoadsLoaded" class="loading-overlay">
      <q-spinner-dots size="2em" color="primary" />
      <p>Loading interactive map...</p>
    </div>

    <!-- Road tooltip -->
    <Transition name="tooltip">
      <div v-if="showTooltip && tooltipContent" class="road-tooltip" :style="{
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px'
      }">
        {{ tooltipContent }}
      </div>
    </Transition>

    <!-- Zoom controls -->
    <div class="zoom-controls">
      <q-btn round color="primary" icon="add" size="sm" @click="zoomIn" :disable="state.zoomLevel >= 5" />
      <q-btn round color="primary" icon="remove" size="sm" @click="zoomOut" :disable="state.zoomLevel <= 0.5" />
      <q-btn round color="secondary" icon="center_focus_strong" size="sm" @click="centerMap" title="Center Map" />
    </div>

    <!-- Map info overlay -->
    <div v-if="selectedRoad" class="map-info-overlay">
      <q-card class="road-info-card">
        <q-card-section>
          <div class="text-h6">{{ selectedRoad.name }}</div>
          <div class="text-caption text-grey-6">ID: {{ selectedRoad.id }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" @click="selectRoad(null)">Close</q-btn>
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { useInteractiveMap } from '../composables/useInteractiveMap';
import MapSVG from './MapSVG.vue';

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
  initializeSVGParser,
  selectRoad,
  hoverRoad,
  clearHover,
  zoomIn,
  zoomOut,
  centerMap,
  showRoadTooltip,
  hideTooltip,
  validateSVGStructure
} = useInteractiveMap();

// Template refs
const mapContainer = ref<HTMLElement>();
const mapSvgRef = ref<InstanceType<typeof MapSVG>>();
const interactiveSvgRef = ref<SVGSVGElement>();

// Mouse interaction state
const isDragging = ref(false);
const lastMousePos = ref({ x: 0, y: 0 });

// Initialize the map when the original SVG is mounted
const onMapSVGMounted = async () => {
  await nextTick();

  if (mapSvgRef.value?.$el) {
    // The $el might be the SVG element itself, or we need to find it
    let svgElement: SVGSVGElement | null = null;

    if (mapSvgRef.value.$el instanceof SVGSVGElement) {
      // The $el is the SVG element itself
      svgElement = mapSvgRef.value.$el;
    } else {
      // Look for SVG element within $el
      svgElement = mapSvgRef.value.$el.querySelector('svg') as SVGSVGElement;
    }

    if (svgElement) {
      initializeSVGParser(svgElement);

      // Validate structure
      const validation = validateSVGStructure();
      if (!validation.isValid) {
        console.warn('SVG structure validation issues:', validation.issues);
      }
    } else {
      console.error('SVG element not found in MapSVG component');
    }
  } else {
    console.error('MapSVG ref not available or $el not found');
  }
};

// Initialize the map when component is mounted
onMounted(async () => {
  // Use nextTick to ensure the MapSVG component is fully rendered
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

// Road interaction handlers
const handleRoadMouseEnter = (roadId: string, event: MouseEvent) => {
  hoverRoad(roadId);
  showRoadTooltip(roadId, event.clientX + 10, event.clientY - 10);
};

const handleRoadMouseLeave = (roadId: string) => {
  if (state.hoveredRoadId === roadId) {
    clearHover();
    hideTooltip();
  }
};

// Style helpers
const getRoadStroke = (roadId: string): string => {
  if (state.selectedRoadId === roadId) {
    return currentTheme.value.selectedColor;
  }
  if (state.hoveredRoadId === roadId) {
    return currentTheme.value.hoverColor;
  }
  return currentTheme.value.strokeColor;
};

const getRoadStrokeWidth = (roadId: string): number => {
  if (state.selectedRoadId === roadId) {
    return currentTheme.value.strokeWidth + 2;
  }
  if (state.hoveredRoadId === roadId) {
    return currentTheme.value.strokeWidth + 1;
  }
  return currentTheme.value.strokeWidth;
};

// Expose methods for parent components
defineExpose({
  selectRoad,
  centerMap,
  zoomIn,
  zoomOut,
  roads,
  selectedRoad,
  state
});
</script>

<style scoped>
.interactive-map-container {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f9fa;
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
}

.interactive-map-svg:active {
  cursor: grabbing;
}

.road-group {
  cursor: pointer;
  transition: all 0.2s ease;
}

.road-path {
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.road-selected {
  filter: brightness(1.1) drop-shadow(0 0 3px rgba(40, 167, 69, 0.5));
}

.road-hovered {
  filter: brightness(1.2) drop-shadow(0 0 2px rgba(0, 123, 255, 0.5));
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
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
  max-width: 200px;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

.map-info-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 5;
  max-width: 300px;
}

.road-info-card {
  min-width: 200px;
}

/* Animation for smooth interactions */
@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.road-selected .road-path {
  animation: pulse 2s infinite;
}
</style>
