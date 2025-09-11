/**
 * Role-based Authorization Composable
 * Provides role checking and page protection for admin/editor functions
 */
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useFirebase } from './useFirebase';
import { firestoreService } from '../services/firebase-firestore.service';
import type { UserProfile } from '../services/firebase-firestore.service';
import { logger } from '../utils/logger';

// Legacy role type for backward compatibility
export type UserRole = 'reader' | 'contributor' | 'editor' | 'admin';export const useRoleAuth = () => {
  const router = useRouter();
  const { auth } = useFirebase();

  // Reactive state
  const userProfile = ref<UserProfile | null>(null);
  const isLoading = ref(false);

  // Computed role checks
  const isAuthenticated = computed(() => auth.isAuthenticated.value);
  const isAuthLoading = computed(() => auth.isLoading.value);
  const userRole = computed(() => userProfile.value?.role || 'reader');
  const isAdmin = computed(() => userRole.value === 'admin');
  const isEditor = computed(() => userRole.value === 'editor' || userRole.value === 'admin');
  const isContributor = computed(() =>
    ['contributor', 'editor', 'admin'].includes(userRole.value)
  );

  // Check if we're ready to make authorization decisions
  const isAuthReady = computed(() => {
    // Wait for Firebase Auth to finish initialization
    if (isAuthLoading.value) {
      return false;
    }
    // If not authenticated, we're ready to deny access
    if (!isAuthenticated.value) {
      return true;
    }
    // If authenticated, wait for profile to load
    return !isLoading.value;
  });

  // Role hierarchy checks - supports both legacy and new roles
  const hasRole = (requiredRole: UserRole): boolean => {
    // Extended hierarchy supporting both legacy and new roles
    const roleHierarchy: Record<string, number> = {
      // Legacy roles
      'reader': 0,
      'contributor': 1,
      'editor': 2,
      'admin': 3,
      // New roles
      'member': 0,          // Same as reader
      'canva_contributor': 2, // Between contributor and editor
      'moderator': 3,       // Same as admin
      'administrator': 4,   // Highest level
    };

    const currentRole = userRole.value;
    const userLevel = roleHierarchy[currentRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  // Load user profile and role
  const loadUserProfile = async () => {
    if (!auth.currentUser.value) {
      userProfile.value = null;
      return;
    }

    isLoading.value = true;
    try {
      const profile = await firestoreService.getUserProfile(auth.currentUser.value.uid);
      userProfile.value = profile;
      logger.debug('User profile loaded:', {
        uid: auth.currentUser.value.uid,
        role: profile?.role,
        email: auth.currentUser.value.email
      });

      // Log detailed role information for debugging
      if (profile) {
        logger.info(`User ${profile.email} has role: ${profile.role}`);
      } else {
        logger.warn(`No profile found for user ${auth.currentUser.value.email}, defaulting to reader role`);
      }
    } catch (error) {
      logger.error('Error loading user profile:', error);
      userProfile.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  // Redirect unauthorized users
  const requireRole = (requiredRole: UserRole, redirectTo: string = '/') => {
    logger.debug(`requireRole called - required: ${requiredRole}, authLoading: ${isAuthLoading.value}, authenticated: ${isAuthenticated.value}, profileLoading: ${isLoading.value}, currentRole: ${userRole.value}, authReady: ${isAuthReady.value}`);

    // Wait for Firebase Auth to finish initialization
    if (isAuthLoading.value) {
      logger.debug('Firebase Auth still initializing, allowing temporary access');
      return true;
    }

    if (!isAuthenticated.value) {
      logger.warn(`Unauthorized access attempt - not authenticated`);
      void router.push(redirectTo);
      return false;
    }

    // If user profile is still loading, allow access temporarily
    // The page will handle the loading state appropriately
    if (isLoading.value) {
      logger.debug('User profile still loading, allowing temporary access');
      return true;
    }

    const hasRequiredRole = hasRole(requiredRole);
    logger.debug(`Role check result: ${hasRequiredRole} (required: ${requiredRole}, user: ${userRole.value})`);

    if (!hasRequiredRole) {
      logger.warn(`Insufficient permissions - required: ${requiredRole}, user: ${userRole.value}`);
      void router.push(redirectTo);
      return false;
    }

    logger.success(`Access granted - user ${userRole.value} meets requirement ${requiredRole}`);
    return true;
  };

  // Page protection wrapper - use the simple requireRole method
  const requireAdmin = (redirectTo: string = '/') => requireRole('admin', redirectTo);
  const requireEditor = (redirectTo: string = '/') => requireRole('editor', redirectTo);
  const requireContributor = (redirectTo: string = '/') => requireRole('contributor', redirectTo);

  // Utility to check if current route is protected
  const isCurrentRouteProtected = (): { isProtected: boolean; requiredRole?: UserRole } => {
    const currentRoute = router.currentRoute.value;
    const protectedRoutes = [
      { path: '/admin/content', requiredRole: 'editor' as UserRole },
      { path: '/admin', requiredRole: 'admin' as UserRole },
    ];

    const routeRule = protectedRoutes.find(rule =>
      currentRoute.path.startsWith(rule.path)
    );

    if (routeRule) {
      return {
        isProtected: true,
        requiredRole: routeRule.requiredRole
      };
    }

    return {
      isProtected: false
    };
  };

  // Watch auth state changes
  watch(
    () => auth.currentUser.value,
    (newUser, oldUser) => {
      if (newUser) {
        void loadUserProfile();
      } else {
        userProfile.value = null;

        // Handle logout: check if user was on a protected route and redirect
        if (oldUser && !newUser) {
          logger.info('User logged out, checking if on protected route');
          const currentRoute = router.currentRoute.value;
          const protectedRoutes = ['/admin', '/admin/content'];

          // Check if current route starts with any protected route pattern
          const isOnProtectedRoute = protectedRoutes.some(route =>
            currentRoute.path.startsWith(route)
          );

          if (isOnProtectedRoute) {
            logger.warn('User logged out while on protected route, redirecting to home');
            void router.push('/');
          }
        }
      }
    },
    { immediate: true }
  );

  // Add a watcher to handle deferred authorization checks AND ongoing role validation
  const pendingRoleChecks = ref<Array<{ role: UserRole; redirectTo: string }>>([]);

  watch(
    () => isAuthReady.value,
    (ready) => {
      if (ready && pendingRoleChecks.value.length > 0) {
        // Process any pending role checks
        const checks = [...pendingRoleChecks.value];
        pendingRoleChecks.value = [];

        for (const { role, redirectTo } of checks) {
          if (!isAuthenticated.value || !hasRole(role)) {
            logger.warn(`Deferred role check failed - required: ${role}, user: ${userRole.value}`);
            void router.push(redirectTo);
            break; // Only redirect once
          }
        }
      }
    }
  );

  // Watch for role changes and validate current route access
  watch(
    [isAuthenticated, userRole],
    ([authenticated, role]) => {
      // Only check if auth state is ready (not loading)
      if (!isAuthReady.value) return;

      const currentRoute = router.currentRoute.value;
      const protectedRoutes = [
        { path: '/admin/content', requiredRole: 'editor' as UserRole },
        { path: '/admin', requiredRole: 'admin' as UserRole },
      ];

      // Find if current route requires specific permissions
      const routeRule = protectedRoutes.find(rule =>
        currentRoute.path.startsWith(rule.path)
      );

      if (routeRule) {
        // Check if user lost access to current route
        if (!authenticated || !hasRole(routeRule.requiredRole)) {
          logger.warn(`Access revoked for route ${currentRoute.path} - required: ${routeRule.requiredRole}, user: ${role}, authenticated: ${authenticated}`);
          void router.push('/');
        }
      }
    },
    { immediate: false } // Don't run on mount, only on changes
  );

  return {
    // State
    userProfile,
    isLoading,
    isAuthReady,

    // Computed checks
    isAuthenticated,
    isAuthLoading,
    userRole,
    isAdmin,
    isEditor,
    isContributor,

    // Methods
    hasRole,
    loadUserProfile,
    requireRole,
    requireAdmin,
    requireEditor,
    requireContributor,
    isCurrentRouteProtected,
  };
};
