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
