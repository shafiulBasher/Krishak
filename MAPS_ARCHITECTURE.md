# Google Maps Integration - Architecture & Data Flow

## 🏗️ Component Architecture

```
Checkout Component
│
├─ State Management
│  ├─ mapRef (useRef)                    → Map DOM container
│  ├─ mapInstanceRef (useRef)            → Google Map instance
│  ├─ mapLocation (useState)             → Location object {lat, lng, address, district, thana}
│  ├─ mapLoading (useState)              → Boolean for loading state
│  ├─ mapAddress (useState)              → Address string
│  ├─ mapThana (useState)                → Thana string
│  └─ mapDistrict (useState)             → District string
│
├─ Effects (useEffect)
│  ├─ Fetch saved addresses on mount
│  └─ Initialize map when "Select on Map" is selected
│
├─ Functions
│  ├─ initializeMap()
│  │  ├─ Check if Google Maps API loaded
│  │  ├─ Create map instance (Dhaka centered)
│  │  ├─ Setup click event listener
│  │  ├─ Create and manage marker
│  │  └─ Reverse geocode on location change
│  │
│  ├─ handleMapAddressSubmit()
│  │  ├─ Validate required fields
│  │  ├─ Confirm location
│  │  ├─ Fetch delivery slots by district
│  │  └─ Show success toast
│  │
│  ├─ fetchSavedAddresses()
│  │  └─ Load from API
│  │
│  └─ fetchDeliverySlots()
│     └─ Load based on district
│
└─ JSX Rendering
   ├─ Delivery Method Toggle (address vs map)
   │
   ├─ When method = "address"
   │  └─ Show saved addresses list
   │
   └─ When method = "map"
      ├─ Map container
      │  └─ Google Map instance
      ├─ Loading overlay
      ├─ Location display (if selected)
      ├─ Address input fields
      │  ├─ Address
      │  ├─ Thana
      │  └─ District
      └─ Confirm button
```

---

## 🔄 Data Flow Diagram

```
USER OPENS CHECKOUT
        │
        ↓
  Fetch Saved Addresses (Cart → API)
        │
        ├─ Yes ────→ Display Saved Addresses
        │
        └─ No ─────→ Show "Add New Address" button
        
USER SELECTS "SELECT ON MAP"
        │
        ↓
  Initialize Google Map
        │
        ├─ Check Google Maps API
        │
        ├─ Create Map Instance (Dhaka center)
        │
        ├─ Add Click Event Listener
        │
        └─ Set Map Loading = false
        
USER CLICKS ON MAP
        │
        ↓
  Google Maps API Event Handler
        │
        ├─ Get click coordinates (lat, lng)
        │
        ├─ Remove old marker (if exists)
        │
        ├─ Create new marker
        │  ├─ Position: {lat, lng}
        │  ├─ Draggable: true
        │  ├─ Animation: DROP
        │  └─ Title: "Delivery Location"
        │
        ├─ Trigger Reverse Geocoding
        │  │
        │  └─ Google Geocoder API
        │     │
        │     ├─ Input: {lat, lng}
        │     │
        │     ├─ Output: Address Components
        │     │  ├─ formatted_address
        │     │  ├─ administrative_area_level_1 → district
        │     │  └─ administrative_area_level_2 → thana
        │     │
        │     └─ Set State
        │        ├─ mapAddress = formatted_address
        │        ├─ mapThana = extracted thana
        │        └─ mapDistrict = extracted district
        │
        └─ Setup Marker Drag Listener
           │
           └─ On Dragend
              └─ Reverse Geocode New Position
                 └─ Update Address Fields


USER OPTIONALLY DRAGS MARKER
        │
        ↓
  Marker Dragend Event
        │
        ├─ Get new coordinates
        │
        └─ Trigger Reverse Geocoding (same as above)
        

USER OPTIONALLY EDITS FIELDS
        │
        ├─ Edit Address Field
        │
        ├─ Edit Thana Field
        │
        └─ Edit District Field
        

USER CLICKS "CONFIRM LOCATION"
        │
        ├─ Validate fields
        │
        ├─ If not valid → Show error toast
        │
        └─ If valid
           │
           ├─ Confirm location
           │
           ├─ Fetch Delivery Slots
           │  │
           │  └─ API: GET /orders/delivery-slots?district={mapDistrict}
           │     │
           │     └─ Backend returns slots for district
           │
           ├─ Show success toast
           │
           └─ Display Delivery Slot Section
              │
              └─ User selects slot & completes order
```

