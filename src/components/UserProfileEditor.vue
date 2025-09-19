<!--
  UserProfileEditor Component

  Volunteer workflow user profile editor for tags and availability.
  Allows users to edit their volunteer-specific profile information while
  preserving existing preferences and preventing role/permission changes.

  Built following Week 1 Volunteer Workflow implementation plan.
-->
<template>
  <q-card>
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon name="person" class="q-mr-sm" />
        {{ $t('profile.editor.title') }}
      </div>
      <p class="text-body2 text-grey-6">
        {{ $t('profile.editor.description') }}
      </p>
    </q-card-section>

    <q-card-section>
      <!-- Basic Profile Information -->
      <div class="q-mb-lg">
        <div class="text-subtitle2 q-mb-md">{{ $t('profile.editor.basicInfo') }}</div>

        <q-input
          v-model="localProfile.displayName"
          :label="$t('profile.editor.displayName')"
          outlined
          dense
          :rules="[val => !!val || $t('profile.editor.displayNameRequired')]"
          class="q-mb-md"
        />

        <q-select
          v-model="localProfile.availability"
          :options="availabilityOptions"
          :label="$t('profile.editor.availability')"
          outlined
          dense
          emit-value
          map-options
          class="q-mb-md"
        />
      </div>

      <!-- Tags Section -->
      <div class="q-mb-lg">
        <div class="text-subtitle2 q-mb-md">{{ $t('profile.editor.tags') }}</div>
        <p class="text-caption text-grey-6 q-mb-md">
          {{ $t('profile.editor.tagsDescription') }}
        </p>

        <!-- Add New Tag -->
        <div class="row q-mb-md">
          <div class="col-12 col-md-8 q-pr-sm">
            <q-input
              v-model="newTag"
              :label="$t('profile.editor.newTag')"
              outlined
              dense
              :placeholder="$t('profile.editor.tagPlaceholder')"
              @keyup.enter="addTag"
              :error="!!tagError"
              :error-message="tagError"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-btn
              :label="$t('profile.editor.addTag')"
              icon="add"
              color="primary"
              @click="addTag"
              :disable="!newTag.trim()"
              class="full-width"
            />
          </div>
        </div>

        <!-- Existing Tags -->
        <div v-if="localProfile.tags.length > 0" class="q-mb-md">
          <div class="text-caption text-grey-6 q-mb-sm">
            {{ $t('profile.editor.currentTags') }}
          </div>
          <div class="row q-col-gutter-sm">
            <div
              v-for="tag in localProfile.tags"
              :key="tag"
              class="col-auto"
            >
              <q-chip
                :label="tag"
                removable
                color="primary"
                text-color="white"
                @remove="removeTag(tag)"
              >
                <q-icon :name="getTagIcon(tag)" size="xs" class="q-mr-xs" />
              </q-chip>
            </div>
          </div>
        </div>

        <!-- Tag Suggestions -->
        <div v-if="suggestedTags.length > 0" class="q-mb-md">
          <div class="text-caption text-grey-6 q-mb-sm">
            {{ $t('profile.editor.suggestedTags') }}
          </div>
          <div class="row q-col-gutter-sm">
            <div
              v-for="tag in suggestedTags"
              :key="tag"
              class="col-auto"
            >
              <q-chip
                :label="tag"
                clickable
                outline
                color="primary"
                @click="addSuggestedTag(tag)"
              >
                <q-icon :name="getTagIcon(tag)" size="xs" class="q-mr-xs" />
              </q-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="q-mb-lg">
        <div class="text-subtitle2 q-mb-md">{{ $t('profile.editor.preferences') }}</div>

        <q-toggle
          v-model="localProfile.preferences.taskAssignments"
          :label="$t('profile.editor.taskAssignments')"
          class="q-mb-sm"
        />

        <q-toggle
          v-model="localProfile.preferences.emailNotifications"
          :label="$t('profile.editor.emailNotifications')"
          class="q-mb-sm"
        />

        <q-toggle
          v-model="localProfile.preferences.pushNotifications"
          :label="$t('profile.editor.pushNotifications')"
        />
      </div>
    </q-card-section>

    <q-card-actions align="right" class="q-pa-md">
      <q-btn
        :label="$t('common.cancel')"
        flat
        color="grey"
        @click="cancel"
        :disable="isSaving"
      />
      <q-btn
        :label="$t('common.save')"
        color="primary"
        @click="saveProfile"
        :loading="isSaving"
        :disable="!hasChanges"
      />
    </q-card-actions>

    <!-- Loading overlay -->
    <q-inner-loading :showing="isLoading">
      <q-spinner-dots size="50px" color="primary" />
    </q-inner-loading>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { logger } from '../utils/logger';
import { userUtils } from '../utils/userUtils';
import { useFirebaseUserProfile } from '../composables/useFirebase';
import { getCurrentTimestamp } from '../utils/date-formatter';
import type { UserProfile } from '../services/firebase-firestore.service';

