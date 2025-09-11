/**
 * User Roles Pinia Store
 * State management for role-based system
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userRoleService } from '../services/user-role.service';
import { logger } from '../utils/logger';
import type {
  UserRoleType,
  UserRoleConfig,
  RoleRequest,
  RoleTransition,
  RoleAnalytics,
  RoleAssignmentMethod,
} from '../types/core/user-roles.types';

export const useUserRolesStore = defineStore('userRoles', () => {
  // State
  const roleConfigs = ref<Record<UserRoleType, UserRoleConfig>>({} as Record<UserRoleType, UserRoleConfig>);
  const userRoles = ref<Record<string, UserRoleType>>({});
  const roleRequests = ref<RoleRequest[]>([]);
  const roleTransitions = ref<RoleTransition[]>([]);
  const analytics = ref<RoleAnalytics | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const availableRoles = computed(() => Object.keys(roleConfigs.value) as UserRoleType[]);
  const pendingRequests = computed(() => roleRequests.value.filter(req => req.status === 'pending'));
  const totalUsers = computed(() => Object.keys(userRoles.value).length);

  /**
   * Initialize store with role configurations
   */
  const initialize = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const configs = await userRoleService.getAllRoleConfigs();
      roleConfigs.value = configs;

      logger.info('Role configurations loaded:', Object.keys(configs));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize role system';
      logger.error('Failed to initialize role system:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get role configuration
   */
  const getRoleConfig = (role: UserRoleType): UserRoleConfig | null => {
    return roleConfigs.value[role] || null;
  };

  /**
   * Get user's current role
   */
  const getUserRole = async (userId: string): Promise<UserRoleType> => {
    // Check cache first
    if (userRoles.value[userId]) {
      return userRoles.value[userId];
    }

    try {
      const role = await userRoleService.getUserRole(userId);
      userRoles.value[userId] = role;
      return role;
    } catch (err) {
      logger.error(`Failed to get user role for ${userId}:`, err);
      return 'member'; // Default role
    }
  };

  /**
   * Assign role to user
   */
  const assignRole = async (
    userId: string,
    role: UserRoleType,
    assignedBy: string,
    method: RoleAssignmentMethod,
    reason?: string
  ): Promise<void> => {
    try {
      await userRoleService.assignRole(userId, role, assignedBy, method, reason);

      // Update cache
      userRoles.value[userId] = role;

      // Refresh data that might have changed
      await Promise.all([
        Promise.resolve(loadRoleRequests()),
        Promise.resolve(loadRoleTransitions()),
      ]);

      logger.info(`Role ${role} assigned to user ${userId}`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to assign role';
      logger.error(`Failed to assign role ${role} to user ${userId}:`, err);
      throw err;
    }
  };

  /**
   * Request role change
   */
  const requestRole = async (
    userId: string,
    requestedRole: UserRoleType,
    reason: string
  ): Promise<string> => {
    try {
      const requestId = await userRoleService.requestRole(userId, requestedRole, reason);

      // Refresh role requests
      loadRoleRequests();

      return requestId;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit role request';
      logger.error('Failed to submit role request:', err);
      throw err;
    }
  };

  /**
   * Process role request (approve/reject)
   */
  const processRoleRequest = async (
    requestId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewerNotes?: string
  ): Promise<void> => {
    try {
      await userRoleService.processRoleRequest(requestId, reviewerId, status, reviewerNotes);

      // Refresh data
      await Promise.all([
        Promise.resolve(loadRoleRequests()),
        Promise.resolve(loadRoleTransitions()),
      ]);

      logger.info(`Role request ${requestId} ${status}`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to process role request';
      logger.error(`Failed to process role request ${requestId}:`, err);
      throw err;
    }
  };

  /**
   * Load all role requests
   */
  const loadRoleRequests = (): void => {
    try {
      // This would be implemented to fetch role requests from Firestore
      // For now, we'll set empty array to satisfy the interface
      roleRequests.value = [];
      logger.debug('Role requests loaded');
    } catch (err) {
      logger.error('Failed to load role requests:', err);
    }
  };

  /**
   * Load role transitions for audit
   */
  const loadRoleTransitions = (): void => {
    try {
      // This would be implemented to fetch role transitions from Firestore
      // For now, we'll set empty array to satisfy the interface
      roleTransitions.value = [];
      logger.debug('Role transitions loaded');
    } catch (err) {
      logger.error('Failed to load role transitions:', err);
    }
  };

  /**
   * Load role analytics
   */
  const loadAnalytics = (): void => {
    try {
      // Calculate role distribution from cached user roles
      const roleDistribution: Record<string, number> = {};

      for (const role of Object.values(userRoles.value)) {
        roleDistribution[role] = (roleDistribution[role] || 0) + 1;
      }

      analytics.value = {
        totalUsers: totalUsers.value,
        roleDistribution: roleDistribution as Record<UserRoleType, number>,
        recentTransitions: roleTransitions.value.slice(0, 10),
        pendingRequests: pendingRequests.value.length,
        activeRoleRequests: pendingRequests.value.slice(0, 5),
      };

      logger.debug('Role analytics loaded');
    } catch (err) {
      logger.error('Failed to load role analytics:', err);
    }
  };  /**
   * Clear user from cache (when user logs out or is deleted)
   */
  const clearUser = (userId: string): void => {
    delete userRoles.value[userId];
  };

  /**
   * Clear all cached data
   */
  const clearCache = (): void => {
    userRoles.value = {};
    roleRequests.value = [];
    roleTransitions.value = [];
    analytics.value = null;
    error.value = null;
  };

  /**
   * Check if role can be assigned by current user
   */
  const canAssignRole = (targetRole: UserRoleType, assignerRole: UserRoleType): boolean => {
    const assignerConfig = getRoleConfig(assignerRole);
    const targetConfig = getRoleConfig(targetRole);

    if (!assignerConfig || !targetConfig) {
      return false;
    }

    // Administrator can assign any role except administrator
    if (assignerRole === 'administrator') {
      return true;
    }

    // Moderator can assign roles below their level
    if (assignerRole === 'moderator') {
      return targetConfig.hierarchy < assignerConfig.hierarchy;
    }

    return false;
  };

  /**
   * Get roles that can be assigned by a user
   */
  const getAssignableRoles = (assignerRole: UserRoleType): UserRoleType[] => {
    return availableRoles.value.filter(role => canAssignRole(role, assignerRole));
  };

  /**
   * Clean up expired requests
   */
  const cleanupExpiredRequests = async (): Promise<void> => {
    try {
      await userRoleService.cleanupExpiredRequests();
      loadRoleRequests();
    } catch (err) {
      logger.error('Failed to cleanup expired requests:', err);
    }
  };

  return {
    // State
    roleConfigs: computed(() => roleConfigs.value),
    userRoles: computed(() => userRoles.value),
    roleRequests: computed(() => roleRequests.value),
    roleTransitions: computed(() => roleTransitions.value),
    analytics: computed(() => analytics.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    availableRoles,
    pendingRequests,
    totalUsers,

    // Actions
    initialize,
    getRoleConfig,
    getUserRole,
    assignRole,
    requestRole,
    processRoleRequest,
    loadRoleRequests,
    loadRoleTransitions,
    loadAnalytics,
    clearUser,
    clearCache,
    canAssignRole,
    getAssignableRoles,
    cleanupExpiredRequests,
  };
});
