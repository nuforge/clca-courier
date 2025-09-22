<!--
  Admin Stats Overview Component
  Displays admin statistics using BaseStatsGrid with computed stats
-->
<template>
  <BaseStatsGrid
    :stats="adminStats"
    :loading="loading || false"
    :columns="columns || 4"
    class="q-mb-lg"
    @stat-click="handleStatClick"
    @refresh="handleRefresh"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseStatsGrid from '../BaseStatsGrid.vue';
import { useSiteTheme } from '../../composables/useSiteTheme';
import { UI_ICONS } from '../../constants/ui-icons';
import { logger } from '../../utils/logger';
import type { TaskStatistics } from '../../services/task.service';

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
}

interface StatsData {
  totalContent: number;
  pendingReviews: number;
  publishedContent: number;
  newsletters: number;
}

interface Props {
  stats: StatsData;
  taskStats?: TaskStatistics | null;
  loading?: boolean;
  columns?: number;
  includeTaskStats?: boolean;
}

interface Emits {
  (e: 'stat-click', stat: StatItem): void;
  (e: 'refresh'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: 4,
  includeTaskStats: true
});

const emit = defineEmits<Emits>();

const { getContentIcon, getStatusIcon } = useSiteTheme();

// Computed properties
const adminStats = computed((): StatItem[] => {
  const contentIcon = getContentIcon('article');
  const pendingIcon = getStatusIcon('pending');
  const publishedIcon = getStatusIcon('published');
  const notificationIcon = getContentIcon('notification');

  const baseStats = [
    {
      label: 'Total Content',
      value: props.stats.totalContent,
      icon: contentIcon.icon,
      color: contentIcon.color,
      description: 'Total content items'
    },
    {
      label: 'Pending Reviews',
      value: props.stats.pendingReviews,
      icon: pendingIcon.icon,
      color: pendingIcon.color,
      description: 'Content awaiting review'
    },
    {
      label: 'Published',
      value: props.stats.publishedContent,
      icon: publishedIcon.icon,
      color: publishedIcon.color,
      description: 'Published content'
    },
    {
      label: 'Newsletters',
      value: props.stats.newsletters,
      icon: notificationIcon.icon,
      color: notificationIcon.color,
      description: 'Total newsletters'
    }
  ];

  // Add task statistics if available and enabled
  if (props.includeTaskStats && props.taskStats) {
    baseStats.push(
      {
        label: 'Active Tasks',
        value: props.taskStats.unclaimedTasks + props.taskStats.inProgressTasks,
        icon: UI_ICONS.assignment,
        color: 'blue',
        description: 'Unclaimed and in-progress tasks'
      },
      {
        label: 'Overdue Tasks',
        value: props.taskStats.overdueTasks,
        icon: UI_ICONS.warning,
        color: 'negative',
        description: 'Tasks past due date'
      }
    );
  }

  return baseStats;
});

// Event handlers
const handleStatClick = (stat: StatItem) => {
  logger.info('Stat clicked:', stat.label);
  emit('stat-click', stat);
};

const handleRefresh = () => {
  emit('refresh');
};
</script>
