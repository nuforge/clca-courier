<script setup lang="ts">
import { computed } from 'vue';
import { getContentIcon, formatCategoryName } from '../utils/content-icons';

interface Props {
  category: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showIcon?: boolean;
  iconOnly?: boolean;
  labelOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showLabel: true,
  showIcon: true,
  iconOnly: false,
  labelOnly: false
});

// Get the icon configuration for this category
const iconConfig = computed(() => getContentIcon(props.category));

// Formatted display name
const displayName = computed(() => formatCategoryName(props.category));

// Determine what to show based on props
const showIconElement = computed(() => (props.showIcon || props.iconOnly) && !props.labelOnly);
const showLabelElement = computed(() => (props.showLabel || props.labelOnly) && !props.iconOnly);
</script>

<template>
  <span class="category-display">
    <q-icon
      v-if="showIconElement"
      :name="iconConfig.icon"
      :size="size"
      :color="iconConfig.color"
      :class="{ 'q-mr-xs': showLabelElement }"
    />
    <span
      v-if="showLabelElement"
      :class="`text-${iconConfig.color}`"
    >
      {{ displayName }}
    </span>
  </span>
</template>

<style scoped>
.category-display {
  display: inline-flex;
  align-items: center;
}
</style>
