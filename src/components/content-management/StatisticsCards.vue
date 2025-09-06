<!--
  Statistics Cards Component
  Displays newsletter statistics in card format
-->
<template>
    <div class="row q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
            <q-card class="text-center">
                <q-card-section>
                    <div class="text-h6">{{ totalNewsletters }}</div>
                    <div class="text-caption">Total Newsletters</div>
                </q-card-section>
            </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
            <q-card class="text-center">
                <q-card-section>
                    <div class="text-h6">{{ newslettersWithText }}</div>
                    <div class="text-caption">With Extracted Text</div>
                </q-card-section>
            </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
            <q-card class="text-center">
                <q-card-section>
                    <div class="text-h6">{{ newslettersWithThumbnails }}</div>
                    <div class="text-caption">With Thumbnails</div>
                </q-card-section>
            </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3 q-pa-sm">
            <q-card class="text-center">
                <q-card-section>
                    <div class="text-h6">{{ totalFileSize }}</div>
                    <div class="text-caption">Total Size</div>
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    totalNewsletters: number;
    newslettersWithText: number;
    newslettersWithThumbnails: number;
    totalFileSize: string;
}

defineProps<Props>();
</script>
