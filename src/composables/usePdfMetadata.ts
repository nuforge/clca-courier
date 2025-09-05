import { ref } from 'vue';
import { isCloudStorageUrl } from '../utils/imageUtils';

interface PdfMetadata {
  pageCount: number;
  fileSize?: string;
  title?: string;
  author?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

interface PdfDocumentInfo {
  Title?: string;
  Author?: string;
  CreationDate?: string;
  ModDate?: string;
  [key: string]: unknown;
}

export function usePdfMetadata() {
  const metadataCache = ref<Record<string, PdfMetadata>>({});

  const extractMetadata = async (url: string): Promise<PdfMetadata | null> => {
    // Check cache first
    if (metadataCache.value[url]) {
      return metadataCache.value[url];
    }

    // IMMEDIATE BAILOUT: Cloud Storage URLs may have CORS restrictions
    if (isCloudStorageUrl(url)) {
      console.log(
        'Skipping PDF metadata extraction for cloud storage URL - potential CORS restrictions',
      );

      // Return fallback metadata immediately without any network requests
      const fallbackMetadata: PdfMetadata = {
        pageCount: 1, // Default fallback - actual page count unknown due to CORS
        title: 'Cloud Storage PDF', // Generic title
      };

      // Cache the fallback to avoid repeated checks
      metadataCache.value[url] = fallbackMetadata;
      return fallbackMetadata;
    }

    try {
      // Import PDF.js dynamically to avoid bundle size issues
      const pdfjs = await import('pdfjs-dist');

      // Set worker path with correct base path for GitHub Pages
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        const isProduction = import.meta.env.PROD;
        const basePath = isProduction ? '/clca-courier' : '';
        pdfjs.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.js`;
      }

      // Load PDF document - only for NON-Google Drive URLs
      const loadingTask = pdfjs.getDocument({
        url: url,
        withCredentials: false,
      });
      const pdf = await loadingTask.promise;

      // Get basic metadata
      const metadata: PdfMetadata = {
        pageCount: pdf.numPages,
      };

      // Try to get additional metadata
      try {
        const documentInfo = await pdf.getMetadata();

        if (documentInfo.info) {
          const info = documentInfo.info as PdfDocumentInfo;

          if (info.Title) {
            metadata.title = info.Title;
          }
          if (info.Author) {
            metadata.author = info.Author;
          }

          if (info.CreationDate) {
            metadata.creationDate = new Date(info.CreationDate);
          }

          if (info.ModDate) {
            metadata.modificationDate = new Date(info.ModDate);
          }
        }
      } catch (metaError) {
        console.log('Could not extract additional metadata:', metaError);
      }

      // Try to get file size from response headers
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          const sizeInBytes = parseInt(contentLength);
          metadata.fileSize = formatFileSize(sizeInBytes);
        }
      } catch (sizeError) {
        console.log('Could not get file size:', sizeError);
      }

      // Cache the result
      metadataCache.value[url] = metadata;
      return metadata;
    } catch (error) {
      console.error('Error extracting PDF metadata:', error);
      return null;
    }
  };

  const getPageCount = async (url: string): Promise<number | null> => {
    const metadata = await extractMetadata(url);
    return metadata?.pageCount || null;
  };

  const getFileSize = async (url: string): Promise<string | null> => {
    const metadata = await extractMetadata(url);
    return metadata?.fileSize || null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const clearCache = () => {
    metadataCache.value = {};
  };

  const clearUrlCache = (url: string) => {
    delete metadataCache.value[url];
  };

  return {
    extractMetadata,
    getPageCount,
    getFileSize,
    clearCache,
    clearUrlCache,
    metadataCache,
  };
}
