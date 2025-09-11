/**
 * Permission System Types for CASL Integration
 * Enhanced permission checking with resource-based access control
 */

import type { MongoAbility } from '@casl/ability';
import type { UserRoleType } from './user-roles.types';

/**
 * Available actions that can be performed on resources
 */
export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'    // Special action that represents any action
  | 'publish'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'request'
  | 'export'
  | 'import'
  | 'backup'
  | 'audit'
  | 'configure'
  | 'moderate'
  | 'claim';

/**
 * Available subjects (resources) that actions can be performed on
 */
export type Subject =
  | 'Content'
  | 'Newsletter'
  | 'User'
  | 'Role'
  | 'Design'
  | 'Template'
  | 'Theme'
  | 'System'
  | 'Analytics'
  | 'Print'
  | 'Comment'
  | 'Category'
  | 'Tag'
  | 'Media'
  | 'File'
  | 'Settings'
  | 'Audit'
  | 'Backup'
  | 'Dashboard'
  | 'Report'
  | 'all';    // Special subject that represents any subject

/**
 * Resource interfaces for permission checking
 */
export interface BaseResource {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface ContentResource extends BaseResource {
  type: 'article' | 'announcement' | 'event' | 'classified' | 'photo';
  title: string;
  authorId: string;
  status: 'pending' | 'approved' | 'rejected' | 'published' | 'draft';
  featured?: boolean;
  categoryId?: string;
}

export interface NewsletterResource extends BaseResource {
  title: string;
  filename: string;
  publicationDate: string;
  isPublished: boolean;
  featured: boolean;
  issueNumber?: string;
}

export interface UserResource extends BaseResource {
  email: string;
  role: UserRoleType;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface RoleResource extends BaseResource {
  roleType: UserRoleType;
  userId: string;
  assignedBy: string;
  method: 'admin_assigned' | 'self_requested' | 'auto_domain' | 'external_sync';
  expiresAt?: string;
}

export interface DesignResource extends BaseResource {
  name: string;
  type: 'template' | 'custom' | 'newsletter' | 'poster' | 'flyer';
  canvaId?: string;
  isPublic: boolean;
  categoryId?: string;
}

export interface ThemeResource extends BaseResource {
  name: string;
  isDefault: boolean;
  isPublic: boolean;
  config: Record<string, unknown>;
}

export interface SystemResource extends BaseResource {
  component: string;
  setting: string;
  value: unknown;
  isPublic: boolean;
}

/**
 * Union type for all resources
 */
export type AppResource =
  | ContentResource
  | NewsletterResource
  | UserResource
  | RoleResource
  | DesignResource
  | ThemeResource
  | SystemResource
  | BaseResource;

/**
 * Permission context for conditional permissions
 */
export interface PermissionContext {
  userId?: string;
  organizationId?: string;
  categoryId?: string;
  departmentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Permission condition function type
 */
export type PermissionCondition<T = AppResource> = (resource: T, context?: PermissionContext) => boolean;

/**
 * Extended ability configuration
 */
export interface AbilityConfig {
  role: UserRoleType;
  userId: string;
  context?: PermissionContext;
  customRules?: AbilityRule[];
}

/**
 * Ability rule configuration
 */
export interface AbilityRule {
  action: Action | Action[];
  subject: Subject | Subject[];
  conditions?: Record<string, unknown>;
  fields?: string[];
  inverted?: boolean;
  reason?: string;
}

/**
 * CASL Ability type for our application
 */
export type AppAbility = MongoAbility<[Action, Subject]>;

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  conditions?: Record<string, unknown>;
  fields?: string[];
}

/**
 * Bulk permission check input
 */
export interface BulkPermissionCheck {
  action: Action;
  subject: Subject;
  resource?: AppResource;
  context?: PermissionContext;
}

/**
 * Bulk permission check result
 */
export interface BulkPermissionResult {
  checks: Array<BulkPermissionCheck & PermissionCheckResult>;
  summary: {
    total: number;
    allowed: number;
    denied: number;
  };
}

/**
 * Permission analytics data
 */
export interface PermissionAnalytics {
  totalChecks: number;
  allowedChecks: number;
  deniedChecks: number;
  topActions: Array<{ action: Action; count: number }>;
  topSubjects: Array<{ subject: Subject; count: number }>;
  roleDistribution: Record<UserRoleType, number>;
  timeRange: {
    start: string;
    end: string;
  };
}

/**
 * Type guards for resources
 */
export function isContentResource(resource: unknown): resource is ContentResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'type' in resource &&
    'title' in resource &&
    'authorId' in resource &&
    'status' in resource
  );
}

export function isNewsletterResource(resource: unknown): resource is NewsletterResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'filename' in resource &&
    'publicationDate' in resource &&
    'isPublished' in resource
  );
}

export function isUserResource(resource: unknown): resource is UserResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'email' in resource &&
    'role' in resource &&
    'isActive' in resource
  );
}

export function isRoleResource(resource: unknown): resource is RoleResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'roleType' in resource &&
    'userId' in resource &&
    'assignedBy' in resource &&
    'method' in resource
  );
}

export function isDesignResource(resource: unknown): resource is DesignResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'name' in resource &&
    'type' in resource &&
    'isPublic' in resource
  );
}

export function isThemeResource(resource: unknown): resource is ThemeResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'name' in resource &&
    'isDefault' in resource &&
    'isPublic' in resource &&
    'config' in resource
  );
}

export function isSystemResource(resource: unknown): resource is SystemResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'component' in resource &&
    'setting' in resource &&
    'value' in resource &&
    'isPublic' in resource
  );
}

/**
 * Helper function to determine subject from resource
 */
export function getSubjectFromResource(resource: AppResource): Subject {
  if (isContentResource(resource)) return 'Content';
  if (isNewsletterResource(resource)) return 'Newsletter';
  if (isUserResource(resource)) return 'User';
  if (isRoleResource(resource)) return 'Role';
  if (isDesignResource(resource)) return 'Design';
  if (isThemeResource(resource)) return 'Theme';
  if (isSystemResource(resource)) return 'System';

  // Fallback to generic based on resource properties
  return 'all';
}

/**
 * Helper function to create permission context
 */
export function createPermissionContext(
  userId?: string,
  organizationId?: string,
  metadata?: Record<string, unknown>
): PermissionContext {
  const context: PermissionContext = {
    metadata: metadata || {},
  };

  if (userId !== undefined) {
    context.userId = userId;
  }

  if (organizationId !== undefined) {
    context.organizationId = organizationId;
  }

  return context;
}

/**
 * Constants for common permission patterns
 */
export const PERMISSION_PATTERNS = {
  OWN_CONTENT_ONLY: { createdBy: '$userId' },
  PUBLISHED_ONLY: { status: 'published' },
  ACTIVE_ONLY: { isActive: true },
  PUBLIC_ONLY: { isPublic: true },
  SAME_ORGANIZATION: { organizationId: '$organizationId' },
} as const;

/**
 * Permission inheritance rules
 */
export const PERMISSION_INHERITANCE = {
  'manage': ['create', 'read', 'update', 'delete', 'publish', 'approve'],
  'moderate': ['read', 'update', 'approve', 'reject'],
  'publish': ['read', 'update'],
  'approve': ['read'],
} as const;
