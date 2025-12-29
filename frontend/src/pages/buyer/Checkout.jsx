import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Plus, Clock, DollarSign, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { getAddresses } from '../../services/userService';
import { toast } from 'react-toastify';
import ErrorBoundary from '../../components/ErrorBoundary';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart, updateDeliveryPreferences } = useContext(CartContext);
  const { user } = useAuth();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('address'); // 'address' or 'map'
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [deliverySlots, setDeliverySlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [mapAddress, setMapAddress] = useState('');
  const [mapThana, setMapThana] = useState('');
  const [mapDistrict, setMapDistrict] = useState('');
  const [newAddress, setNewAddress] = useState({
    label: '',
    recipientName: '',
    recipientPhone: '',
    addressLine1: '',
    addressLine2: '',
    thana: '',
    district: ''
  });

  // Initialize Google Map - safer detached DOM approach
  const initializeMap = () => {
    // Guard: Only initialize if map container exists and Google Maps is ready
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    // Check if Google Maps API is available
    if (!window.google?.maps) {
      // Schedule retry after short delay
      setTimeout(initializeMap, 500);
      return;
    }

    try {
      // Default center (Dhaka, Bangladesh)
      const defaultCenter = { lat: 23.8103, lng: 90.4125 };

      const mapOptions = {
        zoom: 13,
        center: defaultCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: true,
        styles: [
          {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{"visibility": "off"}]
          }
        ]
      };

      // Create map instance
      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Setup map functionality
      setupMapListeners(map);
      setMapLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapLoading(false);
    }
  };

  // Setup map click and marker listeners
  const setupMapListeners = (map) => {
    let marker = null;
    const geocoder = new window.google.maps.Geocoder();

    // Click handler for pinning location
    const clickListener = map.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // Remove old marker
      if (marker) {
        marker.setMap(null);
      }

      // Add new marker
      marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: 'Delivery Location'
      });

      // Center map on marker
      map.panTo({ lat, lng });

      // Get address from coordinates
      updateAddressFromCoordinates(geocoder, lat, lng, marker);
    });

    // Store listener for cleanup
    mapInstanceRef.current._clickListener = clickListener;
  };

  // Update address from geocoding
  const updateAddressFromCoordinates = (geocoder, lat, lng, marker) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        let district = 'Dhaka';
        let thana = 'Unknown';

        results[0].address_components.forEach(component => {
          if (component.types.includes('administrative_area_level_1')) {
            district = component.long_name;
          }
          if (component.types.includes('administrative_area_level_2')) {
            thana = component.long_name;
          }
        });

        setMapAddress(address);
        setMapThana(thana);
        setMapDistrict(district);
        setMapLocation({
          lat,
          lng,
          address,
          district,
          thana
        });

        toast.success('Location pinned successfully! 📍');

        // Setup drag listener
        if (marker) {
          marker.addListener('dragend', () => {
            const newLat = marker.getPosition().lat();
            const newLng = marker.getPosition().lng();
            updateAddressFromCoordinates(geocoder, newLat, newLng, marker);
          });
        }
      }
    });
  };

  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await getAddresses();
      setSavedAddresses(response.data || []);
      // Auto-select first address if available
      if (response.data && response.data.length > 0) {
        setSelectedAddressId(response.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Fetch delivery slots
  const fetchDeliverySlots = async (district) => {
    if (!district) return;
    setLoadingSlots(true);
    try {
      const response = await api.get('/orders/delivery-slots', {
        params: { district }
      });
      // The api interceptor returns response.data directly, so response.data contains { success, data, count }
      setDeliverySlots(response.data || []);
    } catch (err) {
      console.error('Error fetching delivery slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Get district for address
  const getAddressDistrict = () => {
    if (deliveryMethod === 'address' && selectedAddressId && savedAddresses.length > 0) {
      const addr = savedAddresses.find(a => a._id === selectedAddressId);
      return addr?.district;
    } else if (deliveryMethod === 'map' && mapLocation) {
      return mapLocation.district;
    }
    return null;
  };

  // Update slots when address changes
  useEffect(() => {
    const district = getAddressDistrict();
    if (district) {
      fetchDeliverySlots(district);
    }
  }, [selectedAddressId, mapLocation, deliveryMethod, savedAddresses]);

  // Handle map location selection
  const handleMapClick = (e) => {
    // Simulate map interaction - in real app, would use Google Maps API
    setMapLocation({
      lat: e.target.value ? parseFloat(e.target.value) : 23.8103,
      lng: 90.4125,
      address: 'Selected Location',
      district: 'Dhaka',
      thana: 'Mirpur'
    });
  };

  // Handle map-based address submission
  const handleMapAddressSubmit = () => {
    if (!mapAddress || !mapDistrict || !mapThana) {
      setError('Please fill in all address fields');
      return;
    }

    setMapLocation({
      lat: 23.8103, // Default Dhaka coordinates
      lng: 90.4125,
      address: mapAddress,
      district: mapDistrict,
      thana: mapThana
    });

    setError(null);
    toast.success('Location selected successfully');
  };

  // Add new address
  const handleAddNewAddress = async () => {
    try {
      const response = await api.post('/users/addresses', newAddress);
      // Refresh addresses list
      await fetchSavedAddresses();
      setNewAddress({
        label: '',
        recipientName: '',
        recipientPhone: '',
        addressLine1: '',
        addressLine2: '',
        thana: '',
        district: ''
      });
      setShowAddressForm(false);
    } catch (err) {
      setError('Failed to add address');
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    try {
      setCheckoutLoading(true);
      setError(null);

      // Validate selection
      if (deliveryMethod === 'address' && !selectedAddressId) {
        setError('Please select a delivery address');
        setCheckoutLoading(false);
        return;
      }

      if (deliveryMethod === 'map' && !mapLocation) {
        setError('Please select location on map');
        setCheckoutLoading(false);
        return;
      }

      // Create order
      const orderData = {
        paymentMethod,
        notes,
        ...(deliveryMethod === 'address' ? { deliveryAddressId: selectedAddressId } : { mapLocation }),
        ...(selectedSlot && { deliverySlot: selectedSlot })
      };

      const response = await api.post('/orders', orderData);

      if (response.success) {
        // Clear cart
        await clearCart();

        toast.success(response.message || 'Order placed successfully!');
        
        // Navigate to order confirmation
        navigate('/buyer/my-orders', { 
          state: { 
            orderId: response.data?.[0]?._id,
            message: response.message 
          }
        });
      } else {
        setError(response.message || 'Failed to place order');
      }
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : err.message || 'Failed to place order';
      setError(errorMsg);
      console.error('Order error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Fetch saved addresses on mount
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  // Initialize Google Map when delivery method changes
  useEffect(() => {
    if (deliveryMethod === 'map') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Clean up map instance when switching away
      if (mapInstanceRef.current) {
        try {
          // Remove click listener if it exists
          if (mapInstanceRef.current._clickListener) {
            window.google.maps.event.removeListener(mapInstanceRef.current._clickListener);
          }
          // Clear the reference
          mapInstanceRef.current = null;
        } catch (e) {
          console.warn('Error cleaning up map:', e);
        }
      }
    }
  }, [deliveryMethod]);

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Cart is Empty</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin size={20} /> Delivery Address
              </h2>

              <div className="space-y-4">
                {/* Delivery Method Toggle */}
                <div className="flex gap-4 mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="address"
                      checked={deliveryMethod === 'address'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                    />
                    <span>Use Saved Address</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="map"
                      checked={deliveryMethod === 'map'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                    />
                    <span>Select on Map</span>
                  </label>
                </div>

                {/* Address Selection */}
                {deliveryMethod === 'address' && (
                  <div>
                    {loadingAddresses ? (
                      <p className="text-gray-600">Loading addresses...</p>
                    ) : savedAddresses && savedAddresses.length > 0 ? (
                      <div className="space-y-3">
                        {savedAddresses.map((addr) => (
                          <label
                            key={addr._id}
                            className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              value={addr._id}
                              checked={selectedAddressId === addr._id}
                              onChange={(e) => setSelectedAddressId(e.target.value)}
                              className="mt-1"
                            />
                            <div className="ml-3 flex-grow">
                              <p className="font-semibold">{addr.label}</p>
                              <p className="text-sm text-gray-600">{addr.recipientName}</p>
                              <p className="text-sm text-gray-600">
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {addr.thana}, {addr.district}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 mb-4">No saved addresses. Add one below to continue.</p>
                    )}

                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="mt-4 flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                    >
                      <Plus size={20} /> Add New Address
                    </button>

                    {showAddressForm && (
                      <div className="mt-4 p-4 border-t pt-4 space-y-3">
                        <input
                          type="text"
                          placeholder="Address Label (e.g., Home, Office)"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Recipient Name"
                          value={newAddress.recipientName}
                          onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="tel"
                          placeholder="Phone (01XXXXXXXXX)"
                          value={newAddress.recipientPhone}
                          onChange={(e) => setNewAddress({ ...newAddress, recipientPhone: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 1"
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 2 (Optional)"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Thana"
                          value={newAddress.thana}
                          onChange={(e) => setNewAddress({ ...newAddress, thana: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="District"
                          value={newAddress.district}
                          onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                          className="w-full p-2 border rounded"
                        />
                        <button
                          onClick={handleAddNewAddress}
                          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                        >
                          Save Address
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Map Selection */}
                {deliveryMethod === 'map' && (
                  <div className="space-y-4">
                    <div 
                      ref={mapRef}
                      className="border rounded-lg overflow-hidden h-96 bg-gray-200 relative shadow-md"
                      style={{ WebkitTouchCallout: 'none' }}
                    >
                      {mapLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 pointer-events-none">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-2"></div>
                            <p className="text-gray-700 font-medium">Loading Map...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-blue-900 mb-3 font-semibold">
                      📍 Click on the map to pin your delivery location. You can drag the marker to adjust.
                    </p>
                    
                    {mapLocation ? (
                      <div className="bg-white p-3 rounded border-l-4 border-green-600 mb-3">
                        <p className="font-medium text-green-700">Selected Location</p>
                        <p className="text-sm text-gray-700 mt-1">{mapLocation.address}</p>
                        <p className="text-sm text-gray-600">{mapLocation.thana}, {mapLocation.district}</p>
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded border-l-4 border-yellow-500 mb-3">
                        <p className="text-sm text-yellow-700">No location selected yet. Click on the map to add a pin.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          placeholder="Address will be auto-filled when you pin on map"
                          value={mapAddress}
                          onChange={(e) => setMapAddress(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Thana</label>
                          <input
                            type="text"
                            placeholder="Auto-detected"
                            value={mapThana}
                            onChange={(e) => setMapThana(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">District</label>
                          <input
                            type="text"
                            placeholder="Auto-detected"
                            value={mapDistrict}
                            onChange={(e) => setMapDistrict(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleMapAddressSubmit}
                        disabled={!mapLocation}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                      >
                        {mapLocation ? 'Confirm Location' : 'Pin Location on Map First'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Slot Section */}
            {deliverySlots.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock size={20} /> Delivery Slot
                  </h2>

                  {loadingSlots ? (
                    <p className="text-gray-600">Loading available slots...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliverySlots.map((slot) => (
                        <label
                          key={slot._id}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            value={slot._id}
                            checked={selectedSlot === slot._id}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                          />
                          <div className="mt-2">
                            <p className="font-medium">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            <p className="text-sm text-gray-600">
                              {slot.description || 'Standard Delivery'}
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              ৳{slot.deliveryFee}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Payment Method Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={20} /> Payment Method
              </h2>

              <div className="space-y-3">
                {['cash_on_delivery', 'bkash', 'nagad', 'bank_transfer', 'card'].map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="capitalize">{method.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Additional Notes (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions for delivery..."
                className="w-full p-3 border rounded-lg h-24"
              />
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 pb-4 border-b max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.product._id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.product.cropName}</p>
                      <p className="text-gray-600">{item.quantity} kg × ৳{item.pricePerUnit}</p>
                    </div>
                    <p className="font-medium">৳{(item.totalPrice || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">৳{(cart.cartSummary?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-medium">৳{(cart.cartSummary?.platformFee || 0).toFixed(2)}</span>
                </div>
                {cart.cartSummary?.estimatedDeliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">৳{(cart.cartSummary.estimatedDeliveryFee).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between mb-6">
                <span className="font-bold">Total</span>
                <span className="text-lg font-bold text-green-600">
                  ৳{(cart.cartSummary?.total || 0).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={checkoutLoading || (deliveryMethod === 'address' && !selectedAddressId) || (deliveryMethod === 'map' && !mapLocation)}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
              >
                {checkoutLoading ? 'Processing Order...' : 'Place Order'}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                By placing an order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </ErrorBoundary>
    );
  };

export default Checkout;
