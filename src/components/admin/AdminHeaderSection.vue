<!--
  Admin Header Section Component
  Reusable header with title, description, and refresh functionality
-->
<template>
  <div class="row items-center q-mb-lg">
    <div class="col">
      <h4 class="q-my-none">
        <q-icon :name="icon" class="q-mr-sm" />
        {{ title }}
      </h4>
      <p class="text-body2 q-my-none">
        {{ subtitle }}
      </p>
    </div>
    <div class="col-auto">
      <q-btn
        v-if="showRefresh"
        color="primary"
        :icon="refreshIcon"
        :label="refreshLabel"
        @click="handleRefresh"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UI_ICONS } from '../../constants/ui-icons';

interface Props {
  title: string;
  subtitle: string;
  icon: string;
  showRefresh?: boolean;
  refreshLabel?: string;
  refreshIcon?: string;
  loading?: boolean;
}

interface Emits {
  (e: 'refresh'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showRefresh: true,
  refreshLabel: 'Refresh Stats',
  refreshIcon: UI_ICONS.refresh,
  loading: false
});

const emit = defineEmits<Emits>();

const handleRefresh = () => {
  emit('refresh');
};
</script>
