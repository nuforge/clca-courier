<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTheme } from '../composables/useTheme';
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

const { cardClasses } = useTheme();
const drawerOpen = ref(false);

// Store initialization removed - handled by app-level initialization

// Search value management
const searchValue = computed({
  get: () => props.search,
  set: (value) => emit('update:search', value)
});

// Page container classes based on theme
const pageContainerClasses = computed(() =>
  cardClasses.value.includes('bg-dark') ? 'bg-dark-page' : 'bg-white'
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

      <!-- Back to Top Button -->
      <q-page-scroller
        position="bottom-right"
        :offset="[18, 18]"
        :scroll-offset="300"
        :duration="300"
      >
        <q-btn
          round
          color="primary"
          icon="keyboard_arrow_up"
          size="md"
          class="back-to-top-btn"
          aria-label="Back to top"
          :title="$t('common.backToTop')"
        >
          <q-tooltip
            anchor="center left"
            self="center right"
            :offset="[10, 0]"
            class="bg-dark text-white"
          >
            {{ $t('common.backToTop') }}
          </q-tooltip>
        </q-btn>
      </q-page-scroller>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.main-layout {
  // Prevent unwanted scrolling on tablet devices
  touch-action: manipulation;
  overscroll-behavior: contain;

  .main-content {
    min-height: 100vh;
    // Ensure proper touch behavior for main content area
    touch-action: pan-y;
    overscroll-behavior: contain;

    .q-page {
      min-height: calc(100vh - 160px); // Account for header and footer space
      display: flex;
      flex-direction: column;
      // Allow vertical scrolling within page content
      touch-action: pan-y;
      overscroll-behavior: contain;

      .col {
        flex: 1;
        // Prevent horizontal scrolling
        overflow-x: hidden;
        touch-action: pan-y;
      }

      .col-auto {
        flex: none;
        touch-action: manipulation;
      }
    }
  }
}

// Ensure pages with padding have proper spacing
:deep(.q-page[padding]) {
  padding-bottom: 0 !important; // Remove bottom padding so footer sits right
}

// Back to Top Button Styling
.back-to-top-btn {
  // Ensure proper touch target size (minimum 44px for accessibility)
  min-width: 44px;
  min-height: 44px;

  // Smooth transitions for better UX
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // Enhanced shadow for better visibility
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  // Hover effects
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  // Focus styles for keyboard navigation
  &:focus {
    outline: 2px solid var(--q-primary);
    outline-offset: 2px;
  }

  // Active state
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  // Ensure icon is properly sized
  :deep(.q-icon) {
    font-size: 1.2em;
  }
}

// Dark mode adjustments
:deep(.q-page-scroller) {
  // Ensure button is visible in both light and dark themes
  .back-to-top-btn {
    // Use primary color which adapts to theme
    background-color: var(--q-primary);
    color: white;

    // Ensure contrast in dark mode
    &.q-btn--outline {
      border-color: var(--q-primary);
      color: var(--q-primary);
    }
  }
}
</style>
