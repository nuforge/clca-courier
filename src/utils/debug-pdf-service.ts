/**
 * Debug utilities for PDF processing
 * Run these in browser console to check PDF service status
 */

import { pdfMetadataService } from '../services/pdf-metadata-service';

// Make debug functions available on window for console access
declare global {
  interface Window {
    debugPDFService: {
      getStats: () => unknown;
      getBlacklist: () => unknown;
      clearBlacklist: () => void;
      testPDF: (filename: string) => Promise<unknown>;
    };
  }
}

const debugPDFService = {
  /**
   * Get current processing statistics
   */
  getStats() {
    const stats = pdfMetadataService.getProcessingStats();
    console.table(stats.failures);
    console.log('Processing Statistics:', {
      ...stats,
      failures: `${stats.failures.length} files with failures`,
    });
    return stats;
  },

  /**
   * Get blacklist information
   */
  getBlacklist() {
    const blacklist = pdfMetadataService.getBlacklistInfo();
    console.log('Blacklisted files:', blacklist);
    return blacklist;
  },

  /**
   * Clear the blacklist (for testing)
   */
  clearBlacklist() {
    pdfMetadataService.clearBlacklist();
    console.log('Blacklist cleared - files will be retried on next load');
  },

  /**
   * Test processing a specific PDF
   */
  async testPDF(filename: string) {
    console.log(`Testing PDF processing for: ${filename}`);
    const baseUrl = import.meta.env.PROD ? '/clca-courier' : '';
    const pdfUrl = `${baseUrl}/issues/${filename}`;

    try {
      const result = await pdfMetadataService.extractPDFMetadata(pdfUrl, filename);
      console.log('Result:', result);
      return result;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  },
};

// Attach to window for console access
if (typeof window !== 'undefined') {
  window.debugPDFService = debugPDFService;
  console.log('Debug functions attached to window.debugPDFService');
  console.log('Available methods:', Object.keys(debugPDFService));
}

export default debugPDFService;
