/**
 * EMERGENCY TYPE SAFETY WRAPPER
 * Add this import to any file doing Firebase operations
 */

import {
  setDoc,
  addDoc,
  updateDoc,
  type DocumentReference,
  type CollectionReference,
  type SetOptions,
} from 'firebase/firestore';
import { cleanForFirebase } from './data-type-validator';
import { logger } from './logger';

// Wrap ALL Firebase writes
export const safeSetDoc = async (
  ref: DocumentReference,
  data: Record<string, unknown>,
  options?: SetOptions,
) => {
  const cleaned = cleanForFirebase(data);
  logger.debug('🛡️ SAFE WRITE:', { original: data, cleaned });
  return options ? setDoc(ref, cleaned, options) : setDoc(ref, cleaned);
};

export const safeAddDoc = async (
  collection: CollectionReference,
  data: Record<string, unknown>,
) => {
  const cleaned = cleanForFirebase(data);
  logger.debug('🛡️ SAFE ADD:', { original: data, cleaned });
  return addDoc(collection, cleaned);
};

export const safeUpdateDoc = async (ref: DocumentReference, data: Record<string, unknown>) => {
  const cleaned = cleanForFirebase(data);
  logger.debug('🛡️ SAFE UPDATE:', { original: data, cleaned });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return updateDoc(ref, cleaned as any);
};
