/**
 * Update Firebase with word counts from EXISTING extracted text
 *
 * Reads the already-extracted text from docs/pdf-text-extraction-2025-09-04.json
 * and updates Firebase Firestore with the word counts.
 */

// This will run in the browser console on the newsletter management page
// Copy and paste this into the browser console while on the newsletter management page

async function updateWordCountsFromExistingText() {
  console.log('📊 Starting word count update from existing extracted text...');

  try {
    // Read the already-extracted text data
    const response = await fetch('/docs/pdf-text-extraction-2025-09-04.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch extraction data: ${response.statusText}`);
    }
    const extractionData = await response.json();

    // Create word count lookup from existing extracted text
    const wordCountMap = new Map();
    extractionData.forEach((item) => {
      if (item.filename && item.textContent) {
        // Count words from the existing extracted text
        const wordCount = item.textContent
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        wordCountMap.set(item.filename, wordCount);
        console.log(
          `✅ Calculated word count for ${item.filename}: ${wordCount.toLocaleString()} words`,
        );
      }
    });

    console.log(`🔢 Calculated word counts for ${wordCountMap.size} newsletters`);

    // Get the newsletter store (assuming we're on the newsletter management page)
    const store =
      window.Vue?.config?.globalProperties?.$store ||
      window.__VUE__?.newsletter ||
      (await import('/src/stores/newsletter-management.store.js')).useNewsletterManagementStore();

    if (!store) {
      console.error(
        '❌ Could not access newsletter store. Make sure you are on the newsletter management page.',
      );
      return;
    }

    // Get the Firestore service
    const { firestoreService } = await import('/src/services/firebase-firestore.service.js');

    // Update each newsletter with word count
    let updatedCount = 0;
    for (const newsletter of store.newsletters || []) {
      const wordCount = wordCountMap.get(newsletter.filename);
      if (wordCount !== undefined) {
        try {
          await firestoreService.updateNewsletterMetadata(newsletter.id, {
            wordCount: wordCount,
          });
          updatedCount++;
          console.log(`📝 Updated ${newsletter.filename}: ${wordCount.toLocaleString()} words`);
        } catch (error) {
          console.error(`❌ Failed to update ${newsletter.filename}:`, error);
        }
      } else {
        console.log(`⚠️  No extracted text found for ${newsletter.filename}`);
      }
    }

    console.log(`✅ Successfully updated word counts for ${updatedCount} newsletters!`);

    // Refresh the page to show updated data
    window.location.reload();
  } catch (error) {
    console.error('❌ Error updating word counts:', error);
  }
}

// Run the function
updateWordCountsFromExistingText();
