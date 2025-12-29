# Google Maps Integration - Quick Reference

## Feature Overview

### Map Display
```
┌─────────────────────────────────────────┐
│  Google Maps (384px height)             │
│  - Centered on Dhaka, Bangladesh        │
│  - Click anywhere to pin location       │
│  - Drag marker to adjust               │
│  - Zoom, Pan, Street View Controls      │
│                                         │
│              [Loading Spinner]          │
│           (appears during init)         │
└─────────────────────────────────────────┘
```

### Location Selection Flow
```
Start → Select "Select on Map"
  ↓
Map Loads (Dhaka centered)
  ↓
User Clicks on Map
  ↓
Marker Appears + Address Auto-fills
  ↓
User Can Drag Marker (Optional)
  ↓
User Clicks "Confirm Location"
  ↓
Delivery Slots Load by District
  ↓
Complete Order
```

## Component Layout

```
Delivery Address Section
├── Radio: "Use Saved Address" | "Select on Map"
├── [When "Select on Map" is selected]
│   ├── Map Container (h-96)
│   │   └── Google Map with Controls
│   │
│   └── Location Details Card
│       ├── Selected Location Display
│       ├── Address Input Field
│       ├── Thana Input Field
│       ├── District Input Field
│       └── Confirm Location Button
```

## State Transitions

### Map Loading
```javascript
Initial State:
{
  mapLocation: null,
  mapLoading: true,
  mapAddress: '',
  mapThana: '',
  mapDistrict: ''
}
         ↓
Map Initialized:
{
  mapLoading: false
}
```

### After Pinning Location
```javascript
{
  mapLocation: {
    lat: 23.8103,
    lng: 90.4125,
    address: "Full address from Google",
    district: "Dhaka",
    thana: "Mirpur"
  },
  mapLoading: false,
  mapAddress: "Full address from Google",
  mapThana: "Mirpur",
  mapDistrict: "Dhaka"
}
```

## User Actions & Outcomes

| Action | Trigger | Result |
|--------|---------|--------|
| Click "Select on Map" | Radio button selection | Map loads with Dhaka centered |
| Click on Map | Mouse click event | Marker placed, geocoding triggered |
| Drag Marker | Marker drag | Location updates, address re-geocoded |
| Edit Address Field | Text input | Manual adjustment of address |
| Edit Thana Field | Text input | Manual adjustment of thana |
| Edit District Field | Text input | Manual adjustment of district |
| Click "Confirm Location" | Button click | Location confirmed, slots loaded |

## Location Object Structure

```javascript
{
  lat: 23.8103,                    // Latitude from marker position
  lng: 90.4125,                    // Longitude from marker position
  address: "Mirpur, Dhaka 1216, Bangladesh",  // Google formatted address
  district: "Dhaka",               // Extracted from geocoding results
  thana: "Mirpur"                  // Extracted from geocoding results
}
```

## Reverse Geocoding Extraction

```
Google Geocoding Result
  ↓
Address Components Array
  ├── administrative_area_level_1 → District
  ├── administrative_area_level_2 → Thana
  ├── locality → City
  ├── postal_code → Postal Code
  └── formatted_address → Full Address
```

## Delivery Slot Integration

```
User Confirms Location
  ↓
District Extracted (e.g., "Dhaka")
  ↓
API Call: GET /orders/delivery-slots?district=Dhaka
  ↓
Slots Displayed by Time & Cost
  ↓
User Selects Slot
  ↓
Order Created with:
  ├── mapLocation object
  ├── selectedSlot
  ├── paymentMethod
  └── notes
```

## Marker Behavior

```
Marker States:
├── Not Placed
│   └── Instructions shown: "Click on map to pin"
├── Placed (Drop Animation)
│   ├── Draggable = true
│   ├── Animation = DROP
│   └── Title = "Delivery Location"
└── Being Dragged
    └── Address updates in real-time
```

## Button States

### "Confirm Location" Button

```
Disabled State (Red):
├── Condition: mapLocation === null
├── Text: "Pin Location on Map First"
└── Cursor: not-allowed

Enabled State (Blue):
├── Condition: mapLocation !== null
├── Text: "Confirm Location"
└── Cursor: pointer
```

## Loading Overlay

```
While Initializing:
┌─────────────────────────┐
│  Loading Map...         │
│   [Spinning Circle]     │
│                         │
│ (Semi-transparent white)│
└─────────────────────────┘
```

## Error Handling

```
Scenario 1: Google Maps API Not Loaded
  └── Console warning logged
  └── setMapLoading(false)
  └── Map shows empty gray area

Scenario 2: Address Fields Not Filled
  └── Error toast: "Please fill in all address fields"
  └── Button remains disabled

Scenario 3: Geocoding Fails
  └── Thana/District show "N/A"
  └── User can manually edit fields
  └── Allows order to proceed
```

## API Integration Points

### On Map Load
```javascript
// In useEffect:
if (deliveryMethod === 'map' && mapRef.current && !mapInstanceRef.current) {
  initializeMap();
}
```

### On Location Selected
```javascript
// In map click handler:
api.post('/orders', {
  mapLocation: {
    lat, lng, address, district, thana
  },
  paymentMethod,
  notes,
  deliverySlot: selectedSlot
});
```

### Getting Delivery Slots
```javascript
// After location confirmed:
api.get('/orders/delivery-slots', {
  params: { district: mapDistrict }
});
```

## Browser Compatibility

- Chrome/Chromium ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## Performance Notes

- Map initialization: ~1-2 seconds
- Reverse geocoding: ~500ms per request
- Marker placement: Instant
- Dragging: Smooth (triggers geocoding only on dragend)

## Testing Scenarios

1. **Basic Pin**: Click map → marker appears → address auto-fills
2. **Drag Adjust**: Pin location → drag marker → address updates
3. **Manual Edit**: Pin location → edit address fields → values persist
4. **Different Districts**: Complete order → change district → slots update
5. **Mobile**: Test on mobile device → touch interactions work
6. **Network Error**: Disconnect internet → graceful error handling
7. **Rapid Clicks**: Multiple rapid map clicks → only latest marker shown

## Configuration

### Default Center
```javascript
const defaultCenter = { lat: 23.8103, lng: 90.4125 };  // Dhaka, Bangladesh
```

### Map Options
```javascript
{
  zoom: 13,
  mapTypeControl: true,        // Show map type selector
  fullscreenControl: true,     // Show fullscreen button
  streetViewControl: true,     // Show street view pegman
  zoomControl: true            // Show zoom buttons
}
```

### Reverse Geocoding
- Enabled by default
- Extracts multiple address components
- Fallback to "N/A" if component not found
- Triggers on click AND on drag end

## Future Enhancements

1. **Place Autocomplete Widget**: Search for addresses while typing
2. **Search Box**: "Search for address" input field
3. **Current Location Button**: "Use My Location" button
4. **Distance Matrix**: Show delivery distance and time
5. **Heatmap**: Show service area availability
6. **Multiple Markers**: Show farmer locations
7. **Geofencing**: Validate delivery address is in service area
8. **Route Optimization**: Show optimal delivery route

## Support & Debugging

### Enable Debug Mode
```javascript
// Add to initializeMap():
console.log('Map initialized:', map);
console.log('Map instance:', mapInstanceRef.current);
```

### Check API Key
```javascript
// Browser console:
fetch('https://maps.googleapis.com/maps/api/staticmap?center=Dhaka&zoom=13&size=400x300&key=YOUR_KEY')
```

### Monitor Geocoding
```javascript
// In geocode callback:
console.log('Geocoding results:', results);
console.log('Address components:', results[0].address_components);
```
