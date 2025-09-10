import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger utility
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn()
  }
}));

// Import the actual service after mocking dependencies
import { dateManagementService } from '../../../src/services/date-management.service';

describe('Date Management Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseFilenameDate - Newsletter Filename Parsing', () => {
    it('should parse monthly newsletter filenames correctly', () => {
      const testCases = [
        {
          filename: '2024.03-conashaugh-courier.pdf',
          expected: {
            year: 2024,
            month: 3,
            displayDate: 'March 2024',
            sortValue: 202403
          }
        },
        {
          filename: '2025.09.conashaugh-annual-picnic.pdf',
          expected: {
            year: 2025,
            month: 9,
            displayDate: 'September 2025',
            sortValue: 202509
          }
        },
        {
          filename: '2024.12-newsletter.pdf',
          expected: {
            year: 2024,
            month: 12,
            displayDate: 'December 2024',
            sortValue: 202412
          }
        }
      ];

      testCases.forEach(({ filename, expected }) => {
        const result = dateManagementService.parseFilenameDate(filename);

        expect(result).not.toBeNull();
        expect(result?.year).toBe(expected.year);
        expect(result?.month).toBe(expected.month);
        expect(result?.displayDate).toBe(expected.displayDate);
        expect(result?.sortValue).toBe(expected.sortValue);
        expect(result?.season).toBeUndefined();
      });
    });

    it('should parse seasonal newsletter filenames correctly', () => {
      const testCases = [
        {
          filename: '2024.summer-conashaugh-courier.pdf',
          expected: {
            year: 2024,
            season: 'summer',
            displayDate: 'Summer 2024',
            sortValue: 202406 // June equivalent
          }
        },
        {
          filename: '2023.winter.holiday-newsletter.pdf',
          expected: {
            year: 2023,
            season: 'winter',
            displayDate: 'Winter 2023',
            sortValue: 202312 // December equivalent
          }
        },
        {
          filename: '2024.fall-events.pdf',
          expected: {
            year: 2024,
            season: 'fall',
            displayDate: 'Fall 2024',
            sortValue: 202409 // September equivalent
          }
        },
        {
          filename: '2025.spring-update.pdf',
          expected: {
            year: 2025,
            season: 'spring',
            displayDate: 'Spring 2025',
            sortValue: 202503 // March equivalent
          }
        }
      ];

      testCases.forEach(({ filename, expected }) => {
        const result = dateManagementService.parseFilenameDate(filename);

        expect(result).not.toBeNull();
        expect(result?.year).toBe(expected.year);
        expect(result?.season).toBe(expected.season);
        expect(result?.displayDate).toBe(expected.displayDate);
        expect(result?.sortValue).toBe(expected.sortValue);
        expect(result?.month).toBeUndefined();
      });
    });

    it('should reject invalid filename formats', () => {
      const invalidFilenames = [
        'newsletter.pdf', // No date
        '2024-conashaugh.pdf', // Wrong format
        '2024.99-invalid.pdf', // Invalid month
        '2024.13-invalid.pdf', // Invalid month
        '2024.invalid-season.pdf', // Invalid season
        'not-a-date.pdf', // No recognizable date pattern
        '2024..pdf', // Missing date part
        '2024.-invalid.pdf', // Empty date part
      ];

      invalidFilenames.forEach(filename => {
        const result = dateManagementService.parseFilenameDate(filename);
        expect(result).toBeNull();
      });
    });

    it('should handle edge cases gracefully', () => {
      // Valid edge cases
      expect(dateManagementService.parseFilenameDate('2024.01-january.pdf')).not.toBeNull();
      expect(dateManagementService.parseFilenameDate('2024.12-december.pdf')).not.toBeNull();
      expect(dateManagementService.parseFilenameDate('2000.summer-y2k.pdf')).not.toBeNull();
      expect(dateManagementService.parseFilenameDate('9999.winter-future.pdf')).not.toBeNull();

      // Invalid edge cases
      expect(dateManagementService.parseFilenameDate('2024.00-invalid.pdf')).toBeNull(); // Month 0
      expect(dateManagementService.parseFilenameDate('2024.13-invalid.pdf')).toBeNull(); // Month 13
      expect(dateManagementService.parseFilenameDate('')).toBeNull(); // Empty string
    });
  });

  describe('sortNewslettersByDate - Chronological Sorting', () => {
    it('should sort mixed monthly and seasonal newsletters correctly', () => {
      const newsletters = [
        dateManagementService.parseFilenameDate('2024.06-june.pdf'), // June 2024
        dateManagementService.parseFilenameDate('2024.summer-summer.pdf'), // June equivalent 2024
        dateManagementService.parseFilenameDate('2024.03-march.pdf'), // March 2024
        dateManagementService.parseFilenameDate('2024.fall-fall.pdf'), // September equivalent 2024
        dateManagementService.parseFilenameDate('2023.12-december.pdf'), // December 2023
      ].filter(n => n !== null);

      const sorted = dateManagementService.sortNewslettersByDate(newsletters);

      // Should be sorted newest first (descending)
      expect(sorted[0]?.sortValue).toBe(202409); // Fall 2024 (Sept equivalent)
      expect(sorted[1]?.sortValue).toBe(202406); // Summer 2024 (June equivalent) or June 2024
      expect(sorted[2]?.sortValue).toBe(202406); // The other June entry
      expect(sorted[3]?.sortValue).toBe(202403); // March 2024
      expect(sorted[4]?.sortValue).toBe(202312); // December 2023
    });

    it('should handle empty array', () => {
      const result = dateManagementService.sortNewslettersByDate([]);
      expect(result).toEqual([]);
    });
  });

  describe('groupNewslettersByYear - Organization', () => {
    it('should group newsletters by year correctly', () => {
      const newsletters = [
        dateManagementService.parseFilenameDate('2024.06-june.pdf'),
        dateManagementService.parseFilenameDate('2024.03-march.pdf'),
        dateManagementService.parseFilenameDate('2023.12-december.pdf'),
        dateManagementService.parseFilenameDate('2023.summer-summer.pdf'),
      ].filter(n => n !== null);

      const grouped = dateManagementService.groupNewslettersByYear(newsletters);

      // Object.keys() returns keys in insertion order, but we need to check values
      const years = Object.keys(grouped).sort().reverse(); // Sort and reverse for newest first
      expect(years).toEqual(['2024', '2023']);
      expect(grouped[2024]).toHaveLength(2);
      expect(grouped[2023]).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const result = dateManagementService.groupNewslettersByYear([]);
      expect(result).toEqual({});
    });
  });

  describe('formatDateForContext - Display Formatting', () => {
    it('should format monthly newsletters for different contexts', () => {
      const monthlyNewsletter = dateManagementService.parseFilenameDate('2024.06-june.pdf');
      expect(monthlyNewsletter).not.toBeNull();

      expect(dateManagementService.formatDateForContext(monthlyNewsletter!, 'short')).toBe('06/2024');
      expect(dateManagementService.formatDateForContext(monthlyNewsletter!, 'long')).toBe('June 2024');
      expect(dateManagementService.formatDateForContext(monthlyNewsletter!, 'archive')).toBe('June 2024');
    });

    it('should format seasonal newsletters for different contexts', () => {
      const seasonalNewsletter = dateManagementService.parseFilenameDate('2024.summer-summer.pdf');
      expect(seasonalNewsletter).not.toBeNull();

      // Note: Short format for seasons uses first letter + year
      expect(dateManagementService.formatDateForContext(seasonalNewsletter!, 'short')).toMatch(/S2024/);
      expect(dateManagementService.formatDateForContext(seasonalNewsletter!, 'long')).toBe('Summer 2024');
      expect(dateManagementService.formatDateForContext(seasonalNewsletter!, 'archive')).toBe('Summer 2024');
    });
  });

  describe('Real-world Newsletter Validation', () => {
    it('should handle actual newsletter filenames from the archive', () => {
      // These are realistic filenames based on the project structure
      const realFilenames = [
        '2024.08-conashaugh-courier.pdf',
        '2024.07-summer-activities.pdf',
        '2024.06-june-newsletter.pdf',
        '2023.winter-holiday-edition.pdf',
        '2023.fall-community-updates.pdf'
      ];

      realFilenames.forEach(filename => {
        const result = dateManagementService.parseFilenameDate(filename);
        expect(result).not.toBeNull();
        expect(result?.year).toBeGreaterThan(2000);
        expect(result?.year).toBeLessThan(3000);
        expect(result?.sortValue).toBeGreaterThan(200000);
        expect(result?.displayDate).toMatch(/\d{4}/); // Should contain year
      });
    });

    it('should maintain chronological order for real archive data', () => {
      const archiveFilenames = [
        '2024.08-august.pdf',
        '2024.07-july.pdf',
        '2024.summer-special.pdf', // Should sort near July (month 6)
        '2024.06-june.pdf',
        '2024.spring-updates.pdf', // Should sort near March (month 3)
        '2023.12-december.pdf'
      ];

      const newsletters = archiveFilenames
        .map(filename => dateManagementService.parseFilenameDate(filename))
        .filter(n => n !== null);

      const sorted = dateManagementService.sortNewslettersByDate(newsletters);

      // Verify descending chronological order
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i]?.sortValue ?? 0).toBeGreaterThanOrEqual(sorted[i + 1]?.sortValue ?? 0);
      }
    });
  });
});
