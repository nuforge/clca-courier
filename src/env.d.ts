declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;

    // Firebase Configuration
    VITE_FIREBASE_API_KEY: string;
    VITE_FIREBASE_AUTH_DOMAIN: string;
    VITE_FIREBASE_PROJECT_ID: string;
    VITE_FIREBASE_STORAGE_BUCKET: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    VITE_FIREBASE_APP_ID: string;
    VITE_FIREBASE_MEASUREMENT_ID?: string;

    // Google Drive Configuration (legacy)
    VITE_GOOGLE_DRIVE_API_KEY?: string;
    VITE_GOOGLE_DRIVE_CLIENT_ID?: string;
    VITE_GOOGLE_DRIVE_PDF_FOLDER_ID?: string;
    VITE_GOOGLE_DRIVE_IMAGES_FOLDER_ID?: string;

    // Application Configuration
    VITE_APP_URL?: string;
    VITE_API_URL?: string;
  }
}
