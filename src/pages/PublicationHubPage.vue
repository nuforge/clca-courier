<template>
    <q-page class="publication-hub-page">
        <PublicationHub />
    </q-page>
</template>

<script setup lang="ts">
import PublicationHub from '../components/PublicationHub.vue'

// Page metadata
defineOptions({
    name: 'PublicationHubPage'
})
</script>

<style scoped>
.publication-hub-page {
    min-height: 100vh;
    background-color: #f5f5f5;
}
</style>
