/**
 * Firebase Firestore Service
 * Manages newsletter metadata, user content, and approval workflows
 */

import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type FieldValue,
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { newsletterVersioningService } from './newsletter-versioning.service';
import { logger } from '../utils/logger';
import { safeSetDoc, safeAddDoc } from '../utils/safe-firebase';
import { sortByDateDesc, sortByDateAsc } from '../utils/date-formatter';
import type { NewsletterDocument } from '../types/core/newsletter.types';
import type { CanvaDesign } from '../services/canva/types';
import type { UnifiedNewsletter } from '../types/core/newsletter.types';

// Use the canonical UnifiedNewsletter interface
export type NewsletterMetadata = UnifiedNewsletter;

// Legacy UserContent interface removed - replaced with ContentDoc architecture
// All content operations now use ContentDoc from src/types/core/content.types.ts

// User profile interface - Updated for enhanced role system
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  // Enhanced role system - backward compatible with legacy roles
  role: 'member' | 'contributor' | 'canva_contributor' | 'editor' | 'moderator' | 'administrator' |
        'reader' | 'admin'; // Legacy roles for backward compatibility
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

// NewsletterIssue interface is now defined in newsletter-generation.service.ts
// This eliminates duplication and ensures consistency

class FirebaseFirestoreService {
  private readonly COLLECTIONS = {
    NEWSLETTERS: 'newsletters',
    USER_PROFILES: 'userProfiles',
    NEWSLETTER_ISSUES: 'newsletterIssues',
    // Legacy collections USER_CONTENT and APPROVAL_QUEUE removed
    // All content operations now use 'content' collection via ContentDoc system
  } as const;

