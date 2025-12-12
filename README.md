# Goa Fire Truck API

Public archive of [DFES Goa](https://dfes.goa.gov.in/)'s live fire truck data.

**Available Data**

- Latest data _updated every 15-60 minutes_ [(view)](https://github.com/publicmap/goa-fire-trucks-geojson/blob/data/data/goa-fire-trucks.geojson) | [(raw)](https://raw.githubusercontent.com/publicmap/goa-fire-trucks-geojson/refs/heads/data/data/goa-fire-trucks.geojson)


- Geojson: [data/goa-fire-trucks.geojson](data/goa-fire-trucks.geojson)
- API URL: `https://raw.githubusercontent.com/publicmap/goa-fire-trucks-geojson/refs/heads/data/data/goa-fire-trucks.geojson`

## Details

We use GitHub Actions to:
1. Fetch the API data every minute
2. Save it to a cached JSON file in the repository
3. Serve this file via GitHub Pages
4. Configure our client to use the cached file instead of hitting the API directly

The actual implementation consists of:
- A GitHub Actions workflow (`.github/workflows/`) that runs every minute
- A script to fetch and process the API data (`fetch-data.js`)
- A cached data file that gets updated by the workflow (`data`)

