/**
 * Content Submission Service
 * Handles all user content submission logic with Firebase integration
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { logger } from '../utils/logger';
import type {
  BaseContentItem,
  ContentType,
  ReviewStatus,
  ContentAttachment,
  ReviewEntry,
  ArticleMetadata,
  EventMetadata,
  ProjectMetadata,
  ClassifiedMetadata,
  PhotoStoryMetadata,
  AnnouncementMetadata,
} from '../types/core/content.types';

/**
 * Submission form data interface
 */
export interface ContentSubmissionData {
  type: ContentType;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  targetIssue?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  attachments: ContentAttachment[];
}

/**
 * Content submission statistics
 */
export interface SubmissionStats {
  totalSubmissions: number;
  pendingReview: number;
  approved: number;
  published: number;
  byType: Record<ContentType, number>;
  byCategory: Record<string, number>;
}

class ContentSubmissionService {
  private readonly COLLECTION_NAME = 'userContent';
  private readonly CATEGORIES_COLLECTION = 'contentCategories';

  /**
   * Submit new content for review
   */
  async submitContent(submissionData: ContentSubmissionData): Promise<string> {
    try {
      const user = firebaseAuthService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to submit content');
      }

      const now = Date.now();
      const contentItem: Omit<BaseContentItem, 'id'> = {
        type: submissionData.type,
        title: submissionData.title,
        author: {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          ...(user.photoURL && { avatar: user.photoURL }),
        },
        content: submissionData.content,
        status: 'submitted',
        metadata: submissionData.metadata,
        attachments: submissionData.attachments,
        reviewHistory: [
          {
            id: `initial_${now}`,
            reviewerId: user.uid,
            reviewerName: user.displayName || 'Author',
            timestamp: now,
            status: 'submitted',
            feedback: 'Initial submission',
          },
        ],
        submittedAt: now,
        ...(submissionData.targetIssue && { targetIssue: submissionData.targetIssue }),
        priority: submissionData.priority,
        category: submissionData.category,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(firestore, this.COLLECTION_NAME), {
        ...contentItem,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add category to user-defined categories if it's new
      await this.addUserCategory(submissionData.category);

      logger.info('Content submitted successfully', {
        contentId: docRef.id,
        type: submissionData.type,
      });
      return docRef.id;
    } catch (error) {
      logger.error('Failed to submit content', error);
      throw new Error('Failed to submit content. Please try again.');
    }
  }

  /**
   * Update existing content (for revisions)
   */
  async updateContent(contentId: string, updates: Partial<ContentSubmissionData>): Promise<void> {
    try {
      const user = firebaseAuthService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const contentRef = doc(firestore, this.COLLECTION_NAME, contentId);
      const contentDoc = await getDoc(contentRef);

      if (!contentDoc.exists()) {
        throw new Error('Content not found');
      }

      const contentData = contentDoc.data() as BaseContentItem;

      // Verify user owns this content or has editor permissions
      if (contentData.author.uid !== user.uid && !(await this.isEditor(user.uid))) {
        throw new Error('Insufficient permissions to update this content');
      }

      const now = Date.now();
      const updateData: Partial<BaseContentItem> = {
        ...updates,
        updatedAt: now,
        status: 'submitted', // Reset to submitted when updated
      };

      // Add revision to review history
      if (updates.content || updates.title) {
        const revisionEntry: ReviewEntry = {
          id: `revision_${now}`,
          reviewerId: user.uid,
          reviewerName: user.displayName || 'Author',
          timestamp: now,
          status: 'submitted',
          feedback: 'Content revised by author',
        };

        updateData.reviewHistory = [...contentData.reviewHistory, revisionEntry];
      }

      await updateDoc(contentRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      logger.info('Content updated successfully', { contentId });
    } catch (error) {
      logger.error('Failed to update content', error);
      throw error;
    }
  }

  /**
   * Add review feedback to content
   */
  async addReview(
    contentId: string,
    status: ReviewStatus,
    feedback?: string,
    section?: string,
  ): Promise<void> {
    try {
      const user = firebaseAuthService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Check if user has editor permissions
      if (!(await this.isEditor(user.uid))) {
        throw new Error('Insufficient permissions to review content');
      }

      const contentRef = doc(firestore, this.COLLECTION_NAME, contentId);
      const contentDoc = await getDoc(contentRef);

      if (!contentDoc.exists()) {
        throw new Error('Content not found');
      }

      const contentData = contentDoc.data() as BaseContentItem;
      const now = Date.now();

      const reviewEntry: ReviewEntry = {
        id: `review_${now}`,
        reviewerId: user.uid,
        reviewerName: user.displayName || 'Editor',
        timestamp: now,
        status,
        ...(feedback && { feedback }),
        ...(section && { section }),
      };

      const updateData: Partial<BaseContentItem> = {
        status,
        lastReviewedAt: now,
        reviewHistory: [...contentData.reviewHistory, reviewEntry],
        updatedAt: now,
      };

      // Set published timestamp if approved
      if (status === 'published') {
        updateData.publishedAt = now;
      }

      await updateDoc(contentRef, {
        ...updateData,
        lastReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: status === 'published' ? serverTimestamp() : contentData.publishedAt,
      });

      logger.info('Review added successfully', { contentId, status });
    } catch (error) {
      logger.error('Failed to add review', error);
      throw error;
    }
  }

  /**
   * Get user's submitted content
   */
  async getUserContent(userId: string): Promise<BaseContentItem[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        where('author.uid', '==', userId),
        orderBy('createdAt', 'desc'),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BaseContentItem[];
    } catch (error) {
      logger.error('Failed to get user content', error);
      throw new Error('Failed to load your content');
    }
  }

  /**
   * Get content pending review (for editors)
   */
  async getPendingContent(): Promise<BaseContentItem[]> {
    try {
      const user = firebaseAuthService.getCurrentUser();
      if (!user || !(await this.isEditor(user.uid))) {
        throw new Error('Insufficient permissions');
      }

      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        where('status', 'in', ['submitted', 'under_review']),
        orderBy('submittedAt', 'asc'),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BaseContentItem[];
    } catch (error) {
      logger.error('Failed to get pending content', error);
      throw new Error('Failed to load pending content');
    }
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats(): Promise<SubmissionStats> {
    try {
      const q = query(collection(firestore, this.COLLECTION_NAME));
      const querySnapshot = await getDocs(q);

      const stats: SubmissionStats = {
        totalSubmissions: 0,
        pendingReview: 0,
        approved: 0,
        published: 0,
        byType: {} as Record<ContentType, number>,
        byCategory: {} as Record<string, number>,
      };

      querySnapshot.docs.forEach((doc) => {
        const content = doc.data() as BaseContentItem;
        stats.totalSubmissions++;

        // Count by status
        if (content.status === 'submitted' || content.status === 'under_review') {
          stats.pendingReview++;
        } else if (content.status === 'approved') {
          stats.approved++;
        } else if (content.status === 'published') {
          stats.published++;
        }

        // Count by type
        stats.byType[content.type] = (stats.byType[content.type] || 0) + 1;

        // Count by category
        stats.byCategory[content.category] = (stats.byCategory[content.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get submission stats', error);
      throw new Error('Failed to load statistics');
    }
  }

  /**
   * Subscribe to content updates
   */
  subscribeToContentUpdates(
    contentId: string,
    callback: (content: BaseContentItem | null) => void,
  ): Unsubscribe {
    const contentRef = doc(firestore, this.COLLECTION_NAME, contentId);

    return onSnapshot(
      contentRef,
      (doc) => {
        if (doc.exists()) {
          callback({
            id: doc.id,
            ...doc.data(),
          } as BaseContentItem);
        } else {
          callback(null);
        }
      },
      (error) => {
        logger.error('Content subscription error', error);
        callback(null);
      },
    );
  }

  /**
   * Subscribe to editorial queue
   */
  subscribeToEditorialQueue(callback: (content: BaseContentItem[]) => void): Unsubscribe {
    const q = query(
      collection(firestore, this.COLLECTION_NAME),
      where('status', 'in', ['submitted', 'under_review']),
      orderBy('submittedAt', 'asc'),
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const content = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BaseContentItem[];
        callback(content);
      },
      (error) => {
        logger.error('Editorial queue subscription error', error);
        callback([]);
      },
    );
  }

  /**
   * Get predefined categories
   */
  getPredefinedCategories(): string[] {
    return [
      'Community News',
      'Events & Activities',
      'Lake & Environment',
      'Resident Spotlights',
      'Projects & Improvements',
      'For Sale/Wanted',
      'Services',
      'Announcements',
    ];
  }

  /**
   * Get user-defined categories
   */
  async getUserDefinedCategories(): Promise<string[]> {
    try {
      const q = query(collection(firestore, this.CATEGORIES_COLLECTION));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data().name).filter(Boolean);
    } catch (error) {
      logger.error('Failed to get user-defined categories', error);
      return [];
    }
  }

  /**
   * Add a new user-defined category
   */
  private async addUserCategory(category: string): Promise<void> {
    try {
      const predefined = this.getPredefinedCategories();
      if (predefined.includes(category)) {
        return; // Already a predefined category
      }

      // Check if category already exists
      const existing = await this.getUserDefinedCategories();
      if (existing.includes(category)) {
        return; // Already exists
      }

      await addDoc(collection(firestore, this.CATEGORIES_COLLECTION), {
        name: category,
        createdAt: serverTimestamp(),
        createdBy: firebaseAuthService.getCurrentUser()?.uid,
      });
    } catch (error) {
      logger.error('Failed to add user category', error);
      // Don't throw - this is not critical for submission
    }
  }

  /**
   * Check if user has editor permissions
   */
  private async isEditor(userId: string): Promise<boolean> {
    try {
      // This would check the user's role in the userProfiles collection
      // For now, we'll implement a simple check
      const userRef = doc(firestore, 'userProfiles', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role === 'editor' || userData.role === 'admin';
      }

      return false;
    } catch (error) {
      logger.error('Failed to check editor permissions', error);
      return false;
    }
  }

  /**
   * Create metadata template for content type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMetadataTemplate(type: ContentType): Record<string, any> {
    switch (type) {
      case 'article':
        return {
          subtitle: '',
          readTime: 5,
          tags: [],
        } as ArticleMetadata;

      case 'event':
        return {
          startDate: Date.now(),
          location: '',
          registrationRequired: false,
          contactInfo: '',
        } as EventMetadata;

      case 'project':
        return {
          projectStatus: 'planning',
          involvedResidents: [],
          progressPercentage: 0,
        } as ProjectMetadata;

      case 'classified':
        return {
          category: 'for_sale',
          contactMethod: 'email',
        } as ClassifiedMetadata;

      case 'photo_story':
        return {
          photographerName: '',
          photographyDate: Date.now(),
          location: '',
        } as PhotoStoryMetadata;

      case 'announcement':
        return {
          urgency: 'medium',
          actionRequired: false,
        } as AnnouncementMetadata;

      default:
        return {};
    }
  }
}

export const contentSubmissionService = new ContentSubmissionService();
