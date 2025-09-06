/**
 * Firebase Firestore Service
 * Manages newsletter metadata, user content, and approval workflows
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { logger } from '../utils/logger';

// Newsletter metadata interface (Firebase Storage with future flexibility)
export interface NewsletterMetadata {
  id: string;
  filename: string;
  title: string;
  description?: string;
  publicationDate: string;
  issueNumber?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  year: number;
  fileSize: number;
  pageCount?: number;

  // Current Firebase Storage implementation
  downloadUrl: string; // Firebase Storage download URL
  storageRef: string; // Firebase Storage path reference
  thumbnailUrl?: string; // Optional thumbnail URL

  // Future-ready storage configuration (optional)
  storage?: {
    primary: {
      // Current: Firebase Storage
      provider: 'firebase'; // Provider identifier
      downloadUrl: string; // CDN-delivered URL
      storageRef: string; // Storage path reference
      fileSize: number; // File size
    };
    thumbnail?: {
      // Optional thumbnail storage
      provider: 'firebase'; // Provider identifier
      downloadUrl: string; // Thumbnail URL
      storageRef: string; // Thumbnail path
    };
    // Reserved for future multi-tier implementation
    archive?: {
      provider: 'b2' | 'r2' | 'spaces' | 'wasabi';
      downloadUrl: string;
      storageRef: string;
      fileSize: number;
    };
  };

  tags: string[];
  featured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User UID
  updatedBy: string; // User UID
  searchableText?: string; // Extracted PDF text for search

  // Action availability (future-ready)
  actions: {
    canView: boolean; // PDF available for viewing
    canDownload: boolean; // PDF available for download
    canSearch: boolean; // Text extracted and searchable
    hasThumbnail: boolean; // Preview thumbnail available
  };
}

// User-generated content interface
export interface UserContent {
  id: string;
  type: 'article' | 'announcement' | 'event' | 'classified' | 'photo';
  title: string;
  content: string;
  authorId: string; // User UID
  authorName: string;
  authorEmail: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  reviewedBy?: string; // Editor UID
  reviewDate?: string;
  reviewNotes?: string;
  scheduledPublishDate?: string;
  tags: string[];
  attachments: Array<{
    filename: string;
    storageRef: string;
    downloadUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    submissionSource: 'web' | 'mobile' | 'api';
  };
}

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'reader' | 'contributor' | 'editor' | 'admin';
  permissions: string[];
  isApproved: boolean;
  approvedBy?: string;
  approvalDate?: string;
  createdAt: string;
  lastLoginAt: string;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    preferredCategories: string[];
  };
}

// Newsletter issue interface (aggregates multiple content pieces)
export interface NewsletterIssue {
  id: string;
  title: string;
  description: string;
  issueNumber: string;
  publicationDate: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  coverImageUrl?: string;
  sections: Array<{
    title: string;
    order: number;
    contentIds: string[]; // References to UserContent
  }>;
  contributors: string[]; // User UIDs
  editorNotes?: string;
  publishedBy?: string;
  publishedAt?: string;
  downloadUrl?: string;
  storageRef?: string;
}

class FirebaseFirestoreService {
  private readonly COLLECTIONS = {
    NEWSLETTERS: 'newsletters',
    USER_CONTENT: 'userContent',
    USER_PROFILES: 'userProfiles',
    NEWSLETTER_ISSUES: 'newsletterIssues',
    APPROVAL_QUEUE: 'approvalQueue',
  } as const;

  // Newsletter metadata operations
  async saveNewsletterMetadata(metadata: Omit<NewsletterMetadata, 'id'>): Promise<string> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to save newsletter metadata');
      }

      const docRef = await addDoc(collection(firestore, this.COLLECTIONS.NEWSLETTERS), {
        ...metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
        updatedBy: currentUser.uid,
      });

      logger.success('Newsletter metadata saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Error saving newsletter metadata:', error);
      throw error;
    }
  }

  async getNewsletterMetadata(id: string): Promise<NewsletterMetadata | null> {
    try {
      const docRef = doc(firestore, this.COLLECTIONS.NEWSLETTERS, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as NewsletterMetadata;
      }
      return null;
    } catch (error) {
      logger.error('Error getting newsletter metadata:', error);
      throw error;
    }
  }

  async updateNewsletterMetadata(id: string, updates: Partial<NewsletterMetadata>): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to update newsletter metadata');
      }

      const docRef = doc(firestore, this.COLLECTIONS.NEWSLETTERS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      });

      logger.success('Newsletter metadata updated:', id);
    } catch (error) {
      logger.error('Error updating newsletter metadata:', error);
      throw error;
    }
  }

  async getAllNewsletterMetadata(): Promise<NewsletterMetadata[]> {
    try {
      logger.info('Attempting to fetch newsletter metadata...');

      // Include isPublished filter in the query to match security rules
      const q = query(
        collection(firestore, this.COLLECTIONS.NEWSLETTERS),
        where('isPublished', '==', true), // This must match the security rule condition
        limit(100),
      );

      logger.info('Executing Firestore query with isPublished filter...');
      const querySnapshot = await getDocs(q);

      logger.info(`Retrieved ${querySnapshot.docs.length} published documents from Firestore`);

      const results = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          } as NewsletterMetadata;
        })
        // Sort by publication date (no need to filter isPublished since query already does it)
        .sort(
          (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime(),
        );

      logger.success(`Successfully processed ${results.length} published newsletters`);
      return results;
    } catch (error) {
      logger.error('Error getting all newsletter metadata:', error);

      // Check if this is a permission error and provide helpful context
      if (error instanceof Error && error.message.includes('permission')) {
        logger.error('Permission denied - this might indicate:');
        logger.error('1. Firestore rules are not allowing public read access');
        logger.error('2. The documents do not have isPublished=true');
        logger.error('3. Firebase configuration is incorrect');
      }

      throw error;
    }
  }

  // Admin method: Get all newsletters regardless of published status
  async getAllNewslettersForAdmin(): Promise<NewsletterMetadata[]> {
    try {
      logger.info('Admin: Fetching ALL newsletters (including unpublished)...');

      // Get ALL documents without filtering by isPublished
      const q = query(collection(firestore, this.COLLECTIONS.NEWSLETTERS), limit(100));

      const querySnapshot = await getDocs(q);
      logger.info(`Admin: Retrieved ${querySnapshot.docs.length} total documents from Firestore`);

      const results = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as NewsletterMetadata;
      });

      const published = results.filter((r) => r.isPublished === true);
      const unpublished = results.filter((r) => r.isPublished !== true);

      logger.info(
        `Admin: Loaded ${published.length} published, ${unpublished.length} unpublished newsletters`,
      );

      return results;
    } catch (error) {
      logger.error('Admin: Error getting all newsletters:', error);
      throw error;
    }
  }

  // User content operations
  async submitUserContent(
    content: Omit<UserContent, 'id' | 'submissionDate' | 'status'>,
  ): Promise<string> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to submit content');
      }

      const docRef = await addDoc(collection(firestore, this.COLLECTIONS.USER_CONTENT), {
        ...content,
        submissionDate: serverTimestamp(),
        status: 'pending',
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorEmail: currentUser.email || '',
      });

      logger.success('User content submitted:', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Error submitting user content:', error);
      throw error;
    }
  }

  async getUserContent(id: string): Promise<UserContent | null> {
    try {
      const docRef = doc(firestore, this.COLLECTIONS.USER_CONTENT, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserContent;
      }
      return null;
    } catch (error) {
      logger.error('Error getting user content:', error);
      throw error;
    }
  }

  async updateContentStatus(
    contentId: string,
    status: UserContent['status'],
    reviewNotes?: string,
  ): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to update content status');
      }

      const docRef = doc(firestore, this.COLLECTIONS.USER_CONTENT, contentId);
      const updates: Partial<UserContent> = {
        status,
        reviewedBy: currentUser.uid,
        reviewDate: new Date().toISOString(),
      };

      if (reviewNotes) {
        updates.reviewNotes = reviewNotes;
      }

      await updateDoc(docRef, updates);
      logger.success('Content status updated:', contentId, status);
    } catch (error) {
      logger.error('Error updating content status:', error);
      throw error;
    }
  }

  async getPendingContent(): Promise<UserContent[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTIONS.USER_CONTENT),
        where('status', '==', 'pending'),
        orderBy('submissionDate', 'asc'),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as UserContent,
      );
    } catch (error) {
      logger.error('Error getting pending content:', error);
      throw error;
    }
  }

  // User profile operations
  async createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTIONS.USER_PROFILES, profile.uid);
      await setDoc(docRef, {
        ...profile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      logger.success('User profile created:', profile.uid);
    } catch (error) {
      logger.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(firestore, this.COLLECTIONS.USER_PROFILES, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTIONS.USER_PROFILES, uid);
      await updateDoc(docRef, updates);
      logger.success('User profile updated:', uid);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  subscribeToNewsletters(callback: (newsletters: NewsletterMetadata[]) => void): Unsubscribe {
    try {
      logger.info('Setting up newsletter subscription...');

      // Include isPublished filter in the query to match security rules
      const q = query(
        collection(firestore, this.COLLECTIONS.NEWSLETTERS),
        where('isPublished', '==', true), // This must match the security rule condition
        limit(50),
      );

      return onSnapshot(
        q,
        (querySnapshot) => {
          logger.info(`Newsletter subscription received ${querySnapshot.docs.length} documents`);

          const newsletters = querySnapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
              } as NewsletterMetadata;
            })
            // Client-side filtering and sorting until indexes are created
            .filter((newsletter) => {
              const isPublished = newsletter.isPublished === true;
              if (!isPublished) {
                logger.debug(
                  `Subscription filtering out unpublished newsletter: ${newsletter.title || newsletter.id}`,
                );
              }
              return isPublished;
            })
            .sort(
              (a, b) =>
                new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime(),
            );

          logger.success(
            `Newsletter subscription processed ${newsletters.length} published newsletters`,
          );
          callback(newsletters);
        },
        (error) => {
          logger.error('Newsletter subscription error:', error);

          // Check if this is a permission error and provide helpful context
          if (error.message.includes('permission')) {
            logger.error('Subscription permission denied - this might indicate:');
            logger.error('1. Firestore rules are not allowing public read access');
            logger.error('2. The documents do not have isPublished=true');
            logger.error('3. Firebase configuration is incorrect');
          }

          // Call callback with empty array to prevent app crash
          callback([]);
        },
      );
    } catch (error) {
      logger.error('Error setting up newsletter subscription:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  subscribeToPendingContent(callback: (content: UserContent[]) => void): Unsubscribe {
    try {
      logger.info('Setting up pending content subscription...');

      // Simplified query - consider adding compound index for complex filtering
      const q = query(collection(firestore, this.COLLECTIONS.USER_CONTENT), limit(50));

      return onSnapshot(
        q,
        (querySnapshot) => {
          const content = querySnapshot.docs
            .map(
              (doc) =>
                ({
                  id: doc.id,
                  ...doc.data(),
                }) as UserContent,
            )
            // Client-side filtering and sorting until indexes are created
            .filter((item) => item.status === 'pending')
            .sort(
              (a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime(),
            );

          logger.success(`Pending content subscription processed ${content.length} items`);
          callback(content);
        },
        (error) => {
          logger.error('Pending content subscription error:', error);
          if (error.message.includes('permission')) {
            logger.debug('Permission denied for pending content - user may not be editor');
          }
          // Call callback with empty array to prevent app crash
          callback([]);
        },
      );
    } catch (error) {
      logger.error('Error setting up pending content subscription:', error);
      callback([]);
      return () => {};
    }
  }

  // Search operations
  async searchNewsletters(searchTerm: string): Promise<NewsletterMetadata[]> {
    try {
      // If no search term, return all published newsletters
      if (!searchTerm || searchTerm.trim().length === 0) {
        const q = query(
          collection(firestore, this.COLLECTIONS.NEWSLETTERS),
          where('isPublished', '==', true),
          orderBy('publicationDate', 'desc'),
          limit(100),
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as NewsletterMetadata,
        );
      }

      // Enhanced search with better indexing strategy
      const q = query(
        collection(firestore, this.COLLECTIONS.NEWSLETTERS),
        where('isPublished', '==', true),
        limit(200), // Increased limit for comprehensive client-side search
      );

      const querySnapshot = await getDocs(q);
      const newsletters = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as NewsletterMetadata,
      );

      // Improved client-side search with ranking
      const searchTermLower = searchTerm.toLowerCase().trim();
      const searchWords = searchTermLower.split(/\s+/).filter((word) => word.length > 0);

      return newsletters
        .map((newsletter) => {
          let score = 0;
          const titleLower = newsletter.title.toLowerCase();
          const descriptionLower = newsletter.description?.toLowerCase() || '';
          const searchableTextLower = newsletter.searchableText?.toLowerCase() || '';
          const tagsLower = newsletter.tags.map((tag) => tag.toLowerCase());

          // Scoring system for relevance
          searchWords.forEach((word) => {
            // Exact title match (highest score)
            if (titleLower.includes(word)) {
              score += titleLower === word ? 100 : 50;
            }

            // Description match
            if (descriptionLower.includes(word)) {
              score += 20;
            }

            // Tag exact match
            if (tagsLower.some((tag) => tag === word)) {
              score += 30;
            }

            // Tag partial match
            if (tagsLower.some((tag) => tag.includes(word))) {
              score += 15;
            }

            // Full text search (if available)
            if (searchableTextLower.includes(word)) {
              score += 10;
            }

            // Season match
            if (newsletter.season?.toLowerCase().includes(word)) {
              score += 25;
            }

            // Year match
            if (newsletter.year.toString().includes(word)) {
              score += 25;
            }

            // Issue number match
            if (newsletter.issueNumber?.toLowerCase().includes(word)) {
              score += 30;
            }
          });

          return { newsletter, score };
        })
        .filter((item) => item.score > 0) // Only return items with matches
        .sort((a, b) => b.score - a.score) // Sort by relevance score
        .map((item) => item.newsletter);
    } catch (error) {
      logger.error('Error searching newsletters:', error);
      throw error;
    }
  }

  // Analytics and reporting
  async getNewsletterStats(): Promise<{
    totalNewsletters: number;
    publishedThisYear: number;
    pendingContent: number;
    totalUsers: number;
  }> {
    try {
      const currentYear = new Date().getFullYear();

      const [allNewsletters, thisYearNewsletters, pendingContent, allUsers] = await Promise.all([
        getDocs(collection(firestore, this.COLLECTIONS.NEWSLETTERS)),
        getDocs(
          query(
            collection(firestore, this.COLLECTIONS.NEWSLETTERS),
            where('year', '==', currentYear),
            where('isPublished', '==', true),
          ),
        ),
        getDocs(
          query(
            collection(firestore, this.COLLECTIONS.USER_CONTENT),
            where('status', '==', 'pending'),
          ),
        ),
        getDocs(collection(firestore, this.COLLECTIONS.USER_PROFILES)),
      ]);

      return {
        totalNewsletters: allNewsletters.size,
        publishedThisYear: thisYearNewsletters.size,
        pendingContent: pendingContent.size,
        totalUsers: allUsers.size,
      };
    } catch (error) {
      logger.error('Error getting newsletter stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firestoreService = new FirebaseFirestoreService();
export default firestoreService;