---

## 📦 State Transitions

```
INITIAL STATE
{
  mapLocation: null,
  mapLoading: true,
  mapAddress: '',
  mapThana: '',
  mapDistrict: ''
}
       │
       ↓
AFTER MAP INITIALIZES
{
  mapLocation: null,
  mapLoading: false,          ← Map ready
  mapAddress: '',
  mapThana: '',
  mapDistrict: ''
}
       │
       ↓
AFTER USER CLICKS MAP
{
  mapLocation: {              ← Location object created
    lat: 23.8103,
    lng: 90.4125,
    address: "...",
    district: "Dhaka",
    thana: "Mirpur"
  },
  mapLoading: false,
  mapAddress: "...",          ← Auto-filled from geocoding
  mapThana: "Mirpur",         ← Auto-detected
  mapDistrict: "Dhaka"        ← Auto-detected
}
       │
       ↓
AFTER CONFIRMING LOCATION
{
  mapLocation: {...},         ← Sent to order API
  [Delivery slots loaded]
  [User can select slot]
}
       │
       ↓
AFTER ORDER PLACEMENT
{
  mapLocation: {...},         ← Used in order creation
  deliverySlot: "slot_id",
  paymentMethod: "...",
  [Order created successfully]
}
```

---

## 🔌 API Integration Points

```
FRONTEND ←→ BACKEND

1. ON MOUNT
   ├─ API: GET /users/addresses
   └─ Response: [{address1}, {address2}, ...]

2. AFTER LOCATION CONFIRMATION
   ├─ API: GET /orders/delivery-slots?district=Dhaka
   └─ Response: [{slot1}, {slot2}, ...]

3. PLACE ORDER
   ├─ API: POST /orders
   ├─ Body: {
   │  paymentMethod: "...",
   │  mapLocation: {lat, lng, address, district, thana},
   │  deliverySlot: "slot_id",
   │  notes: "..."
   │ }
   └─ Response: {success: true, data: [order], message: "..."}
```

---

## 🗺️ Google Maps API Integration

```
GOOGLE MAPS JAVASCRIPT API
├─ Maps Service
│  ├─ Initialize Map
│  ├─ Handle Click Events
│  ├─ Create Markers
│  └─ Handle Marker Drag Events
│
└─ Geocoding Service
   ├─ Reverse Geocode (coordinates → address)
   │  └─ Input: {lat, lng}
   │     Output: {
   │       formatted_address: "123 Main St, Dhaka",
   │       address_components: [
   │         {types: ["administrative_area_level_1"], long_name: "Dhaka"},
   │         {types: ["administrative_area_level_2"], long_name: "Mirpur"}
   │       ]
   │     }
   │
   └─ Extract Components
      ├─ Full Address
      ├─ District (admin_level_1)
      └─ Thana (admin_level_2)
```

---

## 📊 Event Flow

```
Click Event
    ↓
Google Maps Captures Click
    ↓
getLatLng() → {lat, lng}
    ↓
Create Marker at {lat, lng}
    ↓
Trigger Reverse Geocoding
    ↓
Geocoder API Returns Address Components
    ↓
Extract & Process Components
    ├─ address = formatted_address
    ├─ district = admin_area_level_1
    └─ thana = admin_area_level_2
    ↓
Update React State
    ├─ setMapAddress(address)
    ├─ setMapThana(thana)
    ├─ setMapDistrict(district)
    └─ setMapLocation({lat, lng, address, district, thana})
    ↓
Component Re-renders
    └─ Display Location Info
```

---

## 🎬 Marker Lifecycle

```
MARKER CREATION
├─ User clicks map
├─ Create marker object
├─ Set properties:
│  ├─ position: {lat, lng}
│  ├─ map: google map instance
│  ├─ draggable: true
│  ├─ animation: DROP
│  └─ title: "Delivery Location"
├─ Add to map (visual display)
└─ Add drag listener

MARKER DRAGGING
├─ User drags marker
├─ Position updates in real-time
├─ Dragend event fired
├─ Reverse geocode new position
├─ Update address fields
└─ Update mapLocation state

MARKER REPLACEMENT
├─ User clicks new location
├─ Remove old marker from map
├─ Create new marker at new location
├─ Reverse geocode
├─ Update all state
└─ Show new location
```

