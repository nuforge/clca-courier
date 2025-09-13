/**
 * Canva Integration Type Definitions
 *
 * Strictly typed interfaces for Canva Connect API integration
 * following CLCA Courier architectural patterns and TypeScript standards.
 *
 * @author CLCA Courier Development Team
 * @version 1.0.0
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Canva design status literal union type
 * Represents the lifecycle states of a Canva design within the content workflow
 */
export type CanvaDesignStatus = 'draft' | 'pending_export' | 'exported' | 'failed';

/**
 * Core Canva design interface
 *
 * Represents a Canva design document with its metadata and export capabilities.
 * Follows Firebase Timestamp patterns established in the project.
 */
export interface CanvaDesign {
  /** Unique identifier for the Canva design */
  id: string;

  /** Edit URL for opening the design in Canva editor */
  editUrl: string;

  /** Export URL for downloading the final design (null until exported) */
  exportUrl: string | null;

  /** Current status of the design in the workflow */
  status: CanvaDesignStatus;

  /** Timestamp when the design was created (Firebase Timestamp) */
  createdAt: Timestamp;

  /** Timestamp when the design was last updated (Firebase Timestamp) */
  updatedAt: Timestamp;
}

/**
 * Canva comment interface for collaborative features
 *
 * Supports commenting and collaboration on Canva designs with
 * denormalized author information for performance optimization.
 */
export interface CanvaComment {
  /** Document ID (used with Firestore @documentId) */
  id: string;

  /** Author's user ID from Firebase Auth */
  authorId: string;

  /** Denormalized author display name for performance (optional) */
  authorDisplayName?: string;

  /** Comment text content */
  text: string;

  /** Timestamp when the comment was created (Firebase Timestamp) */
  createdAt: Timestamp;
}

/**
 * Canva API response interfaces
 */

/**
 * Response from Canva API when creating a design from template
 */
export interface CanvaCreateDesignResponse {
  design: {
    id: string;
    urls: {
      edit_url: string;
    };
  };
}

/**
 * Response from Canva API when creating a design with autofill
 */
export interface CanvaAutofillDesignResponse {
  design: {
    id: string;
    urls: {
      edit_url: string;
    };
  };
}

/**
 * Response from Canva API when requesting design export
 */
export interface CanvaExportResponse {
  job: {
    id: string;
    status: 'in_progress' | 'success' | 'failed';
    result?: {
      url: string;
    };
  };
}

/**
 * Response from Canva API when getting design details
 */
export interface CanvaGetDesignResponse {
  design: {
    id: string;
    title: string;
    urls: {
      edit_url: string;
    };
    thumbnail?: {
      url: string;
    };
  };
}

/**
 * Canva API error response structure
 */
export interface CanvaApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Type guard for Canva API errors
 */
export function isCanvaApiError(response: unknown): response is CanvaApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as Record<string, unknown>).error === 'object'
  );
}

/**
 * Configuration interface for Canva API service
 */
export interface CanvaConfig {
  apiBaseUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}

/**
 * OAuth token interface for Canva authentication
 */
export interface CanvaAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  scope: string[];
}

/**
 * Brand Template Configuration Interface
 *
 * Maps Canva Brand Templates to content types with field mappings for autofill.
 * Stored in admin-configurable collection to avoid creating new top-level collections.
 */
export interface CanvaTemplateConfig {
  /** Canva's Brand Template ID */
  id: string;

  /** Human-readable name for the template */
  name: string;

  /** Description of the template's purpose and design */
  description?: string;

  /** Links to our internal content type system - can support multiple types */
  contentTypes?: string[];

  /**
   * Field mapping for autofill functionality
   * Maps Canva template placeholders to content data paths
   * e.g., { "eventTitle": "title", "eventDate": "metadata.eventDate" }
   */
  fieldMapping?: Record<string, string>;

  /** Optional thumbnail URL for template preview */
  thumbnailUrl?: string;

  /** Whether this template is active and available for use */
  isActive?: boolean;

  /** Creation timestamp (Firebase Timestamp) */
  createdAt?: Timestamp;

  /** Last updated timestamp (Firebase Timestamp) */
  updatedAt?: Timestamp;
}
