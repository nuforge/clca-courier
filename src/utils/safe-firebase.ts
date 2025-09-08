/**
 * EMERGENCY TYPE SAFETY WRAPPER
 * Add this import to any file doing Firebase operations
 */

import { setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { cleanForFirebase } from './data-type-validator';

// Wrap ALL Firebase writes
export const safeSetDoc = async (ref: any, data: any, options?: any) => {
  const cleaned = cleanForFirebase(data);
  console.log('🛡️ SAFE WRITE:', { original: data, cleaned });
  return setDoc(ref, cleaned, options);
};

export const safeAddDoc = async (collection: any, data: any) => {
  const cleaned = cleanForFirebase(data);
  console.log('🛡️ SAFE ADD:', { original: data, cleaned });
  return addDoc(collection, cleaned);
};

export const safeUpdateDoc = async (ref: any, data: any) => {
  const cleaned = cleanForFirebase(data);
  console.log('🛡️ SAFE UPDATE:', { original: data, cleaned });
  return updateDoc(ref, cleaned);
};
