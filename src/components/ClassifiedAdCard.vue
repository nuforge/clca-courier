<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import type { ClassifiedAd } from '../types/core/content.types';
import { logger } from '../utils/logger';
import { getClassifiedCategoryIcon, formatCategoryName } from '../utils/content-icons';

// Following copilot instructions: Unified Newsletter types, proper TypeScript, centralized logging
interface Props {
  item: ClassifiedAd;
  variant?: 'card' | 'list' | 'featured';
  showActions?: boolean;
}

interface Emits {
  (e: 'click', item: ClassifiedAd): void;
  (e: 'edit', item: ClassifiedAd): void;
  (e: 'delete', item: ClassifiedAd): void;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'card',
  showActions: false
});

const emit = defineEmits<Emits>();

const siteStore = useSiteStore();

// Theme-aware classes - following copilot instructions: Theme awareness
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

// Date formatting helper - following copilot instructions: Centralized date management patterns
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    logger.warn('Date formatting error:', error);
    return dateString;
  }
}

// Category color and icon mapping - using centralized content icons system
const getCategoryConfig = () => getClassifiedCategoryIcon(props.item.category);

// Category display name - using centralized formatting
const categoryDisplayName = computed(() =>
  formatCategoryName(props.item.category)
);

// Event handlers - following copilot instructions: Proper TypeScript typing
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
      <div class="text-overline" :class="`text-${getCategoryConfig().color}`">
        {{ categoryDisplayName }}
      </div>
      <div class="text-h6 q-mb-sm line-clamp-2">{{ item.title }}</div>
      <div class="text-body2 q-mb-md line-clamp-3" :class="greyTextClass">
        {{ item.description }}
      </div>
      <div class="row items-center q-mb-sm">
        <div class="col">
          <div v-if="item.price" class="text-h6 text-green">{{ item.price }}</div>
        </div>
        <div class="col-auto">
          <div class="text-caption" :class="greyTextClass">
            {{ formatDate(item.datePosted) }}
          </div>
        </div>
      </div>
      <div class="text-caption" :class="greyTextClass">
        Contact: {{ item.contact.name }}
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
          :color="getCategoryConfig().color"
          text-color="white"
          :icon="getCategoryConfig().icon"
          size="md"
          class="q-mr-md"
        />
        <div class="col">
          <div class="text-overline" :class="`text-${getCategoryConfig().color}`">
            {{ categoryDisplayName }}
          </div>
          <div class="text-h6 q-mb-sm">{{ item.title }}</div>
          <div class="text-body2 q-mb-md" :class="greyTextClass">
            {{ item.description }}
          </div>
          <div class="row items-center q-mb-xs">
            <div class="col">
              <div v-if="item.price" class="text-weight-bold text-green">{{ item.price }}</div>
            </div>
            <div class="col-auto">
              <div class="text-caption" :class="greyTextClass">
                {{ formatDate(item.datePosted) }}
              </div>
            </div>
          </div>
          <div class="text-caption" :class="greyTextClass">
            Contact: {{ item.contact.name }}
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
        :text-color="getCategoryConfig().color"
        :icon="getCategoryConfig().icon"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label class="text-weight-medium">{{ item.title }}</q-item-label>
      <q-item-label caption class="q-mt-xs">
        {{ formatDate(item.datePosted) }}
        <span v-if="item.price"> • {{ item.price }}</span>
        <q-badge v-if="item.featured" color="amber" text-color="black" class="q-ml-xs">
          <q-icon name="star" size="xs" class="q-mr-xs" />
          Featured
        </q-badge>
      </q-item-label>
      <q-item-label class="q-mt-sm text-body2">
        {{ item.description }}
      </q-item-label>
      <q-item-label caption class="q-mt-xs">
        Contact: {{ item.contact.name }}
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
