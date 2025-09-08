<!-- Test component to verify logout protection works -->
<template>
  <div v-if="isAuthenticated" class="q-pa-md">
    <h6>Auth Debug Panel</h6>
    <p><strong>Current Route:</strong> {{ currentRoute.path }}</p>
    <p><strong>Is Protected:</strong> {{ routeProtection.isProtected }}</p>
    <p><strong>Required Role:</strong> {{ routeProtection.requiredRole || 'none' }}</p>
    <p><strong>Your Role:</strong> {{ userRole }}</p>
    <p><strong>Access Granted:</strong> {{ hasAccess ? 'Yes' : 'No' }}</p>

    <q-btn
      v-if="isAuthenticated"
      @click="testLogout"
      color="negative"
      icon="mdi-logout"
      label="Test Logout Protection"
      class="q-mt-md"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRoleAuth } from '../composables/useRoleAuth';
import { useFirebase } from '../composables/useFirebase';

const router = useRouter();
const { auth } = useFirebase();
const {
  isAuthenticated,
  userRole,
  hasRole,
  isCurrentRouteProtected
} = useRoleAuth();

const currentRoute = computed(() => router.currentRoute.value);
const routeProtection = computed(() => isCurrentRouteProtected());
const hasAccess = computed(() => {
  if (!routeProtection.value.isProtected) return true;
  if (!routeProtection.value.requiredRole) return true;
  return hasRole(routeProtection.value.requiredRole);
});

const testLogout = async () => {
  await auth.signOut();
};
</script>
