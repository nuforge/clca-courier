/**
 * Firebase Configuration
 * Centralized Firebase setup for CLCA Courier
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Firebase configuration from environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Debug configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 Firebase config (development mode):', {
    hasApiKey: !!firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    hasAppId: !!firebaseConfig.appId,
  });
}

// Validate required configuration
const requiredFields = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];
const missingFields = requiredFields.filter(
  (field) => !firebaseConfig[field as keyof FirebaseConfig],
);

if (missingFields.length > 0) {
  console.error('Missing required Firebase configuration fields:', missingFields);

  // Provide helpful error message for different environments
  if (typeof window !== 'undefined') {
    // Browser environment
    console.error('🔥 Firebase Configuration Error:');
    console.error('This usually means:');
    console.error('1. Local development: Check your .env file exists and has all VITE_FIREBASE_* variables');
    console.error('2. GitHub Pages: Check repository secrets are configured in Settings > Secrets and variables > Actions');
    console.error('3. Other deployment: Ensure environment variables are set');
  }

  throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`);
}

// Initialize Firebase
let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;
let firestore: Firestore;
let firebaseStorage: FirebaseStorage;
let firebaseFunctions: Functions;

try {
  console.log('🔥 Initializing Firebase with config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
  });

  firebaseApp = initializeApp(firebaseConfig);

  // Initialize Firebase services with error handling
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  firebaseStorage = getStorage(firebaseApp);
  firebaseFunctions = getFunctions(firebaseApp);

  console.log('✅ Firebase services initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

// Export initialized services
export { firebaseApp, firebaseAuth, firestore, firebaseStorage, firebaseFunctions };

// Export configuration for debugging
export { firebaseConfig };

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return missingFields.length === 0;
};

// Export types
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Functions };
