<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import type { NewsItem, ClassifiedAd } from '../types/core/content.types';
import { formatDate } from '../utils/date-formatter';
import { useSiteTheme } from '../composables/useSiteTheme';

// Following copilot instructions: Unified types, proper TypeScript, centralized logging
interface Props {
  item: NewsItem | ClassifiedAd;
  variant?: 'card' | 'list' | 'featured';
  showActions?: boolean;
}

interface Emits {
  (e: 'click', item: NewsItem | ClassifiedAd): void;
  (e: 'edit', item: NewsItem | ClassifiedAd): void;
  (e: 'delete', item: NewsItem | ClassifiedAd): void;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'card',
  showActions: false
});

const emit = defineEmits<Emits>();

const siteStore = useSiteStore();
const { getCategoryIcon, getContentIcon } = useSiteTheme();

// Helper function for formatting category names
const formatCategoryName = (category: string): string => {
  return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/-/g, ' ');
};

// Type guards to determine content type
function isNewsItem(item: NewsItem | ClassifiedAd): item is NewsItem {
  return 'content' in item;
}

function isClassifiedAd(item: NewsItem | ClassifiedAd): item is ClassifiedAd {
  return 'description' in item && 'contact' in item;
}

// Theme-aware classes
const cardClasses = computed(() => {
  const baseClasses = 'cursor-pointer transition-all duration-200 hover:shadow-lg';
  const themeClasses = siteStore.isDarkMode
    ? 'bg-dark text-white q-dark hover:bg-grey-9'
    : 'bg-white text-dark hover:bg-grey-1';

  return `${baseClasses} ${themeClasses}`;
});

const greyTextClass = computed(() =>
  siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
);

// Get category configuration using the SAME LOGIC as the working dialog
const getCategoryConfig = computed(() => {
  if (isClassifiedAd(props.item)) {
    // Use the same logic as CommunityContentPage dialog
    return getCategoryIcon('classified', props.item.category);
  } else {
    // Use the same logic as CommunityContentPage dialog - use getContentIcon for news items
    return getContentIcon(props.item.category);
  }
});

// Category display name - using centralized formatting
const categoryDisplayName = computed(() =>
  formatCategoryName(props.item.category)
);

// Get the appropriate date field
const itemDate = computed(() => {
  if (isNewsItem(props.item)) {
    return props.item.date;
  } else {
    return props.item.datePosted;
  }
});

// Get the appropriate content field
const itemContent = computed(() => {
  if (isNewsItem(props.item)) {
    return props.item.summary;
  } else {
    return props.item.description;
  }
});

// Get author/contact info
const authorInfo = computed(() => {
  if (isNewsItem(props.item)) {
    return `By ${props.item.author}`;
  } else {
    return `Contact: ${props.item.contact.name}`;
  }
});

// Event handlers
function handleClick(): void {
  emit('click', props.item);
}

function handleEdit(): void {
  emit('edit', props.item);
}

function handleDelete(): void {
  emit('delete', props.item);
}
</script>

