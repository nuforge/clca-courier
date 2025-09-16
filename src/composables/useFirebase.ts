/**
 * Firebase Composable
 * Vue 3 composable for Firebase services integration
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  firebaseAuthService,
  type AuthState,
  type SupportedProvider,
} from '../services/firebase-auth.service';
import {
  firestoreService,
  type NewsletterMetadata,
  type UserProfile,
} from '../services/firebase-firestore.service';
import type { ContentDoc } from '../types/core/content.types';
import { type UserRole } from '../composables/useRoleAuth';
import {
  firebaseStorageService,
  type FileUploadProgress,
} from '../services/firebase-storage.service';
import { contentSubmissionService } from '../services/content-submission.service';
import { logger } from '../utils/logger';

export function useFirebaseAuth() {
  const authState = ref<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  let unsubscribe: (() => void) | null = null;

  // Subscribe to auth state changes
  onMounted(() => {
    unsubscribe = firebaseAuthService.onAuthStateChange((state) => {
      authState.value = state;
    });
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  // Computed properties
  const isAuthenticated = computed(() => authState.value.isAuthenticated);
  const isLoading = computed(() => authState.value.isLoading);
  const currentUser = computed(() => authState.value.user);
  const error = computed(() => authState.value.error);

  // Auth methods
  const signIn = async (provider: SupportedProvider) => {
    try {
      await firebaseAuthService.signInWithPopup(provider);
      logger.success(`Signed in with ${provider}`);
    } catch (error) {
      logger.error('Sign in failed:', error);
      throw error;
    }
  };

  const signInWithRedirect = async (provider: SupportedProvider) => {
    try {
      await firebaseAuthService.signInWithRedirect(provider);
      logger.info(`Redirecting for ${provider} sign in...`);
    } catch (error) {
      logger.error('Redirect sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseAuthService.signOut();
      logger.success('Signed out successfully');
    } catch (error) {
      logger.error('Sign out failed:', error);
      throw error;
    }
  };

  const hasPermission = async () => {
    return firebaseAuthService.hasPermission();
  };

  const isEditor = async () => {
    return firebaseAuthService.isEditor();
  };

  const clearAvatarCache = () => {
    firebaseAuthService.clearAvatarCache();
  };

  return {
    // State
    authState: authState.value,
    isAuthenticated,
    isLoading,
    currentUser,
    error,

    // Methods
    signIn,
    signInWithRedirect,
    signOut,
    hasPermission,
    isEditor,
    clearAvatarCache,
  };
}

export function useFirebaseNewsletters() {
  const newsletters = ref<NewsletterMetadata[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  let unsubscribe: (() => void) | null = null;

  // Subscribe to newsletter updates
  onMounted(() => {
    unsubscribe = firestoreService.subscribeToNewsletters((data) => {
      newsletters.value = data;
    });
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  // Load all newsletters
  const loadNewsletters = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      newsletters.value = await firestoreService.getAllNewsletterMetadata();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load newsletters';
      logger.error('Failed to load newsletters:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Search newsletters
  const searchNewsletters = async (searchTerm: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      return await firestoreService.searchNewsletters(searchTerm);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Search failed';
      logger.error('Newsletter search failed:', err);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // Save newsletter metadata
  const saveNewsletter = async (metadata: Omit<NewsletterMetadata, 'id'>) => {
    try {
      const id = await firestoreService.saveNewsletterMetadata(metadata);
      logger.success('Newsletter saved:', id);
      return id;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save newsletter';
      logger.error('Failed to save newsletter:', err);
      throw err;
    }
  };

  // Update newsletter metadata
  const updateNewsletter = async (id: string, updates: Partial<NewsletterMetadata>) => {
    try {
      await firestoreService.updateNewsletterMetadata(id, updates);
      logger.success('Newsletter updated:', id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update newsletter';
      logger.error('Failed to update newsletter:', err);
      throw err;
    }
  };

  return {
    // State
    newsletters,
    isLoading,
    error,

    // Methods
    loadNewsletters,
    searchNewsletters,
    saveNewsletter,
    updateNewsletter,
  };
}

export function useFirebaseStorage() {
  const uploadProgress = ref<FileUploadProgress | null>(null);
  const isUploading = ref(false);
  const error = ref<string | null>(null);

  // Upload PDF with progress tracking
  const uploadPdf = async (
    file: File,
    metadata?: {
      title: string;
      issueNumber?: string;
      publicationDate: string;
      year: number;
      season?: string;
      tags?: string[];
    },
  ) => {
    try {
      isUploading.value = true;
      error.value = null;
      uploadProgress.value = null;

      const result = metadata
        ? await firebaseStorageService.uploadNewsletterPdf(file, metadata, (progress) => {
            uploadProgress.value = progress;
          })
        : await firebaseStorageService.uploadPdf(file, {
            onProgress: (progress) => {
              uploadProgress.value = progress;
            },
          });

      logger.success('PDF uploaded successfully:', result.storagePath);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed';
      logger.error('PDF upload failed:', err);
      throw err;
    } finally {
      isUploading.value = false;
      uploadProgress.value = null;
    }
  };

  // Upload general file
  const uploadFile = async (file: File, folder?: string) => {
    try {
      isUploading.value = true;
      error.value = null;
      uploadProgress.value = null;

      const uploadConfig: { [key: string]: unknown } = {
        onProgress: (progress: FileUploadProgress) => {
          uploadProgress.value = progress;
        },
      };

      if (folder) {
        uploadConfig.folder = folder;
      }

      const result = await firebaseStorageService.uploadFile(file, uploadConfig);

      logger.success('File uploaded successfully:', result.storagePath);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed';
      logger.error('File upload failed:', err);
      throw err;
    } finally {
      isUploading.value = false;
      uploadProgress.value = null;
    }
  };

  // Get storage files
  const getStorageFiles = async (folder: string) => {
    try {
      return await firebaseStorageService.listFiles(folder);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load files';
      logger.error('Failed to load storage files:', err);
      return [];
    }
  };

  // Delete file
  const deleteFile = async (storagePath: string) => {
    try {
      await firebaseStorageService.deleteFile(storagePath);
      logger.success('File deleted:', storagePath);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete file';
      logger.error('Failed to delete file:', err);
      throw err;
    }
  };

  return {
    // State
    uploadProgress,
    isUploading,
    error,

    // Methods
    uploadPdf,
    uploadFile,
    getStorageFiles,
    deleteFile,
  };
}

export function useFirebaseUserContent() {
  const pendingContent = ref<ContentDoc[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const { isAuthenticated } = useFirebaseAuth();

  let unsubscribe: (() => void) | null = null;

  // Subscribe to pending content updates only when authenticated
  watch(
    isAuthenticated,
    (authenticated: boolean) => {
      if (authenticated) {
        // Set up subscription when user logs in
        logger.info('User authenticated - setting up content subscription');
        // TODO: Implement ContentDoc-based subscription
        // unsubscribe = firebaseContentService.subscribeToAllContent((data) => {
        //   pendingContent.value = data.filter(item => item.status === 'draft');
        // });
        logger.info('Content subscription temporarily disabled during migration');
        pendingContent.value = [];
      } else {
        // Clean up subscription when user logs out
        logger.info('User not authenticated - cleaning up content subscription');
        unsubscribe?.();
        unsubscribe = null;
        pendingContent.value = []; // Clear content when not authenticated
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    unsubscribe?.();
  });

  // Submit user content
  const submitContent = async (
    title: string,
    description: string,
    contentType: string,
    features: Record<string, unknown> = {},
    additionalTags: string[] = []
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Use the new ContentDoc architecture
      const id = await contentSubmissionService.createContent(
        title,
        description,
        contentType,
        features,
        additionalTags
      );
      logger.success('Content submitted:', id);
      return id;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit content';
      logger.error('Failed to submit content:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Update content status (for editors)
  const updateContentStatus = async (
    contentId: string,
    status: ContentDoc['status'],
    reviewNotes?: string,
  ) => {
    try {
      // TODO: Implement using ContentDoc status update
      // await firebaseContentService.updateContentStatus(contentId, status, reviewNotes);
      logger.info('Content status update temporarily disabled during migration');
      logger.success('Content status update requested:', contentId, status);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update status';
      logger.error('Failed to update content status:', err);
      throw err;
    }
  };

  // Load pending content
  const loadPendingContent = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      // TODO: Implement using ContentDoc with status filter
      // pendingContent.value = await firebaseContentService.getAllContent()
      //   .then(content => content.filter(item => item.status === 'draft'));
      logger.info('Pending content loading temporarily disabled during migration');
      pendingContent.value = [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load pending content';
      logger.error('Failed to load pending content:', err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // State
    pendingContent,
    isLoading,
    error,

    // Methods
    submitContent,
    updateContentStatus,
    loadPendingContent,
  };
}

export function useFirebaseUserProfile() {
  const userProfile = ref<UserProfile | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Load user profile
  const loadUserProfile = async (uid: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      userProfile.value = await firestoreService.getUserProfile(uid);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load profile';
      logger.error('Failed to load user profile:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Create user profile
  const createUserProfile = async (profile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'>) => {
    try {
      // SECURITY: Force role to 'reader' for new users - admin roles must be set server-side
      const secureProfile = {
        ...profile,
        role: 'reader' as UserRole, // Always default to reader
        permissions: ['read'], // Basic permissions only
        isApproved: false, // Require approval
      };

      await firestoreService.createUserProfile(secureProfile);
      userProfile.value = {
        ...secureProfile,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      logger.success('User profile created with reader role:', profile.uid);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create profile';
      logger.error('Failed to create user profile:', err);
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
    try {
      await firestoreService.updateUserProfile(uid, updates);
      if (userProfile.value) {
        userProfile.value = { ...userProfile.value, ...updates };
      }
      logger.success('User profile updated:', uid);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update profile';
      logger.error('Failed to update user profile:', err);
      throw err;
    }
  };

  return {
    // State
    userProfile,
    isLoading,
    error,

    // Methods
    loadUserProfile,
    createUserProfile,
    updateUserProfile,
  };
}

// Combined Firebase composable
export function useFirebase() {
  const auth = useFirebaseAuth();
  const newsletters = useFirebaseNewsletters();
  const storage = useFirebaseStorage();
  const userContent = useFirebaseUserContent();
  const userProfile = useFirebaseUserProfile();

  return {
    auth,
    newsletters,
    storage,
    userContent,
    userProfile,
  };
}
