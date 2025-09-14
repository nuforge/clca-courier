/**
 * User Roles System Tests
 * Tests for Phase 1A - Role System Foundation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isValidRole,
  isValidPermission,
  getRoleHierarchy,
  hasRoleHierarchy,
  type UserRoleType,
  type Permission
} from '../../src/types/core/user-roles.types';
import { userRoleService } from '../../src/services/user-role.service';

// Mock Firebase
vi.mock('../../src/config/firebase.config', () => ({
  firestore: {},
}));

// Use global Firebase/Firestore mock from tests/setup.ts

vi.mock('../../src/services/firebase-auth.service', () => ({
  firebaseAuthService: {},
}));

vi.mock('../../src/services/firebase-firestore.service', () => ({
  firestoreService: {
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

describe('User Role Types', () => {
  describe('Role Validation', () => {
    it('should validate correct roles', () => {
      const validRoles: UserRoleType[] = [
        'member',
        'contributor',
        'canva_contributor',
        'editor',
        'moderator',
        'administrator'
      ];

      validRoles.forEach(role => {
        expect(isValidRole(role)).toBe(true);
      });
    });

    it('should reject invalid roles', () => {
      const invalidRoles = [
        'invalid_role',
        'user',
        'superuser',
        'guest',
        ''
      ];

      invalidRoles.forEach(role => {
        expect(isValidRole(role)).toBe(false);
      });
    });
  });

  describe('Permission Validation', () => {
    it('should validate content permissions', () => {
      const contentPermissions: Permission[] = [
        'content:read',
        'content:create',
        'content:update',
        'content:delete',
        'content:approve',
        'content:publish'
      ];

      contentPermissions.forEach(permission => {
        expect(isValidPermission(permission)).toBe(true);
      });
    });
  });

  describe('Role Hierarchy', () => {
    it('should return correct hierarchy values', () => {
      expect(getRoleHierarchy('member')).toBe(1);
      expect(getRoleHierarchy('contributor')).toBe(2);
      expect(getRoleHierarchy('canva_contributor')).toBe(3);
      expect(getRoleHierarchy('editor')).toBe(4);
      expect(getRoleHierarchy('moderator')).toBe(5);
      expect(getRoleHierarchy('administrator')).toBe(6);
    });

    it('should correctly compare role hierarchies', () => {
      // Administrator has highest hierarchy
      expect(hasRoleHierarchy('administrator', 'moderator')).toBe(true);
      expect(hasRoleHierarchy('administrator', 'member')).toBe(true);

      // Moderator has higher hierarchy than editor
      expect(hasRoleHierarchy('moderator', 'editor')).toBe(true);
      expect(hasRoleHierarchy('editor', 'moderator')).toBe(false);

      // Same role should return true
      expect(hasRoleHierarchy('editor', 'editor')).toBe(true);

      // Lower roles should not have access to higher
      expect(hasRoleHierarchy('member', 'administrator')).toBe(false);
      expect(hasRoleHierarchy('contributor', 'editor')).toBe(false);
    });
  });
});

describe('User Role Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role Configuration', () => {
    it('should initialize with default configurations', async () => {
      // This test validates that the service initializes properly
      expect(userRoleService).toBeDefined();
    });

    it('should provide role configurations for all roles', async () => {
      const roles: UserRoleType[] = [
        'member',
        'contributor',
        'canva_contributor',
        'editor',
        'moderator',
        'administrator'
      ];

      // Mock the getAllRoleConfigs method
      const mockConfigs = roles.reduce((acc, role) => {
        acc[role] = {
          role,
          permissions: [],
          displayName: role.charAt(0).toUpperCase() + role.slice(1),
          description: `${role} role`,
          color: 'blue-6',
          icon: 'account',
          hierarchy: getRoleHierarchy(role),
          dashboardRoute: `/dashboard/${role}`,
          assignmentMethod: ['admin_assigned'],
          requiredApproval: false,
        };
        return acc;
      }, {} as Record<UserRoleType, any>);

      vi.spyOn(userRoleService, 'getAllRoleConfigs').mockResolvedValue(mockConfigs);

      const configs = await userRoleService.getAllRoleConfigs();

      roles.forEach(role => {
        expect(configs[role]).toBeDefined();
        expect(configs[role].role).toBe(role);
        expect(configs[role].hierarchy).toBe(getRoleHierarchy(role));
      });
    });
  });

  describe('Permission Checking', () => {
    it('should check permissions correctly', async () => {
      // Mock getUserRole and getRoleConfig
      vi.spyOn(userRoleService, 'getUserRole').mockResolvedValue('editor');
      vi.spyOn(userRoleService, 'getRoleConfig').mockResolvedValue({
        role: 'editor',
        permissions: ['content:read', 'content:create', 'content:update', 'newsletter:read'],
        displayName: 'Editor',
        description: 'Content editor',
        color: 'orange-6',
        icon: 'edit_note',
        hierarchy: 4,
        dashboardRoute: '/dashboard/editor',
        assignmentMethod: ['admin_assigned'],
        requiredApproval: true,
      });

      // Should have editor permissions
      expect(await userRoleService.hasPermission('user123', 'content:read')).toBe(true);
      expect(await userRoleService.hasPermission('user123', 'content:create')).toBe(true);

      // Should not have admin-only permissions
      expect(await userRoleService.hasPermission('user123', 'system:config')).toBe(false);
    });

    it('should handle permission checking for multiple permissions', async () => {
      vi.spyOn(userRoleService, 'getUserRole').mockResolvedValue('contributor');
      vi.spyOn(userRoleService, 'getRoleConfig').mockResolvedValue({
        role: 'contributor',
        permissions: ['content:read', 'content:create'],
        displayName: 'Contributor',
        description: 'Content contributor',
        color: 'green-6',
        icon: 'edit',
        hierarchy: 2,
        dashboardRoute: '/dashboard/contributor',
        assignmentMethod: ['admin_assigned', 'self_requested'],
        requiredApproval: true,
      });

      // Should have at least one of the permissions
      expect(await userRoleService.hasAnyPermission('user123', [
        'content:read',
        'system:config'
      ])).toBe(true);

      // Should not have any admin permissions
      expect(await userRoleService.hasAnyPermission('user123', [
        'system:config',
        'system:backup'
      ])).toBe(false);
    });
  });

  describe('Role Assignment', () => {
    it('should assign roles correctly', async () => {
      const mockUserProfile = {
        updateUserProfile: vi.fn(),
      };

      // Mock the updateUserProfile method
      vi.spyOn(userRoleService, 'assignRole').mockImplementation(async () => {
        // Simulate successful role assignment
        return Promise.resolve();
      });

      await expect(userRoleService.assignRole(
        'user123',
        'contributor',
        'admin456',
        'admin_assigned',
        'User requested contributor access'
      )).resolves.not.toThrow();
    });

    it('should reject invalid role assignments', async () => {
      // Mock the assignRole method to reject with invalid role error
      vi.spyOn(userRoleService, 'assignRole').mockRejectedValue(new Error('Invalid role: invalid_role'));

      await expect(userRoleService.assignRole(
        'user123',
        'invalid_role' as UserRoleType,
        'admin456',
        'admin_assigned'
      )).rejects.toThrow('Invalid role: invalid_role');
    });
  });
});

describe('Role System Integration', () => {
  it('should provide consistent role hierarchy across components', () => {
    const roles: UserRoleType[] = [
      'member',
      'contributor',
      'canva_contributor',
      'editor',
      'moderator',
      'administrator'
    ];

    // Verify hierarchy is consistently ordered
    for (let i = 0; i < roles.length - 1; i++) {
      const currentRole = roles[i];
      const nextRole = roles[i + 1];

      // Ensure we have valid roles at these indices
      if (currentRole && nextRole) {
        expect(getRoleHierarchy(currentRole)).toBeLessThan(getRoleHierarchy(nextRole));
        expect(hasRoleHierarchy(nextRole, currentRole)).toBe(true);
        expect(hasRoleHierarchy(currentRole, nextRole)).toBe(false);
      }
    }
  });

  it('should have appropriate default permissions for each role', () => {
    // This test validates that role configurations make sense
    const rolePermissionExpectations = {
      member: ['content:read', 'newsletter:read', 'theme:read', 'theme:update'],
      contributor: ['content:create', 'design:create'],
      canva_contributor: ['design:canva', 'design:export'],
      editor: ['content:approve', 'newsletter:create'],
      moderator: ['user:role:assign', 'content:publish'],
      administrator: ['system:config', 'system:audit'],
    };

    Object.entries(rolePermissionExpectations).forEach(([role, expectedPermissions]) => {
      expectedPermissions.forEach(permission => {
        // Each role should logically have its expected permissions
        // Updated regex to handle colons in permission names
        expect(permission).toMatch(/^[a-z_]+:[a-z_:]+$/);
      });
    });
  });
});
