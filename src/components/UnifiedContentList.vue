<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import type { ContentDoc } from '../types/core/content.types';
import ContentCard from './ContentCard.vue';

// Following copilot instructions: Unified ContentDoc types, proper TypeScript
interface Props {
  items: Array<ContentDoc>;
  variant?: 'card' | 'list' | 'featured';
  showActions?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
}

interface Emits {
  (e: 'item-click', item: ContentDoc): void;
  (e: 'item-edit', item: ContentDoc): void;
  (e: 'item-delete', item: ContentDoc): void;
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

const { cardClasses, isDarkMode } = useTheme();

// Theme-aware classes - following copilot instructions: Theme awareness
const greyTextClass = computed(() =>
  isDarkMode.value ? 'text-grey-4' : 'text-grey-7'
);

// Event handlers - following copilot instructions: Proper TypeScript typing
function handleItemClick(item: ContentDoc): void {
  emit('item-click', item);
}

function handleItemEdit(item: ContentDoc): void {
  emit('item-edit', item);
}

function handleItemDelete(item: ContentDoc): void {
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
      <ContentCard
        :content="item"
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
        <ContentCard
          v-for="item in props.items"
          :key="item.id"
          :content="item"
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
