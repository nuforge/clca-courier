// src/config/google-cloud-config.ts
export interface GoogleCloudConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  keyFile?: string;
  projectId?: string;
  scopes: string[];
}

// Default configuration for Google Drive API
export const defaultGoogleDriveConfig: GoogleCloudConfig = {
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.file',
  ],
};

// Default Google Drive folder ID for public submissions
export const GOOGLE_DRIVE_PUBLIC_FOLDER_ID =
  import.meta.env.VITE_GOOGLE_DRIVE_PUBLIC_FOLDER_ID || '1saSXnh9kkD_KNVwqusaz3i9YP46NZmIz';

// Build Google Drive folder URL
export const getGoogleDriveFolderUrl = (
  folderId: string = GOOGLE_DRIVE_PUBLIC_FOLDER_ID,
): string => {
  return `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
};

// Environment-based configuration
export const getGoogleCloudConfig = (): GoogleCloudConfig => {
  return {
    apiKey: process.env.GOOGLE_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY,
    clientId: process.env.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    keyFile: process.env.GOOGLE_KEY_FILE || import.meta.env.VITE_GOOGLE_KEY_FILE,
    projectId: process.env.GOOGLE_PROJECT_ID || import.meta.env.VITE_GOOGLE_PROJECT_ID,
    scopes: defaultGoogleDriveConfig.scopes,
  };
};
