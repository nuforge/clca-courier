<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import type { NavigationItem } from '../types/navigation';

interface Props {
  item: NavigationItem;
  mini?: boolean;
}

defineProps<Props>();

const { textClasses } = useTheme();

const navItemClasses = computed(() => [
  'nav-item',
  'nav-menu-font',
  'q-ml-md',
  { 'dark-mode': textClasses.value.primary === 'text-white' }
]);
</script>

<template>
  <q-item :to="item.link" clickable v-ripple exact-active-class="nav-item-active" :class="navItemClasses">
    <q-item-section avatar>
      <q-icon :name="item.icon" />
    </q-item-section>

    <q-item-section v-if="!mini">
      <q-item-label>{{ item.title }}</q-item-label>
    </q-item-section>

    <!-- Tooltip for mini mode -->
    <q-tooltip v-if="mini" anchor="center right" self="center left" :offset="[10, 0]">
      {{ item.title }}
    </q-tooltip>
  </q-item>
</template>


<style lang="scss" scoped>
.nav-item {
  border-bottom-left-radius: 10px;
  border-top-left-radius: 10px;
  transition: all 0.3s ease;
  color: white;

  // Apply Century Gothic font to navigation labels
  :deep(.q-item__label) {
    font-family: 'Outfit', 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Futura', 'Trebuchet MS', sans-serif;
    font-weight: 300;
  }

  &:hover {
    background-color: rgba(var(--q-primary-rgb), 0.1);
  }
}

.nav-item-active {
  font-weight: 600;

  // Light mode styles
  &:not(.dark-mode) {
    background-color: white;

    :deep(.q-item__label) {
      color: var(--q-dark, #1d1d1d);

      &:hover {

        color: white;
      }
    }
  }

  // Dark mode styles
  &.dark-mode {
    background-color: var(--q-dark-page, #121212);

    :deep(.q-item__label) {
      color: white;
    }
  }

  :deep(.q-item__section--avatar .q-icon) {
    color: var(--q-primary);
  }
}
</style>
