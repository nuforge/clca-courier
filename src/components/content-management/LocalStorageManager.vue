<!--
  Local Storage Management Component
  Displays local metadata storage stats and management controls
-->
<template>
    <q-card class="q-mb-lg">
        <q-card-section>
            <div class="text-h6 q-mb-md">
                <q-icon name="mdi-database" class="q-mr-sm" />
                Local Metadata Storage
            </div>
            <div class="row items-center">
                <div class="col-12 col-md-6">
                    <div class="text-body2">
                        <div>Total: {{ stats.total }}</div>
                        <div class="text-orange">Pending: {{ stats.pending }}</div>
                        <div class="text-green">Synced: {{ stats.synced }}</div>
                        <div class="text-red" v-if="stats.errors > 0">Errors: {{ stats.errors }}</div>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="row ">
                        <q-btn color="positive" icon="mdi-cloud-upload" label="Sync to Firebase"
                            @click="$emit('sync-to-firebase')" :loading="isSyncing" :disable="stats.pending === 0"
                            size="sm" />
                        <q-btn color="warning" icon="mdi-delete" label="Clear Local" @click="$emit('clear-local')"
                            :disable="stats.total === 0" size="sm" />
                        <q-btn color="info" icon="mdi-refresh" label="Refresh" @click="$emit('refresh-stats')"
                            size="sm" />
                    </div>
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
interface LocalStorageStats {
    total: number;
    pending: number;
    synced: number;
    errors: number;
}

interface Props {
    stats: LocalStorageStats;
    isSyncing: boolean;
}

defineProps<Props>();

defineEmits<{
    'sync-to-firebase': [];
    'clear-local': [];
    'refresh-stats': [];
}>();
</script>
