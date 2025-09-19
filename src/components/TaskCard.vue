<!--
  TaskCard - Individual task display with actions
  Volunteer workflow system component for displaying editorial tasks
-->
<template>
  <q-card
    class="task-card"
    :class="cardClasses"
    bordered
  >
    <q-card-section>
      <!-- Task Header -->
      <div class="row items-center q-mb-sm">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">
            {{ taskDetails.contentTitle }}
          </div>
          <div class="text-caption text-grey-6">
            {{ $t('tasks.card.content_by') }} {{ taskDetails.contentAuthor }}
          </div>
        </div>
        <div class="col-auto">
          <q-chip
            :color="priorityColor"
            text-color="white"
            :icon="priorityIcon"
            size="sm"
          >
            {{ $t(`tasks.priority.${task.priority}`) }}
          </q-chip>
        </div>
      </div>

      <!-- Task Category and Status -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <q-chip
            :color="categoryColor"
            text-color="white"
            :icon="categoryIcon"
            size="md"
          >
            {{ $t(`tasks.category.${task.category}`) }}
          </q-chip>
        </div>
        <div class="col-auto">
          <q-chip
            :color="statusColor"
            :text-color="statusTextColor"
            :icon="statusIcon"
            size="md"
          >
            {{ $t(`tasks.status.${task.status}`) }}
          </q-chip>
        </div>
      </div>

      <!-- Task Details -->
      <div class="task-details q-mb-md">
        <!-- Estimated Time -->
        <div class="row items-center q-mb-xs">
          <q-icon name="schedule" class="q-mr-xs text-grey-6" size="sm" />
          <span class="text-body2">
            {{ $t('tasks.card.estimated_time') }}: {{ task.estimatedTime }} {{ $t('common.minutes') }}
          </span>
        </div>

        <!-- Due Date -->
        <div v-if="task.dueDate" class="row items-center q-mb-xs">
          <q-icon
            :name="isOverdue ? 'warning' : 'event'"
            :class="isOverdue ? 'text-negative' : 'text-grey-6'"
            class="q-mr-xs"
            size="sm"
          />
          <span
            class="text-body2"
            :class="isOverdue ? 'text-negative text-weight-medium' : ''"
          >
            {{ $t('tasks.card.due_date') }}: {{ formatDueDate(task.dueDate) }}
            <span v-if="timeRemaining !== undefined" class="q-ml-xs">
              ({{ formatTimeRemaining(timeRemaining) }})
            </span>
          </span>
        </div>

        <!-- Assigned User -->
        <div v-if="task.assignedTo" class="row items-center q-mb-xs">
          <q-icon name="person" class="q-mr-xs text-grey-6" size="sm" />
          <span class="text-body2">
            {{ $t('tasks.card.assigned_to') }}:
            {{ taskDetails.assignedUserName || task.assignedTo }}
          </span>
        </div>

        <!-- Instructions -->
        <div v-if="task.instructions" class="q-mt-sm">
          <div class="text-body2 text-weight-medium q-mb-xs">
            {{ $t('tasks.card.instructions') }}:
          </div>
          <div class="text-body2 text-grey-7 q-pl-md">
            {{ task.instructions }}
          </div>
        </div>
      </div>

      <!-- Created/Updated Timestamps -->
      <div class="row items-center text-caption text-grey-5 q-mb-md">
        <div class="col">
          {{ $t('tasks.card.created') }}: {{ formatDateTime(task.createdAt, 'SHORT_WITH_TIME') }}
        </div>
        <div class="col-auto" v-if="task.updatedAt && task.updatedAt !== task.createdAt">
          {{ $t('tasks.card.updated') }}: {{ formatDateTime(task.updatedAt, 'SHORT_WITH_TIME') }}
        </div>
      </div>
    </q-card-section>

    <!-- Action Buttons -->
    <q-card-actions v-if="showActions" align="right">
      <!-- Claim Task -->
      <q-btn
        v-if="canClaim"
        color="primary"
        :icon="UI_ICONS.accountPlus"
        :label="$t('tasks.actions.claim')"
        @click="claimTask"
        :loading="isClaimLoading"
        :aria-label="$t('tasks.actions.claim_task_aria', { title: taskDetails.contentTitle })"
      />

      <!-- Start Task -->
      <q-btn
        v-if="canStart"
        color="secondary"
        :icon="UI_ICONS.play"
        :label="$t('tasks.actions.start')"
        @click="startTask"
        :loading="isUpdateLoading"
        :aria-label="$t('tasks.actions.start_task_aria', { title: taskDetails.contentTitle })"
      />

      <!-- Complete Task -->
      <q-btn
        v-if="canComplete"
        color="positive"
        :icon="UI_ICONS.checkCircle"
        :label="$t('tasks.actions.complete')"
        @click="completeTask"
        :loading="isUpdateLoading"
        :aria-label="$t('tasks.actions.complete_task_aria', { title: taskDetails.contentTitle })"
      />

      <!-- View Content -->
      <q-btn
        flat
        color="info"
        :icon="UI_ICONS.eye"
        :label="$t('tasks.actions.view_content')"
        @click="viewContent"
        :aria-label="$t('tasks.actions.view_content_aria', { title: taskDetails.contentTitle })"
      />

      <!-- Admin Actions -->
      <q-btn
        v-if="showAdminActions"
        flat
        color="warning"
        :icon="UI_ICONS.cog"
        :label="$t('tasks.actions.manage')"
        @click="showManageDialog"
        :aria-label="$t('tasks.actions.manage_task_aria', { title: taskDetails.contentTitle })"
      />
    </q-card-actions>

    <!-- Task Management Dialog (Admin) -->
    <q-dialog v-model="showManageTaskDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('tasks.manage.title') }}</div>
          <div class="text-subtitle2 text-grey-6">{{ taskDetails.contentTitle }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- Reassign Task -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">{{ $t('tasks.manage.reassign') }}</div>
            <q-select
              v-model="selectedUser"
              :options="availableUsers"
              option-label="displayName"
              option-value="uid"
              emit-value
              map-options
              :label="$t('tasks.manage.select_user')"
              outlined
              clearable
            />
          </div>

          <!-- Update Status -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">{{ $t('tasks.manage.status') }}</div>
            <q-select
              v-model="selectedStatus"
              :options="statusOptions"
              :label="$t('tasks.manage.select_status')"
              outlined
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="grey" v-close-popup />
          <q-btn
            :label="$t('common.save')"
            color="primary"
            @click="saveTaskChanges"
            :loading="isUpdateLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { taskService } from '../services/task.service';
import { firestoreService } from '../services/firebase-firestore.service';
import { firebaseAuthService } from '../services/firebase-auth.service';
import { logger } from '../utils/logger';
import { formatDateTime } from '../utils/date-formatter';
import { UI_ICONS } from '../constants/ui-icons';
import type { TaskDetails, TaskStatus } from '../services/task.service';
import type { UserProfile } from '../services/firebase-firestore.service';

// Props
interface Props {
  taskDetails: TaskDetails;
  showActions?: boolean;
  showAdminActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  showAdminActions: false
});

