/**
 * Main execution script for Goa Fire Truck GPS data
 */

import { fetchAndCacheData } from './fetch-data.js';
import { createDailyTracks } from './track-creator.js';

// Run both functions in sequence
async function main() {
  try {
    await fetchAndCacheData();
    await createDailyTracks();
    console.log('Completed all operations successfully');
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

main(); 