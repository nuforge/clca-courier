<script setup lang="ts">
import { computed } from 'vue';
import { useSiteTheme } from '../composables/useSiteTheme';

interface Props {
  category: string;
  contentType?: 'article' | 'event' | 'announcement' | 'classified';
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

const { getContentIcon, getCategoryIcon } = useSiteTheme();

// Helper function for formatting category names
const formatCategoryName = (category: string): string => {
  return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/-/g, ' ');
};

// Get the icon configuration for this category
const iconConfig = computed(() => {
  // If contentType is provided, try to get category-specific icon first
  if (props.contentType) {
    const categoryIcon = getCategoryIcon(props.contentType, props.category);
    if (categoryIcon.icon) {
      return categoryIcon;
    }
    // Fallback to content type icon
    return getContentIcon(props.contentType);
  }

  // Legacy fallback - try to map category to content type
  if (props.category === 'announcement') {
    return getContentIcon('announcement');
  } else if (props.category === 'event') {
    return getContentIcon('event');
  } else if (['forSale', 'wanted', 'service', 'general'].includes(props.category)) {
    const categoryIcon = getCategoryIcon('classified', props.category);
    return categoryIcon.icon ? categoryIcon : getContentIcon('classified');
  } else {
    return getContentIcon('article'); // Default fallback
  }
});

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