// Emits
const emit = defineEmits<{
  taskUpdated: [taskDetails: TaskDetails];
  viewContent: [contentId: string];
}>();

// Composables
const $q = useQuasar();
const { t } = useI18n();

// Computed properties from task details
const task = computed(() => props.taskDetails.task);
const isOverdue = computed(() => props.taskDetails.isOverdue || false);
const timeRemaining = computed(() => props.taskDetails.timeRemaining);

// State
const isClaimLoading = ref(false);
const isUpdateLoading = ref(false);
const showManageTaskDialog = ref(false);
const selectedUser = ref<string>('');
const selectedStatus = ref<TaskStatus>(task.value.status);
const availableUsers = ref<UserProfile[]>([]);

// Current user
const currentUser = computed(() => firebaseAuthService.getCurrentUser());
const currentUserId = computed(() => currentUser.value?.uid);

// Card styling
const cardClasses = computed(() => ({
  'task-card--high-priority': task.value.priority === 'high',
  'task-card--overdue': isOverdue.value,
  'task-card--assigned': !!task.value.assignedTo,
  'task-card--completed': task.value.status === 'completed'
}));

// Priority styling
const priorityColor = computed(() => {
  const colors = {
    low: 'blue-grey',
    medium: 'orange',
    high: 'red'
  };
  return colors[task.value.priority];
});

const priorityIcon = computed(() => {
  const icons = {
    low: 'low_priority',
    medium: 'priority_high',
    high: 'priority_high'
  };
  return icons[task.value.priority];
});

// Category styling
const categoryColor = computed(() => {
  const colors = {
    review: 'blue',
    layout: 'purple',
    'fact-check': 'teal',
    approve: 'green',
    print: 'brown'
  };
  return colors[task.value.category];
});

const categoryIcon = computed(() => {
  const icons = {
    review: 'rate_review',
    layout: 'design_services',
    'fact-check': 'fact_check',
    approve: 'approval',
    print: 'print'
  };
  return icons[task.value.category];
});

// Status styling
const statusColor = computed(() => {
  const colors = {
    unclaimed: 'grey-4',
    claimed: 'orange',
    'in-progress': 'blue',
    completed: 'green'
  };
  return colors[task.value.status];
});

const statusTextColor = computed(() => {
  return task.value.status === 'unclaimed' ? 'grey-8' : 'white';
});

const statusIcon = computed(() => {
  const icons = {
    unclaimed: 'radio_button_unchecked',
    claimed: 'person',
    'in-progress': 'play_circle',
    completed: 'check_circle'
  };
  return icons[task.value.status];
});

// Action permissions
const canClaim = computed(() => {
  return task.value.status === 'unclaimed' && currentUserId.value;
});

const canStart = computed(() => {
  return task.value.status === 'claimed' &&
         task.value.assignedTo === currentUserId.value;
});

const canComplete = computed(() => {
  return task.value.status === 'in-progress' &&
         task.value.assignedTo === currentUserId.value;
});

