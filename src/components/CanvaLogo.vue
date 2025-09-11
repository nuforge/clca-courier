<!--
  Canva Logo Component
  Brand-compliant Canva logo implementation following official guidelines
  @see https://www.canva.dev/docs/conn    <div
    :class="logoClasses"
    :role="clickable ? 'button' : 'img'"
    :tabindex="clickable && !disabled ? 0 : -1"
    :aria-disabled="clickable ? disabled : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >elines/brand/
-->
<script setup lang="ts">
import { computed } from 'vue';
import {
  getCanvaLogo,
  getRecommendedCanvaLogoType,
  CANVA_LOGO_PRESETS,
  CANVA_ALT_TEXTS,
  type CanvaLogoConfig,
  type CanvaLogoType
} from '../constants/canva-icons';

interface Props {
  /** Logo type - if not provided, will auto-select based on size */
  type?: CanvaLogoType;
  /** Target size in pixels for auto-selection and styling */
  size?: number | string;
  /** Preset configuration for common use cases */
  preset?: keyof typeof CANVA_LOGO_PRESETS;
  /** Custom alt text - falls back to brand-compliant defaults */
  alt?: string;
  /** Additional CSS classes */
  class?: string | undefined;
  /** Whether to add the minimum required 8px padding */
  padded?: boolean;
  /** Click handler for interactive logos */
  clickable?: boolean;
  /** Disabled state for interactive logos */
  disabled?: boolean;
}

interface Emits {
  (e: 'click', event: MouseEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  size: 32,
  padded: true,
  clickable: false,
  disabled: false,
});

const emit = defineEmits<Emits>();

// Convert size to number for calculations
const sizeNumber = computed(() => {
  return typeof props.size === 'string' ? parseInt(props.size, 10) : props.size;
});

// Determine logo configuration
const logoConfig = computed((): CanvaLogoConfig => {
  // Use preset if provided
  if (props.preset) {
    const preset = CANVA_LOGO_PRESETS[props.preset];
    return {
      ...preset,
      alt: props.alt || CANVA_ALT_TEXTS[preset.type],
    };
  }

  // Auto-select type based on size if not provided
  const logoType = props.type || getRecommendedCanvaLogoType(sizeNumber.value);

  return {
    type: logoType,
    format: 'svg', // Prefer SVG for web
    alt: props.alt || CANVA_ALT_TEXTS[logoType],
  };
});

// Get logo source URL
const logoSrc = computed(() => getCanvaLogo(logoConfig.value));

// Computed CSS classes
const logoClasses = computed(() => {
  const classes = ['canva-logo'];

  if (props.padded) {
    classes.push('canva-logo--padded');
  }

  if (props.clickable && !props.disabled) {
    classes.push('canva-logo--clickable');
  }

  if (props.disabled) {
    classes.push('canva-logo--disabled');
  }

  // Size-based classes
  if (sizeNumber.value < 32) {
    classes.push('canva-logo--xs');
  } else if (sizeNumber.value < 50) {
    classes.push('canva-logo--sm');
  } else if (sizeNumber.value < 80) {
    classes.push('canva-logo--md');
  } else {
    classes.push('canva-logo--lg');
  }

  if (props.class) {
    classes.push(props.class);
  }

  return classes.join(' ');
});

// Logo styles
const logoStyles = computed(() => ({
  width: `${sizeNumber.value}px`,
  height: 'auto', // Maintain aspect ratio
  maxWidth: '100%',
}));

// Handle click events
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && props.clickable) {
    emit('click', event);
  }
};

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.disabled && props.clickable && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    // Create a synthetic mouse event for consistency
    const mouseEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    emit('click', mouseEvent);
  }
};
</script>

<template>
  <div
    :class="logoClasses"
    :role="clickable ? 'button' : 'img'"
    :tabindex="clickable && !disabled ? 0 : -1"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <img
      :src="logoSrc"
      :alt="logoConfig.alt || ''"
      :style="logoStyles"
      class="canva-logo__image"
      loading="lazy"
      decoding="async"
    />

    <!-- Screen reader text for better accessibility -->
    <span class="sr-only">
      {{ logoConfig.alt }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.canva-logo {
  display: inline-block;

  // Brand guidelines: minimum 8px padding on all sides
  &--padded {
    padding: 8px;
  }

  // Interactive states
  &--clickable {
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.1s ease;
    border-radius: 4px;

    &:hover {
      opacity: 0.9;
      transform: scale(1.02);
    }

    &:active {
      transform: scale(0.98);
    }

    &:focus-visible {
      outline: 2px solid #00C4CC;
      outline-offset: 2px;
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      opacity: 0.5;
      transform: none;
    }
  }

  // Size variants for different contexts
  &--xs {
    // Extra small icons (< 32px)
    .canva-logo__image {
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }
  }

  &--sm {
    // Small icons (32-49px) - use icon logo per guidelines
    .canva-logo__image {
      filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12));
    }
  }

  &--md {
    // Medium icons (50-79px) - can use type logo per guidelines
    .canva-logo__image {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
    }
  }

  &--lg {
    // Large icons (80px+) - use type logo per guidelines
    .canva-logo__image {
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
    }
  }
}

.canva-logo__image {
  display: block;
  // Maintain aspect ratio and prevent distortion per guidelines
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

// Screen reader only text
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
