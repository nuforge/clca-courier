/**
 * Permission System Tests
 * Tests for Phase 1B - Permission Checking with CASL
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createAbilityForRole, validatePermissionRule, getPermissionDescription } from '../../src/utils/permissions';
import type { Action, Subject, AbilityRule } from '../../src/types/core/permissions.types';
import type { UserRoleType } from '../../src/types/core/user-roles.types';

// Mock logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Permission System', () => {
  const testUserId = 'test-user-123';

  describe('createAbilityForRole', () => {
    it('should create ability for member role', () => {
      const ability = createAbilityForRole('member', testUserId);

      expect(ability).toBeDefined();
      expect(ability.can('read', 'Settings')).toBe(true);
      expect(ability.can('read', 'Content')).toBe(true);
      expect(ability.can('create', 'Content')).toBe(false);
    });

    it('should create ability for contributor role', () => {
      const ability = createAbilityForRole('contributor', testUserId);

      expect(ability).toBeDefined();
      expect(ability.can('create', 'Content')).toBe(true);
      expect(ability.can('read', 'Content')).toBe(true);
      expect(ability.can('approve', 'Content')).toBe(false);
    });

    it('should create ability for canva_contributor role', () => {
      const ability = createAbilityForRole('canva_contributor', testUserId);

      expect(ability).toBeDefined();
      expect(ability.can('create', 'Content')).toBe(true);
      expect(ability.can('create', 'Design')).toBe(true);
      expect(ability.can('export', 'Design')).toBe(true);
    });

    it('should create ability for editor role', () => {
      const ability = createAbilityForRole('editor', testUserId);

      expect(ability).toBeDefined();
      expect(ability.can('read', 'Content')).toBe(true);
      expect(ability.can('approve', 'Content')).toBe(true);
      expect(ability.can('publish', 'Content')).toBe(true);
      expect(ability.can('create', 'Newsletter')).toBe(true);
    });

    it('should create ability for moderator role', () => {
      const ability = createAbilityForRole('moderator', testUserId);

      expect(ability).toBeDefined();
      expect(ability.can('read', 'User')).toBe(true);
      expect(ability.can('moderate', 'Content')).toBe(true);
      expect(ability.can('delete', 'Content')).toBe(true);
      expect(ability.can('read', 'Analytics')).toBe(true);
    });

    it('should create ability for administrator role', () => {
      const ability = createAbilityForRole('administrator', testUserId);

      expect(ability).toBeDefined();
      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('delete', 'User')).toBe(true);
      expect(ability.can('configure', 'System')).toBe(true);
      expect(ability.can('backup', 'System')).toBe(true);
    });

    it('should default to member permissions for unknown roles', () => {
      const ability = createAbilityForRole('unknown' as UserRoleType, testUserId);

      expect(ability).toBeDefined();
      expect(ability.can('read', 'Settings')).toBe(true);
      expect(ability.can('create', 'Content')).toBe(false);
    });
  });

  describe('Permission Hierarchy', () => {
    it('should respect role hierarchy in permissions', () => {
      const memberAbility = createAbilityForRole('member', testUserId);
      const contributorAbility = createAbilityForRole('contributor', testUserId);
      const editorAbility = createAbilityForRole('editor', testUserId);
      const adminAbility = createAbilityForRole('administrator', testUserId);

      // Members can only read public content
      expect(memberAbility.can('read', 'Content')).toBe(true);
      expect(memberAbility.can('create', 'Content')).toBe(false);

      // Contributors inherit member permissions plus content creation
      expect(contributorAbility.can('read', 'Content')).toBe(true);
      expect(contributorAbility.can('create', 'Content')).toBe(true);
      expect(contributorAbility.can('approve', 'Content')).toBe(false);

      // Editors inherit all previous permissions plus content management
      expect(editorAbility.can('create', 'Content')).toBe(true);
      expect(editorAbility.can('approve', 'Content')).toBe(true);
      expect(editorAbility.can('delete', 'User')).toBe(false);

      // Administrators have full access
      expect(adminAbility.can('manage', 'all')).toBe(true);
      expect(adminAbility.can('delete', 'User')).toBe(true);
    });

    it('should provide incremental permissions across roles', () => {
      const roles: UserRoleType[] = [
        'member',
        'contributor',
        'canva_contributor',
        'editor',
        'moderator',
        'administrator'
      ];

      // Test that each role has appropriate permissions
      roles.forEach(role => {
        const ability = createAbilityForRole(role, testUserId);

        // Each role should have some basic permissions
        expect(ability.rules.length).toBeGreaterThan(0);

        // All roles should be able to read settings
        expect(ability.can('read', 'Settings')).toBe(true);

        // Administrator should have the most comprehensive access
        if (role === 'administrator') {
          expect(ability.can('manage', 'all')).toBe(true);
        }
      });
    });
  });

  describe('validatePermissionRule', () => {
    it('should validate correct permission rules', () => {
      const validRule: AbilityRule = {
        action: 'read',
        subject: 'Content',
        conditions: { status: 'published' },
      };

      expect(validatePermissionRule(validRule)).toBe(true);
    });

    it('should validate rules with multiple actions and subjects', () => {
      const validRule: AbilityRule = {
        action: ['read', 'update'],
        subject: ['Content', 'Newsletter'],
      };

      expect(validatePermissionRule(validRule)).toBe(true);
    });

    it('should reject rules with invalid actions', () => {
      const invalidRule: AbilityRule = {
        action: 'invalid-action' as Action,
        subject: 'Content',
      };

      expect(validatePermissionRule(invalidRule)).toBe(false);
    });

    it('should reject rules with invalid subjects', () => {
      const invalidRule: AbilityRule = {
        action: 'read',
        subject: 'InvalidSubject' as Subject,
      };

      expect(validatePermissionRule(invalidRule)).toBe(false);
    });

    it('should reject rules with missing required fields', () => {
      const invalidRule = {
        action: 'read',
        // Missing subject
      } as AbilityRule;

      expect(validatePermissionRule(invalidRule)).toBe(false);
    });
  });

  describe('getPermissionDescription', () => {
    it('should return human-readable permission descriptions', () => {
      expect(getPermissionDescription('read', 'Content')).toBe('View content');
      expect(getPermissionDescription('create', 'Newsletter')).toBe('Create newsletters');
      expect(getPermissionDescription('manage', 'User')).toBe('Manage users');
      expect(getPermissionDescription('approve', 'Content')).toBe('Approve content');
    });

    it('should handle all supported actions and subjects', () => {
      const actions: Action[] = ['create', 'read', 'update', 'delete', 'manage'];
      const subjects: Subject[] = ['Content', 'Newsletter', 'User', 'Role', 'Design'];

      actions.forEach(action => {
        subjects.forEach(subject => {
          const description = getPermissionDescription(action, subject);
          expect(description).toBeTruthy();
          expect(typeof description).toBe('string');
        });
      });
    });
  });

  describe('Basic Permission Checks', () => {
    it('should allow different actions based on role', () => {
      const contributorAbility = createAbilityForRole('contributor', testUserId);
      const editorAbility = createAbilityForRole('editor', testUserId);

      // Contributors can create content but not approve it
      expect(contributorAbility.can('create', 'Content')).toBe(true);
      expect(contributorAbility.can('approve', 'Content')).toBe(false);

      // Editors can both create and approve content
      expect(editorAbility.can('create', 'Content')).toBe(true);
      expect(editorAbility.can('approve', 'Content')).toBe(true);
    });

    it('should deny unauthorized actions', () => {
      const memberAbility = createAbilityForRole('member', testUserId);

      // Members should not be able to perform administrative actions
      expect(memberAbility.can('delete', 'User')).toBe(false);
      expect(memberAbility.can('configure', 'System')).toBe(false);
      expect(memberAbility.can('manage', 'all')).toBe(false);
    });

    it('should allow public actions for all roles', () => {
      const roles: UserRoleType[] = [
        'member', 'contributor', 'canva_contributor',
        'editor', 'moderator', 'administrator'
      ];

      roles.forEach(role => {
        const ability = createAbilityForRole(role, testUserId);

        // All roles should be able to read public content and settings
        expect(ability.can('read', 'Settings')).toBe(true);
        expect(ability.can('read', 'Content')).toBe(true);
      });
    });
  });

  describe('Role-Specific Features', () => {
    it('should allow Canva-specific permissions for canva_contributor', () => {
      const canvaContributor = createAbilityForRole('canva_contributor', testUserId);
      const regularContributor = createAbilityForRole('contributor', testUserId);

      // Canva contributors should have additional design permissions
      expect(canvaContributor.can('export', 'Design')).toBe(true);
      expect(canvaContributor.can('import', 'Media')).toBe(true);

      // Regular contributors should not have Canva permissions
      expect(regularContributor.can('export', 'Design')).toBe(false);
      expect(regularContributor.can('import', 'Media')).toBe(false);
    });

    it('should allow moderation permissions for moderators', () => {
      const moderator = createAbilityForRole('moderator', testUserId);
      const editor = createAbilityForRole('editor', testUserId);

      // Moderators should have additional user management permissions
      expect(moderator.can('moderate', 'Content')).toBe(true);
      expect(moderator.can('read', 'User')).toBe(true);
      expect(moderator.can('read', 'Audit')).toBe(true);

      // Editors should not have moderation permissions
      expect(editor.can('moderate', 'Content')).toBe(false);
      expect(editor.can('read', 'Audit')).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty user ID gracefully', () => {
      const ability = createAbilityForRole('member', '');
      expect(ability).toBeDefined();
      expect(ability.rules.length).toBeGreaterThan(0);
    });

    it('should maintain consistent behavior across ability recreations', () => {
      const ability1 = createAbilityForRole('contributor', testUserId);
      const ability2 = createAbilityForRole('contributor', testUserId);

      // Same permissions should be granted consistently
      expect(ability1.can('create', 'Content')).toBe(ability2.can('create', 'Content'));
      expect(ability1.can('approve', 'Content')).toBe(ability2.can('approve', 'Content'));
    });
  });

  describe('Integration with Role System', () => {
    it('should work with all defined user roles', () => {
      const roles: UserRoleType[] = [
        'member',
        'contributor',
        'canva_contributor',
        'editor',
        'moderator',
        'administrator'
      ];

      roles.forEach(role => {
        expect(() => createAbilityForRole(role, testUserId)).not.toThrow();
        const ability = createAbilityForRole(role, testUserId);
        expect(ability).toBeDefined();
        expect(ability.rules.length).toBeGreaterThan(0);
      });
    });

    it('should provide meaningful rule counts for each role', () => {
      const roles: UserRoleType[] = [
        'member', 'contributor', 'canva_contributor',
        'editor', 'moderator', 'administrator'
      ];

      roles.forEach(role => {
        const ability = createAbilityForRole(role, testUserId);

        // Each role should have at least some basic permissions
        expect(ability.rules.length).toBeGreaterThan(0);

        // Administrator should have the most comprehensive permissions
        if (role === 'administrator') {
          expect(ability.rules.length).toBeGreaterThan(5);
        }
      });
    });
  });
});
