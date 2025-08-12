<script setup lang="ts">
import { computed, ref } from 'vue';
import NavigationItem from './NavigationItem.vue';
import LatestIssueCard from './LatestIssueCard.vue';
import { useNavigation } from '../composables/useNavigation';
import type { NavigationItem as NavigationItemType } from './NavigationItem.vue';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use the navigation composable
const { navigationItems } = useNavigation();

// Mini state for collapsed sidebar
const isMini = ref(false);

// Account navigation item
const accountItem: NavigationItemType = {
  title: 'Account',
  icon: 'mdi-account-circle',
  link: '/account'
};

// Computed properties
// None needed for navigation-specific functionality

// Toggle mini mode
const toggleMini = () => {
  isMini.value = !isMini.value;
};

// Create a computed property for two-way binding
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});
</script>

<template>
  <q-drawer v-model="isOpen" show-if-above class="bg-dark navigation-drawer" :mini="isMini" :width="280"
    :mini-width="60" mini-to-overlay>
    <!-- Toggle button -->
    <div class="flex justify-end q-pa-sm">
      <q-btn flat round dense :icon="isMini ? 'mdi-chevron-right' : 'mdi-chevron-left'" @click="toggleMini"
        class="text-white" size="sm" />
    </div>

    <!-- Scrollable navigation area -->
    <div class="navigation-content justify-between">
      <!-- Main navigation items -->
      <q-list class="q-mt-sm">
        <NavigationItem v-for="item in navigationItems" :key="item.title" :item="item" :mini="isMini" />
      </q-list>

      <q-space class="q-my-lg" />

      <!-- Latest Issue Card -->
      <div class="latest-issue-section">
        <LatestIssueCard :mini="isMini" />
      </div>

      <q-space class="q-my-lg" />
      <!-- Bottom section with Account -->
      <div class="bottom-section">
        <!-- Account Link -->
        <NavigationItem :item="accountItem" :mini="isMini" />
      </div>
    </div>
  </q-drawer>
</template>

<style lang="scss" scoped>
.nav-item {
  border-bottom-left-radius: 8px;
  border-top-left-radius: 8px;
  transition: all 0.3s ease;
  color: white;

  &:hover {
    background-color: rgba(var(--q-primary-rgb), 0.1);
  }
}

// Ensure proper spacing in mini mode
.q-drawer--mini {
  .q-item {
    justify-content: center;
  }

  .q-separator {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }

  .latest-issue-section {
    margin-left: 0.5rem !important;
    margin-right: 0.5rem;
    display: flex;
    justify-content: center;
  }
}

// Ensure right alignment for full mode
.latest-issue-section {
  display: flex;
  justify-content: flex-end;
}
</style>
