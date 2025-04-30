# Goa Fire Truck API

This directory contains data for Goa Fire Department's GPS API data. 

## Solution

We use GitHub Actions to:
1. Fetch the API data every minute
2. Save it to a cached JSON file in the repository
3. Serve this file via GitHub Pages
4. Configure our client to use the cached file instead of hitting the API directly

The actual implementation consists of:
- A GitHub Actions workflow (`.github/workflows/`) that runs every minute
- A script to fetch and process the API data (`fetch-data.js`)
- A cached data file that gets updated by the workflow (`data`)

## How to Use

Update the `layer-config.js` file to use the cached data URL instead of the direct API:

```js
{
    title: 'Live Fire Trucks',
    // ... other properties ...
    url: 'data/cached-fire-trucks.json', // Use this cached file instead of the API
    // ... other properties ...
}
``` 