<template>
  <!-- Featured Variant -->
  <q-card
    v-if="variant === 'featured'"
    :class="cardClasses"
    class="full-height"
    @click="handleClick"
  >
    <q-card-section>
      <div class="text-overline" :class="`text-${getCategoryConfig.color}`">
        <q-icon :name="getCategoryConfig.icon" size="xs" class="q-mr-xs" />
        {{ categoryDisplayName }}
      </div>
      <div class="text-h6 q-mb-sm line-clamp-2">{{ item.title }}</div>
      <div class="text-body2 q-mb-md line-clamp-3" :class="greyTextClass">
        {{ itemContent }}
      </div>

      <!-- Price for classified ads -->
      <div v-if="isClassifiedAd(item) && item.price" class="row items-center q-mb-sm">
        <div class="col">
          <div class="text-h6 text-green">{{ item.price }}</div>
        </div>
        <div class="col-auto">
          <div class="text-caption" :class="greyTextClass">
            {{ formatDate(itemDate) }}
          </div>
        </div>
      </div>

      <!-- Date only for news items or classified without price -->
      <div v-else class="text-caption q-mb-sm" :class="greyTextClass">
        {{ formatDate(itemDate) }}
      </div>

      <div class="text-caption" :class="greyTextClass">
        {{ authorInfo }}
      </div>

      <q-badge v-if="item.featured" color="amber" text-color="black" class="q-mt-sm">
        <q-icon name="star" size="xs" class="q-mr-xs" />
        Featured
      </q-badge>
    </q-card-section>

    <q-card-actions v-if="showActions" align="right">
      <q-btn flat icon="edit" @click.stop="handleEdit" />
      <q-btn flat icon="delete" color="negative" @click.stop="handleDelete" />
    </q-card-actions>
  </q-card>

  <!-- Card Variant -->
  <q-card
    v-else-if="variant === 'card'"
    :class="cardClasses"
    @click="handleClick"
  >
    <q-card-section>
      <div class="row items-start">
        <q-avatar
          :color="getCategoryConfig.color"
          text-color="white"
          :icon="getCategoryConfig.icon"
          size="md"
          class="q-mr-md"
        />
        <div class="col">
          <div class="text-overline" :class="`text-${getCategoryConfig.color}`">
            <q-icon :name="getCategoryConfig.icon" size="xs" class="q-mr-xs" />
            {{ categoryDisplayName }}
          </div>
          <div class="text-h6 q-mb-sm">{{ item.title }}</div>
          <div class="text-body2 q-mb-md" :class="greyTextClass">
            {{ itemContent }}
          </div>

          <!-- Price for classified ads -->
          <div v-if="isClassifiedAd(item) && item.price" class="row items-center q-mb-xs">
            <div class="col">
              <div class="text-weight-bold text-green">{{ item.price }}</div>
            </div>
            <div class="col-auto">
              <div class="text-caption" :class="greyTextClass">
                {{ formatDate(itemDate) }}
              </div>
            </div>
          </div>

          <!-- Date only for news items or classified without price -->
          <div v-else class="text-caption q-mb-xs" :class="greyTextClass">
            {{ formatDate(itemDate) }}
          </div>

          <div class="text-caption" :class="greyTextClass">
            {{ authorInfo }}
          </div>

          <q-badge v-if="item.featured" color="amber" text-color="black" class="q-mt-sm">
            <q-icon name="star" size="xs" class="q-mr-xs" />
            Featured
          </q-badge>
        </div>
      </div>
    </q-card-section>

    <q-card-actions v-if="showActions" align="right">
      <q-btn flat icon="edit" @click.stop="handleEdit" />
      <q-btn flat icon="delete" color="negative" @click.stop="handleDelete" />
    </q-card-actions>
  </q-card>

  <!-- List Variant -->
  <q-item
    v-else-if="variant === 'list'"
    clickable
    @click="handleClick"
    class="q-pa-md"
  >
    <q-item-section avatar>
      <q-avatar
        color="transparent"
        :text-color="getCategoryConfig.color"
        :icon="getCategoryConfig.icon"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label class="text-weight-medium">{{ item.title }}</q-item-label>
      <q-item-label caption class="q-mt-xs">
        {{ formatDate(itemDate) }} • {{ authorInfo }}
        <span v-if="isClassifiedAd(item) && item.price"> • {{ item.price }}</span>
        <q-badge v-if="item.featured" color="amber" text-color="black" class="q-ml-xs">
          <q-icon name="star" size="xs" class="q-mr-xs" />
          Featured
        </q-badge>
      </q-item-label>
      <q-item-label class="q-mt-sm text-body2">
        {{ itemContent }}
      </q-item-label>
    </q-item-section>

    <q-item-section side v-if="showActions">
      <div class="row">
        <q-btn flat round icon="edit" @click.stop="handleEdit" />
        <q-btn flat round icon="delete" color="negative" @click.stop="handleDelete" />
      </div>
    </q-item-section>

    <q-item-section side v-else>
      <q-icon name="chevron_right" color="grey" />
    </q-item-section>
  </q-item>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
