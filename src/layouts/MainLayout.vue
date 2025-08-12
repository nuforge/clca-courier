<script setup lang="ts">
import { ref } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';

const siteStore = useSiteStore();
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

interface NavigationItem {
  title: string;
  icon: string;
  link: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Home',
    icon: 'mdi-home',
    link: '/'
  },
  {
    title: 'News & Updates',
    icon: 'mdi-newspaper',
    link: '/news'
  },
  {
    title: 'Classifieds & Ads',
    icon: 'mdi-bulletin-board',
    link: '/classifieds'
  },
  {
    title: 'Issue Archive',
    icon: 'mdi-archive',
    link: '/archive'
  },
  {
    title: 'Contribute',
    icon: 'mdi-pencil',
    link: '/contribute'
  },
  {
    title: 'Contact',
    icon: 'mdi-phone',
    link: '/contact'
  },
  {
    title: 'About',
    icon: 'mdi-information',
    link: '/about'
  }
];

</script>

<template>
  <q-layout view="hHh lpR lFf">
    <q-header>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> The Courier </q-toolbar-title>

        <q-btn flat round dense :icon="siteStore.isDarkMode ? 'mdi-brightness-7' : 'mdi-brightness-4'"
          @click="siteStore.toggleDarkMode"
          :title="siteStore.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'" />

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above :class="siteStore.isDarkMode ? 'bg-dark' : 'bg-white'">
      <q-list>

        <q-item v-for="item in navigationItems" :key="item.title" :to="item.link" clickable v-ripple
          exact-active-class="nav-item-active" class="nav-item">
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ item.title }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container :class="siteStore.isDarkMode ? 'bg-dark-page' : 'bg-white'">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.nav-item {
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(var(--q-primary-rgb), 0.1);
  }
}

.nav-item-active {
  background-color: var(--q-page-background, white);
  font-weight: 600;

  :deep(.q-item__label) {
    color: var(--q-on-surface, var(--q-dark));
  }

  :deep(.q-item__section--avatar .q-icon) {
    color: var(--q-primary);
  }
}

// Ensure proper contrast in dark mode
body.body--dark .nav-item-active {
  background-color: var(--q-dark-page, #121212);

  :deep(.q-item__label) {
    color: var(--q-on-dark-surface, white);
  }
}

// Ensure proper contrast in light mode
body.body--light .nav-item-active {
  background-color: white;

  :deep(.q-item__label) {
    color: var(--q-dark, #1d1d1d);
  }
}
</style>
