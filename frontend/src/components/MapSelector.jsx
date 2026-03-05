import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Search, Navigation, ZoomIn, ZoomOut, Maximize2, Locate } from 'lucide-react';
import { Button } from './Button';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to fly to new coordinates when they change
function FlyToLocation({ center, zoom, triggerKey }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      console.log('🚀 Flying to:', center, 'zoom:', zoom, 'trigger:', triggerKey);
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center[0], center[1], zoom, triggerKey]); // Include triggerKey to force update
  
  return null;
}

const MapSelector = ({ onSelect, onClose }) => {
  // Center of Bangladesh (approximate center point)
  const [coordinates, setCoordinates] = useState({ lat: 23.6850, lng: 90.3563 }); // Center of Bangladesh
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapZoom, setMapZoom] = useState(7); // Zoom level to show all of Bangladesh
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [flyToKey, setFlyToKey] = useState(0); // Key to force fly to update
  const mapRef = useRef(null);

  // Get user's current location on mount ONLY
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newCoords);
          setCoordinates(newCoords);
          setMapZoom(13);
          setFlyToKey(prev => prev + 1);
          reverseGeocode(newCoords.lat, newCoords.lng);
        },
        () => {
          console.log('Using center of Bangladesh');
          reverseGeocode(coordinates.lat, coordinates.lng);
        }
      );
    } else {
      reverseGeocode(coordinates.lat, coordinates.lng);
    }
    setMapReady(true);
  }, []); // Empty dependency - only run on mount!

  // Close search results when clicking outside (separate effect)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSearchResults && !e.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSearchResults]);

  const reverseGeocode = async (lat, lng) => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/geocode/reverse?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      
      if (data.display_name) {
        // Use the full display name from Nominatim (includes place name)
        setAddress(data.display_name);
      } else if (data.address) {
        const addr = data.address;
        // Build address with place name first
        const addressParts = [
          addr.city || addr.town || addr.municipality || addr.district,
          addr.state || addr.region,
          addr.country
        ].filter(Boolean);
        
        // If we have a road/house number, add it at the beginning
        if (addr.road || addr.house_number) {
          addressParts.unshift(addr.road || addr.house_number);
        }
        
        const addressString = addressParts.join(', ');
        setAddress(addressString || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearching(true);
      const searchQuery = query.trim();
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_BASE}/geocode/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('❌ Location search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce — 600ms to stay well within Photon's rate limits
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      searchLocation(value);
    }, 600);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(window.searchTimeout);
      if (searchResults.length > 0) {
        // Select the top result immediately
        handleSelectSearchResult(searchResults[0]);
      } else if (searchQuery.trim().length >= 2) {
        // No results yet — trigger search now then auto-select first
        searchLocation(searchQuery).then(() => {
          // handleSelectSearchResult will be available after state update
        });
      }
    }
    if (e.key === 'Escape') {
      setShowSearchResults(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    console.log('📍 Selected result:', result.display_name);
    console.log('📍 Coordinates:', result.lat, result.lon);
    
    const newCoords = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    
    console.log('📍 Setting new coordinates:', newCoords);
    
    // Update state to trigger map fly
    setCoordinates(newCoords);
    setMapZoom(16); // Zoom in closer when location is selected
    setFlyToKey(prev => prev + 1); // Force the FlyToLocation to trigger
    setSearchQuery(result.display_name);
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Set address immediately from search result
    if (result.display_name) {
      setAddress(result.display_name);
    }
    
    // Also reverse geocode to get more detailed address
    reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const handleMapClick = (latlng) => {
    const newCoords = {
      lat: latlng.lat,
      lng: latlng.lng
    };
    setCoordinates(newCoords);
    setMapZoom(16); // Zoom in when user clicks on map
    setFlyToKey(prev => prev + 1); // Force the FlyToLocation to trigger
    reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const handleCoordinateChange = (type, value) => {
    const newCoords = {
      ...coordinates,
      [type]: parseFloat(value) || 0
    };
    setCoordinates(newCoords);
    setMapZoom(14); // Zoom in when coordinates are manually entered
    reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const handleConfirm = () => {
    onSelect(coordinates, address || `${coordinates.lat}, ${coordinates.lng}`);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newCoords);
          setCoordinates(newCoords);
          setMapZoom(16);
          setFlyToKey(prev => prev + 1); // Force fly to
          reverseGeocode(newCoords.lat, newCoords.lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please ensure location permissions are enabled.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 18));
    setFlyToKey(prev => prev + 1);
  };

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 6));
    setFlyToKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-xl shadow-2xl w-full overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'max-w-full max-h-full' : 'max-w-5xl max-h-[95vh]'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5 flex justify-between items-center z-10 shadow-lg">
          <h2 className="text-2xl font-bold flex items-center">
            <MapPin className="w-6 h-6 mr-3" />
            Select Delivery Location
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: isFullscreen ? 'calc(100vh - 180px)' : 'calc(95vh - 180px)' }}>
          {/* Search Location */}
          <div className="relative search-container">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  placeholder="Search: Road 12 Mirpur, House 45 Gulshan, Dhanmondi 27..."
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base shadow-sm"
                />
                {searching ? (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                ) : searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : null}
              </div>
              <button
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md whitespace-nowrap"
                title="Use my current location"
              >
                <Locate className="w-5 h-5" />
                <span className="hidden sm:inline">Current Location</span>
              </button>
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-[9999] w-full mt-2 bg-white border-2 border-primary-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                {console.log('🎨 Rendering dropdown with', searchResults.length, 'results')}
                {searchResults.map((result, index) => {
                  // Build a smart display name with address components
                  const addr = result.address || {};
                  
                  // Get the primary name (building, road, or first part of display_name)
                  const primaryName = addr.building || addr.amenity || addr.shop || 
                    addr.road || addr.neighbourhood || result.display_name.split(',')[0];
                  
                  // Build secondary info (area details)
                  const areaInfo = [
                    addr.house_number,
                    addr.road && !primaryName.includes(addr.road) ? addr.road : null,
                    addr.neighbourhood,
                    addr.suburb,
                    addr.city || addr.town || addr.municipality,
                    addr.district
                  ].filter(Boolean).join(', ');
                  
                  // Get place type for icon/badge
                  const placeType = result.type || result.class || '';
                  const getPlaceIcon = () => {
                    if (['house', 'building', 'residential'].includes(placeType)) return '🏠';
                    if (['road', 'street', 'avenue'].includes(placeType)) return '🛣️';
                    if (['shop', 'supermarket', 'mall'].includes(placeType)) return '🏪';
                    if (['restaurant', 'cafe', 'food'].includes(placeType)) return '🍽️';
                    if (['hospital', 'clinic', 'doctors'].includes(placeType)) return '🏥';
                    if (['school', 'university', 'college'].includes(placeType)) return '🎓';
                    if (['mosque', 'church', 'temple'].includes(placeType)) return '🕌';
                    if (['park', 'garden'].includes(placeType)) return '🌳';
                    if (['bank', 'atm'].includes(placeType)) return '🏦';
                    if (['bus_station', 'bus_stop'].includes(placeType)) return '🚌';
                    return '📍';
                  };
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-5 py-3 hover:bg-primary-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 group"
                    >
                      <div className="flex items-start">
                        <span className="text-xl mr-3 mt-0.5">{getPlaceIcon()}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-900 group-hover:text-primary-700">
                            {primaryName}
                          </p>
                          {areaInfo && (
                            <p className="text-sm text-gray-600 mt-0.5">
                              {areaInfo}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {result.display_name}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded capitalize ml-2">
                          {placeType.replace('_', ' ') || 'place'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Map */}
          {mapReady && (
            <div className={`w-full rounded-xl overflow-hidden border-4 border-primary-200 shadow-xl relative ${
              isFullscreen ? 'h-[calc(100vh-400px)]' : 'h-[500px]'
            }`}>
              <MapContainer
                center={[coordinates.lat, coordinates.lng]}
                zoom={mapZoom}
                minZoom={6}
                maxZoom={18}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Selected location marker */}
                <Marker position={[coordinates.lat, coordinates.lng]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">Delivery Location</p>
                      <p className="text-sm text-gray-600">{address || 'Selected point'}</p>
                    </div>
                  </Popup>
                </Marker>
                {/* User's current location circle (if available) */}
                {userLocation && (
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={100}
                    pathOptions={{ color: 'blue', fillColor: 'lightblue', fillOpacity: 0.3 }}
                  />
                )}
                <MapClickHandler onMapClick={handleMapClick} />
                <FlyToLocation 
                  center={[coordinates.lat, coordinates.lng]} 
                  zoom={mapZoom} 
                  triggerKey={flyToKey}
                />
              </MapContainer>
              
              {/* Map Controls Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                <button
                  onClick={handleZoomIn}
                  className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={handleGetCurrentLocation}
                  className="bg-primary-600 p-3 rounded-lg shadow-lg hover:bg-primary-700 transition-colors"
                  title="Go to my location"
                >
                  <Navigation className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Address Display */}
          {loading ? (
            <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 animate-pulse">
              <p className="text-sm text-gray-500">Loading address...</p>
            </div>
          ) : address ? (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-sm">
              <p className="text-sm font-bold text-green-900 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Selected Location:
              </p>
              <p className="text-base text-green-800 font-medium">{address}</p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <p className="text-sm text-gray-600 font-medium">
                Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-5 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Click <strong>Confirm</strong> to use this location
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="px-6">
              <MapPin className="w-4 h-4 mr-2" />
              Confirm Location
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
