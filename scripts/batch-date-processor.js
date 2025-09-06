/**
 * Batch Date Processing Script
 * One-time Node.js script to process existing PDFs and generate metadata with proper date information
 * Run with: node scripts/batch-date-processor.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Season to month mapping for consistent sorting
const SEASON_MONTH_MAP = {
  spring: 3, // March (beginning of spring)
  summer: 6, // June (middle of summer)
  fall: 9, // September (beginning of fall)
  winter: 12, // December (beginning of winter)
};

// Month names for display purposes
const MONTH_NAMES = [
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
];

// Season names with proper capitalization
const SEASON_NAMES = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
};

/**
 * Parse filename to extract date information
 */
function parseFilenameDate(filename) {
  // Extract the date portion from filename
  // Patterns: YYYY.MM-* or YYYY.SEASON-*
  const dateMatch = filename.match(/^(\\d{4})\\.(.*?)[-.].*$/);

  if (!dateMatch || !dateMatch[1] || !dateMatch[2]) {
    console.warn(`Could not parse date from filename: ${filename}`);
    return null;
  }

  const year = parseInt(dateMatch[1], 10);
  const datePart = dateMatch[2].toLowerCase();

  // Check if it's a month (01-12)
  const monthMatch = datePart.match(/^(\\d{1,2})$/);
  if (monthMatch && monthMatch[1]) {
    const month = parseInt(monthMatch[1], 10);

    if (month >= 1 && month <= 12) {
      return createMonthlyDate(year, month);
    }
  }

  // Check if it's a season
  if (datePart in SEASON_MONTH_MAP) {
    return createSeasonalDate(year, datePart);
  }

  console.warn(
    `Unrecognized date format in filename: ${filename} (parsed: year=${year}, datePart='${datePart}')`,
  );
  return null;
} /**
 * Create date object for monthly newsletters
 */
function createMonthlyDate(year, month) {
  // Create date for the 15th of the month (middle of month)
  const date = new Date(year, month - 1, 15);

  return {
    year,
    month,
    season: null,
    publicationDate: date.toISOString(),
    displayDate: `${MONTH_NAMES[month - 1]} ${year}`,
    sortValue: year * 100 + month, // YYYYMM format for sorting
    issueNumber: `${year}.${month.toString().padStart(2, '0')}`,
  };
}

/**
 * Create date object for seasonal newsletters
 */
function createSeasonalDate(year, season) {
  const equivalentMonth = SEASON_MONTH_MAP[season];
  // Create date for the 15th of the equivalent month
  const date = new Date(year, equivalentMonth - 1, 15);

  return {
    year,
    month: null,
    season,
    publicationDate: date.toISOString(),
    displayDate: `${SEASON_NAMES[season]} ${year}`,
    sortValue: year * 100 + equivalentMonth, // Uses equivalent month for sorting
    issueNumber: `${year}.${season}`,
  };
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.warn(`Could not get file size for ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Process all PDFs and generate metadata
 */
function processAllPdfs() {
  const PDF_DIRECTORY = path.join(process.cwd(), 'public', 'issues');
  const OUTPUT_FILE = path.join(
    process.cwd(),
    'public',
    'data',
    'enhanced-newsletter-metadata.json',
  );

  console.log(`\\n🔍 Processing PDFs in: ${PDF_DIRECTORY}`);
  console.log(`📝 Output will be saved to: ${OUTPUT_FILE}`);

  try {
    // Get all PDF files
    const files = fs
      .readdirSync(PDF_DIRECTORY)
      .filter((file) => file.toLowerCase().endsWith('.pdf'))
      .sort(); // Process in alphabetical order

    console.log(`\\n📄 Found ${files.length} PDF files to process`);

    const results = [];
    let processed = 0;
    let successful = 0;
    let errors = 0;

    for (const filename of files) {
      processed++;

      try {
        const parsedDate = parseFilenameDate(filename);

        if (parsedDate) {
          const filePath = path.join(PDF_DIRECTORY, filename);
          const fileSize = getFileSize(filePath);

          const metadata = {
            filename,
            title: `Conashaugh Lakes Courier - ${parsedDate.displayDate}`,
            description: '',
            year: parsedDate.year,
            month: parsedDate.month,
            season: parsedDate.season,
            publicationDate: parsedDate.publicationDate,
            issueNumber: parsedDate.issueNumber,
            displayDate: parsedDate.displayDate,
            sortValue: parsedDate.sortValue,
            fileSize,

            // Default metadata
            tags: [],
            featured: false,
            isPublished: true,
            pageCount: 0,

            // File access information
            downloadUrl: `/issues/${filename}`,
            storageRef: `newsletters/${filename}`,

            // Capabilities
            actions: {
              canView: true,
              canDownload: true,
              canSearch: false,
              hasThumbnail: false,
            },

            // Audit trail
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          results.push(metadata);
          successful++;

          console.log(`✅ ${filename} -> ${parsedDate.displayDate} (${parsedDate.issueNumber})`);
        } else {
          errors++;
          console.log(`⚠️ Could not parse: ${filename}`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error processing ${filename}:`, error.message);
      }
    }

    // Sort results by date (newest first)
    results.sort((a, b) => b.sortValue - a.sortValue);

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save results to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

    // Generate summary report
    console.log('\\n📊 Processing Summary:');
    console.log('========================');
    console.log(`   Total files: ${processed}`);
    console.log(`   Successfully processed: ${successful}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Output saved to: ${OUTPUT_FILE}`);

    // Show distribution by year
    const yearDistribution = results.reduce((dist, item) => {
      dist[item.year] = (dist[item.year] || 0) + 1;
      return dist;
    }, {});

    console.log('\\n📅 Distribution by Year:');
    Object.entries(yearDistribution)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .forEach(([year, count]) => {
        console.log(`   ${year}: ${count} newsletters`);
      });

    // Show sample of processed data
    console.log('\\n📋 Sample Results (Latest 5):');
    results.slice(0, 5).forEach((item) => {
      console.log(`   ${item.issueNumber}: ${item.title}`);
    });

    console.log('\\n✅ Batch processing completed successfully!');

    return {
      processed,
      successful,
      errors,
      results,
      outputFile: OUTPUT_FILE,
    };
  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    throw error;
  }
}

// Run the script if called directly
console.log('🚀 Starting batch date processing...');

try {
  const result = processAllPdfs();
  console.log(
    `\\n🎉 Processing complete! Generated metadata for ${result.successful} newsletters.`,
  );
} catch (error) {
  console.error('💥 Processing failed:', error.message);
}

export { processAllPdfs, parseFilenameDate, createMonthlyDate, createSeasonalDate };
