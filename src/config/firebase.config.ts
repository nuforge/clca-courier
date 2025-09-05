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
  throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`);
}

// Initialize Firebase
export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firestore: Firestore = getFirestore(firebaseApp);
export const firebaseStorage: FirebaseStorage = getStorage(firebaseApp);
export const firebaseFunctions: Functions = getFunctions(firebaseApp);

// Export configuration for debugging
export { firebaseConfig };

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return missingFields.length === 0;
};

// Export types
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Functions };
