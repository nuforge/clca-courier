<template>
  <q-item :to="item.link" clickable v-ripple exact-active-class="nav-item-active" :class="navItemClasses">
    <q-item-section avatar>
      <q-icon :name="item.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ item.title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';

export interface NavigationItem {
  title: string;
  icon: string;
  link: string;
}

interface Props {
  item: NavigationItem;
}

defineProps<Props>();

const siteStore = useSiteStore();

const navItemClasses = computed(() => [
  'nav-item',
  'q-ml-md',
  { 'dark-mode': siteStore.isDarkMode }
]);
</script>

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

.nav-item-active {
  font-weight: 600;

  // Light mode styles
  &:not(.dark-mode) {
    background-color: white;

    :deep(.q-item__label) {
      color: var(--q-dark, #1d1d1d);
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
