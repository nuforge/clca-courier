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

// Get the icon configuration using SAME LOGIC as working dialog
const iconConfig = computed(() => {
  // If contentType is provided, use it directly
  if (props.contentType) {
    if (props.contentType === 'classified') {
      return getCategoryIcon('classified', props.category);
    } else {
      return getContentIcon(props.category);
    }
  }

  // Auto-detect content type using SAME LOGIC as working dialog
  if (['for-sale', 'services', 'wanted', 'free', 'housing'].includes(props.category)) {
    return getCategoryIcon('classified', props.category);
  } else {
    // Let theme system handle content type mapping from category
    return getContentIcon(props.category);
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
