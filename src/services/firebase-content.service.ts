/**
 * Firebase Content Service - ContentDoc Collection Management
 *
 * This service provides Firebase operations for the new unified ContentDoc collection.
 * Replaces legacy content services with unified tag-based architecture.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type QuerySnapshot,
  type DocumentData,
  // type DocumentSnapshot,
  type Unsubscribe,
  type Timestamp
} from 'firebase/firestore';

import { firestore as db } from '../config/firebase.config';
import { logger } from '../utils/logger';
import type { ContentDoc } from '../types/core/content.types';

export class FirebaseContentService {
  private readonly collectionName = 'content';

  /**
   * Create new content in the ContentDoc collection
   */
  async createContent(contentData: Omit<ContentDoc, 'id'>): Promise<string> {
    try {
      logger.debug('Creating content in Firebase ContentDoc collection', {
        title: contentData.title.substring(0, 50),
        authorId: contentData.authorId,
        status: contentData.status,
        tagsCount: contentData.tags.length,
        featuresCount: Object.keys(contentData.features).length
      });

      const contentCollection = collection(db, this.collectionName);
      const docRef = await addDoc(contentCollection, {
        ...contentData,
        timestamps: {
          ...contentData.timestamps,
          created: serverTimestamp(),
          updated: serverTimestamp()
        }
      });

      logger.info('Content created successfully', {
        contentId: docRef.id,
        title: contentData.title.substring(0, 50),
        status: contentData.status
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to create content', {
        title: contentData.title.substring(0, 50),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get all published content (public access)
   */
  async getPublishedContent(): Promise<ContentDoc[]> {
    try {
      logger.debug('Fetching published content from ContentDoc collection');

      const contentCollection = collection(db, this.collectionName);
      const publishedQuery = query(
        contentCollection,
        where('status', '==', 'published'),
        orderBy('timestamps.created', 'desc')
      );

      const querySnapshot = await getDocs(publishedQuery);
      const content = this.convertSnapshotToContentDocs(querySnapshot);

      logger.info('Published content fetched successfully', {
        count: content.length
      });

      return content;
    } catch (error) {
      logger.error('Failed to fetch published content', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get content by author ID
   */
  async getContentByAuthor(authorId: string): Promise<ContentDoc[]> {
    try {
      logger.debug('Fetching content by author', { authorId });

      const contentCollection = collection(db, this.collectionName);
      const authorQuery = query(
        contentCollection,
        where('authorId', '==', authorId),
        orderBy('timestamps.created', 'desc')
      );

      const querySnapshot = await getDocs(authorQuery);
      const content = this.convertSnapshotToContentDocs(querySnapshot);

      logger.info('Author content fetched successfully', {
        authorId,
        count: content.length
      });

      return content;
    } catch (error) {
      logger.error('Failed to fetch content by author', {
        authorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get content by tags (for filtering)
   */
  async getContentByTag(tag: string): Promise<ContentDoc[]> {
    try {
      logger.debug('Fetching content by tag', { tag });

      const contentCollection = collection(db, this.collectionName);
      const tagQuery = query(
        contentCollection,
        where('tags', 'array-contains', tag),
        where('status', '==', 'published'),
        orderBy('timestamps.created', 'desc')
      );

      const querySnapshot = await getDocs(tagQuery);
      const content = this.convertSnapshotToContentDocs(querySnapshot);

      logger.info('Tagged content fetched successfully', {
        tag,
        count: content.length
      });

      return content;
    } catch (error) {
      logger.error('Failed to fetch content by tag', {
        tag,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update content status (for moderation workflow)
   */
  async updateContentStatus(contentId: string, status: ContentDoc['status']): Promise<void> {
    try {
      logger.debug('Updating content status', { contentId, status });

      const contentDoc = doc(db, this.collectionName, contentId);
      const updateData: Partial<ContentDoc> = {
        status,
        timestamps: {
          created: serverTimestamp() as Timestamp, // Will be ignored by Firestore for existing field
          updated: serverTimestamp() as Timestamp
        }
      };

      // Add published timestamp when status changes to published
      if (status === 'published') {
        updateData.timestamps!.published = serverTimestamp() as Timestamp;
      }

      await updateDoc(contentDoc, updateData);

      logger.info('Content status updated successfully', {
        contentId,
        status
      });
    } catch (error) {
      logger.error('Failed to update content status', {
        contentId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Subscribe to real-time content updates
   */
  subscribeToPublishedContent(callback: (content: ContentDoc[]) => void): Unsubscribe {
    try {
      logger.debug('Setting up real-time subscription to published content');

      const contentCollection = collection(db, this.collectionName);
      const publishedQuery = query(
        contentCollection,
        where('status', '==', 'published'),
        orderBy('timestamps.created', 'desc')
      );

      const unsubscribe = onSnapshot(publishedQuery, (querySnapshot) => {
        const content = this.convertSnapshotToContentDocs(querySnapshot);

        logger.debug('Real-time content update received', {
          count: content.length
        });

        callback(content);
      });

      logger.info('Real-time content subscription established');
      return unsubscribe;
    } catch (error) {
      logger.error('Failed to setup content subscription', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Subscribe to all content (admin access)
   */
  subscribeToAllContent(callback: (content: ContentDoc[]) => void): Unsubscribe {
    try {
      logger.debug('Setting up admin subscription to all content');

      const contentCollection = collection(db, this.collectionName);
      const allContentQuery = query(
        contentCollection,
        orderBy('timestamps.created', 'desc')
      );

      const unsubscribe = onSnapshot(allContentQuery, (querySnapshot) => {
        const content = this.convertSnapshotToContentDocs(querySnapshot);

        logger.debug('Real-time admin content update received', {
          count: content.length
        });

        callback(content);
      });

      logger.info('Admin content subscription established');
      return unsubscribe;
    } catch (error) {
      logger.error('Failed to setup admin content subscription', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Convert Firestore query snapshot to ContentDoc array
   */
  private convertSnapshotToContentDocs(querySnapshot: QuerySnapshot<DocumentData>): ContentDoc[] {
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        description: data.description || '',
        authorId: data.authorId || '',
        authorName: data.authorName || 'Unknown Author',
        tags: Array.isArray(data.tags) ? data.tags : [],
        features: data.features || {},
        status: data.status || 'draft',
        timestamps: {
          created: data.timestamps?.created || data.createdAt || serverTimestamp() as Timestamp,
          updated: data.timestamps?.updated || data.updatedAt || serverTimestamp() as Timestamp,
          published: data.timestamps?.published || data.publishedAt || undefined
        }
      } as ContentDoc;
    });
  }

  /**
   * Update content tags (for featured status, etc.)
   */
  async updateContentTags(contentId: string, tags: string[]): Promise<void> {
    try {
      logger.debug('Updating content tags', { contentId, tagsCount: tags.length });

      const contentDoc = doc(db, this.collectionName, contentId);
      await updateDoc(contentDoc, {
        tags,
        'timestamps.updated': serverTimestamp() as Timestamp
      });

      logger.info('Content tags updated successfully', {
        contentId,
        tagsCount: tags.length
      });
    } catch (error) {
      logger.error('Failed to update content tags', {
        contentId,
        tagsCount: tags.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Toggle newsletter-ready status for content
   */
  async toggleNewsletterReady(contentId: string, newsletterReady: boolean): Promise<void> {
    try {
      logger.debug('Toggling newsletter-ready status', { contentId, newsletterReady });

      // Get the current content to access its tags
      const contentDoc = doc(db, this.collectionName, contentId);
      const contentSnapshot = await getDoc(contentDoc);

      if (!contentSnapshot.exists()) {
        throw new Error('Content not found');
      }

      const currentData = contentSnapshot.data();
      let updatedTags = [...(currentData.tags || [])];

      if (newsletterReady) {
        // Add newsletter:ready tag if not present
        if (!updatedTags.includes('newsletter:ready')) {
          updatedTags.push('newsletter:ready');
        }
      } else {
        // Remove newsletter:ready tag if present
        updatedTags = updatedTags.filter(tag => tag !== 'newsletter:ready');
      }

      // Update the content tags
      await updateDoc(contentDoc, {
        tags: updatedTags,
        'timestamps.updated': serverTimestamp() as Timestamp
      });

      logger.info('Newsletter-ready status updated successfully', {
        contentId,
        newsletterReady,
        tagsCount: updatedTags.length
      });
    } catch (error) {
      logger.error('Failed to toggle newsletter-ready status', {
        contentId,
        newsletterReady,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId: string): Promise<ContentDoc | null> {
    try {
      logger.debug('Fetching content by ID', { contentId });

      const contentDoc = doc(db, this.collectionName, contentId);
      const docSnapshot = await getDoc(contentDoc);

      if (!docSnapshot.exists()) {
        logger.warn('Content not found', { contentId });
        return null;
      }

      const data = docSnapshot.data();
      const content = {
        id: docSnapshot.id,
        title: data.title || 'Untitled',
        description: data.description || '',
        authorId: data.authorId || '',
        authorName: data.authorName || 'Unknown Author',
        tags: Array.isArray(data.tags) ? data.tags : [],
        features: data.features || {},
        status: data.status || 'draft',
        timestamps: {
          created: data.timestamps?.created || data.createdAt || serverTimestamp() as Timestamp,
          updated: data.timestamps?.updated || data.updatedAt || serverTimestamp() as Timestamp,
          published: data.timestamps?.published || data.publishedAt || undefined
        }
      } as ContentDoc;

      logger.info('Content fetched successfully', { contentId });
      return content;
    } catch (error) {
      logger.error('Failed to fetch content by ID', {
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete content (admin only)
   */
  async deleteContent(contentId: string): Promise<void> {
    try {
      logger.debug('Deleting content', { contentId });

      const contentDoc = doc(db, this.collectionName, contentId);
      await deleteDoc(contentDoc);

      logger.info('Content deleted successfully', { contentId });
    } catch (error) {
      logger.error('Failed to delete content', {
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseContentService = new FirebaseContentService();
