/**
 * import type {
  Action,
  Subject,
  AppAbility,
  AppResource,
  PermissionCheckResult,
  BulkPermissionCheck,
  BulkPermissionResult
} from '../types/core/permissions.types';s Composable
 * Vue 3 composable for CASL-powered permission checking
 */

import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import type {
  Action,
  Subject,
  AppAbility,
  AppResource,
  PermissionCheckResult,
  BulkPermissionCheck,
  BulkPermissionResult
} from '../types/core/permissions.types';
import { createAbilityForRole } from '../utils/permissions';
import { useUserRoles } from './useUserRoles';
import { useFirebase } from './useFirebase';
import { logger } from '../utils/logger';/**
 * Permission checking composable
 */
export function usePermissions() {
  const router = useRouter();
  const { auth } = useFirebase();
  const { userRole, isReady: isRoleReady } = useUserRoles();

  // State
  const ability = ref<AppAbility | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const permissionCache = ref<Map<string, PermissionCheckResult>>(new Map());

  // Computed properties
  const isReady = computed(() => {
    return isRoleReady.value && ability.value !== null && !isLoading.value;
  });

  const currentUserId = computed(() => auth.currentUser.value?.uid || '');

  /**
   * Initialize or update the ability based on current user
   */
  const initializeAbility = () => {
    try {
      isLoading.value = true;
      error.value = null;

      if (!auth.currentUser.value) {
        ability.value = null;
        logger.debug('No user authenticated, clearing ability');
        return;
      }

      const currentUserRole = userRole.value;
      if (!currentUserRole) {
        ability.value = null;
        logger.debug('No user role available, clearing ability');
        return;
      }

      // Create ability for user's role
      ability.value = createAbilityForRole(currentUserRole, currentUserId.value);
      logger.debug('Ability initialized for role', { role: currentUserRole });

      // Clear cache when ability changes
      clearCache();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize permissions';
      logger.error('Error initializing ability', { error: err });
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Check if user can perform action on subject
   */
  const can = (
    action: Action,
    subject: Subject,
    resource?: AppResource
  ): boolean => {
    if (!ability.value) {
      logger.warn('Ability not initialized, denying permission', { action, subject });
      return false;
    }

    try {
      // For CASL, we check permissions on the subject, not the resource
      const result = ability.value.can(action, subject);

      logger.debug('Permission check', {
        action,
        subject,
        hasResource: !!resource,
        result
      });

      return result;
    } catch (err) {
      logger.error('Error checking permission', { action, subject, error: err });
      return false;
    }
  };

  /**
   * Check if user cannot perform action on subject
   */
  const cannot = (
    action: Action,
    subject: Subject,
    resource?: AppResource
  ): boolean => {
    return !can(action, subject, resource);
  };

  /**
   * Advanced permission check with detailed result
   */
  const checkPermission = (
    action: Action,
    subject: Subject,
    resource?: AppResource
  ): PermissionCheckResult => {
    const cacheKey = `${action}:${subject}:${resource?.id || 'no-resource'}`;

    // Check cache first
    const cached = permissionCache.value.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const allowed = can(action, subject, resource);

      const result: PermissionCheckResult = {
        allowed,
      };

      if (!allowed) {
        result.reason = 'Insufficient permissions';
      }

      // If we have the ability, get more details
      if (ability.value) {
        const relevantRule = ability.value.relevantRuleFor(action, subject);
        if (relevantRule) {
          if (relevantRule.conditions) {
            result.conditions = relevantRule.conditions as Record<string, unknown>;
          }
          if (relevantRule.fields) {
            result.fields = relevantRule.fields;
          }
        }
      }

      // Cache the result
      permissionCache.value.set(cacheKey, result);

      return result;
    } catch (err) {
      logger.error('Error in advanced permission check', { action, subject, error: err });
      return {
        allowed: false,
        reason: 'Permission check failed',
      };
    }
  };

  /**
   * Check multiple permissions at once
   */
  const checkBulkPermissions = (
    checks: BulkPermissionCheck[]
  ): BulkPermissionResult => {
    const results = checks.map((check) => ({
      ...check,
      ...checkPermission(check.action, check.subject, check.resource),
    }));

    const summary = {
      total: results.length,
      allowed: results.filter(r => r.allowed).length,
      denied: results.filter(r => !r.allowed).length,
    };

    return {
      checks: results,
      summary,
    };
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (
    permissions: Array<{ action: Action; subject: Subject; resource?: AppResource }>
  ): boolean => {
    return permissions.some(({ action, subject, resource }) =>
      can(action, subject, resource)
    );
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (
    permissions: Array<{ action: Action; subject: Subject; resource?: AppResource }>
  ): boolean => {
    return permissions.every(({ action, subject, resource }) =>
      can(action, subject, resource)
    );
  };

  /**
   * Get allowed actions for a subject
   */
  const getAllowedActions = (subject: Subject, resource?: AppResource): Action[] => {
    if (!ability.value) return [];

    const actions: Action[] = [
      'create', 'read', 'update', 'delete', 'manage',
      'publish', 'approve', 'reject', 'assign', 'request',
      'export', 'import', 'backup', 'audit', 'configure',
      'moderate', 'claim'
    ];

    return actions.filter(action => can(action, subject, resource));
  };

  /**
   * Clear permission cache
   */
  const clearCache = (): void => {
    permissionCache.value.clear();
    logger.debug('Permission cache cleared');
  };

  /**
   * Route guard for permission-based access
   */
  const requiresPermission = (
    action: Action,
    subject: Subject,
    redirectTo: string = '/'
  ): boolean => {
    if (!isReady.value) {
      logger.warn('Permission check called before ready', { action, subject });
      return false;
    }

    const allowed = can(action, subject);

    if (!allowed) {
      logger.warn('Permission denied, redirecting', { action, subject, redirectTo });
      void router.push(redirectTo);
    }

    return allowed;
  };

  /**
   * Reactive permission checks for common actions
   */
  const canCreate = computed(() => (subject: Subject, resource?: AppResource) =>
    can('create', subject, resource)
  );

  const canRead = computed(() => (subject: Subject, resource?: AppResource) =>
    can('read', subject, resource)
  );

  const canUpdate = computed(() => (subject: Subject, resource?: AppResource) =>
    can('update', subject, resource)
  );

  const canDelete = computed(() => (subject: Subject, resource?: AppResource) =>
    can('delete', subject, resource)
  );

  const canManage = computed(() => (subject: Subject, resource?: AppResource) =>
    can('manage', subject, resource)
  );

  const canPublish = computed(() => (subject: Subject, resource?: AppResource) =>
    can('publish', subject, resource)
  );

  const canApprove = computed(() => (subject: Subject, resource?: AppResource) =>
    can('approve', subject, resource)
  );

  const canModerate = computed(() => (subject: Subject, resource?: AppResource) =>
    can('moderate', subject, resource)
  );

  // Watch for role changes and reinitialize ability
  watch(
    [() => auth.isAuthenticated.value, userRole],
    ([authenticated, role]) => {
      if (authenticated && role) {
        void initializeAbility();
      } else {
        ability.value = null;
        permissionCache.value.clear();
      }
    },
    { immediate: true }
  );

  // Watch for user changes and reinitialize
  watch(
    () => auth.currentUser.value?.uid,
    (newUserId, oldUserId) => {
      if (newUserId !== oldUserId) {
        void initializeAbility();
      }
    }
  );

  return {
    // State
    ability: computed(() => ability.value),
    isLoading: computed(() => isLoading.value),
    isReady,
    error: computed(() => error.value),

    // Methods
    initializeAbility,
    can,
    cannot,
    checkPermission,
    checkBulkPermissions,
    hasAnyPermission,
    hasAllPermissions,
    getAllowedActions,
    clearCache,
    requiresPermission,

    // Reactive permission checks
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    canPublish,
    canApprove,
    canModerate,
  };
}
