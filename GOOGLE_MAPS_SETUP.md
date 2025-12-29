# Google Maps Integration Setup

## Overview
The Checkout page now includes full Google Maps integration for location-based delivery address selection. Users can:
- See an interactive Google Map
- Click on the map to pin their delivery location
- Drag the marker to adjust the location
- Automatically extract address, thana, and district using reverse geocoding

## Current Setup

### 1. Frontend Configuration
The Google Maps API is loaded in `frontend/index.html` with a placeholder API key:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDemoKeyForDevelopment&libraries=places" async defer></script>
```

### 2. Features Implemented

#### Map Initialization (`initializeMap` function)
- Centered on Dhaka, Bangladesh (default location)
- Zoom level: 13
- Full controls: map type, fullscreen, street view, zoom controls
- Responsive sizing (h-96 = 384px height)

#### Location Pinning
- **Click to Pin**: Users click anywhere on the map to create a pin
- **Draggable Marker**: The marker can be dragged to refine location
- **Reverse Geocoding**: Automatically gets address from coordinates using Google Geocoder
- **Auto-fill Fields**: Address, Thana, and District are automatically populated from geocoding results

#### Address Components Extraction
The geocoder extracts:
- `administrative_area_level_1`: District (বিভাগ)
- `administrative_area_level_2`: Thana (থানা)
- Full formatted address from Google

## Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Geocoding API** (for reverse geocoding)
   - **Places API** (optional, for address autocomplete)

4. Go to **Credentials** → Create API Key
5. Restrict key to:
   - HTTP referrers: `localhost:5177`, `yourdomain.com`
   - APIs: Maps JavaScript API, Geocoding API

### Step 2: Update API Key in Frontend

Replace the demo key in `frontend/index.html`:

**Before:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDemoKeyForDevelopment&libraries=places" async defer></script>
```

**After:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places" async defer></script>
```

### Step 3: Test the Integration

1. Navigate to the Checkout page
2. Select "Select on Map" delivery method
3. The map should load with Dhaka centered
4. Click on any location to create a pin
5. Verify that address, thana, and district auto-populate
6. Drag the marker to adjust the location
7. Click "Confirm Location" to finalize

## Component Structure

### State Management
```jsx
const [mapLocation, setMapLocation] = useState(null);      // Full location object
const [mapLoading, setMapLoading] = useState(true);        // Loading state
const [mapAddress, setMapAddress] = useState('');          // Address string
const [mapThana, setMapThana] = useState('');              // Thana/Upazila
const [mapDistrict, setMapDistrict] = useState('');        // District
```

### Event Handlers
- `initializeMap()`: Initializes the Google Map
- `handleMapAddressSubmit()`: Confirms the selected location and triggers delivery slot fetching
- Click event on map: Pins location with marker
- Drag event on marker: Updates location in real-time

## User Flow

1. **Switch to Map Mode**: Select "Select on Map" radio button
2. **View Map**: Interactive Google Map loads with Dhaka centered
3. **Pin Location**: Click anywhere to add a marker
4. **Auto-Detect**: Address, Thana, and District auto-populate from coordinates
5. **Adjust**: Drag marker to refine location if needed
6. **Edit Manually**: Edit any field if auto-detection isn't accurate
7. **Confirm**: Click "Confirm Location" button
8. **Delivery Slots**: System fetches available delivery slots based on district

## API Response Format

The location object sent to the order API:
```javascript
{
  lat: 23.8103,
  lng: 90.4125,
  address: "Complete formatted address from Google",
  district: "Dhaka",
  thana: "Mirpur"
}
```

## Troubleshooting

### Map Not Loading
1. Check browser console for errors
2. Verify API key is correct and enabled
3. Check API key restrictions (referrer, APIs)
4. Ensure JavaScript is enabled

### Addresses Not Auto-Filling
1. Verify Geocoding API is enabled in Google Cloud Console
2. Check API key has Geocoding API permission
3. Some locations might not have detailed address components

### Markers Not Draggable
1. This is by design for better UX - users can click to add new marker
2. But markers ARE draggable - if not, check Google Maps API version

## Security Notes

- **For Production**: 
  - Use environment variables for API key: `VITE_GOOGLE_MAPS_API_KEY`
  - Restrict API key by HTTP referrer to your domain only
  - Set up billing and usage limits
  - Use separate API keys for development and production

## Future Enhancements

1. **Place Autocomplete**: Add address autocomplete as user types
2. **Search Box**: Allow users to search for addresses
3. **Distance Matrix**: Calculate delivery time/cost based on location
4. **Multiple Markers**: Show farmer/pickup locations on map
5. **Route Optimization**: Show delivery routes to customers
6. **Geofencing**: Validate delivery address is in service area

## Files Modified

- `frontend/index.html`: Added Google Maps API script
- `frontend/src/pages/buyer/Checkout.jsx`: Full map integration with:
  - State management for map and location data
  - `initializeMap()` function with event handlers
  - UI components for map display and location confirmation

## Testing Checklist

- [ ] Map loads in "Select on Map" mode
- [ ] Can click to pin location
- [ ] Marker appears at clicked location with DROP animation
- [ ] Address auto-fills in input field
- [ ] District and Thana auto-fill
- [ ] Marker is draggable
- [ ] Dragging updates address fields in real-time
- [ ] "Confirm Location" button activates after pinning
- [ ] Clicking "Confirm Location" triggers delivery slot fetching
- [ ] Works on different districts (select from dropdown)
- [ ] Toast notification appears on successful confirmation
- [ ] Address selection state persists when switching address methods
