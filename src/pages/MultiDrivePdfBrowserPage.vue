<template>
    <q-page>
        <MultiDrivePdfBrowser />
    </q-page>
</template>

<script setup lang="ts">
import MultiDrivePdfBrowser from '../components/MultiDrivePdfBrowser.vue'

// Meta for SEO
import { useMeta } from 'quasar'

useMeta({
    title: 'Multi-Drive PDF Browser - CLCA Courier',
})
</script>
