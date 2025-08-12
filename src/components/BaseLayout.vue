<template>
  <q-layout :view="viewConfig">
    <slot name="header">
      <AppHeader v-if="showHeader" v-model="searchValue" :show-menu-button="!!showMenuButton"
        @toggle-drawer="toggleDrawer" />
    </slot>

    <slot name="navigation">
      <AppNavigation v-if="showNavigation" v-model="drawerOpen" />
    </slot>

    <q-page-container :class="pageContainerClasses">
      <slot />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import AppHeader from './AppHeader.vue';
import AppNavigation from './AppNavigation.vue';

interface Props {
  viewConfig?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
  showMenuButton?: boolean;
  search?: string;
}

interface Emits {
  (e: 'update:search', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  viewConfig: 'hHh lpR lFf',
  showHeader: true,
  showNavigation: true,
  showMenuButton: true,
  search: ''
});

const emit = defineEmits<Emits>();

const siteStore = useSiteStore();
const drawerOpen = ref(false);

// Search value management
const searchValue = computed({
  get: () => props.search,
  set: (value) => emit('update:search', value)
});

// Page container classes based on theme
const pageContainerClasses = computed(() =>
  siteStore.isDarkMode ? 'bg-dark-page' : 'bg-white'
);

const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value;
};
</script>

<style lang="scss" scoped>
// Base layout styles can go here</style>
