/**
 * Date Management Service
 * Handles parsing newsletter filenames and managing season/month date systems
 */

import type { NewsletterMetadata } from './firebase-firestore.service';

export interface ParsedNewsletterDate {
  year: number;
  month?: number; // 1-12 for monthly newsletters
  season?: 'spring' | 'summer' | 'fall' | 'winter'; // For seasonal newsletters
  publicationDate: string; // ISO date string for sorting/filtering
  displayDate: string; // Human-readable date for UI
  sortValue: number; // Numeric value for sorting (YYYYMM format)
}

/**
 * Season to month mapping for consistent sorting
 * Maps seasons to equivalent months that maintain chronological order
 */
export const SEASON_MONTH_MAP = {
  spring: 3, // March (beginning of spring)
  summer: 6, // June (middle of summer)
  fall: 9, // September (beginning of fall)
  winter: 12, // December (beginning of winter)
} as const;

/**
 * Month names for display purposes
 */
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Season names with proper capitalization
 */
export const SEASON_NAMES = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
} as const;

class DateManagementService {
  /**
   * Parse filename to extract date information
   * Supports formats:
   * - YYYY.MM-* (e.g., "2024.03-conashaugh-courier.pdf")
   * - YYYY.SEASON-* (e.g., "2024.summer-conashaugh-courier.pdf")
   */
  parseFilenameDate(filename: string): ParsedNewsletterDate | null {
    // Extract the date portion from filename (everything before the first dash)
    const dateMatch = filename.match(/^(\d{4})\.(.+?)-/);

    if (!dateMatch || !dateMatch[1] || !dateMatch[2]) {
      console.warn(`Could not parse date from filename: ${filename}`);
      return null;
    }

    const year = parseInt(dateMatch[1], 10);
    const datePart = dateMatch[2].toLowerCase();

    // Check if it's a month (01-12)
    const monthMatch = datePart.match(/^(\d{1,2})$/);
    if (monthMatch && monthMatch[1]) {
      const month = parseInt(monthMatch[1], 10);

      if (month >= 1 && month <= 12) {
        return this.createMonthlyDate(year, month);
      }
    }

    // Check if it's a season
    if (datePart in SEASON_MONTH_MAP) {
      const season = datePart as keyof typeof SEASON_MONTH_MAP;
      return this.createSeasonalDate(year, season);
    }

    console.warn(`Unrecognized date format in filename: ${filename}`);
    return null;
  }

  /**
   * Create date object for monthly newsletters
   */
  private createMonthlyDate(year: number, month: number): ParsedNewsletterDate {
    // Create date for the 15th of the month (middle of month)
    const date = new Date(year, month - 1, 15);

    return {
      year,
      month,
      publicationDate: date.toISOString(),
      displayDate: `${MONTH_NAMES[month - 1]} ${year}`,
      sortValue: year * 100 + month, // YYYYMM format for sorting
    };
  }

  /**
   * Create date object for seasonal newsletters
   */
  private createSeasonalDate(
    year: number,
    season: keyof typeof SEASON_MONTH_MAP,
  ): ParsedNewsletterDate {
    const equivalentMonth = SEASON_MONTH_MAP[season];
    // Create date for the 15th of the equivalent month
    const date = new Date(year, equivalentMonth - 1, 15);

    return {
      year,
      season,
      publicationDate: date.toISOString(),
      displayDate: `${SEASON_NAMES[season]} ${year}`,
      sortValue: year * 100 + equivalentMonth, // Uses equivalent month for sorting
    };
  }

  /**
   * Get all newsletters sorted by date (newest first)
   */
  sortNewslettersByDate(newsletters: ParsedNewsletterDate[]): ParsedNewsletterDate[] {
    return newsletters.sort((a, b) => b.sortValue - a.sortValue);
  }

