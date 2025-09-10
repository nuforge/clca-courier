<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import type { NewsItem, ClassifiedAd } from '../types/core/content.types';
import ContentItemCard from './ContentItemCard.vue';

// Following copilot instructions: Unified Newsletter types, proper TypeScript
interface Props {
  items: Array<NewsItem | ClassifiedAd>;
  variant?: 'card' | 'list' | 'featured';
  showActions?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
}

interface Emits {
  (e: 'item-click', item: NewsItem | ClassifiedAd): void;
  (e: 'item-edit', item: NewsItem | ClassifiedAd): void;
  (e: 'item-delete', item: NewsItem | ClassifiedAd): void;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'list',
  showActions: false,
  emptyMessage: 'No content found',
  emptyIcon: 'search_off'
});

// DON'T destructure props - it breaks reactivity!
// Use props.items, props.variant, etc. directly in template

const emit = defineEmits<Emits>();

const siteStore = useSiteStore();

// Theme-aware classes - following copilot instructions: Theme awareness
const cardClasses = computed(() => {
  if (siteStore.isDarkMode) {
    return 'bg-dark text-white q-dark';
  } else {
    return 'bg-white text-dark';
  }
});

const greyTextClass = computed(() =>
  siteStore.isDarkMode ? 'text-grey-4' : 'text-grey-7'
);

// Event handlers - following copilot instructions: Proper TypeScript typing
function handleItemClick(item: NewsItem | ClassifiedAd): void {
  emit('item-click', item);
}

function handleItemEdit(item: NewsItem | ClassifiedAd): void {
  emit('item-edit', item);
}

function handleItemDelete(item: NewsItem | ClassifiedAd): void {
  emit('item-delete', item);
}
</script>

<template>
  <!-- Grid Layout for Card/Featured Variants -->
  <div v-if="props.variant === 'card' || props.variant === 'featured'" class="row q-col-gutter-md">
    <div
      v-for="item in props.items"
      :key="item.id"
      :class="props.variant === 'featured' ? 'col-12 col-md-6 col-lg-4' : 'col-12 col-md-6'"
    >
      <ContentItemCard
        :item="item"
        :variant="props.variant"
        :show-actions="props.showActions ?? false"
        @click="handleItemClick"
        @edit="handleItemEdit"
        @delete="handleItemDelete"
      />
    </div>

    <!-- Empty State for Grid -->
    <div v-if="props.items.length === 0" class="col-12">
      <q-card :class="cardClasses">
        <q-card-section class="text-center q-py-xl">
          <q-icon :name="props.emptyIcon" size="48px" :class="greyTextClass" />
          <div class="text-h6 q-mt-md" :class="greyTextClass">{{ props.emptyMessage }}</div>
          <div class="text-body2" :class="greyTextClass">
            Try adjusting your search or filter criteria
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>

  <!-- List Layout -->
  <q-card v-else :class="cardClasses">
    <q-card-section v-if="props.items.length === 0" class="text-center q-py-xl">
      <div class="text-h6 q-mt-md" :class="greyTextClass">{{ props.emptyMessage }}</div>
      <div class="text-body2" :class="greyTextClass">
        Try adjusting your search or filter criteria
      </div>
    </q-card-section>

    <q-card-section v-else class="q-pa-none">
      <q-list separator>
        <ContentItemCard
          v-for="item in props.items"
          :key="item.id"
          :item="item"
          variant="list"
          :show-actions="props.showActions ?? false"
          @click="handleItemClick"
          @edit="handleItemEdit"
          @delete="handleItemDelete"
        />
      </q-list>
    </q-card-section>
  </q-card>
</template>