// Status options for admin
const statusOptions = computed(() => [
  { label: t('tasks.status.unclaimed'), value: 'unclaimed' },
  { label: t('tasks.status.claimed'), value: 'claimed' },
  { label: t('tasks.status.in-progress'), value: 'in-progress' },
  { label: t('tasks.status.completed'), value: 'completed' }
]);

// Methods
const claimTask = async () => {
  if (!currentUserId.value) return;

  isClaimLoading.value = true;
  try {
    await taskService.assignTask(props.taskDetails.contentId, currentUserId.value, 'self-claimed');

    $q.notify({
      type: 'positive',
      message: t('tasks.notifications.task_claimed'),
      caption: props.taskDetails.contentTitle
    });

    // Update task details
    const updatedTask = { ...props.taskDetails };
    updatedTask.task.status = 'claimed';
    updatedTask.task.assignedTo = currentUserId.value;
    emit('taskUpdated', updatedTask);

  } catch (error) {
    logger.error('Failed to claim task', {
      contentId: props.taskDetails.contentId,
      error
    });

    $q.notify({
      type: 'negative',
      message: t('tasks.notifications.claim_failed'),
      caption: error instanceof Error ? error.message : t('errors.unknown')
    });
  } finally {
    isClaimLoading.value = false;
  }
};

const startTask = async () => {
  await updateTaskStatus('in-progress');
};

const completeTask = async () => {
  await updateTaskStatus('completed');
};

const updateTaskStatus = async (status: TaskStatus) => {
  isUpdateLoading.value = true;
  try {
    await taskService.updateTaskStatus(props.taskDetails.contentId, status);

    $q.notify({
      type: 'positive',
      message: t(`tasks.notifications.status_updated_to_${status}`),
      caption: props.taskDetails.contentTitle
    });

    // Update task details
    const updatedTask = { ...props.taskDetails };
    updatedTask.task.status = status;
    emit('taskUpdated', updatedTask);

  } catch (error) {
    logger.error('Failed to update task status', {
      contentId: props.taskDetails.contentId,
      status,
      error
    });

    $q.notify({
      type: 'negative',
      message: t('tasks.notifications.status_update_failed'),
      caption: error instanceof Error ? error.message : t('errors.unknown')
    });
  } finally {
    isUpdateLoading.value = false;
  }
};

const viewContent = () => {
  emit('viewContent', props.taskDetails.contentId);
};

const showManageDialog = async () => {
  try {
    // Load available users for reassignment
    const profiles = await firestoreService.getUserProfiles();
    availableUsers.value = profiles.filter(p =>
      p.isApproved &&
      p.preferences?.taskAssignments &&
      ['contributor', 'canva_contributor', 'editor', 'moderator', 'administrator'].includes(p.role)
    );

    selectedUser.value = task.value.assignedTo || '';
    selectedStatus.value = task.value.status;
    showManageTaskDialog.value = true;

  } catch (error) {
    logger.error('Failed to load users for task management', { error });
    $q.notify({
      type: 'negative',
      message: t('tasks.notifications.load_users_failed')
    });
  }
};

const saveTaskChanges = async () => {
  isUpdateLoading.value = true;
  try {
    // Update assignment if changed
    if (selectedUser.value !== task.value.assignedTo) {
      if (selectedUser.value) {
        await taskService.assignTask(props.taskDetails.contentId, selectedUser.value, 'manual');
      }
    }

    // Update status if changed
    if (selectedStatus.value !== task.value.status) {
      await taskService.updateTaskStatus(props.taskDetails.contentId, selectedStatus.value);
    }

    $q.notify({
      type: 'positive',
      message: t('tasks.notifications.task_updated')
    });

    // Update task details
    const updatedTask = { ...props.taskDetails };
    updatedTask.task.status = selectedStatus.value;
    updatedTask.task.assignedTo = selectedUser.value || undefined;
    emit('taskUpdated', updatedTask);

    showManageTaskDialog.value = false;

  } catch (error) {
    logger.error('Failed to save task changes', { error });
    $q.notify({
      type: 'negative',
      message: t('tasks.notifications.task_update_failed'),
      caption: error instanceof Error ? error.message : t('errors.unknown')
    });
  } finally {
    isUpdateLoading.value = false;
  }
};

const formatDueDate = (dueDate: any) => {
  return formatDateTime(dueDate, 'SHORT_WITH_TIME');
};

const formatTimeRemaining = (minutes: number) => {
  if (minutes < 0) {
    return t('tasks.card.overdue_by', { time: formatDuration(Math.abs(minutes)) });
  }
  return t('tasks.card.due_in', { time: formatDuration(minutes) });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return t('common.minutes_short', { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return t('common.hours_short', { count: hours });
  }
  return `${hours}h ${remainingMinutes}m`;
};
</script>

<style scoped>
.task-card {
  transition: all 0.2s ease;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-card--high-priority {
  border-left: 4px solid var(--q-negative);
}

.task-card--overdue {
  border-left: 4px solid var(--q-negative);
  background-color: #fff5f5;
}

.task-card--assigned {
  border-left: 4px solid var(--q-primary);
}

.task-card--completed {
  opacity: 0.8;
  border-left: 4px solid var(--q-positive);
}

.task-details {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}
</style>