// Props
interface Props {
  userProfile: UserProfile;
}

// Emits
interface Emits {
  (e: 'profile-updated', profile: UserProfile): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composables
const $q = useQuasar();
const { t } = useI18n();
const { updateUserProfile } = useFirebaseUserProfile();

// State
const localProfile = ref<UserProfile>({ ...props.userProfile });
const newTag = ref('');
const tagError = ref('');
const isLoading = ref(false);
const isSaving = ref(false);

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(localProfile.value) !== JSON.stringify(props.userProfile);
});

const availabilityOptions = computed(() => [
  { label: t('profile.availability.regular'), value: 'regular' },
  { label: t('profile.availability.occasional'), value: 'occasional' },
  { label: t('profile.availability.onCall'), value: 'on-call' }
]);

const suggestedTags = computed(() => {
  const commonTags = [
    'skill:writing',
    'skill:design',
    'skill:photography',
    'skill:proofreading',
    'skill:translation',
    'language:english',
    'language:spanish',
    'language:german',
    'interest:community',
    'interest:events',
    'interest:newsletter'
  ];

  return commonTags.filter(tag => !localProfile.value.tags.includes(tag));
});

// Methods
const getTagIcon = (tag: string): string => {
  const namespace = tag.split(':')[0];
  const iconMap: Record<string, string> = {
    skill: 'build',
    language: 'translate',
    interest: 'favorite',
    default: 'local_offer'
  };
  return iconMap[namespace] || iconMap.default;
};

const validateTag = (tag: string): string | null => {
  if (!tag.trim()) {
    return t('profile.editor.tagRequired');
  }

  if (!userUtils.isValidTag(tag)) {
    return t('profile.editor.tagFormatInvalid');
  }

  if (localProfile.value.tags.includes(tag)) {
    return t('profile.editor.tagExists');
  }

  return null;
};

const addTag = (): void => {
  const trimmedTag = newTag.value.trim().toLowerCase();
  const validation = validateTag(trimmedTag);

  if (validation) {
    tagError.value = validation;
    return;
  }

  localProfile.value.tags = userUtils.addTag(localProfile.value, trimmedTag);
  newTag.value = '';
  tagError.value = '';

  logger.info('Tag added:', trimmedTag);
};

const addSuggestedTag = (tag: string): void => {
  localProfile.value.tags = userUtils.addTag(localProfile.value, tag);
  logger.info('Suggested tag added:', tag);
};

const removeTag = (tag: string): void => {
  localProfile.value.tags = userUtils.removeTag(localProfile.value, tag);
  logger.info('Tag removed:', tag);
};

const saveProfile = async (): Promise<void> => {
  if (!hasChanges.value) {
    return;
  }

  isSaving.value = true;

  try {
    // Prepare update data - exclude fields that users cannot change
    const updates: Partial<UserProfile> = {
      displayName: localProfile.value.displayName,
      tags: localProfile.value.tags,
      availability: localProfile.value.availability,
      preferences: localProfile.value.preferences,
      lastLoginAt: new Date(getCurrentTimestamp()).toISOString()
    };

    await updateUserProfile(props.userProfile.uid, updates);

    // Update the local profile with the saved changes
    const updatedProfile = { ...localProfile.value, ...updates };
    emit('profile-updated', updatedProfile);

    $q.notify({
      type: 'positive',
      message: t('profile.editor.saveSuccess'),
      icon: 'check_circle'
    });

    logger.success('User profile updated successfully');
  } catch (error) {
    logger.error('Failed to save profile:', error);

    $q.notify({
      type: 'negative',
      message: t('profile.editor.saveError'),
      icon: 'error'
    });
  } finally {
    isSaving.value = false;
  }
};

const cancel = (): void => {
  if (hasChanges.value) {
    $q.dialog({
      title: t('common.confirmCancel'),
      message: t('profile.editor.unsavedChanges'),
      cancel: true,
      persistent: true
    }).onOk(() => {
      // Reset to original profile
      localProfile.value = { ...props.userProfile };
      emit('cancel');
    });
  } else {
    emit('cancel');
  }
};

// Watch for external profile changes
watch(() => props.userProfile, (newProfile) => {
  localProfile.value = { ...newProfile };
}, { deep: true });

// Clear tag error when typing
watch(() => newTag.value, () => {
  if (tagError.value) {
    tagError.value = '';
  }
});

// Initialize defaults for backward compatibility
onMounted(() => {
  if (!localProfile.value.tags) {
    localProfile.value.tags = [];
  }
  if (!localProfile.value.availability) {
    localProfile.value.availability = 'occasional';
  }
  if (!localProfile.value.preferences?.taskAssignments) {
    localProfile.value.preferences = {
      ...localProfile.value.preferences,
      taskAssignments: true
    };
  }
});
</script>
