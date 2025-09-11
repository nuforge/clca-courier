/**
 * Permission Definitions and Rules
 * CASL ability rules for role-based access control
 */

import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import type {
  Action,
  Subject,
  AppAbility,
  AbilityRule
} from '../types/core/permissions.types';
import type { UserRoleType } from '../types/core/user-roles.types';
import { logger } from './logger';/**
 * Create ability for a specific role
 */
export function createAbilityForRole(
  role: UserRoleType,
  userId: string
): AppAbility {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  try {
    // Apply role-specific rules
    switch (role) {
      case 'member':
        defineMemberPermissions(can, cannot, userId);
        break;
      case 'contributor':
        defineMemberPermissions(can, cannot, userId);
        defineContributorPermissions(can, cannot, userId);
        break;
      case 'canva_contributor':
        defineMemberPermissions(can, cannot, userId);
        defineContributorPermissions(can, cannot, userId);
        defineCanvaContributorPermissions(can, cannot, userId);
        break;
      case 'editor':
        defineMemberPermissions(can, cannot, userId);
        defineContributorPermissions(can, cannot, userId);
        defineCanvaContributorPermissions(can, cannot, userId);
        defineEditorPermissions(can, cannot);
        break;
      case 'moderator':
        defineMemberPermissions(can, cannot, userId);
        defineContributorPermissions(can, cannot, userId);
        defineCanvaContributorPermissions(can, cannot, userId);
        defineEditorPermissions(can, cannot);
        defineModeratorPermissions(can, cannot);
        break;
      case 'administrator':
        defineAdministratorPermissions(can);
        break;
      default:
        logger.warn('Unknown role provided, defaulting to member permissions', { role, userId });
        defineMemberPermissions(can, cannot, userId);
    }

    const ability = build();
    logger.debug('Created ability for role', { role, userId, rulesCount: ability.rules.length });
    return ability as AppAbility;

  } catch (error) {
    logger.error('Failed to create ability for role', { role, userId, error });
    // Return minimal permissions on error
    const { can: safeCan, build: safeBuild } = new AbilityBuilder(createMongoAbility);
    safeCan('read', 'Settings', { isPublic: true });
    return safeBuild() as AppAbility;
  }
}/**
 * Member role permissions (base level)
 */
function defineMemberPermissions(
  can: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void,
  cannot: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void,
  userId: string
): void {
  // Account and profile management
  can('read', 'User', { id: userId });
  can('update', 'User', { id: userId }, ['email', 'displayName', 'preferences', 'notifications']);
  cannot('update', 'User', { id: userId }, ['role', 'permissions', 'isActive']);

  // Personal settings and themes
  can('read', 'Settings', { isPublic: true });
  can('update', 'Settings', { createdBy: userId });
  can('create', 'Settings', { createdBy: userId });

  can('read', 'Theme', { isPublic: true });
  can('create', 'Theme', { createdBy: userId });
  can('update', 'Theme', { createdBy: userId });
  can('delete', 'Theme', { createdBy: userId });

  // Public content viewing
  can('read', 'Content', { status: 'published' });
  can('read', 'Newsletter', { isPublished: true });

  // Role requests
  can('request', 'Role', { userId });
  can('read', 'Role', { userId });
}

/**
 * Contributor role permissions
 */
function defineContributorPermissions(
  can: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void,
  cannot: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void,
  userId: string
): void {
  // Content creation and management (own content only)
  can('create', 'Content');
  can('read', 'Content', { authorId: userId });
  can('update', 'Content', { authorId: userId, status: { $in: ['draft', 'rejected'] } });
  can('delete', 'Content', { authorId: userId, status: { $in: ['draft', 'rejected'] } });

  // Cannot modify approved or published content
  cannot('update', 'Content', { status: { $in: ['approved', 'published'] } });
  cannot('delete', 'Content', { status: { $in: ['approved', 'published'] } });

  // Design creation (non-Canva)
  can('create', 'Design', { type: { $in: ['template', 'custom'] } });
  can('read', 'Design', { createdBy: userId });
  can('update', 'Design', { createdBy: userId });
  can('delete', 'Design', { createdBy: userId });

  // Cannot use Canva features
  cannot('create', 'Design', { type: 'canva' });
  cannot('export', 'Design');

  // Media uploads
  can('create', 'Media');
  can('read', 'Media', { createdBy: userId });
  can('update', 'Media', { createdBy: userId });
  can('delete', 'Media', { createdBy: userId });
}

