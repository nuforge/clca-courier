<template>
  <div class="metadata-preview">
    <!-- Article Metadata -->
    <div v-if="contentType === 'article'" class="metadata-section">
      <div v-if="metadata.subtitle" class="metadata-item">
        <q-icon name="subtitles" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Subtitle:</span> {{ metadata.subtitle }}
      </div>
      <div v-if="metadata.readTime" class="metadata-item">
        <q-icon name="schedule" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Estimated read time:</span> {{ metadata.readTime }} minutes
      </div>
      <div v-if="metadata.tags && metadata.tags.length > 0" class="metadata-item">
        <q-icon name="label" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Tags:</span>
        <q-chip
          v-for="tag in metadata.tags"
          :key="tag"
          size="sm"
          color="primary"
          text-color="white"
          class="q-ml-xs"
        >
          {{ tag }}
        </q-chip>
      </div>
    </div>

    <!-- Event Metadata -->
    <div v-if="contentType === 'event'" class="metadata-section">
      <div class="metadata-item">
        <q-icon name="event" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Start Date:</span> {{ formatDate(metadata.startDate) }}
      </div>
      <div v-if="metadata.endDate" class="metadata-item">
        <q-icon name="event_available" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">End Date:</span> {{ formatDate(metadata.endDate) }}
      </div>
      <div v-if="metadata.location" class="metadata-item">
        <q-icon name="place" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Location:</span> {{ metadata.location }}
      </div>
      <div class="metadata-item">
        <q-icon name="how_to_reg" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Registration:</span>
        {{ metadata.registrationRequired ? 'Required' : 'Not required' }}
      </div>
      <div v-if="metadata.contactInfo" class="metadata-item">
        <q-icon name="contact_mail" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Contact:</span> {{ metadata.contactInfo }}
      </div>
    </div>

    <!-- Project Metadata -->
    <div v-if="contentType === 'project'" class="metadata-section">
      <div class="metadata-item">
        <q-icon name="flag" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Status:</span>
        <q-chip
          :color="getProjectStatusColor(metadata.projectStatus)"
          text-color="white"
          size="sm"
          class="q-ml-sm"
        >
          {{ formatProjectStatus(metadata.projectStatus) }}
        </q-chip>
      </div>
      <div v-if="metadata.progressPercentage !== undefined" class="metadata-item">
        <q-icon name="trending_up" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Progress:</span> {{ metadata.progressPercentage }}%
      </div>
      <div v-if="metadata.budget" class="metadata-item">
        <q-icon name="attach_money" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Budget:</span> ${{ metadata.budget.toLocaleString() }}
      </div>
      <div v-if="metadata.completionDate" class="metadata-item">
        <q-icon name="event_available" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Target Completion:</span> {{ formatDate(metadata.completionDate) }}
      </div>
    </div>

    <!-- Classified Metadata -->
    <div v-if="contentType === 'classified'" class="metadata-section">
      <div v-if="metadata.price" class="metadata-item">
        <q-icon name="attach_money" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Price:</span> ${{ metadata.price }}
      </div>
      <div class="metadata-item">
        <q-icon name="category" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Category:</span> {{ formatClassifiedCategory(metadata.category) }}
      </div>
      <div class="metadata-item">
        <q-icon name="contact_mail" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Contact:</span> {{ formatContactMethod(metadata.contactMethod) }}
      </div>
      <div v-if="metadata.condition" class="metadata-item">
        <q-icon name="assessment" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Condition:</span> {{ formatCondition(metadata.condition) }}
      </div>
    </div>

    <!-- Photo Story Metadata -->
    <div v-if="contentType === 'photo_story'" class="metadata-section">
      <div v-if="metadata.photographerName" class="metadata-item">
        <q-icon name="camera_alt" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Photographer:</span> {{ metadata.photographerName }}
      </div>
      <div v-if="metadata.photographyDate" class="metadata-item">
        <q-icon name="event" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Photo Date:</span> {{ formatDate(metadata.photographyDate) }}
      </div>
      <div v-if="metadata.location" class="metadata-item">
        <q-icon name="place" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Location:</span> {{ metadata.location }}
      </div>
      <div v-if="metadata.cameraInfo" class="metadata-item">
        <q-icon name="camera" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Camera:</span> {{ metadata.cameraInfo }}
      </div>
    </div>

    <!-- Announcement Metadata -->
    <div v-if="contentType === 'announcement'" class="metadata-section">
      <div class="metadata-item">
        <q-icon name="priority_high" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Urgency:</span>
        <q-chip
          :color="getUrgencyColor(metadata.urgency)"
          text-color="white"
          size="sm"
          class="q-ml-sm"
        >
          {{ formatUrgency(metadata.urgency) }}
        </q-chip>
      </div>
      <div v-if="metadata.expirationDate" class="metadata-item">
        <q-icon name="schedule" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Expires:</span> {{ formatDate(metadata.expirationDate) }}
      </div>
      <div v-if="metadata.affectedAreas && metadata.affectedAreas.length > 0" class="metadata-item">
        <q-icon name="place" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Affected Areas:</span> {{ metadata.affectedAreas.join(', ') }}
      </div>
      <div class="metadata-item">
        <q-icon name="assignment" size="sm" class="q-mr-sm" />
        <span class="text-weight-medium">Action Required:</span>
        {{ metadata.actionRequired ? 'Yes' : 'No' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContentType } from '../../types/core/content.types';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  contentType: ContentType;
}

defineProps<Props>();

// Helper functions
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getProjectStatusColor(status: string): string {
  const colors = {
    planning: 'blue',
    in_progress: 'orange',
    completed: 'green',
  };
  return colors[status as keyof typeof colors] || 'grey';
}

function formatProjectStatus(status: string): string {
  const labels = {
    planning: 'Planning',
    in_progress: 'In Progress',
    completed: 'Completed',
  };
  return labels[status as keyof typeof labels] || status;
}

function formatClassifiedCategory(category: string): string {
  const labels = {
    for_sale: 'For Sale',
    wanted: 'Wanted',
    services: 'Services',
    housing: 'Housing',
  };
  return labels[category as keyof typeof labels] || category;
}

function formatContactMethod(method: string): string {
  const labels = {
    email: 'Email',
    phone: 'Phone',
    both: 'Email & Phone',
  };
  return labels[method as keyof typeof labels] || method;
}

function formatCondition(condition: string): string {
  const labels = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  };
  return labels[condition as keyof typeof labels] || condition;
}

function getUrgencyColor(urgency: string): string {
  const colors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    urgent: 'red-10',
  };
  return colors[urgency as keyof typeof colors] || 'grey';
}

function formatUrgency(urgency: string): string {
  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[urgency as keyof typeof labels] || urgency;
}
</script>

<style scoped>
.metadata-preview {
  width: 100%;
}

.metadata-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.metadata-item:last-child {
  border-bottom: none;
}

/* Dark theme support */
.body--dark .metadata-item {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}
</style>
