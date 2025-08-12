<script setup lang="ts">
import { ref } from 'vue';
import BaseLayout from '../components/BaseLayout.vue';

const searchText = ref('');
</script>

<template>
  <BaseLayout v-model:search="searchText">
    <router-view />
  </BaseLayout>
</template>

<style lang="scss" scoped>
// Main layout specific styles only
// Component-specific styles are now in their respective component files</style>
