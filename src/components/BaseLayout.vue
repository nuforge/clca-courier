<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import AppHeader from './AppHeader.vue';
import AppNavigation from './AppNavigation.vue';
import AppFooter from './AppFooter.vue';

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
  viewConfig: 'hHh LpR fFf',
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

<template>
  <q-layout :view="viewConfig" class="main-layout">
    <slot name="header">
      <AppHeader v-if="showHeader" v-model="searchValue" :show-menu-button="!!showMenuButton"
        @toggle-drawer="toggleDrawer" />
    </slot>

    <slot name="navigation">
      <AppNavigation v-if="showNavigation" v-model="drawerOpen" />
    </slot>

    <q-page-container :class="pageContainerClasses" class="main-content">
      <q-page class="flex column">
        <div class="col">
          <slot />
        </div>
        <div class="col-auto">
          <slot name="footer">
            <AppFooter />
          </slot>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.main-layout {
  .main-content {
    min-height: 100vh;

    .q-page {
      min-height: calc(100vh - 160px); // Account for header and footer space
      display: flex;
      flex-direction: column;

      .col {
        flex: 1;
      }

      .col-auto {
        flex: none;
      }
    }
  }
}

// Ensure pages with padding have proper spacing
:deep(.q-page[padding]) {
  padding-bottom: 0 !important; // Remove bottom padding so footer sits right
}
</style>
