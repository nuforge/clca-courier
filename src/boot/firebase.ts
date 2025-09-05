/**
 * Firebase Boot File
 * Initializes Firebase services for the Quasar application
 */

import { boot } from 'quasar/wrappers';
import { isFirebaseConfigured } from '../config/firebase.config';
import { firebaseAuthService } from '../services/firebase-auth.service';
import { logger } from '../utils/logger';

export default boot(({ app }) => {
  // Check if Firebase is properly configured
  if (!isFirebaseConfigured()) {
    logger.warn('Firebase is not properly configured. Some features may not work.');
    return;
  }

  try {
    // Initialize Firebase Auth service
    // Note: Firebase app is already initialized in firebase.config.ts
    logger.info('Firebase services initialized successfully');

    // Check for any existing auth state on app startup
    // This is handled automatically by the auth service's onAuthStateChanged listener

    // Make Firebase services globally available if needed
    app.config.globalProperties.$firebaseAuth = firebaseAuthService;

    logger.success('Firebase boot completed successfully');
  } catch (error) {
    logger.error('Firebase initialization failed:', error);
    throw error;
  }
});
