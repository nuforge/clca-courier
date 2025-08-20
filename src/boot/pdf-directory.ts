/**
 * Boot file for directory listing API
 * Provides /api/pdf-files endpoint for dynamic file discovery
 */

import { boot } from 'quasar/wrappers';

export default boot(() => {
  // Only run in development server context
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // We can't add server-side endpoints from a boot file in Quasar
    // Instead, we'll need to use a different approach
    console.log('PDF directory listing boot file loaded');
  }
});
