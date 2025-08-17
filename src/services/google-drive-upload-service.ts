// Real Google Drive Upload Service
// Implements actual file uploads to Google Drive using OAuth

export interface GoogleDriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  size: string;
  mimeType: string;
  thumbnailLink?: string;
}

export class GoogleDriveUploadService {
  private static instance: GoogleDriveUploadService;
  private apiKey: string;
  private clientId: string;

  private constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  }

  static getInstance(): GoogleDriveUploadService {
    if (!GoogleDriveUploadService.instance) {
      GoogleDriveUploadService.instance = new GoogleDriveUploadService();
    }
    return GoogleDriveUploadService.instance;
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(file: File, parentFolderId?: string): Promise<GoogleDriveUploadResult> {
    const accessToken = localStorage.getItem('google_drive_access_token');

    if (!accessToken) {
      throw new Error('Google Drive authentication required. Please sign in first.');
    }

    // Step 1: Create file metadata
    const metadata = {
      name: file.name,
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    // Step 2: Create multipart upload request
    const delimiter = '-------314159265358979323846';
    const close_delim = `\r\n--${delimiter}--`;

    let body = `--${delimiter}\r\n`;
    body += 'Content-Type: application/json\r\n\r\n';
    body += JSON.stringify(metadata) + '\r\n';
    body += `--${delimiter}\r\n`;
    body += `Content-Type: ${file.type}\r\n\r\n`;

    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Create final request body
    const uint8Array1 = new TextEncoder().encode(body);
    const uint8Array2 = new Uint8Array(fileBuffer);
    const uint8Array3 = new TextEncoder().encode(close_delim);

    const combinedArray = new Uint8Array(
      uint8Array1.length + uint8Array2.length + uint8Array3.length,
    );
    combinedArray.set(uint8Array1, 0);
    combinedArray.set(uint8Array2, uint8Array1.length);
    combinedArray.set(uint8Array3, uint8Array1.length + uint8Array2.length);

    // Step 3: Upload to Google Drive
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,mimeType,thumbnailLink',
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary="${delimiter}"`,
          Authorization: `Bearer ${accessToken}`,
        },
        body: combinedArray,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Google Drive upload failed: ${errorData.error?.message || response.statusText}`,
      );
    }

    const uploadResult = await response.json();

    // Format the result
    return {
      id: uploadResult.id,
      name: uploadResult.name,
      webViewLink: uploadResult.webViewLink,
      webContentLink:
        uploadResult.webContentLink || `https://drive.google.com/uc?id=${uploadResult.id}`,
      size: this.formatFileSize(parseInt(uploadResult.size) || file.size),
      mimeType: uploadResult.mimeType,
      thumbnailLink: uploadResult.thumbnailLink,
    };
  }

  /**
   * Upload multiple files to Google Drive
   */
  async uploadFiles(files: File[], parentFolderId?: string): Promise<GoogleDriveUploadResult[]> {
    const results: GoogleDriveUploadResult[] = [];

    for (const file of files) {
      try {
        console.log(`📤 Uploading ${file.name} to Google Drive...`);
        const result = await this.uploadFile(file, parentFolderId);
        results.push(result);
        console.log(`✅ Successfully uploaded ${file.name} (ID: ${result.id})`);
      } catch (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error);
        throw error; // Re-throw to stop the batch upload
      }
    }

    return results;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('google_drive_access_token');
  }

  /**
   * Get authentication message for user
   */
  getAuthenticationMessage(): string {
    if (this.isAuthenticated()) {
      return '✅ Ready to upload to Google Drive';
    } else {
      return '⚠️ Google Drive authentication required to upload files';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const googleDriveUploadService = GoogleDriveUploadService.getInstance();
