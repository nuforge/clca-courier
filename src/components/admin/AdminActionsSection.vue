<!--
  Admin Actions Section Component
  Displays admin action sections using BaseActionToolbar with computed sections
-->
<template>
  <BaseActionToolbar
    :sections="actionSections"
    :columns="columns || 2"
    :loading="loading || false"
    @action-click="handleActionClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseActionToolbar from '../BaseActionToolbar.vue';
import { useSiteTheme } from '../../composables/useSiteTheme';
import { UI_ICONS } from '../../constants/ui-icons';
import type { TaskStatistics } from '../../services/task.service';

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  style?: 'outline' | 'flat';
  size?: 'sm' | 'md';
  to?: string;
  action?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface ActionSection {
  title: string;
  titleIcon: string;
  description: string;
  primaryAction: ActionButton;
  secondaryActions: ActionButton[];
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
  includeSections?: string[]; // Optional filter for which sections to include
}

interface Emits {
  (e: 'action-click', action: ActionButton): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: 2,
  includeSections: () => ['content', 'newsletter', 'site', 'user', 'task']
});

const emit = defineEmits<Emits>();

const { getContentIcon, getStatusIcon } = useSiteTheme();

// Computed properties
const actionSections = computed((): ActionSection[] => {
  const announcementIcon = getContentIcon('announcement');
  const newsletterIcon = getContentIcon('newsletter');
  const pendingIcon = getStatusIcon('pending');
  const publishedIcon = getStatusIcon('published');

  const allSections = [
    {
      id: 'content',
      title: 'Content Management',
      titleIcon: announcementIcon.icon,
      description: 'Review and manage user-submitted content',
      primaryAction: {
        label: 'Review Content',
        icon: UI_ICONS.eye,
        color: 'primary',
        style: 'outline' as const,
        to: '/admin/content'
      },
      secondaryActions: [
        {
          label: `${props.stats.pendingReviews} Pending`,
          icon: pendingIcon.icon,
          color: 'orange',
          style: 'flat' as const,
          size: 'sm' as const,
          to: '/admin/content?tab=pending'
        },
        {
          label: `${props.stats.publishedContent} Published`,
          icon: publishedIcon.icon,
          color: 'positive',
          style: 'flat' as const,
          size: 'sm' as const,
          to: '/admin/content?tab=published'
        }
      ]
    },
    {
      id: 'newsletter',
      title: 'Newsletter Management',
      titleIcon: newsletterIcon.icon,
      description: 'Manage newsletter archive and publications',
      primaryAction: {
        label: 'Manage Newsletters',
        icon: UI_ICONS.edit,
        color: 'secondary',
        style: 'outline' as const,
        to: '/admin/newsletters'
      },
      secondaryActions: [
        {
          label: 'Upload PDF',
          icon: UI_ICONS.upload,
          color: 'info',
          style: 'flat' as const,
          size: 'sm' as const,
          action: 'showUploadDialog'
        },
        {
          label: 'Settings',
          icon: UI_ICONS.cog,
          color: 'accent',
          style: 'flat' as const,
          size: 'sm' as const,
          action: 'showNewsletterSettings'
        }
      ]
    },
    {
      id: 'site',
      title: 'Site Configuration',
      titleIcon: UI_ICONS.palette,
      description: 'Manage themes, categories, and site-wide settings',
      primaryAction: {
        label: 'Theme Editor',
        icon: UI_ICONS.paletteOutline,
        color: 'grey-6',
        style: 'outline' as const,
        to: '/admin/theme'
      },
      secondaryActions: [
        {
          label: 'Quick Categories',
          icon: UI_ICONS.tagMultiple,
          color: 'brown',
          style: 'flat' as const,
          size: 'sm' as const,
          action: 'showCategoriesDialog'
        },
        {
          label: 'Quick Colors',
          icon: UI_ICONS.colorFill,
          color: 'deep-purple',
          style: 'flat' as const,
          size: 'sm' as const,
          action: 'showColorsDialog'
        }
      ]
    },
    {
      id: 'user',
      title: 'User Management',
      titleIcon: UI_ICONS.accountGroup,
      description: 'Manage user accounts and permissions',
      primaryAction: {
        label: 'Manage Users',
        icon: UI_ICONS.accountCog,
        color: 'info',
        style: 'outline' as const,
        action: 'showUserManagement'
      },
      secondaryActions: [
        {
          label: 'Add Admin',
          icon: UI_ICONS.accountPlus,
          color: 'green',
          style: 'flat' as const,
          size: 'sm' as const,
          action: 'showAddAdminDialog'
        },
        {
          label: 'Roles',
          icon: UI_ICONS.accountKey,
          color: 'purple',
          style: 'flat' as const,
          size: 'sm' as const,
          action: 'showRolesDialog'
        }
      ]
    },
    {
      id: 'task',
      title: 'Volunteer Task Management',
      titleIcon: UI_ICONS.assignment,
      description: 'Manage editorial workflow tasks and volunteer assignments',
      primaryAction: {
        label: 'Task Dashboard',
        icon: UI_ICONS.dashboard,
        color: 'purple',
        style: 'outline' as const,
        to: '/admin/tasks'
      },
      secondaryActions: [
        {
          label: `${props.taskStats?.unclaimedTasks || 0} Unclaimed`,
          icon: UI_ICONS.assignment,
          color: 'orange',
          style: 'flat' as const,
          size: 'sm' as const,
          to: '/admin/tasks?filter=unclaimed'
        },
        {
          label: 'Volunteer Workloads',
          icon: UI_ICONS.accountGroup,
          color: 'blue',
          style: 'flat' as const,
          size: 'sm' as const,
          to: '/admin/tasks?view=workloads'
        }
      ]
    }
  ];

  // Filter sections based on includeSections prop
  return allSections.filter(section => props.includeSections.includes(section.id));
});

// Event handlers
const handleActionClick = (action: ActionButton) => {
  emit('action-click', action);
};
</script>
