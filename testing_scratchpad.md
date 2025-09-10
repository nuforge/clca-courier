# Testing Scratchpad - Firebase Authentication Service

## GOAL: Full test coverage for Firebase Authentication Service (`src/services/firebase-auth.service.ts`)

## SERVICE ANALYSIS:
**Firebase Auth Service Features to Test:**
- ✅ **OAuth Providers**: Google, Facebook, Twitter, GitHub with popup/redirect flow
- ✅ **Avatar Caching**: Data URL caching system to prevent 429 rate limits (1 hour TTL)
- ✅ **Auto-Fallback**: Popup → Redirect when popup blocked
- ✅ **Auth State Management**: Real-time state changes with listener pattern
- ✅ **Error Handling**: Comprehensive error logging and user feedback
- ✅ **Token Management**: Access token retrieval for API calls
- ✅ **Permission System**: Role-based access control hooks

## MOCKING STRATEGY:
**Required Mocks:**
- `firebase/auth` - All auth functions (signInWithPopup, signInWithRedirect, etc.)
- `../config/firebase.config` - Firebase app configuration
- `../utils/logger` - Centralized logging utility
- `fetch` - For avatar caching functionality
- `FileReader` - For data URL conversion
- `window.open` - For popup blocker detection

## COMPLETED TESTS:
- [ ] **Basic Setup** - Test file structure and imports

## CRITICAL TEST SCENARIOS TO WRITE:

### Authentication Flow Tests:
- [ ] `signInWithPopup()` - Successful Google authentication
- [ ] `signInWithPopup()` - Popup blocked → auto-fallback to redirect
- [ ] `signInWithPopup()` - Network error handling
- [ ] `signInWithRedirect()` - Redirect flow initiation
- [ ] `getRedirectResult()` - Handling redirect return
- [ ] `signOut()` - Successful logout

### Provider Management:
- [ ] `getProvider()` - Google provider with scopes
- [ ] `getProvider()` - Facebook provider configuration
- [ ] `getProvider()` - Twitter provider setup
- [ ] `getProvider()` - GitHub provider with scopes
- [ ] `getProvider()` - Invalid provider error

### Avatar Caching System:
- [ ] `cacheAvatarImage()` - Successful image caching as data URL
- [ ] `cacheAvatarImage()` - Cache expiry (1 hour TTL)
- [ ] `cacheAvatarImage()` - Network error fallback
- [ ] `getCachedAvatarUrl()` - Valid cached URL retrieval
- [ ] `getCachedAvatarUrl()` - Expired cache handling
- [ ] `clearAvatarCache()` - Cache clearing functionality

### State Management:
- [ ] `onAuthStateChange()` - Listener registration and callback
- [ ] `onAuthStateChange()` - Unsubscribe functionality
- [ ] `transformFirebaseUser()` - User object transformation
- [ ] `getAuthState()` - Current state retrieval
- [ ] `isAuthenticated()` - Authentication status check

### Token & Permissions:
- [ ] `getAccessToken()` - Valid token retrieval
- [ ] `getAccessToken()` - No user error handling
- [ ] `hasPermission()` - Permission checking logic
- [ ] `isEditor()` - Role-based access validation

### Error Scenarios:
- [ ] Popup blocker detection and messaging
- [ ] Network failure during authentication
- [ ] Invalid provider configuration
- [ ] Token refresh failures
- [ ] Avatar caching failures

## CONTEXT:
- **Testing Framework**: Vitest with Vue Test Utils
- **Mocking Pattern**: Comprehensive Firebase function mocking
- **File Location**: `/tests/unit/services/firebase-auth.service.test.ts`
- **Setup Reference**: Follow patterns from `firebase-firestore.service.test.ts`