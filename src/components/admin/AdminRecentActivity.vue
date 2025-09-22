<!--
  Admin Recent Activity Component
  Displays recent activity feed in a reusable card format
-->
<template>
  <q-card class="q-mt-lg">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon :name="UI_ICONS.timeline" class="q-mr-sm" />
        Recent Activity
      </div>
      <q-list>
        <q-item
          v-for="activity in activities"
          :key="activity.id"
          clickable
          @click="handleActivityClick(activity)"
        >
          <q-item-section avatar>
            <q-icon :name="getActivityIcon(activity.type)" :color="getActivityColor(activity.type)" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ activity.description }}</q-item-label>
            <q-item-label caption>{{ formatDateTime(activity.timestamp) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip
              :color="getActivityColor(activity.type)"
              text-color="white"
              size="sm"
            >
              {{ activity.type }}
            </q-chip>
          </q-item-section>
        </q-item>

        <q-item v-if="activities.length === 0">
          <q-item-section>
            <q-item-label class="text-grey-6">{{ emptyMessage }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { formatDateTime } from '../../utils/date-formatter';
import { UI_ICONS } from '../../constants/ui-icons';
import { logger } from '../../utils/logger';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface Props {
  activities: ActivityItem[];
  emptyMessage?: string;
}

interface Emits {
  (e: 'activity-click', activity: ActivityItem): void;
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'No recent activity'
});

const emit = defineEmits<Emits>();

// Helper methods
const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'content': return UI_ICONS.documentPlus;
    case 'newsletter': return UI_ICONS.bookPlus;
    case 'user': return UI_ICONS.accountPlus;
    case 'system': return UI_ICONS.cog;
    case 'task': return UI_ICONS.assignment;
    default: return UI_ICONS.info;
  }
};

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'content': return 'primary';
    case 'newsletter': return 'secondary';
    case 'user': return 'info';
    case 'system': return 'warning';
    case 'task': return 'purple';
    default: return 'grey';
  }
};

const handleActivityClick = (activity: ActivityItem) => {
  logger.info('Activity clicked:', activity.type, activity.id);
  emit('activity-click', activity);
};
</script>
