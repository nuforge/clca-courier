<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from './NavigationItem.vue';
import LatestIssueNavigation from './CurrentProject.vue';
import LanguageSelector from './LanguageSelector.vue';
import { useNavigation } from '../composables/useNavigation';
import { useUserSettings } from '../composables/useUserSettings';
import { useFirebase } from '../composables/useFirebase';
import { UI_ICONS } from '../constants/ui-icons';
import { TRANSLATION_KEYS } from '../i18n/utils/translation-keys';
import type { NavigationItem as NavigationItemType } from '../types/navigation';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Translation function
const { t } = useI18n();

// Use the navigation composable
const { navigationItems } = useNavigation();

// Use user settings for persistent mini state
const { sideMenuCollapsed, setSideMenuCollapsed } = useUserSettings();

// Firebase authentication
const { auth } = useFirebase();

// Mini state for collapsed sidebar - initialize from user settings
const isMini = ref(sideMenuCollapsed.value);

// Watch for changes in user settings and update local state
watch(sideMenuCollapsed, (collapsed: boolean) => {
  isMini.value = collapsed;
});

// Watch for changes in local state and persist to user settings
watch(isMini, (mini: boolean) => {
  void setSideMenuCollapsed(mini);
});

// Debug watcher for auth state changes
watch(() => auth.currentUser.value?.photoURL, (newPhotoURL, oldPhotoURL) => {
  console.log('Avatar URL changed:', {
    old: oldPhotoURL?.substring(0, 50),
    new: newPhotoURL?.substring(0, 50),
    hasData: newPhotoURL?.startsWith('data:')
  });
}, { immediate: true });

// Settings navigation item
const settingsItem = computed((): NavigationItemType => ({
  title: t(TRANSLATION_KEYS.NAVIGATION.SETTINGS),
  icon: UI_ICONS.cog,
  link: '/settings'
}));

// Admin navigation items
const adminItems = computed(() => {
  if (!auth.isAuthenticated.value) return [];

  const items: NavigationItemType[] = [];

  // Admin Dashboard
  items.push({
    title: t(TRANSLATION_KEYS.NAVIGATION.ADMIN),
    icon: UI_ICONS.shield,
    link: '/admin'
  });

  return items;
});

// Computed properties
// None needed for navigation-specific functionality

// Toggle mini mode
const toggleMini = () => {
  isMini.value = !isMini.value;
};

// Create a computed property for two-way binding
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});
</script>

<template>
  <q-drawer v-model="isOpen" show-if-above class="bg-dark navigation-drawer" :mini="isMini" :width="280"
    :mini-width="60">
    <!-- Flexbox container that fills the drawer height -->
    <div class="column no-wrap full-height">
      <!-- Top section with toggle button -->
      <div class="flex justify-end q-pa-sm">
        <q-btn flat round dense :icon="isMini ? UI_ICONS.chevronRight : UI_ICONS.chevronLeft" @click="toggleMini"
          class="text-grey-6" size="sm" />
      </div>

      <!-- Main navigation items -->
      <q-list class="q-mt-sm">
        <NavigationItem v-for="item in navigationItems" :key="item.title" :item="item" :mini="isMini" />
      </q-list>

      <!-- Latest Issue Section -->
      <LatestIssueNavigation :mini="isMini" />

      <!-- Spacer to push bottom content down -->
      <q-space />

      <!-- Bottom section with Auth, Admin, and Settings - Always at bottom -->
      <div class="bottom-section">

        <!-- Language Selector -->
        <div class="q-pa-sm">
          <LanguageSelector
            :mini="isMini"
            :dropdown="true"
            size="sm"
          />
        </div>

        <!-- Admin Links (when authenticated) -->
        <div v-if="auth.isAuthenticated.value">
          <NavigationItem
            v-for="item in adminItems"
            :key="item.title"
            :item="item"
            :mini="isMini"
          />
        </div>

        <!-- Settings Link -->
        <NavigationItem :item="settingsItem" :mini="isMini" />

         <!-- Authentication Section -->
        <div v-if="!auth.isAuthenticated.value" class="q-pa-sm">
          <q-btn
            v-if="!isMini"
            @click="() => auth.signIn('google')"
            color="primary"
            :icon="UI_ICONS.login"
            :label="t(TRANSLATION_KEYS.AUTH.SIGN_IN)"
            :loading="auth.isLoading.value"
            class="full-width"
            size="sm"
          />
          <q-btn
            v-else
            @click="() => auth.signIn('google')"
            color="primary"
            :icon="UI_ICONS.login"
            :loading="auth.isLoading.value"
            round
            size="sm"
          />
        </div>

        <!-- User Info (when authenticated) -->
        <div v-else class="q-pa-sm">
          <div v-if="!isMini" class="bg-dark text-white rounded-borders q-pa-sm">
            <div class="row items-center">
              <q-avatar size="24px" class="q-mr-sm">
                <img
                  v-if="auth.currentUser.value?.photoURL"
                  :src="auth.currentUser.value.photoURL"
                  alt="User Avatar"
                  @load="() => console.log('Avatar loaded:', auth.currentUser.value?.photoURL?.substring(0, 50))"
                  @error="() => console.log('Avatar failed to load')"
                />
                <q-icon v-else :name="UI_ICONS.account" />
              </q-avatar>
              <div class="col">
                <div class="text-caption text-weight-bold">{{ auth.currentUser.value?.displayName || 'User' }}</div>
                <div class="text-caption text-grey-4">{{ auth.currentUser.value?.email }}</div>
              </div>
            </div>
            <q-btn
              @click="auth.signOut"
              flat
              :icon="UI_ICONS.logout"
              :label="t(TRANSLATION_KEYS.AUTH.SIGN_OUT)"
              size="xs"
              class="full-width q-mt-xs text-grey-4"
            />
          </div>
          <div v-else class="text-center">
            <q-btn @click="auth.signOut" flat :icon="UI_ICONS.logout" round size="xs" class="text-grey-4" />
            <q-avatar size="32px" class="q-mb-xs">
              <img
                v-if="auth.currentUser.value?.photoURL"
                :src="auth.currentUser.value.photoURL"
                alt="User Avatar"
                @load="() => console.log('Mini avatar loaded:', auth.currentUser.value?.photoURL?.substring(0, 50))"
                @error="() => console.log('Mini avatar failed to load')"
              />
              <q-icon v-else :name="UI_ICONS.account" />
            </q-avatar>
          </div>
        </div>
      </div>
    </div>
  </q-drawer>
</template>

<style lang="scss" scoped>
// Navigation drawer font styling
.navigation-drawer {
  :deep(.q-item__label) {
    font-family: 'Outfit', 'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Futura', 'Trebuchet MS', sans-serif;
    font-weight: 400;
  }
}

.nav-item {
  border-bottom-left-radius: 8px;
  border-top-left-radius: 8px;
  transition: all 0.3s ease;
  color: white;

  &:hover {
    background-color: rgba(var(--q-primary-rgb), 0.1);
  }
}

// Ensure proper spacing in mini mode
.q-drawer--mini {
  .q-item {
    justify-content: center;
  }

  .q-separator {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
}

// Bottom section styling
.bottom-section {
  // Ensure bottom section stays at bottom with proper spacing
  flex-shrink: 0;
}
</style>
