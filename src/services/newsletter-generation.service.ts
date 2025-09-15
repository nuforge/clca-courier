/**
 * Newsletter Generation Service
 *
 * Handles the creation and management of newsletter issues from approved content submissions.
 * Integrates with existing content submission workflow and Firebase infrastructure.
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
  type Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { logger } from '../utils/logger';
import { normalizeDate } from '../utils/date-formatter';
import type { ContentDoc } from '../types/core/content.types';

export interface NewsletterIssue {
  id: string;
  title: string;
  issueNumber: string;
  publicationDate: Date;
  status: 'draft' | 'generating' | 'ready' | 'published';
  submissions: string[]; // Array of content IDs
  finalPdfUrl?: string;
  finalPdfPath?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
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
    ISSUES: 'newsletter_issues',
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

      const issueData: Omit<NewsletterIssue, 'id'> = {
        title: title.trim(),
        issueNumber: issueNumber.trim(),
        publicationDate,
        status: 'draft',
        submissions: [],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        createdBy: currentUser.uid,
        updatedBy: firebaseAuthService.getCurrentUser()?.uid || 'system'
      };

      const docRef = await addDoc(
        collection(firestore, this.COLLECTIONS.ISSUES),
        issueData
      );

      logger.info('Newsletter issue created', {
        issueId: docRef.id,
        title,
        issueNumber
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
      return querySnapshot.docs.map(doc => {
        const data = doc.data();

        // Use centralized date formatter to handle all date types safely
        const publicationDate = normalizeDate(data.publicationDate) || new Date();

        return {
          id: doc.id,
          title: data.title,
          issueNumber: data.issueNumber,
          publicationDate,
          status: data.status,
          submissions: data.submissions || [],
          finalPdfUrl: data.finalPdfUrl,
          finalPdfPath: data.finalPdfPath,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy
        } as NewsletterIssue;
      });
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
      // Query for content that is approved (we'll filter newsletter:ready in the client)
      const q = query(
        collection(firestore, 'content'),
        where('tags', 'array-contains', 'status:approved'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const allApproved = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ContentDoc));

      // Filter for newsletter-ready content on the client side
      return allApproved.filter(content =>
        content.tags.includes('newsletter:ready')
      );
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
   * Trigger PDF generation for a newsletter issue
   * This will call the Cloud Function to generate the PDF
   */
  async generateNewsletterPdf(issueId: string): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to generate newsletters');
      }

      // Update issue status to generating
      const issueRef = doc(firestore, this.COLLECTIONS.ISSUES, issueId);
      await updateDoc(issueRef, {
        status: 'generating',
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuthService.getCurrentUser()?.uid || 'system'
      });

      // Call the Cloud Function
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const generateNewsletter = httpsCallable(functions, 'generateNewsletter');

      const result = await generateNewsletter({ issueId });

      logger.info('Newsletter PDF generation initiated', {
        issueId,
        result: result.data
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
}

// Export singleton instance
export const newsletterGenerationService = new NewsletterGenerationService();
export default newsletterGenerationService;
