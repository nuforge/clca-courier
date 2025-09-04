import { computed } from 'vue';
import { useSiteStore } from '../stores/site-store-simple';
import type { PdfDocument } from './usePdfViewer';

export function useIssueDetails() {
  const siteStore = useSiteStore();

  // Get issue by ID
  const getIssueById = (id: number): PdfDocument | undefined => {
    return siteStore.archivedIssues.find((issue: PdfDocument) => issue.id === id);
  };

  // Get all issues
  const allIssues = computed(() => siteStore.archivedIssues);

  // Get next issue in sequence
  const getNextIssue = (currentId: number): PdfDocument | undefined => {
    const currentIndex = siteStore.archivedIssues.findIndex(
      (issue: PdfDocument) => issue.id === currentId,
    );
    if (currentIndex !== -1 && currentIndex < siteStore.archivedIssues.length - 1) {
      return siteStore.archivedIssues[currentIndex + 1];
    }
    return undefined;
  };

  // Get previous issue in sequence
  const getPreviousIssue = (currentId: number): PdfDocument | undefined => {
    const currentIndex = siteStore.archivedIssues.findIndex(
      (issue: PdfDocument) => issue.id === currentId,
    );
    if (currentIndex > 0) {
      return siteStore.archivedIssues[currentIndex - 1];
    }
    return undefined;
  };

  // Get related issues (could be by year, season, etc.)
  const getRelatedIssues = (currentIssue: PdfDocument, limit = 3): PdfDocument[] => {
    return siteStore.archivedIssues
      .filter((issue: PdfDocument) => issue.id !== currentIssue.id)
      .slice(0, limit);
  };

  // Format issue metadata
  const formatIssueMetadata = (issue: PdfDocument) => {
    return {
      size: `${issue.pages} page${issue.pages !== 1 ? 's' : ''}`,
      filename: issue.filename,
      date: issue.date,
      downloadUrl: issue.url,
    };
  };

  // Check if issue exists
  const issueExists = (id: number): boolean => {
    return siteStore.archivedIssues.some((issue: PdfDocument) => issue.id === id);
  };

  return {
    getIssueById,
    allIssues,
    getNextIssue,
    getPreviousIssue,
    getRelatedIssues,
    formatIssueMetadata,
    issueExists,
  };
}
