<!--
  TagDisplay Component
  Generic, flexible component for displaying tags
  Supports both string tags and TagConfig objects
  No special cases - completely configurable
-->
<template>
  <div v-if="tags && tags.length > 0" class="tag-display">
    <template v-for="tag in displayTags" :key="typeof tag === 'string' ? tag : tag.text">
      <q-chip
        :flat="variant === 'flat'"
        :outline="variant === 'outline' || bordered"
        :square="square"
        :dense="dense"
        :size="size"
        :color="variant === 'flat' ? 'transparent' : normalizeTag(tag).color"
        class="q-ma-xs"
      >
        <q-icon
          v-if="normalizeTag(tag).icon"
          :name="normalizeTag(tag).icon"
          :size="size === 'xs' ? 'xs' : 'sm'"
          :color="variant === 'flat' ? normalizeTag(tag).color : undefined"
          class="q-mr-xs"
        />
        {{ normalizeTag(tag).text }}
      </q-chip>
    </template>

    <!-- Show more button if there are hidden tags -->
    <q-btn
      v-if="showMoreButton"
      flat
      dense
      size="sm"
      color="secondary"
      :label="`+${tags.length - (maxDisplay || 3)}`"
      @click="showAll = true"
    />
  </div>

  <span v-else class="text-grey-5">No tags</span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface TagConfig {
  text: string;
  icon?: string;
  color?: string;
}

interface Props {
  tags: string[] | TagConfig[];
  maxDisplay?: number;
  showMore?: boolean;
  variant?: 'flat' | 'default' | 'outline';
  bordered?: boolean;
  square?: boolean;
  dense?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: 3,
  showMore: false,
  variant: 'flat',
  bordered: false,
  square: false,
  dense: false,
  size: 'sm'
});

// Internal state for showing all tags
const showAll = ref(false);

// Computed properties
const displayTags = computed(() => {
  if (showAll.value || !props.showMore) {
    return props.tags;
  }
  return props.tags.slice(0, props.maxDisplay);
});

// Helper to normalize tags to TagConfig format
const normalizeTag = (tag: string | TagConfig): TagConfig => {
  if (typeof tag === 'string') {
    // Handle namespace:value format
    if (tag.includes(':')) {
      const [, value] = tag.split(':');
      const tagValue = value || tag;
      return {
        text: tagValue,
        icon: getContentTypeIcon(tagValue),
        color: getContentTypeColor(tagValue)
      };
    }
    // Handle simple tags - no special cases, just use the tag as-is
    return {
      text: tag,
      color: getTagColor(tag)
    };
  }
  return tag;
};

const showMoreButton = computed(() => {
  return props.showMore && !showAll.value && props.tags.length > props.maxDisplay;
});

// Content type icon mapping
const getContentTypeIcon = (contentType: string): string => {
  switch (contentType.toLowerCase()) {
    case 'event': return 'event';
    case 'news': return 'article';
    case 'announcement': return 'campaign';
    case 'classified': return 'sell';
    case 'task': return 'task';
    case 'article': return 'description';
    case 'photo': return 'photo_camera';
    case 'newsletter': return 'newspaper';
    default: return 'label';
  }
};

// Content type color mapping
const getContentTypeColor = (contentType: string): string => {
  switch (contentType.toLowerCase()) {
    case 'event': return 'green';
    case 'news': return 'blue';
    case 'announcement': return 'purple';
    case 'classified': return 'orange';
    case 'task': return 'teal';
    case 'article': return 'indigo';
    case 'photo': return 'pink';
    case 'newsletter': return 'teal';
    default: return 'grey';
  }
};

// Tag color mapping for regular tags
const getTagColor = (tag: string): string => {
  if (tag === 'priority:high') return 'red';
  if (tag === 'priority:medium') return 'orange';
  if (tag === 'priority:low') return 'green';
  if (tag === 'status:active') return 'green';
  if (tag === 'status:inactive') return 'grey';
  if (tag === 'status:pending') return 'orange';
  return 'secondary';
};
</script>

<style scoped>
.tag-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
