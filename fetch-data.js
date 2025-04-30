/**
 * Fire Truck API Cache Script
 * 
 * This script fetches data from the Goa Fire Department GPS API
 * and saves it to a cached JSON file that can be served via GitHub Pages.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const API_URL = 'https://gpsmiles.live//webservice?token=getLiveData&user=cnt-fire.goa@nic.in&pass=cnt@123&company=Directorate%20of%20Fire%20Emergency%20Services&format=csv';
const OUTPUT_FILE = path.join(__dirname, '../public/data/cached-fire-trucks.json');
const CACHE_DIRECTORY = path.dirname(OUTPUT_FILE);

// Make sure the cache directory exists
if (!fs.existsSync(CACHE_DIRECTORY)) {
  fs.mkdirSync(CACHE_DIRECTORY, { recursive: true });
}

// Parse CSV data for fire trucks
function parseFiretruckCSV(csvText) {
  if (!csvText) return [];
  
  // Split into lines and remove empty lines
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  
  const rows = [];
  let headers = [];
  let currentIndex = 0;
  
  // Process lines in groups (header followed by data)
  while (currentIndex < lines.length) {
    // Get headers from the current group
    const headerLine = lines[currentIndex++];
    if (headerLine.startsWith('Company,')) {
      headers = headerLine.split(',').map(h => h.trim());
    }
    
    // Skip if we reached the end or found "No Data Found"
    if (currentIndex >= lines.length || lines[currentIndex].includes('No Data Found')) {
      break;
    }
    
    // Process data row
    const values = lines[currentIndex++].split(',');
    
    // Create object with header keys
    const row = {};
    headers.forEach((header, index) => {
      // Keep it simple, just use the value as is
      let value = values[index] || '';
      // Only remove surrounding quotes if they exist
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      row[header] = value;
    });
    
    // Extract correct latitude and longitude based on the API response
    const lat = parseFloat(row['Longitude']);
    const lng = parseFloat(row['Status']);
    
    // Only add rows that have valid coordinates
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      row.Latitude = lat;
      row.Longitude = lng;
      rows.push(row);
    } else {
      console.log('Invalid row:', row);
    }
  }
  
  return rows;
}

// Convert rows to GeoJSON format
function rowsToGeoJSON(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.map(row => {
      const { Latitude, Longitude, ...properties } = row;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Longitude, Latitude]
        },
        properties
      };
    })
  };
}

// Main function to fetch and cache data
async function fetchAndCacheData() {
  try {
    console.log('Fetching fire truck data from API...');
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('Parsing CSV data...');
    
    // Parse CSV data
    const rows = parseFiretruckCSV(csvText);
    console.log(`Parsed ${rows.length} fire truck records`);
    
    // Convert to GeoJSON
    const geojson = rowsToGeoJSON(rows);
    
    // Add metadata
    const result = {
      type: 'FeatureCollection',
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'Directorate of Fire Emergency Services, Govt. of Goa',
        count: rows.length
      },
      features: geojson.features
    };
    
    // Save to file
    console.log(`Saving data to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log('Fire truck data cached successfully!');
    
  } catch (error) {
    console.error('Error fetching or caching data:', error);
    process.exit(1);
  }
}

// Run the main function
fetchAndCacheData(); 