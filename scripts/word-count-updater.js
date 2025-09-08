/**
 * Simple Word Count Updater - Uses App's Firebase Config
 *
 * This creates a simple Vue.js page to update Firebase word counts
 * using the existing app's Firebase authentication and configuration.
 */

// Add this functionality to an existing admin page temporarily
// The easiest approach is to add a button to the Newsletter Management page
// that reads the local extraction data and updates Firebase

const updateWordCountsFromExtraction = async () => {
  try {
    console.log('📊 Starting word count update...');

    // Read the extraction data from the JSON file
    const response = await fetch('/docs/pdf-text-extraction-2025-09-04.json');
    const extractionData = await response.json();

    // Create word count lookup
    const wordCountMap = new Map();
    extractionData.forEach((item) => {
      if (item.filename && item.wordCount) {
        wordCountMap.set(item.filename, item.wordCount);
        console.log(
          `✅ Found word count for ${item.filename}: ${item.wordCount.toLocaleString()} words`,
        );
      }
    });

    console.log(`🔢 Found word counts for ${wordCountMap.size} newsletters`);

    // Get all newsletters from store (which loads from Firebase)
    const store = useNewsletterManagementStore();
    await store.loadNewsletters();

    // Update each newsletter in Firebase
    let updatedCount = 0;
    for (const newsletter of store.newsletters) {
      const wordCount = wordCountMap.get(newsletter.filename);
      if (wordCount !== undefined) {
        try {
          // Use the existing Firebase service to update
          await firestoreService.updateNewsletter(newsletter.id, {
            wordCount: wordCount,
          });
          updatedCount++;
          console.log(`📝 Updated ${newsletter.filename}: ${wordCount.toLocaleString()} words`);
        } catch (error) {
          console.error(`❌ Failed to update ${newsletter.filename}:`, error);
        }
      } else {
        // Set to 0 if no word count found
        try {
          await firestoreService.updateNewsletter(newsletter.id, {
            wordCount: 0,
          });
          console.log(`⚠️  No word count found for ${newsletter.filename}, setting to 0`);
        } catch (error) {
          console.error(`❌ Failed to update ${newsletter.filename} to 0:`, error);
        }
      }
    }

    console.log(`✅ Successfully updated word counts for ${updatedCount} newsletters!`);

    // Refresh the store to show updated data
    await store.refreshNewsletters();
  } catch (error) {
    console.error('❌ Error updating word counts:', error);
  }
};

// Export for use in admin page
export { updateWordCountsFromExtraction };