/**
 * Canva Contributor role permissions
 */
function defineCanvaContributorPermissions(
  can: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void,
  cannot: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void,
  userId: string
): void {
  // Canva-specific design permissions
  can('create', 'Design', { type: 'canva' });
  can('export', 'Design', { createdBy: userId });
  can('read', 'Template', { isPublic: true });
  can('create', 'Template', { createdBy: userId });
  can('update', 'Template', { createdBy: userId });

  // Enhanced media capabilities
  can('import', 'Media');
}

/**
 * Editor role permissions
 */
function defineEditorPermissions(
  can: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void,
  cannot: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void
): void {
  // Content management (all content)
  can('read', 'Content');
  can('update', 'Content', { status: { $in: ['pending', 'approved'] } });
  can('approve', 'Content', { status: 'pending' });
  can('reject', 'Content', { status: 'pending' });
  can('publish', 'Content', { status: 'approved' });

  // Newsletter management
  can('create', 'Newsletter');
  can('read', 'Newsletter');
  can('update', 'Newsletter');
  can('publish', 'Newsletter');

  // Cannot delete published newsletters without admin approval
  cannot('delete', 'Newsletter', { isPublished: true });

  // Category and tag management
  can('create', 'Category');
  can('read', 'Category');
  can('update', 'Category');
  can('delete', 'Category');

  can('create', 'Tag');
  can('read', 'Tag');
  can('update', 'Tag');
  can('delete', 'Tag');

  // Template management
  can('manage', 'Template');

  // Analytics (content-related)
  can('read', 'Analytics', { type: 'content' });
}

/**
 * Moderator role permissions
 */
function defineModeratorPermissions(
  can: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void,
  cannot: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void
): void {
  // User management (limited)
  can('read', 'User');
  can('update', 'User', undefined, ['isActive', 'role']);
  cannot('update', 'User', { role: { $eq: 'administrator' } }); // Cannot modify administrators
  cannot('delete', 'User');

  // Role management
  can('read', 'Role');
  can('assign', 'Role', { roleType: { $in: ['member', 'contributor', 'canva_contributor', 'editor'] } });
  cannot('assign', 'Role', { roleType: { $in: ['moderator', 'administrator'] } });

  // Content moderation
  can('moderate', 'Content');
  can('delete', 'Content');

  // System monitoring
  can('read', 'Audit');
  can('read', 'Analytics', { type: { $in: ['content', 'user'] } });

  // Print workflow management
  can('read', 'Print');
  can('manage', 'Print');
}

/**
 * Administrator role permissions (full access)
 */
function defineAdministratorPermissions(
  can: (action: Action, subject: Subject, conditions?: Record<string, unknown>, fields?: string[]) => void
): void {
  // Full system access
  can('manage', 'all');

  // Explicitly allow sensitive operations
  can('delete', 'User');
  can('assign', 'Role');
  can('configure', 'System');
  can('backup', 'System');
  can('audit', 'System');

  // Note: Even administrators should have some restrictions in production
  // These can be added based on security requirements
}

/**
 * Permission rule templates for common patterns
 */
export const PERMISSION_TEMPLATES = {
  OWN_CONTENT: {
    read: { authorId: '$userId' },
    update: { authorId: '$userId' },
    delete: { authorId: '$userId' },
  },
  PUBLISHED_CONTENT: {
    read: { status: 'published' },
  },
  PUBLIC_RESOURCES: {
    read: { isPublic: true },
  },
  DRAFT_CONTENT: {
    update: { status: ['draft', 'rejected'] },
    delete: { status: ['draft', 'rejected'] },
  },
  PENDING_APPROVAL: {
    approve: { status: 'pending' },
    reject: { status: 'pending' },
  },
} as const;

/**
 * Field restrictions for different roles
 */
