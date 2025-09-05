/**
 * Firebase Storage Service
 * Manages PDF uploads, downloads, and file operations
 */

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  updateMetadata,
  listAll,
  type StorageReference,
  type UploadTaskSnapshot,
  type SettableMetadata,
} from 'firebase/storage';
import { firebaseStorage } from '../config/firebase.config';
import { firebaseAuthService } from './firebase-auth.service';
import { logger } from '../utils/logger';

export interface FileUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface StoredFile {
  name: string;
  fullPath: string;
  size: number;
  contentType?: string | undefined;
  downloadUrl: string;
  metadata: {
    customMetadata?: Record<string, string> | undefined;
    cacheControl?: string | undefined;
    contentDisposition?: string | undefined;
    contentEncoding?: string | undefined;
    contentLanguage?: string | undefined;
    contentType?: string | undefined;
    md5Hash?: string | undefined;
    timeCreated?: string | undefined;
    updated?: string | undefined;
  };
}

export interface UploadConfig {
  folder?: string;
  filename?: string;
  metadata?: SettableMetadata;
  onProgress?: (progress: FileUploadProgress) => void;
  onError?: (error: Error) => void;
  onComplete?: (downloadUrl: string) => void;
}

class FirebaseStorageService {
  private readonly STORAGE_PATHS = {
    NEWSLETTERS: 'newsletters',
    USER_UPLOADS: 'user-uploads',
    THUMBNAILS: 'thumbnails',
    TEMP: 'temp',
  } as const;

  /**
   * Generate a safe filename with timestamp
   */
  private generateSafeFilename(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return prefix ? `${prefix}_${timestamp}_${sanitized}` : `${timestamp}_${sanitized}`;
  }

  /**
   * Get storage reference for a path
   */
  private getStorageRef(path: string): StorageReference {
    return ref(firebaseStorage, path);
  }

