/**
 * User Role Service
 * Manages role assignments, permissions, and role-based operations
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { firestoreService } from './firebase-firestore.service';
import { logger } from '../utils/logger';
import type {
  UserRoleType,
  Permission,
  RoleAssignmentMethod,
  RoleRequest,
  UserRoleConfig,
  UserRoleAssignment,
  PermissionContext,
  DashboardConfig,
  DashboardTool,
  DashboardNavigationItem,
  RoleTransition,
} from '../types/core/user-roles.types';
import { isValidRole } from '../types/core/user-roles.types';

/**
 * Firestore collections for role management
 */
const COLLECTIONS = {
  ROLE_ASSIGNMENTS: 'roleAssignments',
  ROLE_REQUESTS: 'roleRequests',
  ROLE_TRANSITIONS: 'roleTransitions',
  ROLE_CONFIGS: 'roleConfigs',
} as const;

/**
 * Default role configurations
 */
const DEFAULT_ROLE_CONFIGS: Record<UserRoleType, UserRoleConfig> = {
  member: {
    role: 'member',
    permissions: ['content:read', 'newsletter:read', 'theme:read', 'theme:update'],
    displayName: 'Member',
    description: 'Authenticated community member with basic access',
    color: 'blue-6',
    icon: 'account',
    hierarchy: 1,
    dashboardRoute: '/dashboard/member',
    assignmentMethod: ['admin_assigned', 'auto_domain'],
    requiredApproval: false,
  },
  contributor: {
    role: 'contributor',
    permissions: [
      'content:read', 'content:create', 'content:update',
      'newsletter:read', 'design:create',
      'theme:read', 'theme:update',
    ],
    displayName: 'Contributor',
    description: 'Create and manage content submissions',
    color: 'green-6',
    icon: 'edit',
    hierarchy: 2,
    dashboardRoute: '/dashboard/contributor',
    assignmentMethod: ['admin_assigned', 'self_requested'],
    requiredApproval: true,
  },
  canva_contributor: {
    role: 'canva_contributor',
    permissions: [
      'content:read', 'content:create', 'content:update',
      'newsletter:read', 'design:create', 'design:canva', 'design:export',
      'theme:read', 'theme:update',
    ],
    displayName: 'Canva Contributor',
    description: 'Design creation with Canva integration access',
    color: 'purple-6',
    icon: 'palette',
    hierarchy: 3,
    dashboardRoute: '/dashboard/canva-contributor',
    assignmentMethod: ['admin_assigned', 'self_requested'],
    requiredApproval: true,
  },
  editor: {
    role: 'editor',
    permissions: [
      'content:read', 'content:create', 'content:update', 'content:approve',
      'newsletter:read', 'newsletter:create', 'newsletter:update', 'newsletter:publish',
      'design:create', 'design:template',
      'user:read', 'theme:read', 'theme:update',
    ],
    displayName: 'Editor',
    description: 'Manage newsletter content and approve submissions',
    color: 'orange-6',
    icon: 'edit_note',
    hierarchy: 4,
    dashboardRoute: '/dashboard/editor',
    assignmentMethod: ['admin_assigned', 'self_requested'],
    requiredApproval: true,
  },
  moderator: {
    role: 'moderator',
    permissions: [
      'content:read', 'content:create', 'content:update', 'content:approve', 'content:publish',
      'newsletter:read', 'newsletter:create', 'newsletter:update',
      'user:read', 'user:update', 'user:role:assign',
      'design:create', 'design:template',
      'print:read', 'print:claim', 'print:manage',
      'theme:read', 'theme:update',
    ],
    displayName: 'Moderator',
    description: 'Approve content submissions and manage user roles',
    color: 'red-6',
    icon: 'gavel',
    hierarchy: 5,
    dashboardRoute: '/dashboard/moderator',
    assignmentMethod: ['admin_assigned'],
    requiredApproval: true,
  },
  administrator: {
    role: 'administrator',
    permissions: [
      // All permissions - full system access
      'content:read', 'content:create', 'content:update', 'content:delete', 'content:approve', 'content:publish',
      'newsletter:read', 'newsletter:create', 'newsletter:update', 'newsletter:delete', 'newsletter:publish',
      'user:read', 'user:update', 'user:delete', 'user:role:assign',
      'design:create', 'design:canva', 'design:export', 'design:template',
      'system:config', 'system:analytics', 'system:backup', 'system:audit',
      'theme:read', 'theme:update', 'theme:admin',
      'print:read', 'print:claim', 'print:manage',
    ],
    displayName: 'Administrator',
    description: 'Full system access and configuration',
    color: 'indigo-6',
    icon: 'admin_panel_settings',
    hierarchy: 6,
    dashboardRoute: '/dashboard/administrator',
    assignmentMethod: ['admin_assigned'],
    requiredApproval: true,
  },
};

class UserRoleService {
  private roleConfigCache = new Map<UserRoleType, UserRoleConfig>();
  private userRoleCache = new Map<string, UserRoleType>();