  // Newsletter metadata operations
  async saveNewsletterMetadata(metadata: Omit<NewsletterMetadata, 'id'>): Promise<string> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to save newsletter metadata');
      }

      const docRef = await safeAddDoc(collection(firestore, this.COLLECTIONS.NEWSLETTERS), {
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

      // Use safeSetDoc with merge to create document if it doesn't exist, or update if it does
      await safeSetDoc(
        docRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        },
        { merge: true },
      );

      logger.success('Newsletter metadata updated/created:', id);
    } catch (error) {
      logger.error('Error updating newsletter metadata:', error);
      throw error;
    }
  }

  async deleteNewsletterMetadata(id: string): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to delete newsletter metadata');
      }

      const docRef = doc(firestore, this.COLLECTIONS.NEWSLETTERS, id);
      await deleteDoc(docRef);

      logger.success('Newsletter metadata deleted:', id);
    } catch (error) {
      logger.error('Error deleting newsletter metadata:', error);
      throw error;
    }
  }

  // UPSERT: Update existing newsletter by filename or create new one
  async upsertNewsletterMetadata(metadata: Omit<NewsletterMetadata, 'id'>): Promise<string> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to save newsletter metadata');
      }

      // First, try to find existing newsletter by filename
      const q = query(
        collection(firestore, this.COLLECTIONS.NEWSLETTERS),
        where('filename', '==', metadata.filename),
        limit(1),
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Newsletter exists - UPDATE IT
        const existingDoc = querySnapshot.docs[0];
        if (existingDoc) {
          const existingId = existingDoc.id;

          logger.info(
            `Found existing newsletter with filename ${metadata.filename}, updating document ${existingId}`,
          );

          await this.updateNewsletterMetadata(existingId, metadata);
          return existingId;
        }
      }

      // Newsletter doesn't exist - CREATE NEW ONE
      logger.info(
        `No existing newsletter found with filename ${metadata.filename}, creating new document`,
      );

      const docRef = await addDoc(collection(firestore, this.COLLECTIONS.NEWSLETTERS), {
        ...metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
        updatedBy: currentUser.uid,
      });

      logger.success('New newsletter metadata created:', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Error upserting newsletter metadata:', error);
      throw error;
    }
  }

  /**
   * Find Firebase document ID by filename
   * Used to get the actual Firebase document ID when we only have the filename
   */
  async findNewsletterIdByFilename(filename: string): Promise<string | null> {
    try {
      const q = query(
        collection(firestore, this.COLLECTIONS.NEWSLETTERS),
        where('filename', '==', filename),
        limit(1),
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        if (doc) {
          return doc.id;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error finding newsletter ID by filename ${filename}:`, error);
      return null;
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
        .sort((a, b) => sortByDateDesc(a.publicationDate, b.publicationDate));

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
      logger.info('Admin: Firebase project:', firestore.app.options.projectId);
      logger.info('Admin: Database:', this.COLLECTIONS.NEWSLETTERS);

      // Get ALL documents without filtering by isPublished
      const q = query(collection(firestore, this.COLLECTIONS.NEWSLETTERS), limit(100));

      const querySnapshot = await getDocs(q);
      logger.info(`Admin: Retrieved ${querySnapshot.docs.length} total documents from Firestore`);

      // Debug: Log document IDs and some metadata
      if (querySnapshot.docs.length > 0) {
        logger.info(
          'Admin: Sample document IDs:',
          querySnapshot.docs.slice(0, 3).map((doc) => ({
            id: doc.id,
            filename: doc.data().filename,
            createdAt: doc.data().createdAt,
          })),
        );
      }

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
  // Legacy submitUserContent method removed - use ContentDoc architecture instead
  // All content creation should now use firebaseContentService.createContent

  // Legacy getUserContent method removed
  // Use firebaseContentService.getContentById() instead

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

  async updateContentFeaturedStatus(contentId: string, featured: boolean): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to update featured status');
      }

      const docRef = doc(firestore, this.COLLECTIONS.USER_CONTENT, contentId);
      await updateDoc(docRef, { featured });

      logger.success('Content featured status updated:', contentId, featured);
    } catch (error) {
      logger.error('Error updating content featured status:', error);
      throw error;
    }
  }

  // Legacy updateUserContent method removed
  // Use firebaseContentService.updateContent() instead

  // Legacy getPendingContent method removed
  // Use firebaseContentService.getAllContent() with status filter instead

  // Legacy getPublishedContent method removed
  // Use firebaseContentService.getPublishedContent() instead

  // Legacy getApprovedContent method removed
  // Use firebaseContentService.getPublishedContent() instead

  // ========================================
  // LEGACY CONVERSION METHODS - COMMENTED OUT FOR MIGRATION
  // These will be replaced with ContentDoc queries
  // ========================================

  /*
  // Convert UserContent to NewsItem for display
  convertUserContentToNewsItem(userContent: UserContent): NewsItem {
    // Map content type to category
    const categoryMap: Record<string, 'news' | 'announcement' | 'event'> = {
      article: 'news',
      announcement: 'announcement',
      event: 'event',
      classified: 'announcement', // Map classified to announcement
      photo: 'announcement', // Map photo to announcement
    };

    // Convert Firestore Timestamp to ISO string for NewsItem
    const dateString = normalizeDate(userContent.submissionDate)?.toISOString() || new Date().toISOString();

    return {
      id: userContent.id,
      title: userContent.title,
      summary:
        userContent.content.substring(0, 200) + (userContent.content.length > 200 ? '...' : ''),
      content: userContent.content,
      author: userContent.authorName,
      date: dateString,
      category: categoryMap[userContent.type] || 'news',
      featured: userContent.featured ?? false, // Use featured property if set, default to false
    };
  }

  // Convert UserContent to ClassifiedAd for display
  convertUserContentToClassifiedAd(userContent: UserContent): ClassifiedAd {
    // Map classified content type to specific classified categories
    const classifiedCategoryMap: Record<string, 'for-sale' | 'services' | 'wanted' | 'free'> = {
      'for-sale': 'for-sale',
      'services': 'services',
      'wanted': 'wanted',
      'free': 'free'
    };

    // Extract price from content if mentioned (simple regex match)
    const priceMatch = userContent.content.match(/\$\d+(?:\.\d{2})?/);

    // Convert Firestore Timestamp to ISO string for ClassifiedAd
    const dateString = normalizeDate(userContent.submissionDate)?.toISOString() || new Date().toISOString();

    const contact: { name: string; email?: string; phone?: string } = {
      name: userContent.authorName,
      email: userContent.authorEmail
    };

    const result: ClassifiedAd = {
      id: userContent.id,
      title: userContent.title,
      description: userContent.content,
      category: classifiedCategoryMap[userContent.type] || 'for-sale', // Default to for-sale
      contact: contact,
      datePosted: dateString,
      featured: userContent.featured ?? false
    };

    // Only add price if it was found
    if (priceMatch) {
      result.price = priceMatch[0];
    }

    return result;
  }

  // Convert UserContent to Event for display
  convertUserContentToEvent(userContent: UserContent): Event {
    // Extract time from content (simple regex match for common time formats)
    const timeMatch = userContent.content.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)|\d{1,2}:\d{2})\b/);
    const time = timeMatch?.[1] ?? 'TBD';

    // Extract location from content (look for common location indicators)
    const locationMatch = userContent.content.match(/(?:at|location:|venue:)\s*([^\n.]+)/i);
    const location = locationMatch?.[1]?.trim();

    // Convert Firestore Timestamp to ISO string for Event
    const dateString = normalizeDate(userContent.submissionDate)?.toISOString() || new Date().toISOString();

    const result: Event = {
      id: userContent.id,
      title: userContent.title,
      description: userContent.content,
      date: dateString,
      time: time,
      organizer: userContent.authorName
    };

    // Only add location if it exists
    if (location) {
      result.location = location;
    }

    return result;
  }

  // Legacy getPublishedContentAsNewsItems method removed
  // ContentDoc system doesn't need conversion - use firebaseContentService.getPublishedContent() directly

  // Legacy getApprovedContentAsNewsItems method removed
  // ContentDoc system doesn't need conversion - use firebaseContentService.getPublishedContent() directly

  // Legacy subscribeToPublishedContent method removed
  // Use firebaseContentService subscription methods with ContentDoc instead

  // Legacy subscribeToApprovedContent method removed
  // Use firebaseContentService subscription methods with ContentDoc instead

  // ========================================
  // END LEGACY METHODS
  // ========================================

  // User profile operations
  async createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTIONS.USER_PROFILES, profile.uid);
      await safeSetDoc(docRef, {
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
            .sort((a, b) => sortByDateDesc(a.publicationDate, b.publicationDate));

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

  // Admin version: Subscribe to ALL newsletters (including unpublished) with real-time updates
  subscribeToNewslettersForAdmin(
    callback: (newsletters: NewsletterMetadata[]) => void,
  ): () => void {
    try {
      logger.info('Setting up ADMIN newsletter subscription (including unpublished)...');

      // Query ALL newsletters without publication status filter
      const q = query(
        collection(firestore, this.COLLECTIONS.NEWSLETTERS),
        orderBy('createdAt', 'desc'),
        limit(100),
      );

      return onSnapshot(
        q,
        (querySnapshot) => {
          logger.info(
            `Admin newsletter subscription received ${querySnapshot.docs.length} documents`,
          );

          const newsletters = querySnapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
              } as NewsletterMetadata;
            })
            // NO client-side filtering for admin - show ALL newsletters
            .sort((a, b) => sortByDateDesc(a.publicationDate, b.publicationDate));

          logger.success(
            `Admin newsletter subscription processed ${newsletters.length} newsletters (including unpublished)`,
          );
          callback(newsletters);
        },
        (error) => {
          logger.error('Admin newsletter subscription error:', error);
          if (error.message.includes('permission')) {
            logger.debug('Permission denied for admin newsletter subscription');
          }
          // Call callback with empty array to prevent app crash
          callback([]);
        },
      );
    } catch (error) {
      logger.error('Error setting up admin newsletter subscription:', error);
      callback([]);
      return () => {};
    }
  }

  // Legacy subscribeToPendingContent method removed
  // Use firebaseContentService subscription methods with ContentDoc instead

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

  // Versioning operations
  /**
   * Update newsletter with versioning support
   * Creates a new version entry and updates the main document
   */
  async updateNewsletterWithVersioning(
    id: string,
    updates: Partial<NewsletterMetadata>,
    comment: string = '',
    userId?: string,
  ): Promise<void> {
    try {
      const currentUser = userId ? { uid: userId } : firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to update newsletter with versioning');
      }

      // Convert NewsletterMetadata to NewsletterDocument for versioning
      const versioningUpdates: Record<string, unknown> = {
        ...updates,
        // Map NewsletterMetadata to NewsletterDocument if needed
        actions: (updates.actions as { canView: boolean; canDownload: boolean; canSearch: boolean; hasThumbnail: boolean; }) || {
          canView: true,
          canDownload: true,
          canSearch: !!updates.searchableText,
          hasThumbnail: !!updates.thumbnailUrl,
        },
      };

      await newsletterVersioningService.updateNewsletterWithVersioning(id, versioningUpdates, {
        comment,
        userId: currentUser.uid,
        branch: 'main',
      });

      logger.success('Newsletter updated with versioning:', id);
    } catch (error) {
      logger.error('Error updating newsletter with versioning:', error);
      throw error;
    }
  }

  /**
   * Get newsletter version history
   * Returns all versions of a newsletter
   */
  async getNewsletterHistory(id: string, limit: number = 50) {
    try {
      return await newsletterVersioningService.getNewsletterHistory(id, limit);
    } catch (error) {
      logger.error('Error getting newsletter history:', error);
      throw error;
    }
  }

  /**
   * Restore newsletter to specific version
   * Reverts newsletter to a previous version
   */
  async restoreNewsletterVersion(
    id: string,
    version: number,
    comment: string = '',
    userId?: string,
  ): Promise<NewsletterDocument> {
    try {
      const currentUser = userId ? { uid: userId } : firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to restore newsletter version');
      }

      const restored = await newsletterVersioningService.restoreNewsletterVersion(
        id,
        version,
        currentUser.uid,
        comment || `Restored to version ${version}`,
      );

      logger.success('Newsletter restored to version:', id, version);
      return restored;
    } catch (error) {
      logger.error('Error restoring newsletter version:', error);
      throw error;
    }
  }

  /**
   * Get newsletter version count
   * Returns the number of versions for a newsletter
   */
  async getNewsletterVersionCount(id: string): Promise<number> {
    try {
      return await newsletterVersioningService.getNewsletterVersionCount(id);
    } catch (error) {
      logger.error('Error getting newsletter version count:', error);
      return 0;
    }
  }

  /**
   * Check if newsletter has versioning enabled
   * Returns true if the newsletter has version history
   */
  async hasNewsletterVersioning(id: string): Promise<boolean> {
    try {
      return await newsletterVersioningService.hasVersioning(id);
    } catch (error) {
      logger.error('Error checking newsletter versioning status:', error);
      return false;
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

  /**
   * Get a document by its path
   * @param documentPath - The path to the document (e.g., 'app/config')
   * @returns The document data or null if not found
   */
  async getDocument(documentPath: string): Promise<Record<string, unknown> | null> {
    try {
      const docRef = doc(firestore, documentPath);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as Record<string, unknown>;
      } else {
        logger.debug(`Document not found: ${documentPath}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error getting document ${documentPath}:`, error);
      throw error;
    }
  }

  // ===========================
  // Print Job Management Methods
  // ===========================

  // Legacy getPrintReadyContent method removed
  // Print functionality will be reimplemented using ContentDoc with print-related tags/features

  // Legacy getClaimedPrintJobs method removed
  // Print functionality will be reimplemented using ContentDoc with print-related tags/features

  // Legacy claimPrintJob method removed
  // Print functionality will be reimplemented using ContentDoc with print-related tags/features

  // Legacy completePrintJob method removed
  // Print functionality will be reimplemented using ContentDoc with print-related tags/features

  // Legacy setPrintJobReady method removed
  // Print functionality will be reimplemented using ContentDoc with print-related tags/features
}

// Export Firebase utilities
export { deleteField, type FieldValue };

// Export singleton instance
export const firestoreService = new FirebaseFirestoreService();
export default firestoreService;
