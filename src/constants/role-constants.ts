/**
 * Role System Constants
 * Centralized role definitions and utilities to eliminate hardcoded roles throughout the codebase
 */
import type { UserRoleType } from '../types/core/user-roles.types';

// Centralized role constants - NO MORE HARDCODED ROLES!
export const USER_ROLES = {
  MEMBER: 'member' as const,
  CONTRIBUTOR: 'contributor' as const,
  CANVA_CONTRIBUTOR: 'canva_contributor' as const,
  EDITOR: 'editor' as const,
  MODERATOR: 'moderator' as const,
  ADMINISTRATOR: 'administrator' as const,
} as const;


// Role hierarchy mapping
export const ROLE_HIERARCHY: Record<string, number> = {
  [USER_ROLES.MEMBER]: 1,
  [USER_ROLES.CONTRIBUTOR]: 2,
  [USER_ROLES.CANVA_CONTRIBUTOR]: 3,
  [USER_ROLES.EDITOR]: 4,
  [USER_ROLES.MODERATOR]: 5,
  [USER_ROLES.ADMINISTRATOR]: 6,
} as const;

// Role arrays for common checks
export const CONTENT_MANAGEMENT_ROLES = [
  USER_ROLES.CONTRIBUTOR,
  USER_ROLES.CANVA_CONTRIBUTOR,
  USER_ROLES.EDITOR,
  USER_ROLES.MODERATOR,
  USER_ROLES.ADMINISTRATOR,
] as const;

export const EDITOR_ROLES = [
  USER_ROLES.EDITOR,
  USER_ROLES.MODERATOR,
  USER_ROLES.ADMINISTRATOR,
] as const;

export const ADMIN_ROLES = [
  USER_ROLES.MODERATOR,
  USER_ROLES.ADMINISTRATOR,
] as const;

export const CANVA_ROLES = [
  USER_ROLES.CANVA_CONTRIBUTOR,
  USER_ROLES.EDITOR,
  USER_ROLES.MODERATOR,
  USER_ROLES.ADMINISTRATOR,
] as const;

// Route protection mapping
export const PROTECTED_ROUTES = {
  '/admin/content': USER_ROLES.CONTRIBUTOR,
  '/admin': USER_ROLES.ADMINISTRATOR,
} as const;

// Utility functions
export function hasRoleHierarchy(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

export function isContentManager(role: string): boolean {
  return CONTENT_MANAGEMENT_ROLES.includes(role as any);
}

export function isEditor(role: string): boolean {
  return EDITOR_ROLES.includes(role as any);
}

export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role as any);
}

export function canUseCanva(role: string): boolean {
  return CANVA_ROLES.includes(role as any);
}