  constructor() {
    // Initialize default role configurations
    this.initializeDefaultConfigs().catch(error => {
      logger.error('Failed to initialize role configurations:', error);
    });
  }

  /**
   * Initialize default role configurations in Firestore
   */
  private async initializeDefaultConfigs(): Promise<void> {
    try {
      const batch = writeBatch(firestore);

      for (const [roleType, config] of Object.entries(DEFAULT_ROLE_CONFIGS)) {
        const configRef = doc(firestore, COLLECTIONS.ROLE_CONFIGS, roleType);
        batch.set(configRef, {
          ...config,
          updatedAt: serverTimestamp(),
        });
        this.roleConfigCache.set(roleType as UserRoleType, config);
      }

      await batch.commit();
      logger.info('Default role configurations initialized');
    } catch (error) {
      logger.error('Failed to initialize default role configurations:', error);
      throw error;
    }
  }

  /**
   * Get role configuration
   */
  async getRoleConfig(role: UserRoleType): Promise<UserRoleConfig | null> {
    try {
      // Check cache first
      if (this.roleConfigCache.has(role)) {
        return this.roleConfigCache.get(role) || null;
      }

      const configRef = doc(firestore, COLLECTIONS.ROLE_CONFIGS, role);
      const configDoc = await getDoc(configRef);

      if (configDoc.exists()) {
        const config = configDoc.data() as UserRoleConfig;
        this.roleConfigCache.set(role, config);
        return config;
      }

      return null;
    } catch (error) {
      logger.error(`Failed to get role configuration for ${role}:`, error);
      throw error;
    }
  }

