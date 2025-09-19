/**
 * UserUtils Test Suite
 *
 * Tests for volunteer workflow user utility functions.
 * Ensures tag management and user filtering work correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { userUtils } from '../../../src/utils/userUtils';
import type { UserProfile } from '../../../src/services/firebase-firestore.service';

describe('userUtils', () => {
  let mockUser: UserProfile;

  beforeEach(() => {
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      role: 'contributor',
      permissions: ['read', 'write'],
      isApproved: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: '2024-01-01T00:00:00.000Z',
      tags: ['skill:writing', 'language:english', 'language:spanish', 'interest:community'],
      availability: 'regular',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        preferredCategories: ['news', 'events'],
        taskAssignments: true
      }
    };
  });

  describe('getTagsByNamespace', () => {
    it('should return tags for specified namespace', () => {
      const skills = userUtils.getTagsByNamespace(mockUser, 'skill');
      expect(skills).toEqual(['writing']);
    });

    it('should return multiple tags for namespace', () => {
      const languages = userUtils.getTagsByNamespace(mockUser, 'language');
      expect(languages).toEqual(['english', 'spanish']);
    });

    it('should return empty array for non-existent namespace', () => {
      const certifications = userUtils.getTagsByNamespace(mockUser, 'certification');
      expect(certifications).toEqual([]);
    });

    it('should handle user with no tags', () => {
      const userWithNoTags = { ...mockUser, tags: [] };
      const skills = userUtils.getTagsByNamespace(userWithNoTags, 'skill');
      expect(skills).toEqual([]);
    });
  });

  describe('hasTag', () => {
    it('should return true for exact tag match', () => {
      expect(userUtils.hasTag(mockUser, 'skill:writing')).toBe(true);
      expect(userUtils.hasTag(mockUser, 'language:english')).toBe(true);
    });

    it('should return true for tag value match', () => {
      expect(userUtils.hasTag(mockUser, 'writing')).toBe(true);
      expect(userUtils.hasTag(mockUser, 'english')).toBe(true);
    });

    it('should return false for non-existent tag', () => {
      expect(userUtils.hasTag(mockUser, 'skill:design')).toBe(false);
      expect(userUtils.hasTag(mockUser, 'photography')).toBe(false);
    });

    it('should handle user with no tags', () => {
      const userWithNoTags = { ...mockUser, tags: [] };
      expect(userUtils.hasTag(userWithNoTags, 'skill:writing')).toBe(false);
    });
  });

  describe('addTag', () => {
    it('should add new tag to user', () => {
      const newTags = userUtils.addTag(mockUser, 'skill:design');
      expect(newTags).toContain('skill:design');
      expect(newTags).toHaveLength(mockUser.tags.length + 1);
    });

    it('should not add duplicate tag', () => {
      const newTags = userUtils.addTag(mockUser, 'skill:writing');
      expect(newTags).toEqual(mockUser.tags);
    });

    it('should not mutate original user object', () => {
      const originalTags = [...mockUser.tags];
      userUtils.addTag(mockUser, 'skill:design');
      expect(mockUser.tags).toEqual(originalTags);
    });
  });

  describe('removeTag', () => {
    it('should remove existing tag from user', () => {
      const newTags = userUtils.removeTag(mockUser, 'skill:writing');
      expect(newTags).not.toContain('skill:writing');
      expect(newTags).toHaveLength(mockUser.tags.length - 1);
    });

    it('should handle removal of non-existent tag', () => {
      const newTags = userUtils.removeTag(mockUser, 'skill:design');
      expect(newTags).toEqual(mockUser.tags);
    });

    it('should not mutate original user object', () => {
      const originalTags = [...mockUser.tags];
      userUtils.removeTag(mockUser, 'skill:writing');
      expect(mockUser.tags).toEqual(originalTags);
    });
  });

  describe('isValidTag', () => {
    it('should return true for valid tag format', () => {
      expect(userUtils.isValidTag('skill:writing')).toBe(true);
      expect(userUtils.isValidTag('language:english')).toBe(true);
      expect(userUtils.isValidTag('interest:community-events')).toBe(true);
      expect(userUtils.isValidTag('certification:first_aid')).toBe(true);
    });

    it('should return false for invalid tag format', () => {
      expect(userUtils.isValidTag('writing')).toBe(false);
      expect(userUtils.isValidTag('skill:')).toBe(false);
      expect(userUtils.isValidTag(':writing')).toBe(false);
      expect(userUtils.isValidTag('skill writing')).toBe(false);
      expect(userUtils.isValidTag('SKILL:WRITING')).toBe(false);
    });
  });

  describe('getNamespaces', () => {
    it('should return unique namespaces from user tags', () => {
      const namespaces = userUtils.getNamespaces(mockUser);
      expect(namespaces).toEqual(['skill', 'language', 'interest']);
    });

    it('should handle user with no tags', () => {
      const userWithNoTags = { ...mockUser, tags: [] };
      const namespaces = userUtils.getNamespaces(userWithNoTags);
      expect(namespaces).toEqual([]);
    });

    it('should handle malformed tags', () => {
      const userWithMalformedTags = { ...mockUser, tags: ['skill:writing', 'badtag', 'language:english'] };
      const namespaces = userUtils.getNamespaces(userWithMalformedTags);
      expect(namespaces).toEqual(['skill', 'language']);
    });
  });

  describe('filterByAvailability', () => {
    let users: UserProfile[];

    beforeEach(() => {
      users = [
        { ...mockUser, uid: 'user1', availability: 'regular' },
        { ...mockUser, uid: 'user2', availability: 'occasional' },
        { ...mockUser, uid: 'user3', availability: 'on-call' },
        { ...mockUser, uid: 'user4', availability: 'regular' }
      ];
    });

    it('should filter users by availability', () => {
      const regularUsers = userUtils.filterByAvailability(users, 'regular');
      expect(regularUsers).toHaveLength(2);
      expect(regularUsers.every(user => user.availability === 'regular')).toBe(true);
    });

    it('should return empty array if no matches', () => {
      const users = [{ ...mockUser, availability: 'regular' }];
      const onCallUsers = userUtils.filterByAvailability(users, 'on-call');
      expect(onCallUsers).toEqual([]);
    });
  });

  describe('getUsersWithTags', () => {
    let users: UserProfile[];

    beforeEach(() => {
      users = [
        { ...mockUser, uid: 'user1', tags: ['skill:writing', 'language:english'] },
        { ...mockUser, uid: 'user2', tags: ['skill:design', 'language:spanish'] },
        { ...mockUser, uid: 'user3', tags: ['skill:writing', 'skill:design'] },
        { ...mockUser, uid: 'user4', tags: ['interest:community'] }
      ];
    });

    it('should return users with all required tags', () => {
      const writingUsers = userUtils.getUsersWithTags(users, ['skill:writing']);
      expect(writingUsers).toHaveLength(2);
      expect(writingUsers.every(user => user.tags.includes('skill:writing'))).toBe(true);
    });

    it('should return users with multiple required tags', () => {
      const multiSkillUsers = userUtils.getUsersWithTags(users, ['skill:writing', 'skill:design']);
      expect(multiSkillUsers).toHaveLength(1);
      expect(multiSkillUsers[0]?.uid).toBe('user3');
    });

    it('should return empty array if no users match', () => {
      const photoUsers = userUtils.getUsersWithTags(users, ['skill:photography']);
      expect(photoUsers).toEqual([]);
    });
  });

  describe('getAvailableUsers', () => {
    let users: UserProfile[];

    beforeEach(() => {
      users = [
        {
          ...mockUser,
          uid: 'user1',
          tags: ['skill:writing'],
          availability: 'regular'
        },
        {
          ...mockUser,
          uid: 'user2',
          tags: ['skill:writing'],
          availability: 'occasional'
        },
        {
          ...mockUser,
          uid: 'user3',
          tags: ['skill:writing'],
          availability: 'on-call'
        },
        {
          ...mockUser,
          uid: 'user4',
          tags: ['skill:design'],
          availability: 'regular'
        }
      ];
    });

    it('should return available users with required tags sorted by availability', () => {
      const availableUsers = userUtils.getAvailableUsers(users, ['skill:writing']);
      expect(availableUsers).toHaveLength(2); // regular and occasional, not on-call
      expect(availableUsers[0]?.availability).toBe('regular');
      expect(availableUsers[1]?.availability).toBe('occasional');
    });

    it('should respect custom availability preferences', () => {
      const availableUsers = userUtils.getAvailableUsers(users, ['skill:writing'], ['regular']);
      expect(availableUsers).toHaveLength(1);
      expect(availableUsers[0]?.availability).toBe('regular');
    });

    it('should return empty array if no matching users', () => {
      const availableUsers = userUtils.getAvailableUsers(users, ['skill:photography']);
      expect(availableUsers).toEqual([]);
    });

    it('should include on-call users when specified', () => {
      const availableUsers = userUtils.getAvailableUsers(users, ['skill:writing'], ['regular', 'occasional', 'on-call']);
      expect(availableUsers).toHaveLength(3);
    });
  });
});
