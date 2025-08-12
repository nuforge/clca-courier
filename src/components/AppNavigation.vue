<script setup lang="ts">
import { computed, ref } from 'vue';
import NavigationItem from './NavigationItem.vue';
import { useNavigation } from '../composables/useNavigation';
import { useSiteStore } from '../stores/site-store-simple';
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

// Use the site store for theme functionality
const siteStore = useSiteStore();

// Mini state for collapsed sidebar
const isMini = ref(false);

// Account navigation item
const accountItem: NavigationItemType = {
  title: 'Account',
  icon: 'mdi-account-circle',
  link: '/account'
};

// Computed properties
const isDarkMode = computed(() => siteStore.isDarkMode);

// Toggle mini mode
const toggleMini = () => {
  isMini.value = !isMini.value;
};

// Theme toggle function
const toggleDarkMode = () => {
  siteStore.toggleDarkMode();
};

// Create a computed property for two-way binding
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
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

      <q-space class="q-my-xl" />
      <!-- Bottom section with Account and Theme toggle -->
      <div class="bottom-section ">
        <!-- Account Link -->
        <NavigationItem :item="accountItem" :mini="isMini" />

        <!-- Theme Toggle -->
        <q-item clickable v-ripple @click="toggleDarkMode" class="nav-item q-ml-md">
          <q-item-section avatar>
            <q-icon :name="isDarkMode ? 'mdi-brightness-7' : 'mdi-brightness-4'" />
          </q-item-section>
          <q-item-section v-if="!isMini">
            <q-item-label>{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</q-item-label>
          </q-item-section>
          <q-tooltip v-if="isMini" anchor="center right" self="center left" :offset="[10, 0]">
            {{ isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}
          </q-tooltip>
        </q-item>
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
}
</style>
