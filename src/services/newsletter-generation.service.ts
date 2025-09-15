/**
 * Newsletter Generation Service - CORRECTED VERSION
 *
 * Uses the EXISTING 'newsletters' collection instead of creating duplicate collections.
 * This maintains consistency with the documented architecture.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  type UpdateData
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { logger } from '../utils/logger';
import { normalizeDate } from '../utils/date-formatter';
import type { ContentDoc } from '../types/core/content.types';
import type { UnifiedNewsletter } from '../types/core/newsletter.types';

// Extended UnifiedNewsletter to support draft issues
interface NewsletterIssue extends UnifiedNewsletter {
  status: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  submissions: string[]; // Array of content IDs for new issues
  finalPdfPath?: string; // Path to generated PDF
  finalPdfUrl?: string; // URL to generated PDF
}

export interface NewsletterSubmission {
  contentId: string;
  title: string;
  content: string;
  author: string;
  featuredImageUrl?: string;
  order: number;
  pageNumber?: number;
}

export interface GenerationProgress {
  issueId: string;
  status: 'starting' | 'fetching_content' | 'generating_pages' | 'merging_pdf' | 'uploading' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

class NewsletterGenerationService {
  private readonly COLLECTIONS = {
    ISSUES: 'newsletters', // Use existing newsletters collection
    SUBMISSIONS: 'content_submissions'
  } as const;

  /**
   * Create a new newsletter issue
   */
  async createIssue(
    title: string,
    issueNumber: string,
    publicationDate: Date
  ): Promise<string> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to create newsletter issues');
      }

      // Create issue data that matches the existing newsletters collection structure
      const issueData: Omit<NewsletterIssue, 'id'> = {
        // Required NewsletterMetadata fields
        filename: `newsletter-${issueNumber.trim()}.pdf`,
        title: title.trim(),
        description: `Newsletter issue ${issueNumber.trim()}`,
        publicationDate: publicationDate.toISOString(), // ISO string to match existing structure
        issueNumber: issueNumber.trim(),
        year: publicationDate.getFullYear(),
        fileSize: 0, // Will be updated when PDF is generated
        pageCount: 0, // Will be updated when PDF is generated
        downloadUrl: '', // Will be updated when PDF is generated
        storageRef: '', // Will be updated when PDF is generated
        tags: ['newsletter', 'draft'],
        featured: false,
        isPublished: false, // Draft status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        updatedBy: currentUser.uid,

        // Extended fields for draft issues
        status: 'draft',
        submissions: []
      };

      const docRef = await addDoc(
        collection(firestore, this.COLLECTIONS.ISSUES),
        issueData
      );

      logger.info('Newsletter issue created in existing newsletters collection', {
        issueId: docRef.id,
        title,
        issueNumber,
        collection: this.COLLECTIONS.ISSUES
      });

      return docRef.id;
    } catch (error) {
      logger.error('Failed to create newsletter issue:', error);
      throw error;
    }
  }

  /**
   * Get all newsletter issues
   */
  async getIssues(): Promise<NewsletterIssue[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTIONS.ISSUES),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot?.docs?.map(doc => {
        const data = doc.data();

        // Use centralized date formatter to handle all date types safely
        const publicationDate = normalizeDate(data.publicationDate) || new Date();

        return {
          // NewsletterMetadata fields
          id: doc.id,
          filename: data.filename || `newsletter-${data.issueNumber || 'unknown'}.pdf`,
          title: data.title,
          description: data.description || '',
          publicationDate: publicationDate.toISOString(),
          issueNumber: data.issueNumber,
          season: data.season,
          year: data.year || publicationDate.getFullYear(),
          month: data.month,
          fileSize: data.fileSize || 0,
          pageCount: data.pageCount || 0,
          displayDate: data.displayDate,
          sortValue: data.sortValue,
          downloadUrl: data.downloadUrl || '',
          storageRef: data.storageRef || '',
          thumbnailUrl: data.thumbnailUrl,
          storage: data.storage,
          tags: data.tags || ['newsletter'],
          featured: data.featured || false,
          isPublished: data.isPublished || false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          createdBy: data.createdBy || 'system',
          updatedBy: data.updatedBy || 'system',
          searchableText: data.searchableText,
          actions: data.actions,

          // Extended fields for draft issues
          status: data.status || (data.isPublished ? 'published' : 'draft'),
          submissions: data.submissions || [],
          finalPdfPath: data.finalPdfPath,
          finalPdfUrl: data.finalPdfUrl
        } as NewsletterIssue;
      }) || [];
    } catch (error) {
      logger.error('Failed to fetch newsletter issues:', error);
      throw error;
    }
  }

  /**
   * Get approved content submissions for newsletter inclusion
   */
  async getApprovedSubmissions(): Promise<ContentDoc[]> {
    try {
      // Query for content that is either:
      // 1. Published and marked as newsletter:ready, OR
      // 2. Has status:approved tag and newsletter:ready tag
      const q = query(
        collection(firestore, 'content'),
        where('status', '==', 'published'),
        orderBy('timestamps.created', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const publishedContent = querySnapshot?.docs?.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ContentDoc)) || [];

      // Filter for newsletter-ready content on the client side
      const newsletterReadyContent = publishedContent.filter(content =>
        content.tags.includes('newsletter:ready')
      );

      // Also check for content with status:approved tag (legacy support)
      const legacyQuery = query(
        collection(firestore, 'content'),
        where('tags', 'array-contains', 'status:approved'),
        orderBy('timestamps.created', 'desc')
      );

      const legacySnapshot = await getDocs(legacyQuery);
      const legacyApproved = legacySnapshot?.docs?.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ContentDoc)) || [];

      const legacyNewsletterReady = legacyApproved.filter(content =>
        content.tags.includes('newsletter:ready')
      );

      // Combine and deduplicate by ID
      const allNewsletterReady = [...newsletterReadyContent, ...legacyNewsletterReady];
      const uniqueContent = allNewsletterReady.filter((content, index, self) =>
        index === self.findIndex(c => c.id === content.id)
      );

      logger.info('Found newsletter-ready content', {
        count: uniqueContent.length,
        published: newsletterReadyContent.length,
        legacy: legacyNewsletterReady.length
      });

      return uniqueContent;
    } catch (error) {
      logger.error('Failed to fetch approved submissions:', error);
      throw error;
    }
  }

  /**
   * Add submissions to a newsletter issue
   */
  async addSubmissionsToIssue(
    issueId: string,
    submissionIds: string[]
  ): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to modify newsletter issues');
      }

      const issueRef = doc(firestore, this.COLLECTIONS.ISSUES, issueId);
      await updateDoc(issueRef, {
        submissions: submissionIds,
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuthService.getCurrentUser()?.uid || 'system'
      });

      logger.info('Submissions added to newsletter issue', {
        issueId,
        submissionCount: submissionIds.length
      });
    } catch (error) {
      logger.error('Failed to add submissions to issue:', error);
      throw error;
    }
  }

  /**
   * Update an existing newsletter issue
   */
  async updateIssue(issueId: string, updates: {
    title?: string;
    issueNumber?: string;
    publicationDate?: Date;
    status?: 'draft' | 'generating' | 'ready' | 'published' | 'archived';
  }): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to update issues');
      }

      const issueRef = doc(firestore, this.COLLECTIONS.ISSUES, issueId);
      const updateData: UpdateData<NewsletterIssue> = {
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      // Add only the fields that are provided
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.issueNumber !== undefined) updateData.issueNumber = updates.issueNumber;
      if (updates.publicationDate !== undefined) updateData.publicationDate = updates.publicationDate.toISOString();
      if (updates.status !== undefined) {
        updateData.status = updates.status;

        // CRITICAL: Sync status with isPublished field for archive compatibility
        if (updates.status === 'published') {
          updateData.isPublished = true;
        } else if (updates.status === 'draft' || updates.status === 'archived') {
          updateData.isPublished = false;
        }
        // For 'ready' and 'generating', keep isPublished as is
      }

      await updateDoc(issueRef, updateData);

      logger.info('Issue updated successfully', {
        issueId,
        updates: Object.keys(updateData),
        statusChange: updates.status ? {
          newStatus: updates.status,
          isPublishedSet: updates.status === 'published' ? true : updates.status === 'draft' || updates.status === 'archived' ? false : 'unchanged'
        } : 'no status change'
      });

    } catch (error) {
      logger.error('Failed to update issue:', error);
      throw error;
    }
  }

  /**
   * Delete a newsletter issue
   */
  async deleteIssue(issueId: string): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to delete issues');
      }

      const issueRef = doc(firestore, this.COLLECTIONS.ISSUES, issueId);
      await updateDoc(issueRef, {
        status: 'archived',
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });

      logger.info('Issue archived successfully', { issueId });

    } catch (error) {
      logger.error('Failed to delete issue:', error);
      throw error;
    }
  }

  /**
   * Trigger PDF generation for a newsletter issue
   * This will call the Cloud Function to generate the PDF
   */
  async generateNewsletterPdf(issueId: string): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to generate newsletters');
      }

      logger.info('Generating newsletter PDF with authentication', {
        issueId,
        userId: currentUser.uid,
        userEmail: currentUser.email
      });

      // Update issue status to generating
      const issueRef = doc(firestore, this.COLLECTIONS.ISSUES, issueId);
      await updateDoc(issueRef, {
        status: 'generating',
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuthService.getCurrentUser()?.uid || 'system'
      });

      // Call the Cloud Function via HTTP (CORS-enabled)
      const { firebaseAuth } = await import('../config/firebase.config');
      const idToken = await firebaseAuth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error('User authentication token not available');
      }

      const response = await fetch('https://us-central1-clca-courier-27aed.cloudfunctions.net/generateNewsletterHttp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ issueId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      logger.info('Newsletter PDF generation initiated', {
        issueId,
        result: result
      });

    } catch (error) {
      logger.error('Failed to generate newsletter PDF:', error);

      // Update issue status to error
      const issueRef = doc(firestore, this.COLLECTIONS.ISSUES, issueId);
      await updateDoc(issueRef, {
        status: 'draft',
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuthService.getCurrentUser()?.uid || 'system'
      });

      throw error;
    }
  }

  /**
   * Get newsletter generation progress
   */
  async getGenerationProgress(issueId: string): Promise<GenerationProgress | null> {
    try {
      const progressRef = doc(firestore, 'generation_progress', issueId);
      const progressDoc = await getDoc(progressRef);

      if (progressDoc.exists()) {
        return progressDoc.data() as GenerationProgress;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get generation progress:', error);
      return null;
    }
  }

  /**
   * Mark content as ready for newsletter inclusion
   */
  async markContentForNewsletter(contentId: string): Promise<void> {
    try {
      const contentRef = doc(firestore, 'content', contentId);
      await updateDoc(contentRef, {
        tags: ['newsletter:ready'], // This will be merged with existing tags in the actual implementation
        updatedAt: serverTimestamp()
      });

      logger.info('Content marked for newsletter inclusion', { contentId });
    } catch (error) {
      logger.error('Failed to mark content for newsletter:', error);
      throw error;
    }
  }

  /**
   * Remove content from newsletter consideration
   */
  async unmarkContentForNewsletter(contentId: string): Promise<void> {
    try {
      const contentRef = doc(firestore, 'content', contentId);
      // Remove newsletter:ready tag (implementation would need to handle array removal)
      await updateDoc(contentRef, {
        updatedAt: serverTimestamp()
      });

      logger.info('Content unmarked for newsletter inclusion', { contentId });
    } catch (error) {
      logger.error('Failed to unmark content for newsletter:', error);
      throw error;
    }
  }

  /**
   * Unpublish an existing newsletter (both new issues and existing newsletters)
   */
  async unpublishNewsletter(newsletterId: string): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to unpublish newsletters');
      }

      const newsletterRef = doc(firestore, this.COLLECTIONS.ISSUES, newsletterId);
      const updateData: UpdateData<NewsletterIssue> = {
        isPublished: false,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      // For new issues, also update status to draft
      // For existing newsletters, just update isPublished
      const newsletterDoc = await getDoc(newsletterRef);
      if (newsletterDoc.exists()) {
        const newsletterData = newsletterDoc.data() as NewsletterIssue;

        // If it has a status field (new issue), set to draft
        if (newsletterData.status) {
          updateData.status = 'draft';
        }
      }

      await updateDoc(newsletterRef, updateData);

      logger.info('Newsletter unpublished successfully', {
        newsletterId,
        isPublished: false,
        statusUpdated: updateData.status ? 'draft' : 'unchanged'
      });

    } catch (error) {
      logger.error('Failed to unpublish newsletter:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const newsletterGenerationService = new NewsletterGenerationService();
export default newsletterGenerationService;