  /**
   * Get all role configurations
   */
  async getAllRoleConfigs(): Promise<Record<UserRoleType, UserRoleConfig>> {
    try {
      const configsQuery = query(collection(firestore, COLLECTIONS.ROLE_CONFIGS));
      const querySnapshot = await getDocs(configsQuery);

      const configs: Partial<Record<UserRoleType, UserRoleConfig>> = {};

      querySnapshot.forEach((doc) => {
        const config = doc.data() as UserRoleConfig;
        configs[config.role] = config;
        this.roleConfigCache.set(config.role, config);
      });

      return configs as Record<UserRoleType, UserRoleConfig>;
    } catch (error) {
      logger.error('Failed to get all role configurations:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    role: UserRoleType,
    assignedBy: string,
    method: RoleAssignmentMethod,
    reason?: string
  ): Promise<void> {
    try {
      // Validate role
      if (!isValidRole(role)) {
        throw new Error('Invalid role: ' + String(role));
      }

      // Get current user role for transition tracking
      const currentRole = await this.getUserRole(userId);

      // Create role assignment record
      const assignmentData: Omit<UserRoleAssignment, 'userId'> = {
        role,
        assignedBy,
        assignedAt: new Date().toISOString(),
        assignmentMethod: method,
        isActive: true,
      };

      const assignmentRef = doc(firestore, COLLECTIONS.ROLE_ASSIGNMENTS, userId);
      await setDoc(assignmentRef, { userId, ...assignmentData });

      // Update user profile with new role
      await firestoreService.updateUserProfile(userId, { role });

      // Create transition record
      await this.createRoleTransition(userId, currentRole, role, 'assignment', assignedBy, reason);

      // Clear cache
      this.userRoleCache.delete(userId);

      logger.info(`Role ${role} assigned to user ${userId} by ${assignedBy}`);
    } catch (error) {
      logger.error('Failed to assign role to user:', { role, userId, error });
      throw error;
    }
  }

  /**
   * Get user's current role
   */
  async getUserRole(userId: string): Promise<UserRoleType> {
    try {
      // Check cache first
      if (this.userRoleCache.has(userId)) {
        return this.userRoleCache.get(userId)!;
      }

      // Try user profile first (primary source)
      const userProfile = await firestoreService.getUserProfile(userId);
      if (userProfile?.role && isValidRole(userProfile.role)) {
        const validRole: UserRoleType = userProfile.role;
        this.userRoleCache.set(userId, validRole);
        return validRole;
      }

      // Fallback to role assignment record
      const assignmentRef = doc(firestore, COLLECTIONS.ROLE_ASSIGNMENTS, userId);
      const assignmentDoc = await getDoc(assignmentRef);

      if (assignmentDoc.exists()) {
        const assignment = assignmentDoc.data() as UserRoleAssignment;
        if (assignment.isActive) {
          this.userRoleCache.set(userId, assignment.role);
          return assignment.role;
        }
      }

      // Default role for new users
      const defaultRole: UserRoleType = 'member';
      this.userRoleCache.set(userId, defaultRole);
      return defaultRole;
    } catch (error) {
      logger.error(`Failed to get user role for ${userId}:`, error);
      // Return default role on error
      return 'member';
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId);
      const roleConfig = await this.getRoleConfig(userRole);

      if (!roleConfig) {
        return false;
      }

      // Check basic permission
      const hasBasicPermission = roleConfig.permissions.includes(permission);

      // Apply context-based logic if provided
      if (context && hasBasicPermission) {
        return this.evaluatePermissionContext(permission, context, userId);
      }

      return hasBasicPermission;
    } catch (error) {
      logger.error(`Failed to check permission ${permission} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    try {
      for (const permission of permissions) {
        if (await this.hasPermission(userId, permission)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error(`Failed to check permissions for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Request role change
   */
  async requestRole(
    userId: string,
    requestedRole: UserRoleType,
    reason: string
  ): Promise<string> {
    try {
      const currentRole = await this.getUserRole(userId);

      if (currentRole === requestedRole) {
        throw new Error('User already has the requested role');
      }

      const requestData: Omit<RoleRequest, 'id'> = {
        userId,
        requestedRole,
        currentRole,
        reason,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };

      const requestRef = await addDoc(collection(firestore, COLLECTIONS.ROLE_REQUESTS), requestData);

      logger.info(`Role request submitted: ${userId} requesting ${requestedRole}`);
      return requestRef.id;
    } catch (error) {
      logger.error(`Failed to submit role request for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Approve/reject role request
   */
  async processRoleRequest(
    requestId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewerNotes?: string
  ): Promise<void> {
    try {
      const requestRef = doc(firestore, COLLECTIONS.ROLE_REQUESTS, requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Role request not found');
      }

      const request = { id: requestDoc.id, ...requestDoc.data() } as RoleRequest;

      if (request.status !== 'pending') {
        throw new Error('Role request is not pending');
      }

      // Update request status
      await updateDoc(requestRef, {
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerId,
        reviewerNotes: reviewerNotes || '',
      });

      // If approved, assign the role
      if (status === 'approved') {
        await this.assignRole(
          request.userId,
          request.requestedRole,
          reviewerId,
          'self_requested',
          `Role request approved: ${request.reason}`
        );
      }

      logger.info(`Role request ${requestId} ${status} by ${reviewerId}`);
    } catch (error) {
      logger.error(`Failed to process role request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard configuration for user's role
   */
  async getDashboardConfig(userId: string): Promise<DashboardConfig | null> {
    try {
      const userRole = await this.getUserRole(userId);
      const roleConfig = await this.getRoleConfig(userRole);

      if (!roleConfig) {
        return null;
      }

      // Return role-specific dashboard configuration
      // This would be expanded with actual dashboard tools and navigation
      const dashboardConfig: DashboardConfig = {
        defaultRoute: roleConfig.dashboardRoute,
        availableTools: this.getAvailableTools(),
        navigation: this.getNavigationItems(),
        layout: 'grid',
      };

      return dashboardConfig;
    } catch (error) {
      logger.error(`Failed to get dashboard config for user ${userId}:`, error);
      return null;
    }
  }

    /**
   * Create role transition record
   */
  private async createRoleTransition(
    userId: string,
    fromRole: UserRoleType | null,
    toRole: UserRoleType,
    transitionType: 'assignment' | 'promotion' | 'demotion' | 'removal',
    performedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const transitionData: Omit<RoleTransition, 'id'> = {
        userId,
        fromRole,
        toRole,
        transitionType,
        performedBy,
        performedAt: new Date().toISOString(),
        reason: reason || '',
        approvalRequired: false, // Will be enhanced in future phases
      };

      await addDoc(collection(firestore, COLLECTIONS.ROLE_TRANSITIONS), transitionData);
    } catch (error) {
      logger.error('Failed to create role transition record:', error);
      // Don't throw - this is audit logging, shouldn't break main flow
    }
  }

  /**
   * Evaluate permission context for complex rules
   */
  private evaluatePermissionContext(
    permission: Permission,
    context: PermissionContext,
    userId: string
  ): boolean {
    // Resource ownership check
    if (context.ownerId && context.ownerId === userId) {
      return true;
    }

    // Add more context-based rules here
    // This will be expanded based on specific permission requirements

    return true;
  }

  /**
   * Clean up expired role requests
   */
  async cleanupExpiredRequests(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const expiredQuery = query(
        collection(firestore, COLLECTIONS.ROLE_REQUESTS),
        where('expiresAt', '<', now),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(expiredQuery);
      const batch = writeBatch(firestore);

      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { status: 'expired' });
      });

      if (querySnapshot.size > 0) {
        await batch.commit();
        logger.info(`Expired ${querySnapshot.size} role requests`);
      }
    } catch (error) {
      logger.error('Failed to cleanup expired role requests:', error);
    }
  }

  /**
   * Get available dashboard tools for permissions
   */
  private getAvailableTools(): DashboardTool[] {
    // This will be implemented in Phase 4 - Dashboard Framework
    // For now, return empty array to satisfy the interface
    return [];
  }

  /**
   * Get navigation items for permissions
   */
  private getNavigationItems(): DashboardNavigationItem[] {
    // This will be implemented in Phase 4 - Dashboard Framework
    // For now, return empty array to satisfy the interface
    return [];
  }
}

// Export singleton instance
export const userRoleService = new UserRoleService();
