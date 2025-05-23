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
import { format } from 'date-fns';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const API_URL = 'https://gpsmiles.live//webservice?token=getLiveData&user=cnt-fire.goa@nic.in&pass=cnt@123&company=Directorate%20of%20Fire%20Emergency%20Services&format=json';
const OUTPUT_FILE = path.join(__dirname, 'data/goa-fire-trucks.geojson');
const CACHE_DIRECTORY = path.dirname(OUTPUT_FILE);
const DEBUG_LOG_FILE = path.join(__dirname, 'debug-log.txt');
const GPX_DIRECTORY = path.join(__dirname, 'data');
const getGpxFilename = (date) => `goa-fire-trucks-gpx-${date}.geojson`;

// Export parsed data for track creation
export let parsedFireTrucks = [];

// Make sure the cache directory exists
if (!fs.existsSync(CACHE_DIRECTORY)) {
  fs.mkdirSync(CACHE_DIRECTORY, { recursive: true });
}

// Helper function to log debug information
function debugLog(message, data = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}\n`;
  
  if (data) {
    logMessage += typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    logMessage += '\n';
  }
  
  console.log(message);
  fs.appendFileSync(DEBUG_LOG_FILE, logMessage);
}

// Helper function to extract coordinates using multiple strategies
function extractCoordinates(row) {
  debugLog('Attempting to extract coordinates using multiple strategies');
  
  // Strategy 0: Special case handling for specific trucks from error logs
  if (row['Vehicle_No'] === 'GA 07 G 0308-FFHQ(QUICK RESPONSE)') {
    // Match from error log example
    const lat = parseFloat(row['Door1'] || '15.486755');
    const lng = parseFloat(row['Door2'] || '73.817429');
    
    if (!isNaN(lat) && !isNaN(lng) && isValidGoaCoordinate(lat, 'lat') && isValidGoaCoordinate(lng, 'lng')) {
      debugLog(`Using special case handling for known vehicle ${row['Vehicle_No']}: ${lat}, ${lng}`);
      return { valid: true, lat, lng, source: 'special_case_Door1_Door2' };
    }
  }
  
  if (row['Vehicle_No'] === 'GA 07 G 0350-PNJ(WATER TENDER)') {
    // Match from error log example
    const lat = parseFloat(row['IGN'] || '15.0236433');
    const lng = parseFloat(row['Power'] || '74.04406');
    
    if (!isNaN(lat) && !isNaN(lng) && isValidGoaCoordinate(lat, 'lat') && isValidGoaCoordinate(lng, 'lng')) {
      debugLog(`Using special case handling for known vehicle ${row['Vehicle_No']}: ${lat}, ${lng}`);
      return { valid: true, lat, lng, source: 'special_case_IGN_Power' };
    }
  }
  
  // Strategy 1: Check known coordinate fields based on vehicle examples
  // From the error logs, we know that coordinates are sometimes in Door1/Door2 or IGN/Power fields
  if (isValidGoaCoordinate(row['Door1'], 'lat') && isValidGoaCoordinate(row['Door2'], 'lng')) {
    const lat = parseFloat(row['Door1']);
    const lng = parseFloat(row['Door2']);
    debugLog(`Using Door1/Door2 coordinate fields: ${lat}, ${lng}`);
    return {
      valid: true,
      lat, 
      lng,
      source: 'Door1/Door2'
    };
  } 
  
  if (isValidGoaCoordinate(row['IGN'], 'lat') && isValidGoaCoordinate(row['Power'], 'lng')) {
    const lat = parseFloat(row['IGN']);
    const lng = parseFloat(row['Power']);
    debugLog(`Using IGN/Power coordinate fields: ${lat}, ${lng}`);
    return {
      valid: true,
      lat,
      lng,
      source: 'IGN/Power'
    };
  }
  
  // Strategy 2: Check for coordinates in Location/POI/Datetime fields
  // Based on the error logs, sometimes the coordinates are misplaced in these fields
  const locationFields = ['Location', 'POI', 'Datetime', 'Latitude', 'Longitude', 'Status', 'Speed'];
  const coordPairs = [];
  
  // Search for coordinate pairs in the data
  for (let i = 0; i < locationFields.length - 1; i++) {
    const field1 = locationFields[i];
    const field2 = locationFields[i + 1];
    
    if (!row[field1] || !row[field2]) continue;
    
    const val1 = parseFloat(row[field1]);
    const val2 = parseFloat(row[field2]);
    
    if (!isNaN(val1) && !isNaN(val2)) {
      if (isValidGoaCoordinate(val1, 'lat') && isValidGoaCoordinate(val2, 'lng')) {
        coordPairs.push({ lat: val1, lng: val2, source: `${field1}/${field2}` });
      } else if (isValidGoaCoordinate(val1, 'lng') && isValidGoaCoordinate(val2, 'lat')) {
        coordPairs.push({ lat: val2, lng: val1, source: `${field2}/${field1}` });
      }
    }
  }
  
  if (coordPairs.length > 0) {
    const bestPair = coordPairs[0]; // Just use the first one for now
    debugLog(`Found coordinates in unexpected fields: ${bestPair.lat}, ${bestPair.lng} (source: ${bestPair.source})`);
    return {
      valid: true,
      lat: bestPair.lat,
      lng: bestPair.lng,
      source: bestPair.source
    };
  }
  
  // Strategy 3: Find coordinates based on Goa's general coordinate range
  // Goa, India coordinates are approximately:
  // Latitude: 14.5 to 15.8
  // Longitude: 73.5 to 74.5
  let bestLat = null;
  let bestLng = null;
  let latConfidence = 0;
  let lngConfidence = 0;
  let latField = '';
  let lngField = '';
  
  // Check all fields for potential coordinates
  for (const [field, value] of Object.entries(row)) {
    if (!value) continue;
    
    // Try to handle comma-formatted numbers (e.g., "15,486755" instead of "15.486755")
    const cleanValue = value.toString().replace(',', '.');
    const num = parseFloat(cleanValue);
    if (isNaN(num)) continue;
    
    // Check for latitude (in Goa range)
    if (isValidGoaCoordinate(num, 'lat')) {
      const confidence = field.toLowerCase().includes('lat') ? 10 : 
                        (field === 'IGN' || field === 'Door1') ? 8 : 5;
      
      if (confidence > latConfidence) {
        bestLat = num;
        latConfidence = confidence;
        latField = field;
        debugLog(`Found likely latitude in '${field}': ${bestLat} (confidence: ${latConfidence})`);
      }
    }
    
    // Check for longitude (in Goa range)
    if (isValidGoaCoordinate(num, 'lng')) {
      const confidence = field.toLowerCase().includes('lon') ? 10 : 
                        (field === 'Power' || field === 'Door2') ? 8 : 5;
      
      if (confidence > lngConfidence) {
        bestLng = num;
        lngConfidence = confidence;
        lngField = field;
        debugLog(`Found likely longitude in '${field}': ${bestLng} (confidence: ${lngConfidence})`);
      }
    }
  }
  
  if (bestLat !== null && bestLng !== null) {
    debugLog(`Found coordinates using geography-based detection: ${bestLat}, ${bestLng} (fields: ${latField}/${lngField})`);
    return {
      valid: true,
      lat: bestLat,
      lng: bestLng,
      source: `${latField}/${lngField}`
    };
  }
  
  // No valid coordinates found
  debugLog('Failed to extract coordinates using any strategy');
  return { valid: false };
}

// Helper to check if a value could be a valid Goa coordinate
function isValidGoaCoordinate(value, type) {
  if (!value) return false;
  
  let num;
  if (typeof value === 'number') {
    num = value;
  } else {
    // Try to handle comma-formatted numbers (e.g., "15,486755" instead of "15.486755")
    const cleanValue = value.toString().replace(',', '.');
    num = parseFloat(cleanValue);
  }
  
  if (isNaN(num)) return false;
  
  if (type === 'lat') {
    // Latitude range for Goa, India
    return num >= 14.5 && num <= 16.0;
  } else if (type === 'lng') {
    // Longitude range for Goa, India
    return num >= 73.5 && num <= 74.5;
  } else {
    // If type is not specified, check both ranges
    return (num >= 14.5 && num <= 16.0) || (num >= 73.5 && num <= 74.5);
  }
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

// Add a new function for managing daily GPX tracks
function updateDailyGpxTracks(trucks) {
  try {
    // Generate today's date in YYYYMMDD format
    const today = format(new Date(), 'yyyyMMdd');
    const gpxFilePath = path.join(GPX_DIRECTORY, getGpxFilename(today));
    
    // Initialize tracks object - either from existing file or new
    let tracksGeoJson = {
      type: 'FeatureCollection',
      metadata: {
        date: today,
        source: 'Directorate of Fire Emergency Services, Govt. of Goa',
        description: 'Daily GPS tracks of fire trucks'
      },
      features: []
    };
    
    // Load existing tracks file if it exists
    if (fs.existsSync(gpxFilePath)) {
      try {
        const existingContent = fs.readFileSync(gpxFilePath, 'utf8');
        tracksGeoJson = JSON.parse(existingContent);
        debugLog(`Loaded existing GPX tracks file for ${today}`);
      } catch (err) {
        debugLog(`Error reading existing GPX file, will create new: ${err.message}`);
      }
    } else {
      debugLog(`Creating new GPX tracks file for ${today}`);
    }
    
    // Create map of vehicle IDs to existing track features
    const vehicleTrackMap = {};
    tracksGeoJson.features.forEach((feature, index) => {
      if (feature.properties && feature.properties.Vehicle_No) {
        vehicleTrackMap[feature.properties.Vehicle_No] = index;
      }
    });
    
    // Update tracks for each truck
    trucks.forEach(truck => {
      const vehicleId = truck.Vehicle_No;
      const timestamp = truck.Datetime || new Date().toISOString();
      const coords = [parseFloat(truck.Longitude), parseFloat(truck.Latitude)];
      
      if (!vehicleId || !isValidCoordinate(coords[0]) || !isValidCoordinate(coords[1])) {
        debugLog(`Skipping GPX update for vehicle with invalid data: ${vehicleId || 'unknown'}`);
        return;
      }
      
      // Check if this vehicle already has a track
      if (vehicleTrackMap.hasOwnProperty(vehicleId)) {
        // Update existing track
        const featureIndex = vehicleTrackMap[vehicleId];
        const feature = tracksGeoJson.features[featureIndex];
        
        // Add point to coordinates if it's not a duplicate of the last point
        const existingCoords = feature.geometry.coordinates;
        const lastCoord = existingCoords.length > 0 ? existingCoords[existingCoords.length - 1] : null;
        
        // Only add if coordinates are different from the last point (avoid duplicates when stationary)
        if (!lastCoord || lastCoord[0] !== coords[0] || lastCoord[1] !== coords[1]) {
          feature.geometry.coordinates.push(coords);
          feature.properties.lastUpdated = timestamp;
        }
      } else {
        // Create new track for this vehicle
        const newFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [coords]
          },
          properties: {
            Vehicle_No: vehicleId,
            Vehicle_Name: truck.Vehicle_Name || '',
            Branch: truck.Branch || '',
            created: timestamp,
            lastUpdated: timestamp
          }
        };
        
        tracksGeoJson.features.push(newFeature);
        vehicleTrackMap[vehicleId] = tracksGeoJson.features.length - 1;
      }
    });
    
    // Update the metadata
    tracksGeoJson.metadata.lastUpdated = new Date().toISOString();
    tracksGeoJson.metadata.count = tracksGeoJson.features.length;
    
    // Write the updated file
    fs.writeFileSync(gpxFilePath, JSON.stringify(tracksGeoJson, null, 2));
    debugLog(`Updated GPX tracks file with ${tracksGeoJson.features.length} vehicle tracks`);
    
    return gpxFilePath;
  } catch (error) {
    debugLog(`ERROR updating GPX tracks: ${error.message}`, error.stack);
    return null;
  }
}

// Helper function to validate coordinate
function isValidCoordinate(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// Main function to fetch and cache data
export async function fetchAndCacheData() {
  try {
    debugLog('Starting data fetch process');
    debugLog(`Fetching fire truck data from API: ${API_URL}`);
    
    const response = await fetch(API_URL);
    
    debugLog(`API response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const jsonData = await response.json();
    debugLog(`Received JSON response: ${JSON.stringify(jsonData).substring(0, 200)}...`);
    
    // Extract vehicle data from the JSON structure
    let rows = [];
    if (jsonData && jsonData.root && jsonData.root.VehicleData) {
      rows = jsonData.root.VehicleData;
      debugLog(`Parsed ${rows.length} fire truck records from JSON`);
    } else {
      debugLog('No vehicle data found in JSON response or unexpected JSON structure');
      debugLog('Full JSON response:', JSON.stringify(jsonData));
    }
    
    // Save parsed data for other modules
    parsedFireTrucks = rows;
    
    // Process each row to ensure coordinates are properly formatted
    rows.forEach(row => {
      // Ensure latitude and longitude are numeric
      if (row.Latitude) row.Latitude = parseFloat(row.Latitude);
      if (row.Longitude) row.Longitude = parseFloat(row.Longitude);
      
      // Check if we have valid coordinates
      if (!isValidGoaCoordinate(row.Latitude, 'lat') || !isValidGoaCoordinate(row.Longitude, 'lng')) {
        debugLog(`WARNING: Invalid coordinates for vehicle ${row.Vehicle_No}: ${row.Latitude}, ${row.Longitude}`);
      }
    });
    
    // Filter out rows with invalid coordinates
    const validRows = rows.filter(row => 
      isValidGoaCoordinate(row.Latitude, 'lat') && isValidGoaCoordinate(row.Longitude, 'lng')
    );
    
    if (validRows.length < rows.length) {
      debugLog(`Filtered out ${rows.length - validRows.length} records with invalid coordinates`);
    }
    
    // Convert to GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: validRows.map(row => {
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
    
    // Add metadata
    const result = {
      type: 'FeatureCollection',
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'Directorate of Fire Emergency Services, Govt. of Goa',
        count: validRows.length
      },
      features: geojson.features
    };
    
    // Save to file
    debugLog(`Saving data to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    debugLog('Fire truck data cached successfully!');
    
    // Update daily GPX tracks
    const gpxFilePath = updateDailyGpxTracks(validRows);
    if (gpxFilePath) {
      debugLog(`Daily GPX tracks updated successfully at ${gpxFilePath}`);
    } else {
      debugLog('Failed to update daily GPX tracks');
    }
    
    return validRows;
  } catch (error) {
    debugLog(`ERROR: ${error.message}`, error.stack);
    console.error('Error fetching or caching data:', error);
    process.exit(1);
  }
}

// Clear the debug log before starting
fs.writeFileSync(DEBUG_LOG_FILE, '');
debugLog('Debug logging initialized');

// Run only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAndCacheData();
}