  /**
   * Group newsletters by year
   */
  groupNewslettersByYear(
    newsletters: ParsedNewsletterDate[],
  ): Record<number, ParsedNewsletterDate[]> {
    return newsletters.reduce(
      (groups, newsletter) => {
        const year = newsletter.year;
        if (!groups[year]) {
          groups[year] = [];
        }
        groups[year].push(newsletter);
        return groups;
      },
      {} as Record<number, ParsedNewsletterDate[]>,
    );
  }

  /**
   * Check if a date is in the current year
   */
  isCurrentYear(newsletter: ParsedNewsletterDate): boolean {
    return newsletter.year === new Date().getFullYear();
  }

  /**
   * Format date for display in various contexts
   */
  formatDateForContext(
    newsletter: ParsedNewsletterDate,
    context: 'short' | 'long' | 'archive',
  ): string {
    switch (context) {
      case 'short':
        if (newsletter.month) {
          return `${newsletter.month.toString().padStart(2, '0')}/${newsletter.year}`;
        }
        return `${newsletter.season?.charAt(0).toUpperCase()}${newsletter.year}`;

      case 'long':
        return newsletter.displayDate;

      case 'archive':
        if (newsletter.month) {
          return `${MONTH_NAMES[newsletter.month - 1]} ${newsletter.year}`;
        }
        return `${SEASON_NAMES[newsletter.season!]} ${newsletter.year}`;

      default:
        return newsletter.displayDate;
    }
  }

  /**
   * Generate issue number from date information
   * Format: YYYY.MM or YYYY.SEASON
   */
  generateIssueNumber(newsletter: ParsedNewsletterDate): string {
    if (newsletter.month) {
      // For monthly newsletters, use "Month Year" format
      const monthName = MONTH_NAMES[newsletter.month - 1];
      return `${monthName} ${newsletter.year}`;
    }
    // For seasonal newsletters, use "Season Year" format
    const seasonName = SEASON_NAMES[newsletter.season as keyof typeof SEASON_NAMES];
    return `${seasonName} ${newsletter.year}`;
  }

  /**
   * Parse existing newsletter metadata and enhance with date information
   */
  enhanceNewsletterMetadata(
    filename: string,
    existingMetadata: Partial<NewsletterMetadata> = {},
  ): Partial<NewsletterMetadata> {
    const parsedDate = this.parseFilenameDate(filename);

    if (!parsedDate) {
      console.warn(`Could not enhance metadata for ${filename} - date parsing failed`);
      return existingMetadata;
    }

    const enhancedData: Partial<NewsletterMetadata> = {
      ...existingMetadata,
      filename,
      year: parsedDate.year,
      publicationDate: parsedDate.publicationDate,
      displayDate: parsedDate.displayDate,
      issueNumber: this.generateIssueNumber(parsedDate),
      title: existingMetadata.title || this.generateTitleFromDate(parsedDate),
      sortValue: parsedDate.sortValue,
    };

    // Only include optional properties if they have values
    if (parsedDate.month !== undefined) {
      enhancedData.month = parsedDate.month;
    }
    if (parsedDate.season !== undefined) {
      enhancedData.season = parsedDate.season;
    }

    return enhancedData;
  }

  /**
   * Generate a title from date information if none exists
   */
  private generateTitleFromDate(parsedDate: ParsedNewsletterDate): string {
    const baseTitle = 'Conashaugh Lakes Courier';
    return `${baseTitle} - ${parsedDate.displayDate}`;
  }

  /**
   * Process a batch of PDF files and extract date metadata
   */
  processBatchFilenames(filenames: string[]): Array<{
    filename: string;
    parsed: ParsedNewsletterDate | null;
    enhanced: Partial<NewsletterMetadata>;
  }> {
    return filenames.map((filename) => {
      const parsed = this.parseFilenameDate(filename);
      const enhanced = this.enhanceNewsletterMetadata(filename);

      return {
        filename,
        parsed,
        enhanced,
      };
    });
  }
}

// Export singleton instance
export const dateManagementService = new DateManagementService();
export default dateManagementService;
