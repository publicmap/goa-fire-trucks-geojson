# Goa Fire Truck API

Public archive of [DFES Goa](https://dfes.goa.gov.in/)'s live fire truck API. The data is automatically refreshed every 15-60 minutes. 

**Live Data**

- **[Data Explorer](https://publicmap.github.io/goa-fire-trucks-geojson/)**
- Latest data _updated every 15-60 minutes_ [(view)](https://github.com/publicmap/goa-fire-trucks-geojson/blob/data/data/goa-fire-trucks.geojson) | [(raw)](https://raw.githubusercontent.com/publicmap/goa-fire-trucks-geojson/refs/heads/data/data/goa-fire-trucks.geojson)
- View map on [amche atlas](https://amche.in/?layers=goa-firetrucks,mapbox-satellite#8.97/15.3422/73.9618)

**Data Archive**

- Data coverage [(view)](https://github.com/publicmap/goa-fire-trucks-geojson/blob/data/data/coverage.csv)
- Movement GeoJSON [(by date)](https://github.com/publicmap/goa-fire-trucks-geojson/tree/data/data) 
- Timeseries CSV [(by date)](https://github.com/publicmap/goa-fire-trucks-geojson/tree/data/data/csv) 



## Details

We use GitHub Actions to:
1. Fetch the API data
2. Archive in CSV and GeoJSON format

The actual implementation consists of:
- A GitHub Actions workflow (`.github/workflows/`) that runs on a 15 minute schedule
- A script to fetch and process the API data (`index.js`)
- A /data directory that gets updated by the workflow in the `data` branch

