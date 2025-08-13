import type { Directive, App } from 'vue';

interface RoadElement extends HTMLElement {
  _roadId?: string | undefined;
  _roadName?: string | undefined;
  _onMouseEnter?: ((event: MouseEvent) => void) | undefined;
  _onMouseLeave?: ((event: MouseEvent) => void) | undefined;
  _onClick?: ((event: MouseEvent) => void) | undefined;
}

interface TooltipElement extends HTMLElement {
  _mouseMoveHandler?: ((event: MouseEvent) => void) | null;
}

interface PanElement extends HTMLElement {
  _panHandlers?: {
    handleMouseDown: (event: MouseEvent) => void;
    handleMouseMove: (event: MouseEvent) => void;
    handleMouseUp: () => void;
    handleWheel: (event: WheelEvent) => void;
  };
}

interface RoadDirectiveBinding {
  value: {
    roadId: string;
    roadName: string;
    onHover?: (roadId: string, isHovering: boolean) => void;
    onClick?: (roadId: string) => void;
    showTooltip?: boolean;
    highlightOnHover?: boolean;
  };
}

// Tooltip utilities
let tooltipElement: TooltipElement | null = null;

const createTooltip = (): TooltipElement => {
  if (tooltipElement) return tooltipElement;

  tooltipElement = document.createElement('div') as TooltipElement;
  tooltipElement.className = 'road-tooltip';
  tooltipElement.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    z-index: 1000;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.2s ease;
  `;

  document.body.appendChild(tooltipElement);
  return tooltipElement;
};

const showTooltipElement = (text: string, event: MouseEvent) => {
  const tooltip = createTooltip();
  tooltip.textContent = text;
  tooltip.style.opacity = '1';
  tooltip.style.transform = 'translateY(0)';

  const updatePosition = (e: MouseEvent) => {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY - 30}px`;
  };

  updatePosition(event);

  // Follow mouse movement
  const mouseMoveHandler = (e: MouseEvent) => updatePosition(e);
  document.addEventListener('mousemove', mouseMoveHandler);

  // Store the handler for cleanup
  tooltip._mouseMoveHandler = mouseMoveHandler;
};

const hideTooltip = () => {
  if (tooltipElement) {
    tooltipElement.style.opacity = '0';
    tooltipElement.style.transform = 'translateY(8px)';

    // Remove mouse move handler
    if (tooltipElement._mouseMoveHandler) {
      document.removeEventListener('mousemove', tooltipElement._mouseMoveHandler);
      tooltipElement._mouseMoveHandler = null;
    }

    setTimeout(() => {
      if (tooltipElement && tooltipElement.style.opacity === '0') {
        tooltipElement.style.display = 'none';
      }
    }, 200);
  }
};

// Road interaction directive
export const vRoadInteraction: Directive<RoadElement, RoadDirectiveBinding['value']> = {
  mounted(el: RoadElement, binding) {
    const {
      roadId,
      roadName,
      onHover,
      onClick,
      showTooltip = true,
      highlightOnHover = true,
    } = binding.value;

    // Store road info
    el._roadId = roadId;
    el._roadName = roadName;

    // Mouse enter handler
    el._onMouseEnter = (event: MouseEvent) => {
      if (highlightOnHover) {
        el.style.filter = 'drop-shadow(0 0 4px rgba(255, 107, 53, 0.7))';
        el.style.cursor = 'pointer';
      }

      if (showTooltip && roadName) {
        showTooltipElement(roadName, event);
      }

      if (onHover) {
        onHover(roadId, true);
      }
    };

    // Mouse leave handler
    el._onMouseLeave = () => {
      if (highlightOnHover) {
        el.style.filter = '';
        el.style.cursor = '';
      }

      if (showTooltip) {
        hideTooltip();
      }

      if (onHover) {
        onHover(roadId, false);
      }
    };

    // Click handler
    el._onClick = () => {
      if (onClick) {
        onClick(roadId);
      }
    };

    // Add event listeners
    el.addEventListener('mouseenter', el._onMouseEnter);
    el.addEventListener('mouseleave', el._onMouseLeave);
    el.addEventListener('click', el._onClick);

    // Add road interaction class
    el.classList.add('road-interactive');
  },

  updated(el: RoadElement, binding) {
    // Update road info if changed
    el._roadId = binding.value.roadId;
    el._roadName = binding.value.roadName;
  },

  unmounted(el: RoadElement) {
    // Remove event listeners
    if (el._onMouseEnter) {
      el.removeEventListener('mouseenter', el._onMouseEnter);
    }
    if (el._onMouseLeave) {
      el.removeEventListener('mouseleave', el._onMouseLeave);
    }
    if (el._onClick) {
      el.removeEventListener('click', el._onClick);
    }

    // Clean up
    el.classList.remove('road-interactive');
    el._roadId = undefined;
    el._roadName = undefined;
    el._onMouseEnter = undefined;
    el._onMouseLeave = undefined;
    el._onClick = undefined;
  },
};

// Zoom and pan directive for the map container
export const vMapPan: Directive<PanElement> = {
  mounted(el: PanElement) {
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
        // Middle click or Ctrl+left click
        isPanning = true;
        startX = event.clientX - currentX;
        startY = event.clientY - currentY;
        el.style.cursor = 'grabbing';
        event.preventDefault();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPanning) return;

      currentX = event.clientX - startX;
      currentY = event.clientY - startY;

      el.style.transform = `translate(${currentX}px, ${currentY}px)`;
    };

    const handleMouseUp = () => {
      isPanning = false;
      el.style.cursor = '';
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();

        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        const currentScale = parseFloat(el.style.transform.match(/scale\(([^)]+)\)/)?.[1] || '1');
        const newScale = Math.max(0.5, Math.min(3, currentScale * delta));

        el.style.transformOrigin = `${x}px ${y}px`;
        el.style.transform = `scale(${newScale}) translate(${currentX}px, ${currentY}px)`;
      }
    };

    el.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('wheel', handleWheel, { passive: false });

    // Store handlers for cleanup
    el._panHandlers = {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleWheel,
    };
  },

  unmounted(el: PanElement) {
    const handlers = el._panHandlers;
    if (handlers) {
      el.removeEventListener('mousedown', handlers.handleMouseDown);
      document.removeEventListener('mousemove', handlers.handleMouseMove);
      document.removeEventListener('mouseup', handlers.handleMouseUp);
      el.removeEventListener('wheel', handlers.handleWheel);
    }
  },
};

// Export for global registration
export default {
  install(app: App) {
    app.directive('road-interaction', vRoadInteraction);
    app.directive('map-pan', vMapPan);
  },
};
