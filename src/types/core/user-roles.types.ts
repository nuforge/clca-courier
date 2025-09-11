/**
 * User Role System Types
 * Comprehensive role-based access control for CLCA Courier
 */

/**
 * Available user roles in the system
 */
export type UserRoleType =
  | 'member'              // Authenticated user, account settings, individual site theme settings
  | 'contributor'         // Authenticated user, design creation permissions, NO CANVA
  | 'canva_contributor'   // Design creation permissions, specifically to manage CANVA permissions
  | 'editor'              // Manage newsletter content
  | 'moderator'           // Approve/reject submissions, role management
  | 'administrator';      // Full system access

/**
 * Granular permissions for action-level control
 */
export type Permission =
  // Content Management
  | 'content:read'        // View content submissions
  | 'content:create'      // Submit new content
  | 'content:update'      // Edit existing content
  | 'content:delete'      // Delete content
  | 'content:approve'     // Approve/reject content submissions
  | 'content:publish'     // Publish approved content

  // Newsletter Management
  | 'newsletter:read'     // View newsletter archive
  | 'newsletter:create'   // Create newsletter issues
  | 'newsletter:update'   // Edit newsletter content
  | 'newsletter:delete'   // Delete newsletter issues
  | 'newsletter:publish'  // Publish newsletter issues

  // User Management
  | 'user:read'           // View user profiles
  | 'user:update'         // Update user profiles
  | 'user:delete'         // Delete user accounts
  | 'user:role:assign'    // Assign roles to users
  | 'user:role:request'   // Request role changes

  // Design & Creative
  | 'design:create'       // Create designs (non-Canva)
  | 'design:canva'        // Canva integration access
  | 'design:export'       // Export designs
  | 'design:template'     // Manage design templates

  // System Administration
  | 'system:config'       // System configuration
  | 'system:analytics'    // View analytics
  | 'system:backup'       // System backup/restore
  | 'system:audit'        // View audit logs

  // Theme & Customization
  | 'theme:read'          // View theme settings
  | 'theme:update'        // Modify personal theme
  | 'theme:admin'         // Manage global themes

  // Print Management
  | 'print:read'          // View print queue
  | 'print:claim'         // Claim print jobs
  | 'print:manage';       // Manage print workflow

/**
 * Role assignment method
 */
export type RoleAssignmentMethod =
  | 'admin_assigned'      // Manual assignment by admin
  | 'self_requested'      // User requested (pending approval)
  | 'auto_domain'         // Automatic based on email domain
  | 'external_sync';      // Synced from external system

/**
 * Role request status
 */
export type RoleRequestStatus =
  | 'pending'             // Awaiting approval
  | 'approved'            // Approved and role granted
  | 'rejected'            // Request rejected
  | 'expired';            // Request expired

/**
 * Role request interface
 */
export interface RoleRequest {
  id: string;
  userId: string;
  requestedRole: UserRoleType;
  currentRole: UserRoleType;
  reason: string;
  status: RoleRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  expiresAt: string;
}

/**
 * Enhanced user role configuration
 */
export interface UserRoleConfig {
  role: UserRoleType;
  permissions: Permission[];
  displayName: string;
  description: string;
  color: string;          // For UI display
  icon: string;           // UI icon identifier
  hierarchy: number;      // Numeric hierarchy for comparison
  dashboardRoute: string; // Default dashboard route
  assignmentMethod: RoleAssignmentMethod[];  // Allowed assignment methods
  requiredApproval: boolean;  // Requires approval for assignment
  autoExpiresAfter?: number;  // Days after which role expires (optional)
}

/**
 * User role assignment record
 */
export interface UserRoleAssignment {
  userId: string;
  role: UserRoleType;
  assignedBy: string;
  assignedAt: string;
  assignmentMethod: RoleAssignmentMethod;
  approvedBy?: string;
  approvedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Permission check context
 */
export interface PermissionContext {
  resource?: string;      // Resource being accessed
  resourceId?: string;    // Specific resource ID
  ownerId?: string;       // Resource owner (for ownership checks)
  metadata?: Record<string, unknown>;  // Additional context
}

/**
 * Dashboard configuration per role
 */
export interface DashboardConfig {
  defaultRoute: string;
  availableTools: DashboardTool[];
  navigation: DashboardNavigationItem[];
  layout: 'grid' | 'list' | 'compact';
  refreshInterval?: number;  // Auto-refresh in seconds
}

/**
 * Dashboard tool configuration
 */
export interface DashboardTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  permissions: Permission[];
  category: 'content' | 'management' | 'design' | 'system' | 'personal';
  priority: number;       // Display order
  isEnabled: boolean;
  requiredFeatureFlags?: string[];
}

/**
 * Dashboard navigation item
 */
export interface DashboardNavigationItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  permissions: Permission[];
  children?: DashboardNavigationItem[];
  badge?: string;         // Optional badge text
  isVisible: boolean;
}

/**
 * Role transition record for audit
 */
export interface RoleTransition {
  id: string;
  userId: string;
  fromRole: UserRoleType | null;
  toRole: UserRoleType;
  transitionType: 'assignment' | 'promotion' | 'demotion' | 'removal';
  performedBy: string;
  performedAt: string;
  reason: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Role analytics interface
 */
export interface RoleAnalytics {
  totalUsers: number;
  roleDistribution: Record<UserRoleType, number>;
  recentTransitions: RoleTransition[];
  pendingRequests: number;
  activeRoleRequests: RoleRequest[];
}

/**
 * Type guards for role system
 */
export function isValidRole(role: string): role is UserRoleType {
  const validRoles: UserRoleType[] = [
    'member',
    'contributor',
    'canva_contributor',
    'editor',
    'moderator',
    'administrator'
  ];
  return validRoles.includes(role as UserRoleType);
}

export function isValidPermission(permission: string): permission is Permission {
  // This would be expanded with all valid permissions
  const validPermissions = [
    'content:read', 'content:create', 'content:update', 'content:delete',
    'content:approve', 'content:publish',
    // ... all other permissions
  ];
  return validPermissions.includes(permission as Permission);
}

/**
 * Role hierarchy helper
 */
export function getRoleHierarchy(role: UserRoleType): number {
  const hierarchy: Record<UserRoleType, number> = {
    'member': 1,
    'contributor': 2,
    'canva_contributor': 3,
    'editor': 4,
    'moderator': 5,
    'administrator': 6
  };
  return hierarchy[role] || 0;
}

/**
 * Check if role A has higher or equal hierarchy to role B
 */
export function hasRoleHierarchy(roleA: UserRoleType, roleB: UserRoleType): boolean {
  return getRoleHierarchy(roleA) >= getRoleHierarchy(roleB);
}
