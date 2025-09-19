/**
 * User Profile Utilities for Volunteer Workflow
 *
 * Utility functions for working with UserProfile tags and volunteer workflow features.
 * Following the workflow implementation plan with namespaced tag support.
 */

import type { UserProfile } from '../services/firebase-firestore.service';

export const userUtils = {
  /**
   * Get tags by namespace from a user's profile.
   * @param user - The user profile to analyze
   * @param namespace - The namespace to filter by (e.g., 'skill', 'language')
   * @returns Array of tag values for the specified namespace
   */
  getTagsByNamespace: (user: UserProfile, namespace: string): string[] => {
    const prefix = `${namespace}:`;
    return user.tags
      .filter(tag => tag.startsWith(prefix))
      .map(tag => tag.substring(prefix.length));
  },

  /**
   * Check if a user has a specific tag.
   * Supports both full tag format ('skill:writing') and just the value ('writing')
   * @param user - The user profile to check
   * @param tag - The tag to look for
   * @returns True if the user has the tag
   */
  hasTag: (user: UserProfile, tag: string): boolean => {
    if (tag.includes(':')) {
      return user.tags.includes(tag);
    }
    return user.tags.some(t => t.endsWith(`:${tag}`));
  },

  /**
   * Add a tag to a user's profile (returns new array, doesn't mutate)
   * @param user - The user profile
   * @param tag - The tag to add
   * @returns New tags array with the tag added (if not already present)
   */
  addTag: (user: UserProfile, tag: string): string[] => {
    if (!user.tags.includes(tag)) {
      return [...user.tags, tag];
    }
    return user.tags;
  },

  /**
   * Remove a tag from a user's profile (returns new array, doesn't mutate)
   * @param user - The user profile
   * @param tag - The tag to remove
   * @returns New tags array with the tag removed
   */
  removeTag: (user: UserProfile, tag: string): string[] => {
    return user.tags.filter(t => t !== tag);
  },

  /**
   * Validate tag format (namespace:value)
   * @param tag - The tag to validate
   * @returns True if the tag format is valid
   */
  isValidTag: (tag: string): boolean => {
    const tagPattern = /^[a-z]+:[a-z0-9_-]+$/;
    return tagPattern.test(tag);
  },

  /**
   * Get all unique namespaces from a user's tags
   * @param user - The user profile
   * @returns Array of unique namespaces
   */
  getNamespaces: (user: UserProfile): string[] => {
    const namespaces = user.tags
      .filter(tag => tag.includes(':'))
      .map(tag => tag.split(':')[0] as string);
    return [...new Set(namespaces)];
  },

  /**
   * Filter users by availability
   * @param users - Array of user profiles
   * @param availability - Availability to filter by
   * @returns Filtered array of users
   */
  filterByAvailability: (users: UserProfile[], availability: UserProfile['availability']): UserProfile[] => {
    return users.filter(user => user.availability === availability);
  },

  /**
   * Get users with specific tags (for task assignment)
   * @param users - Array of user profiles
   * @param requiredTags - Array of tags that must be present
   * @returns Filtered array of users who have all required tags
   */
  getUsersWithTags: (users: UserProfile[], requiredTags: string[]): UserProfile[] => {
    return users.filter(user =>
      requiredTags.every(tag => userUtils.hasTag(user, tag))
    );
  },

  /**
   * Get users available for task assignment
   * @param users - Array of user profiles
   * @param requiredTags - Tags required for the task
   * @param preferredAvailability - Preferred availability levels
   * @returns Sorted array of users (most available first)
   */
  getAvailableUsers: (
    users: UserProfile[],
    requiredTags: string[],
    preferredAvailability: UserProfile['availability'][] = ['regular', 'occasional']
  ): UserProfile[] => {
    const availableUsers = users.filter(user =>
      requiredTags.every(tag => userUtils.hasTag(user, tag)) &&
      preferredAvailability.includes(user.availability)
    );

    // Sort by availability preference: regular > occasional > on-call
    const availabilityOrder = { regular: 3, occasional: 2, 'on-call': 1 };
    return availableUsers.sort((a, b) =>
      availabilityOrder[b.availability] - availabilityOrder[a.availability]
    );
  }
};
