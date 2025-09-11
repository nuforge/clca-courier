/**
 * User Roles Composable
 * Vue 3 composable for the enhanced role-based system
 */

import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFirebase } from './useFirebase';
import { userRoleService } from '../services/user-role.service';
import { logger } from '../utils/logger';
import type {
  UserRoleType,
  Permission,
  UserRoleConfig,
  DashboardConfig,
  PermissionContext,
} from '../types/core/user-roles.types';
import { hasRoleHierarchy } from '../types/core/user-roles.types';

export function useUserRoles() {
  const router = useRouter();
  const { auth } = useFirebase();

  // Reactive state
  const userRole = ref<UserRoleType>('member');
  const roleConfig = ref<UserRoleConfig | null>(null);
  const dashboardConfig = ref<DashboardConfig | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const isAuthenticated = computed(() => auth.isAuthenticated.value);
  const isAuthLoading = computed(() => auth.isLoading.value);
  const currentUser = computed(() => auth.currentUser.value);

  // Role hierarchy checks
  const isMember = computed(() => hasRoleHierarchy(userRole.value, 'member'));
  const isContributor = computed(() => hasRoleHierarchy(userRole.value, 'contributor'));
  const isCanvaContributor = computed(() => hasRoleHierarchy(userRole.value, 'canva_contributor'));
  const isEditor = computed(() => hasRoleHierarchy(userRole.value, 'editor'));
  const isModerator = computed(() => hasRoleHierarchy(userRole.value, 'moderator'));
  const isAdministrator = computed(() => userRole.value === 'administrator');

  // Check if we're ready to make authorization decisions
  const isReady = computed(() => {
    return !isAuthLoading.value && !isLoading.value;
  });

  /**
   * Load user's role and configuration
   */
  const loadUserRole = async (): Promise<void> => {
    if (!isAuthenticated.value || !currentUser.value) {
      userRole.value = 'member';
      roleConfig.value = null;
      dashboardConfig.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Get user's current role
      const role = await userRoleService.getUserRole(currentUser.value.uid);
      userRole.value = role;

      // Load role configuration
      const config = await userRoleService.getRoleConfig(role);
      roleConfig.value = config;

      // Load dashboard configuration
      const dashConfig = await userRoleService.getDashboardConfig(currentUser.value.uid);
      dashboardConfig.value = dashConfig;

      logger.debug('User role loaded:', {
        uid: currentUser.value.uid,
        role,
        permissions: config?.permissions.length || 0,
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load user role';
      logger.error('Failed to load user role:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = async (
    permission: Permission,
    context?: PermissionContext
  ): Promise<boolean> => {
    if (!currentUser.value) {
      return false;
    }

    try {
      return await userRoleService.hasPermission(currentUser.value.uid, permission, context);
    } catch (err) {
      logger.error(`Failed to check permission ${permission}:`, err);
      return false;
    }
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = async (permissions: Permission[]): Promise<boolean> => {
    if (!currentUser.value) {
      return false;
    }

    try {
      return await userRoleService.hasAnyPermission(currentUser.value.uid, permissions);
    } catch (err) {
      logger.error('Failed to check permissions:', err);
      return false;
    }
  };

  /**
   * Check if user has specific role or higher
   */
  const hasRole = (requiredRole: UserRoleType): boolean => {
    return hasRoleHierarchy(userRole.value, requiredRole);
  };

  /**
   * Request role change
   */
  const requestRole = async (requestedRole: UserRoleType, reason: string): Promise<string> => {
    if (!currentUser.value) {
      throw new Error('User must be authenticated to request role change');
    }

    try {
      const requestId = await userRoleService.requestRole(
        currentUser.value.uid,
        requestedRole,
        reason
      );

      logger.info(`Role request submitted: ${requestedRole}`);
      return requestId;
    } catch (err) {
      logger.error('Failed to submit role request:', err);
      throw err;
    }
  };

  /**
   * Navigate to user's default dashboard
   */
  const navigateToDashboard = (): void => {
    const defaultRoute = roleConfig.value?.dashboardRoute || '/dashboard';

    if (router.currentRoute.value.path !== defaultRoute) {
      void router.push(defaultRoute);
    }
  };

  /**
   * Route guard for role-based access
   */
  const requiresRole = (requiredRole: UserRoleType): boolean => {
    if (!isReady.value) {
      return false; // Still loading
    }

    if (!isAuthenticated.value) {
      return false; // Not authenticated
    }

    return hasRole(requiredRole);
  };

  /**
   * Route guard for permission-based access
   */
  const requiresPermission = async (
    permission: Permission,
    context?: PermissionContext
  ): Promise<boolean> => {
    if (!isReady.value) {
      return false; // Still loading
    }

    if (!isAuthenticated.value) {
      return false; // Not authenticated
    }

    return await hasPermission(permission, context);
  };

  /**
   * Get user-friendly role display name
   */
  const getRoleDisplayName = (): string => {
    return roleConfig.value?.displayName || userRole.value;
  };

  /**
   * Get role color for UI
   */
  const getRoleColor = (): string => {
    return roleConfig.value?.color || 'grey-6';
  };

  /**
   * Get role icon for UI
   */
  const getRoleIcon = (): string => {
    return roleConfig.value?.icon || 'account';
  };

  // Watch for authentication changes
  watch(
    () => auth.isAuthenticated.value,
    (authenticated) => {
      if (authenticated) {
        void loadUserRole();
      } else {
        userRole.value = 'member';
        roleConfig.value = null;
        dashboardConfig.value = null;
      }
    },
    { immediate: true }
  );

  // Watch for user changes
  watch(
    () => auth.currentUser.value?.uid,
    (uid) => {
      if (uid) {
        void loadUserRole();
      }
    }
  );

  // Initialize on mount
  onMounted(() => {
    if (isAuthenticated.value) {
      void loadUserRole();
    }
  });

  return {
    // State
    userRole: computed(() => userRole.value),
    roleConfig: computed(() => roleConfig.value),
    dashboardConfig: computed(() => dashboardConfig.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isReady,

    // Authentication checks
    isAuthenticated,
    isAuthLoading,
    currentUser,

    // Role hierarchy checks
    isMember,
    isContributor,
    isCanvaContributor,
    isEditor,
    isModerator,
    isAdministrator,

    // Methods
    loadUserRole,
    hasPermission,
    hasAnyPermission,
    hasRole,
    requestRole,
    navigateToDashboard,
    requiresRole,
    requiresPermission,

    // UI helpers
    getRoleDisplayName,
    getRoleColor,
    getRoleIcon,
  };
}
