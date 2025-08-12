<script setup lang="ts">
import { ref } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';

const siteStore = useSiteStore();
const leftDrawerOpen = ref(false);


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
      <q-toolbar class="bg-clcablue">

        <q-toolbar-title>
          <router-link to="/" class="logo-link">
            <q-img src="/courier-logo.svg" style="height: 40px; max-width: 200px" fit="contain" alt="The Courier" />
          </router-link>
        </q-toolbar-title>

        <q-btn flat round dense :icon="siteStore.isDarkMode ? 'mdi-brightness-7' : 'mdi-brightness-4'"
          @click="siteStore.toggleDarkMode"
          :title="siteStore.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'" />

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above class="bg-dark">
      <q-list>
        <q-item v-for="item in navigationItems" :key="item.title" :to="item.link" clickable v-ripple
          exact-active-class="nav-item-active" :class="['nav-item', 'q-ml-md', { 'dark-mode': siteStore.isDarkMode }]">
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
.logo-link {
  text-decoration: none;

  &:hover {
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }
}

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

// Remove old body-based styles - replaced with store-based reactive styles above</style>
