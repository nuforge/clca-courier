/**
 * English (US) Locale - Main Entry Point
 *
 * Consolidates all English translation modules
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

import navigation from './navigation';
import common from './common';
import forms from './forms';
import content from './content';
import newsletter from './newsletter';
import auth from './auth';
import pages from './pages';
import tasks from './tasks';
import { canva } from './canva';
import { dates, search, errors, success, settings, footer } from './additional';

export default {
  // Core navigation
  navigation,

  // Common UI elements
  common,

  // Forms and validation
  forms,

  // Content management
  content,

  // Newsletter system
  newsletter,

  // Authentication
  auth,

  // Canva integration
  canva,

  // Page content
  pages,

  // Task management system
  tasks,

  // Date and time
  dates,

  // Search and filtering
  search,

  // Error handling
  errors,

  // Success messages
  success,

  // Settings and preferences
  settings,

  // Footer and legal
  footer,

  // Legacy compatibility (existing keys)
  failed: 'Action failed',
  successLegacy: 'Action was successful'
};
