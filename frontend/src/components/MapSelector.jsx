import { useState, useEffect, useRef } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from './Button';

const MapSelector = ({ onSelect, onClose }) => {
  const [coordinates, setCoordinates] = useState({ lat: 23.8103, lng: 90.4125 }); // Default: Dhaka
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Initialize map (using Leaflet or Google Maps)
    // For now, we'll use a simple clickable map interface
    // In production, integrate with Google Maps or Leaflet
    
    // Get user's current location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Use default (Dhaka) if geolocation fails
          console.log('Using default location');
        }
      );
    }

    // Reverse geocode to get address
    reverseGeocode(coordinates.lat, coordinates.lng);
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      setLoading(true);
      // Using Nominatim (OpenStreetMap) for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      if (data.address) {
        const addr = data.address;
        const addressString = [
          addr.road,
          addr.suburb || addr.village,
          addr.city || addr.town,
          addr.state,
          addr.country
        ].filter(Boolean).join(', ');
        setAddress(addressString);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e) => {
    // This would be handled by the map library
    // For now, we'll use a simple coordinate input
  };

  const handleCoordinateChange = (type, value) => {
    const newCoords = {
      ...coordinates,
      [type]: parseFloat(value) || 0
    };
    setCoordinates(newCoords);
    reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const handleConfirm = () => {
    onSelect(coordinates, address || `${coordinates.lat}, ${coordinates.lng}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-600" />
            Select Delivery Location on Map
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Map Placeholder - In production, integrate with Google Maps or Leaflet */}
          <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary-600 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">Map Integration</p>
              <p className="text-sm text-gray-500">
                In production, this would show an interactive map.
                <br />
                For now, enter coordinates manually below.
              </p>
            </div>
            
            {/* Click indicator */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: '50%',
                top: '50%'
              }}
            >
              <div className="w-6 h-6 bg-primary-600 rounded-full border-4 border-white shadow-lg"></div>
            </div>
          </div>

          {/* Coordinate Input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={coordinates.lat}
                onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="23.8103"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={coordinates.lng}
                onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="90.4125"
              />
            </div>
          </div>

          {/* Address Display */}
          {loading ? (
            <p className="text-sm text-gray-500">Loading address...</p>
          ) : address ? (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Selected Location:</p>
              <p className="text-sm text-blue-700">{address}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
          )}

          {/* Instructions */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 Tip: You can enter coordinates manually or use the map (when integrated).
              The system will automatically detect the address for the selected location.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;

