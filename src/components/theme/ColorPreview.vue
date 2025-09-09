<!--
  Color Preview Component
  Shows a visual preview of colors from theme references or direct hex values
-->
<template>
  <div class="color-preview-container">
    <!-- Color circle/square preview -->
    <div
      :class="[
        'color-preview',
        `color-preview--${shape}`,
        `color-preview--${size}`,
        { 'color-preview--clickable': clickable }
      ]"
      :style="previewStyle"
      @click="handleClick"
    >
      <!-- Pattern overlay for transparency/unknown colors -->
      <div
        v-if="showPattern"
        class="color-preview__pattern"
      />

      <!-- Icon overlay for invalid colors -->
      <q-icon
        v-if="showIcon"
        :name="iconName"
        :size="iconSize"
        color="grey-5"
      />
    </div>

    <!-- Optional label -->
    <div
      v-if="showLabel && (label || colorValue)"
      :class="labelClasses"
    >
      {{ label || colorValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveColor } from '../../config/site-theme.config';

interface Props {
  colorValue: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square' | 'rounded';
  showLabel?: boolean;
  clickable?: boolean;
  labelPosition?: 'bottom' | 'right' | 'top' | 'left';
}

interface Emits {
  (e: 'click', color: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  shape: 'circle',
  showLabel: false,
  clickable: false,
  labelPosition: 'bottom',
});

const emit = defineEmits<Emits>();

// Computed properties
const resolvedColor = computed(() => {
  if (!props.colorValue) return '';

  // Try to resolve theme color references
  try {
    return resolveColor(props.colorValue);
  } catch {
    // If it's not a theme reference, check if it's a valid color
    if (isValidColor(props.colorValue)) {
      return props.colorValue;
    }
    return '';
  }
});

const isValidColorResolved = computed(() => {
  return !!resolvedColor.value && isValidColor(resolvedColor.value);
});

const showPattern = computed(() => {
  return !isValidColorResolved.value && props.colorValue;
});

const showIcon = computed(() => {
  return !props.colorValue || !isValidColorResolved.value;
});

const iconName = computed(() => {
  if (!props.colorValue) return 'mdi-help-circle-outline';
  if (!isValidColorResolved.value) return 'mdi-palette-outline';
  return 'mdi-check';
});

const iconSize = computed(() => {
  const sizeMap = {
    xs: 'xs',
    sm: 'xs',
    md: 'sm',
    lg: 'md',
    xl: 'lg'
  };
  return sizeMap[props.size];
});

const previewStyle = computed(() => {
  if (!isValidColorResolved.value) {
    return {
      backgroundColor: '#f5f5f5',
      border: '2px dashed #ccc'
    };
  }

  return {
    backgroundColor: resolvedColor.value,
    border: `2px solid ${getBorderColor(resolvedColor.value)}`
  };
});

const labelClasses = computed(() => {
  const baseClasses = ['color-preview__label'];

  baseClasses.push(`color-preview__label--${props.labelPosition}`);
  baseClasses.push(`color-preview__label--${props.size}`);

  return baseClasses;
});

// Methods
const isValidColor = (color: string): boolean => {
  if (!color) return false;

  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }

  // Check for RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  // Check for HSL/HSLA
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  // Check for named colors (basic check)
  const namedColors = [
    'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'black', 'white', 'gray', 'grey', 'transparent', 'currentColor'
  ];

  return namedColors.includes(color.toLowerCase());
};

const getBorderColor = (backgroundColor: string): string => {
  // Simple logic to determine border color based on background
  if (!backgroundColor) return '#ccc';

  // For very light colors, use a darker border
  if (backgroundColor === '#ffffff' || backgroundColor === '#fff') {
    return '#e0e0e0';
  }

  // For very dark colors, use a lighter border
  if (backgroundColor === '#000000' || backgroundColor === '#000') {
    return '#333333';
  }

  // Default to slightly darker version
  return 'rgba(0, 0, 0, 0.2)';
};

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.colorValue);
  }
};
</script>

<style scoped>
.color-preview-container {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.color-preview {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.2s ease;
}

/* Sizes */
.color-preview--xs {
  width: 16px;
  height: 16px;
}

.color-preview--sm {
  width: 24px;
  height: 24px;
}

.color-preview--md {
  width: 32px;
  height: 32px;
}

.color-preview--lg {
  width: 48px;
  height: 48px;
}

.color-preview--xl {
  width: 64px;
  height: 64px;
}

/* Shapes */
.color-preview--circle {
  border-radius: 50%;
}

.color-preview--square {
  border-radius: 0;
}

.color-preview--rounded {
  border-radius: 6px;
}

/* Clickable state */
.color-preview--clickable {
  cursor: pointer;
}

.color-preview--clickable:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Pattern for invalid/transparent colors */
.color-preview__pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  opacity: 0.3;
}

/* Labels */
.color-preview__label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.color-preview__label--xs {
  font-size: 10px;
  max-width: 80px;
}

.color-preview__label--sm {
  font-size: 11px;
  max-width: 100px;
}

.color-preview__label--md {
  font-size: 12px;
  max-width: 120px;
}

.color-preview__label--lg {
  font-size: 13px;
  max-width: 140px;
}

.color-preview__label--xl {
  font-size: 14px;
  max-width: 160px;
}

/* Label positions - bottom is default */
.color-preview__label--right {
  order: 1;
}

.color-preview__label--top {
  order: -1;
}

.color-preview__label--left {
  order: -1;
}

/* Container adjustments for label positions */
.color-preview-container:has(.color-preview__label--top),
.color-preview-container:has(.color-preview__label--bottom) {
  flex-direction: column;
  align-items: center;
}

.color-preview-container:has(.color-preview__label--left) {
  flex-direction: row-reverse;
}

/* Dark theme support */
.body--dark .color-preview__label {
  color: #ccc;
}

.body--dark .color-preview__pattern {
  background-image:
    linear-gradient(45deg, #555 25%, transparent 25%),
    linear-gradient(-45deg, #555 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #555 75%),
    linear-gradient(-45deg, transparent 75%, #555 75%);
}
</style>