export const FIELD_RESTRICTIONS = {
  member: {
    User: ['email', 'displayName', 'preferences', 'notifications'],
    Settings: ['theme', 'language', 'notifications'],
    Theme: ['name', 'config', 'isPublic'],
  },
  contributor: {
    Content: ['title', 'content', 'type', 'tags'],
    Design: ['name', 'config', 'isPublic'],
    Media: ['title', 'description', 'tags'],
  },
  editor: {
    Content: ['title', 'content', 'type', 'tags', 'status', 'featured'],
    Newsletter: ['title', 'description', 'tags', 'featured', 'isPublished'],
    Category: ['name', 'description', 'color', 'icon'],
  },
  moderator: {
    User: ['isActive', 'role'],
    Role: ['roleType', 'expiresAt'],
  },
  administrator: [], // No field restrictions
} as const;

/**
 * Validate permission rule
 */
export function validatePermissionRule(rule: AbilityRule): boolean {
  try {
    // Basic validation
    if (!rule.action || !rule.subject) {
      return false;
    }

    // Validate action types
    const validActions: Action[] = [
      'create', 'read', 'update', 'delete', 'manage',
      'publish', 'approve', 'reject', 'assign', 'request',
      'export', 'import', 'backup', 'audit', 'configure',
      'moderate', 'claim'
    ];

    const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
    if (!actions.every(action => validActions.includes(action))) {
      return false;
    }

    // Validate subject types
    const validSubjects: Subject[] = [
      'Content', 'Newsletter', 'User', 'Role', 'Design',
      'Template', 'Theme', 'System', 'Analytics', 'Print',
      'Comment', 'Category', 'Tag', 'Media', 'File',
      'Settings', 'Audit', 'Backup', 'Dashboard', 'Report', 'all'
    ];

    const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject];
    if (!subjects.every(subject => validSubjects.includes(subject))) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating permission rule', { rule, error });
    return false;
  }
}

/**
 * Get human-readable permission description
 */
export function getPermissionDescription(action: Action, subject: Subject): string {
  const actionMap: Record<Action, string> = {
    create: 'Create',
    read: 'View',
    update: 'Edit',
    delete: 'Delete',
    manage: 'Manage',
    publish: 'Publish',
    approve: 'Approve',
    reject: 'Reject',
    assign: 'Assign',
    request: 'Request',
    export: 'Export',
    import: 'Import',
    backup: 'Backup',
    audit: 'Audit',
    configure: 'Configure',
    moderate: 'Moderate',
    claim: 'Claim',
  };

  const subjectMap: Record<Subject, string> = {
    Content: 'content',
    Newsletter: 'newsletters',
    User: 'users',
    Role: 'roles',
    Design: 'designs',
    Template: 'templates',
    Theme: 'themes',
    System: 'system',
    Analytics: 'analytics',
    Print: 'print jobs',
    Comment: 'comments',
    Category: 'categories',
    Tag: 'tags',
    Media: 'media',
    File: 'files',
    Settings: 'settings',
    Audit: 'audit logs',
    Backup: 'backups',
    Dashboard: 'dashboard',
    Report: 'reports',
    all: 'everything',
  };

  return `${actionMap[action]} ${subjectMap[subject]}`;
}

/**
 * Check if action implies other actions
 */
export function getImpliedActions(action: Action): Action[] {
  const implications: Record<Action, Action[]> = {
    manage: ['create', 'read', 'update', 'delete', 'publish', 'approve'],
    moderate: ['read', 'update', 'approve', 'reject'],
    publish: ['read', 'update'],
    approve: ['read'],
    create: [],
    read: [],
    update: ['read'],
    delete: ['read'],
    reject: ['read'],
    assign: ['read'],
    request: [],
    export: ['read'],
    import: [],
    backup: ['read'],
    audit: ['read'],
    configure: ['read', 'update'],
    claim: ['read'],
  };

  return implications[action] || [];
}

/**
 * Merge multiple abilities
 */
export function mergeAbilities(abilities: AppAbility[]): AppAbility {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  abilities.forEach(ability => {
    ability.rules.forEach(rule => {
      if (rule.inverted) {
        // Handle 'cannot' rules - this would require more complex logic
        // For now, we'll skip inverted rules in merging
        logger.warn('Skipping inverted rule in ability merge', { rule });
      } else {
        // For the merge, we'll use a simplified approach
        can(rule.action as Action, rule.subject as Subject);
      }
    });
  });

  return build() as AppAbility;
}
