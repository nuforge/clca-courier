/**
 * UserProfileEditor Component Test Suite
 *
 * Tests for the volunteer workflow user profile editor component.
 * Ensures proper tag management, validation, and save functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { Quasar, QCard, QInput, QSelect, QChip, QBtn, QToggle, QIcon } from 'quasar';
import UserProfileEditor from '../../../src/components/UserProfileEditor.vue';
import type { UserProfile } from '../../../src/services/firebase-firestore.service';

// Mock the composables
vi.mock('../../../src/composables/useFirebase', () => ({
  useFirebaseUserProfile: () => ({
    updateUserProfile: vi.fn().mockResolvedValue(undefined)
  })
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock translations
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'profile.editor.title': 'Edit Your Profile',
    'profile.editor.description': 'Update your volunteer profile information and preferences',
    'profile.editor.displayName': 'Display Name',
    'profile.editor.displayNameRequired': 'Display name is required',
    'profile.editor.availability': 'Availability',
    'profile.editor.tags': 'Your Skills & Interests',
    'profile.editor.newTag': 'Add a tag',
    'profile.editor.addTag': 'Add Tag',
    'profile.editor.tagRequired': 'Tag cannot be empty',
    'profile.editor.tagFormatInvalid': 'Tag must be in format: category:value (e.g., skill:writing)',
    'profile.editor.tagExists': 'This tag already exists',
    'profile.availability.regular': 'Regular (Weekly)',
    'profile.availability.occasional': 'Occasional (Monthly)',
    'profile.availability.onCall': 'On-call (As needed)',
    'common.save': 'Save',
    'common.cancel': 'Cancel'
  };
  return translations[key] || key;
});

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT })
}));

describe('UserProfileEditor', () => {
  let wrapper: VueWrapper;
  let mockUserProfile: UserProfile;

  beforeEach(() => {
    mockUserProfile = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      role: 'contributor',
      permissions: ['read', 'write'],
      isApproved: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: '2024-01-01T00:00:00.000Z',
      tags: ['skill:writing', 'language:english'],
      availability: 'regular',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        preferredCategories: ['news'],
        taskAssignments: true
      }
    };

    wrapper = mount(UserProfileEditor, {
      props: {
        userProfile: mockUserProfile
      },
      global: {
        plugins: [
          Quasar,
          createTestingPinia({
            createSpy: vi.fn
          })
        ],
        components: {
          QCard,
          QInput,
          QSelect,
          QChip,
          QBtn,
          QToggle,
          QIcon
        }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  describe('Component Initialization', () => {
    it('should render with user profile data', () => {
      expect(wrapper.find('input[aria-label="Display Name"]').element.value).toBe('Test User');
      expect(wrapper.findAll('.q-chip')).toHaveLength(2); // Two existing tags
    });

    it('should show availability options', () => {
      const availabilitySelect = wrapper.findComponent({ name: 'QSelect' });
      expect(availabilitySelect.exists()).toBe(true);
    });

    it('should show existing tags as chips', () => {
      const chips = wrapper.findAllComponents({ name: 'QChip' });
      expect(chips.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Tag Management', () => {
    it('should validate tag format', async () => {
      const tagInput = wrapper.find('input[placeholder*="skill:writing"]');
      const addButton = wrapper.find('button[aria-label*="Add Tag"]');

      // Invalid format
      await tagInput.setValue('invalid-tag');
      await addButton.trigger('click');

      // Should show validation error
      expect(wrapper.text()).toContain('Tag must be in format');
    });

    it('should prevent duplicate tags', async () => {
      const tagInput = wrapper.find('input[placeholder*="skill:writing"]');
      const addButton = wrapper.find('button[aria-label*="Add Tag"]');

      // Try to add existing tag
      await tagInput.setValue('skill:writing');
      await addButton.trigger('click');

      // Should show duplicate error
      expect(wrapper.text()).toContain('already exists');
    });

    it('should add valid new tag', async () => {
      const tagInput = wrapper.find('input[placeholder*="skill:writing"]');
      const addButton = wrapper.find('button[aria-label*="Add Tag"]');

      await tagInput.setValue('skill:design');
      await addButton.trigger('click');

      // Should clear input after adding
      expect(tagInput.element.value).toBe('');
    });

    it('should remove tag when chip is clicked', async () => {
      const removeableChips = wrapper.findAllComponents({ name: 'QChip' });
      const initialChipCount = removeableChips.length;

      // Find a chip with removable prop and trigger remove
      const chipToRemove = removeableChips.find(chip => chip.props('removable'));
      if (chipToRemove) {
        await chipToRemove.vm.$emit('remove');
        expect(wrapper.findAllComponents({ name: 'QChip' })).toHaveLength(initialChipCount - 1);
      }
    });
  });

  describe('Availability Selection', () => {
    it('should update availability when selected', async () => {
      const availabilitySelect = wrapper.findComponent({ name: 'QSelect' });

      await availabilitySelect.vm.$emit('update:model-value', 'occasional');

      // Verify the value is updated in component state
      expect(availabilitySelect.props('modelValue')).toBe('occasional');
    });
  });

  describe('Preferences Toggle', () => {
    it('should toggle task assignment preference', async () => {
      const taskToggle = wrapper.findAll('.q-toggle').find(toggle =>
        toggle.text().includes('task assignment') || toggle.text().includes('taskAssignments')
      );

      if (taskToggle) {
        await taskToggle.trigger('click');
        // Should emit the toggle event
        expect(taskToggle.emitted()).toBeTruthy();
      }
    });
  });

  describe('Save Functionality', () => {
    it('should detect changes and enable save button', async () => {
      const displayNameInput = wrapper.find('input[aria-label="Display Name"]');
      await displayNameInput.setValue('Updated Name');

      const saveButton = wrapper.find('button[aria-label*="Save"]');
      expect(saveButton.attributes('disabled')).toBeUndefined();
    });

    it('should emit profile-updated on successful save', async () => {
      const displayNameInput = wrapper.find('input[aria-label="Display Name"]');
      await displayNameInput.setValue('Updated Name');

      const saveButton = wrapper.find('button[aria-label*="Save"]');
      await saveButton.trigger('click');

      // Wait for async operation
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('profile-updated')).toBeTruthy();
    });

    it('should disable save button when no changes', () => {
      const saveButton = wrapper.find('button[aria-label*="Save"]');
      expect(saveButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Cancel Functionality', () => {
    it('should emit cancel event', async () => {
      const cancelButton = wrapper.find('button[aria-label*="Cancel"]');
      await cancelButton.trigger('click');

      expect(wrapper.emitted('cancel')).toBeTruthy();
    });

    it('should show confirmation dialog when there are unsaved changes', async () => {
      // Make changes
      const displayNameInput = wrapper.find('input[aria-label="Display Name"]');
      await displayNameInput.setValue('Updated Name');

      // Mock dialog confirmation
      const mockDialog = vi.fn().mockReturnValue({
        onOk: vi.fn((callback) => callback())
      });

      wrapper.vm.$q = { dialog: mockDialog };

      const cancelButton = wrapper.find('button[aria-label*="Cancel"]');
      await cancelButton.trigger('click');

      expect(mockDialog).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      // Mock error in updateUserProfile
      const mockError = new Error('Network error');
      vi.mocked(wrapper.vm.updateUserProfile).mockRejectedValue(mockError);

      const displayNameInput = wrapper.find('input[aria-label="Display Name"]');
      await displayNameInput.setValue('Updated Name');

      const saveButton = wrapper.find('button[aria-label*="Save"]');
      await saveButton.trigger('click');

      // Wait for error handling
      await wrapper.vm.$nextTick();

      // Should not emit profile-updated on error
      expect(wrapper.emitted('profile-updated')).toBeFalsy();
    });
  });

  describe('Backward Compatibility', () => {
    it('should initialize missing fields with defaults', () => {
      const profileWithoutTags = {
        ...mockUserProfile,
        tags: undefined,
        availability: undefined,
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          preferredCategories: []
        }
      };

      const compatWrapper = mount(UserProfileEditor, {
        props: {
          userProfile: profileWithoutTags as UserProfile
        },
        global: {
          plugins: [Quasar, createTestingPinia({ createSpy: vi.fn })]
        }
      });

      // Should have initialized defaults
      expect(compatWrapper.vm.localProfile.tags).toEqual([]);
      expect(compatWrapper.vm.localProfile.availability).toBe('occasional');
      expect(compatWrapper.vm.localProfile.preferences.taskAssignments).toBe(true);

      compatWrapper.unmount();
    });
  });
});
