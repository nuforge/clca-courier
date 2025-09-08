// Temporary debug script to check Firebase auth and user profiles
// Run this in browser console to debug authentication issues

(async function debugAuth() {
  console.log('=== Firebase Auth Debug ===');

  // Check if Firebase is available
  if (typeof window.firebase === 'undefined') {
    console.log('Firebase not available on window');
    return;
  }

  const auth = window.firebase.auth();
  const user = auth.currentUser;

  console.log('Current User:', user);
  if (user) {
    console.log('User UID:', user.uid);
    console.log('User Email:', user.email);
    console.log('User Display Name:', user.displayName);

    // Try to fetch user profile from Firestore
    try {
      const firestore = window.firebase.firestore();
      const profileDoc = await firestore.collection('userProfiles').doc(user.uid).get();

      if (profileDoc.exists) {
        const profile = profileDoc.data();
        console.log('User Profile:', profile);
        console.log('User Role:', profile.role);
      } else {
        console.log('No user profile found in Firestore');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  } else {
    console.log('No user currently authenticated');
  }
})();
