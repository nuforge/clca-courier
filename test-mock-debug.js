// Simple test to debug Firebase Auth mocking
import { vi } from 'vitest';

// Mock Firebase Auth
vi.mock('firebase/auth', () => {
  console.log('MOCK: Firebase auth mock being created');
  const createMockProvider = (providerId) => ({
    providerId,
    addScope: vi.fn().mockReturnThis(),
  });

  return {
    GoogleAuthProvider: vi.fn().mockImplementation(() => {
      console.log('MOCK: GoogleAuthProvider constructor called');
      return createMockProvider('google.com');
    }),
    FacebookAuthProvider: vi.fn().mockImplementation(() => {
      console.log('MOCK: FacebookAuthProvider constructor called');
      return createMockProvider('facebook.com');
    }),
  };
});

// Now import Firebase
import { GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

console.log('Testing Google provider...');
const googleProvider = new GoogleAuthProvider();
console.log('Google provider:', googleProvider);
console.log('Has addScope?', typeof googleProvider.addScope);

console.log('Testing Facebook provider...');
const facebookProvider = new FacebookAuthProvider();
console.log('Facebook provider:', facebookProvider);
console.log('Has addScope?', typeof facebookProvider.addScope);
