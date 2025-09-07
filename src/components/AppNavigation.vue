<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import NavigationItem from './NavigationItem.vue';
import LatestIssueCard from './LatestIssueCard.vue';
import { useNavigation } from '../composables/useNavigation';
import { useUserSettings } from '../composables/useUserSettings';
import { useFirebase } from '../composables/useFirebase';
import type { NavigationItem as NavigationItemType } from '../types/navigation';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

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

// Account navigation item
const accountItem: NavigationItemType = {
  title: 'Account',
  icon: 'mdi-account-circle',
  link: '/account'
};

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
    <!-- Toggle button -->
    <div class="flex justify-end q-pa-sm">
      <q-btn flat round dense :icon="isMini ? 'mdi-chevron-right' : 'mdi-chevron-left'" @click="toggleMini"
        class="text-grey-6" size="sm" />
    </div>

    <!-- Scrollable navigation area -->
    <div class="navigation-content justify-between">
      <!-- Main navigation items -->
      <q-list class="q-mt-sm">
        <NavigationItem v-for="item in navigationItems" :key="item.title" :item="item" :mini="isMini" />
      </q-list>

      <q-space class="q-mt-lg" />

      <!-- Latest Issue Card -->
      <div class="latest-issue-section">
        <LatestIssueCard :mini="isMini" />
      </div>

      <q-space class="q-mtlg" />
      <!-- Bottom section with Auth and Account -->
      <div class="bottom-section">
        <!-- Authentication Section -->
        <div v-if="!auth.isAuthenticated.value" class="q-pa-sm">
          <q-btn v-if="!isMini" @click="() => auth.signIn('google')" color="primary" icon="mdi-google" label="Sign In"
            :loading="auth.isLoading.value" class="full-width" size="sm" />
          <q-btn v-else @click="() => auth.signIn('google')" color="primary" icon="mdi-google"
            :loading="auth.isLoading.value" round size="sm" />
        </div>

        <!-- User Info (when authenticated) -->
        <div v-else class="q-pa-sm">
          <div v-if="!isMini" class="bg-dark text-white rounded-borders q-pa-sm">
            <div class="row items-center">
              <q-avatar size="24px" class="q-mr-sm">
                <img v-if="auth.currentUser.value?.photoURL" :src="auth.currentUser.value.photoURL" />
                <q-icon v-else name="mdi-account" />
              </q-avatar>
              <div class="col">
                <div class="text-caption text-weight-bold">{{ auth.currentUser.value?.displayName || 'User' }}</div>
                <div class="text-caption text-grey-4">{{ auth.currentUser.value?.email }}</div>
              </div>
            </div>
            <q-btn @click="auth.signOut" flat icon="mdi-logout" label="Sign Out" size="xs"
              class="full-width q-mt-xs text-grey-4" />
          </div>
          <div v-else class="text-center">
            <q-avatar size="32px" class="q-mb-xs">
              <img v-if="auth.currentUser.value?.photoURL" :src="auth.currentUser.value.photoURL" />
              <q-icon v-else name="mdi-account" />
            </q-avatar>
            <q-btn @click="auth.signOut" flat icon="mdi-logout" round size="xs" class="text-grey-4" />
          </div>
        </div>

        <!-- Account Link -->
        <NavigationItem :item="accountItem" :mini="isMini" />
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

  .latest-issue-section {
    margin-left: 0.5rem !important;
    margin-right: 0.5rem;
    display: flex;
    justify-content: center;
  }
}

// Ensure right alignment for full mode
.latest-issue-section {
  display: flex;
  justify-content: flex-end;
}
</style>
