<!--
  Canva Icon Wrapper for Quasar Integration
  Allows Canva logos to be used seamlessly with q-icon components
-->
<script setup lang="ts">
import { computed } from 'vue';
import CanvaLogo from './CanvaLogo.vue';
import { type CanvaLogoType } from '../constants/canva-icons';

interface Props {
  /** Icon name - determines which Canva logo to show */
  name?: string;
  /** Size for the icon */
  size?: string | number;
  /** Color - not applicable to Canva logos per brand guidelines */
  color?: string;
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: 'canva-icon',
  size: '24px',
});

// Map icon names to Canva logo types
const logoTypeMap: Record<string, CanvaLogoType> = {
  'canva-icon': 'icon',
  'canva-type': 'type',
  'canva-circle': 'circle',
  'canva': 'icon', // Default fallback
};

// Get logo type from name
const logoType = computed((): CanvaLogoType => {
  return logoTypeMap[props.name || 'canva-icon'] || 'icon';
});

// Convert size to number for Canva component
const sizeNumber = computed(() => {
  if (typeof props.size === 'number') return props.size;
  if (typeof props.size === 'string') {
    // Remove units and convert to number
    const numericValue = parseInt(props.size.replace(/[^0-9]/g, ''), 10);
    return isNaN(numericValue) ? 24 : numericValue;
  }
  return 24;
});

// Determine appropriate preset based on size
const logoPreset = computed(() => {
  const size = sizeNumber.value;
  if (size <= 32) {
    return 'buttonIcon';
  } else if (size <= 64) {
    return 'navigationIcon';
  } else {
    return 'headerLogo';
  }
});
</script>

<template>
  <CanvaLogo
    :type="logoType"
    :size="sizeNumber"
    :preset="logoPreset"
    :class="props.class"
    :padded="false"
  />
</template>

<style lang="scss" scoped>
// Ensure consistent sizing with other Quasar icons
:deep(.canva-logo) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