---

## 🔄 User Interaction Loop

```
USER ACTION                 SYSTEM RESPONSE
─────────────────────────────────────────

Select "Select on Map"  →   Map initializes (Dhaka center)
                            ↓
Click on map            →   Marker placed with animation
                            Address auto-fills
                            ↓
Drag marker             →   Address updates in real-time
                            ↓
Manually edit field     →   Field value changes
                            (User can override auto-detection)
                            ↓
Click "Confirm Location" →  Location validated
                            Delivery slots loaded
                            ↓
Order placed            →   Location sent to backend
                            Order created with map location
```

---

## 📍 Address Component Extraction

```
Google Geocoding Result Object
│
└─ address_components[] array
   │
   └─ Each component has:
      ├─ long_name: "Full Name" (e.g., "Dhaka")
      ├─ short_name: "Short Name" (e.g., "DK")
      └─ types[]: ["type1", "type2"]
   
   Example:
   {
     long_name: "Dhaka",
     short_name: "DK",
     types: ["administrative_area_level_1", "political"]
   }

EXTRACTION LOGIC:
if component.types.includes("administrative_area_level_1")
  → district = component.long_name

if component.types.includes("administrative_area_level_2")
  → thana = component.long_name

formatted_address field
  → address = formatted_address
```

---

## 🎯 Loading States

```
STATE 1: Initializing
┌──────────────────────┐
│ [Spinner] Loading... │
└──────────────────────┘
↓ (After ~1-2 seconds)

STATE 2: Ready
┌─────────────────┐
│   Google Map    │
│  (Interactive)  │
└─────────────────┘
↓

STATE 3: Location Selected
┌─────────────────────────────┐
│   Google Map with Marker    │
├─────────────────────────────┤
│ ✓ Selected Location         │
│ 📍 123 Main St, Dhaka       │
├─────────────────────────────┤
│ Address: [...]              │
│ Thana: [...]                │
│ District: [...]             │
├─────────────────────────────┤
│ [CONFIRM LOCATION] (Enabled)│
└─────────────────────────────┘
```

---

## ⚙️ System Architecture

```
FRONTEND
├─ Checkout Component
│  ├─ State Management
│  ├─ Event Handlers
│  └─ UI Rendering
│
└─ Checkout.jsx
   ├─ initializeMap()
   ├─ handleMapAddressSubmit()
   ├─ API Calls via services/
   └─ JSX

        │
        ↓ (API Calls)
        
BACKEND
├─ Order Controller
│  ├─ createOrder()
│  │  └─ Uses mapLocation object
│  └─ getDeliverySlots()
│     └─ Filters by district
│
└─ Order Model
   └─ Stores deliveryAddress.isMapBased flag

        │
        ↓ (Stores)
        
DATABASE (MongoDB)
├─ Orders Collection
│  └─ deliveryAddress field
│     ├─ addressLine (from map)
│     ├─ coordinates {lat, lng}
│     ├─ isMapBased: true
│     └─ district (for slot filtering)
│
└─ DeliverySlots Collection
   └─ Indexed by district
```

---

## 🔐 Data Security Flow

```
USER PINS LOCATION
       ↓
COORDINATES CAPTURED (local only)
       ↓
REVERSE GEOCODING (Google API)
       ↓
ADDRESS EXTRACTED (stored in component state)
       ↓
USER CONFIRMS (not sent yet)
       ↓
ORDER SUBMITTED (encrypted HTTPS)
       ↓
BACKEND VALIDATES
       ├─ Check coordinates valid
       ├─ Check district matches
       └─ Store safely in database
       ↓
DATABASE STORAGE (encrypted)
```

---

## 🚀 Deployment Architecture

```
DEVELOPMENT
└─ http://localhost:5177
   └─ Demo API Key
      └─ Limited functionality

PRODUCTION
└─ https://yourdomain.com
   └─ Real API Key
      ├─ HTTP referrer restricted
      ├─ API restricted
      ├─ Usage limits set
      └─ Billing configured
      
   └─ Google Cloud
      └─ Monitor usage
      └─ Track costs
      └─ Set alerts
```

This architecture ensures smooth integration between user interactions, Google Maps APIs, your backend services, and database storage.
