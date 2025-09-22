<!--
  BaseStatsGrid Component
  Reusable statistics display grid for admin dashboards
-->
<template>
  <div class="row q-col-gutter-md">
    <div
      v-for="stat in stats"
      :key="stat.label"
      :class="getColumnClass"
    >
      <q-card
        class="text-center cursor-pointer"
        @click="handleStatClick(stat)"
      >
        <q-card-section>
          <q-icon
            :name="stat.icon"
            :color="stat.color"
            size="2rem"
          />
          <div class="text-h5 q-mt-sm">
            <template v-if="loading">
              <q-skeleton type="text" width="60px" />
            </template>
            <template v-else>
              {{ stat.value }}
            </template>
          </div>
          <div class="text-caption text-grey-6">
            {{ stat.label }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
}

interface Props {
  stats: StatItem[];
  columns?: number;
  loading?: boolean;
  cardStyle?: 'default' | 'minimal' | 'detailed';
}

const props = withDefaults(defineProps<Props>(), {
  columns: 4,
  loading: false,
  cardStyle: 'default'
});

interface Emits {
  (e: 'stat-click', stat: StatItem): void;
  (e: 'refresh'): void;
}

const emit = defineEmits<Emits>();

// Computed properties
const getColumnClass = computed(() => {
  switch (props.columns) {
    case 1: return 'col-12';
    case 2: return 'col-12 col-md-6';
    case 3: return 'col-12 col-md-4';
    case 4: return 'col-12 col-md-3';
    case 6: return 'col-12 col-md-2';
    default: return 'col-12 col-md-3';
  }
});

// Methods
const handleStatClick = (stat: StatItem) => {
  emit('stat-click', stat);
};
</script>