  /**
   * Upload PDF file with progress tracking
   */
  async uploadPdf(
    file: File,
    config: UploadConfig = {},
  ): Promise<{ downloadUrl: string; storagePath: string }> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to upload files');
      }

      // Validate file type
      if (!file.type.includes('pdf')) {
        throw new Error('Only PDF files are allowed');
      }

      // Generate filename and path
      const folder = config.folder || this.STORAGE_PATHS.NEWSLETTERS;
      const filename = config.filename || this.generateSafeFilename(file.name, 'newsletter');
      const storagePath = `${folder}/${filename}`;

      // Create storage reference
      const storageRef = this.getStorageRef(storagePath);

      // Prepare metadata
      const metadata: SettableMetadata = {
        contentType: 'application/pdf',
        customMetadata: {
          uploadedBy: currentUser.uid,
          uploadedByEmail: currentUser.email || '',
          originalName: file.name,
          uploadDate: new Date().toISOString(),
          ...config.metadata?.customMetadata,
        },
        ...config.metadata,
      };

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress: FileUploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              state: snapshot.state as FileUploadProgress['state'],
            };

            config.onProgress?.(progress);
            logger.debug(`Upload progress: ${progress.percentage.toFixed(2)}%`);
          },
          (error) => {
            logger.error('Upload error:', error);
            config.onError?.(error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadUrl) => {
                config.onComplete?.(downloadUrl);
                logger.success('Upload completed:', storagePath);
                resolve({ downloadUrl, storagePath });
              })
              .catch((downloadError: Error) => {
                reject(downloadError);
              });
          },
        );
      });
    } catch (error) {
      logger.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Upload general file (images, documents, etc.)
   */
  async uploadFile(
    file: File,
    config: UploadConfig = {},
  ): Promise<{ downloadUrl: string; storagePath: string }> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to upload files');
      }

      // Generate filename and path
      const folder = config.folder || this.STORAGE_PATHS.USER_UPLOADS;
      const filename = config.filename || this.generateSafeFilename(file.name);
      const storagePath = `${folder}/${filename}`;

      // Create storage reference
      const storageRef = this.getStorageRef(storagePath);

      // Prepare metadata
      const metadata: SettableMetadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: currentUser.uid,
          uploadedByEmail: currentUser.email || '',
          originalName: file.name,
          uploadDate: new Date().toISOString(),
          ...config.metadata?.customMetadata,
        },
        ...config.metadata,
      };

      // Upload file
      const result = await uploadBytes(storageRef, file, metadata);
      const downloadUrl = await getDownloadURL(result.ref);

      logger.success('File uploaded:', storagePath);
      return { downloadUrl, storagePath };
    } catch (error) {
      logger.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(storagePath: string): Promise<string> {
    try {
      const storageRef = this.getStorageRef(storagePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      logger.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated to delete files');
      }

      const storageRef = this.getStorageRef(storagePath);
      await deleteObject(storageRef);
      logger.success('File deleted:', storagePath);
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(storagePath: string): Promise<StoredFile> {
    try {
      const storageRef = this.getStorageRef(storagePath);
      const metadata = await getMetadata(storageRef);
      const downloadUrl = await getDownloadURL(storageRef);

      return {
        name: metadata.name,
        fullPath: metadata.fullPath,
        size: metadata.size,
        contentType: metadata.contentType,
        downloadUrl,
        metadata: {
          customMetadata: metadata.customMetadata || undefined,
          cacheControl: metadata.cacheControl || undefined,
          contentDisposition: metadata.contentDisposition || undefined,
          contentEncoding: metadata.contentEncoding || undefined,
          contentLanguage: metadata.contentLanguage || undefined,
          contentType: metadata.contentType || undefined,
          md5Hash: metadata.md5Hash || undefined,
          timeCreated: metadata.timeCreated || undefined,
          updated: metadata.updated || undefined,
        },
      };
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(storagePath: string, metadata: SettableMetadata): Promise<void> {
    try {
      const storageRef = this.getStorageRef(storagePath);
      await updateMetadata(storageRef, metadata);
      logger.success('File metadata updated:', storagePath);
    } catch (error) {
      logger.error('Error updating file metadata:', error);
      throw error;
    }
  }

  /**
   * List all files in a folder
   */
  async listFiles(folderPath: string): Promise<StoredFile[]> {
    try {
      const folderRef = this.getStorageRef(folderPath);
      const listResult = await listAll(folderRef);

      const files = await Promise.all(
        listResult.items.map(async (itemRef) => {
          const metadata = await getMetadata(itemRef);
          const downloadUrl = await getDownloadURL(itemRef);

          return {
            name: metadata.name,
            fullPath: metadata.fullPath,
            size: metadata.size,
            contentType: metadata.contentType || undefined,
            downloadUrl,
            metadata: {
              customMetadata: metadata.customMetadata || undefined,
              cacheControl: metadata.cacheControl || undefined,
              contentDisposition: metadata.contentDisposition || undefined,
              contentEncoding: metadata.contentEncoding || undefined,
              contentLanguage: metadata.contentLanguage || undefined,
              contentType: metadata.contentType || undefined,
              md5Hash: metadata.md5Hash || undefined,
              timeCreated: metadata.timeCreated || undefined,
              updated: metadata.updated || undefined,
            },
          };
        }),
      );

      logger.info(`Listed ${files.length} files in ${folderPath}`);
      return files;
    } catch (error) {
      logger.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Get all newsletter PDFs
   */
  async getNewsletterPdfs(): Promise<StoredFile[]> {
    return this.listFiles(this.STORAGE_PATHS.NEWSLETTERS);
  }

  /**
   * Upload newsletter PDF with proper metadata
   */
  async uploadNewsletterPdf(
    file: File,
    metadata: {
      title: string;
      issueNumber?: string;
      publicationDate: string;
      year: number;
      season?: string;
      tags?: string[];
    },
    onProgress?: (progress: FileUploadProgress) => void,
  ): Promise<{ downloadUrl: string; storagePath: string }> {
    const filename = this.generateSafeFilename(file.name, 'newsletter');

    const uploadConfig: UploadConfig = {
      folder: this.STORAGE_PATHS.NEWSLETTERS,
      filename,
      metadata: {
        customMetadata: {
          title: metadata.title,
          issueNumber: metadata.issueNumber || '',
          publicationDate: metadata.publicationDate,
          year: metadata.year.toString(),
          season: metadata.season || '',
          tags: metadata.tags?.join(',') || '',
        },
      },
    };

    if (onProgress) {
      uploadConfig.onProgress = onProgress;
    }

    return this.uploadPdf(file, uploadConfig);
  }

  /**
   * Generate thumbnail storage path
   */
  generateThumbnailPath(originalPath: string, size: string = 'medium'): string {
    const filename = originalPath.split('/').pop()?.replace('.pdf', '') || 'thumbnail';
    return `${this.STORAGE_PATHS.THUMBNAILS}/${filename}_${size}.jpg`;
  }

  /**
   * Check if file exists
   */
  async fileExists(storagePath: string): Promise<boolean> {
    try {
      const storageRef = this.getStorageRef(storagePath);
      await getMetadata(storageRef);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    newsletterCount: number;
    userUploadCount: number;
  }> {
    try {
      const [newsletters, userUploads] = await Promise.all([
        this.listFiles(this.STORAGE_PATHS.NEWSLETTERS),
        this.listFiles(this.STORAGE_PATHS.USER_UPLOADS),
      ]);

      const totalSize = [...newsletters, ...userUploads].reduce((sum, file) => sum + file.size, 0);

      return {
        totalFiles: newsletters.length + userUploads.length,
        totalSize,
        newsletterCount: newsletters.length,
        userUploadCount: userUploads.length,
      };
    } catch (error) {
      logger.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseStorageService = new FirebaseStorageService();
export default firebaseStorageService;
