/**
 * Track Creator for Fire Truck GPS Data
 * 
 * This script creates daily track files in GeoJSON format from the fire truck GPS data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';
import { fetchAndCacheData, parsedFireTrucks } from './fetch-data.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const GPX_DIRECTORY = path.join(__dirname, 'data');
const DEBUG_LOG_FILE = path.join(__dirname, 'debug-log.txt');
const getGpxFilename = (date) => `goa-fire-trucks-gpx-${date}.geojson`;

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

// Helper function to validate coordinate
function isValidCoordinate(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// Add a function for managing daily GPX tracks
export function updateDailyGpxTracks(trucks) {
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

// Main function to update tracks
export async function createDailyTracks() {
  try {
    // Use already fetched data if available, otherwise fetch
    const trucks = parsedFireTrucks.length > 0 ? parsedFireTrucks : await fetchAndCacheData();
    
    // Update daily GPX tracks
    const gpxFilePath = updateDailyGpxTracks(trucks);
    if (gpxFilePath) {
      debugLog(`Daily GPX tracks updated successfully at ${gpxFilePath}`);
    } else {
      debugLog('Failed to update daily GPX tracks');
    }
  } catch (error) {
    debugLog(`ERROR: ${error.message}`, error.stack);
    console.error('Error creating daily tracks:', error);
    process.exit(1);
  }
}

// Run only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDailyTracks();
} 