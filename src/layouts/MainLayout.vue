<script setup lang="ts">
import { ref } from 'vue';
import BaseLayout from '../components/BaseLayout.vue';
import GlobalPdfViewer from '../components/GlobalPdfViewer.vue';

const searchText = ref('');
</script>

<template>
  <BaseLayout v-model:search="searchText">
    <router-view />

    <!-- Global PDF Viewer - available on all pages -->
    <GlobalPdfViewer />
  </BaseLayout>
</template>

<style lang="scss" scoped>
// Main layout specific styles only
// Component-specific styles are now in their respective component files</style>
