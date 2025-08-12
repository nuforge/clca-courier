<script setup lang="ts">
import { ref } from 'vue';

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

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header class="text-grey-8">
          Navigation
        </q-item-label>

        <q-item v-for="item in navigationItems" :key="item.title" :to="item.link" clickable v-ripple>
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ item.title }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
