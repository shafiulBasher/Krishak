import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Loading } from '../../components/Loading';
import { MapPin, Calendar, Clock, CreditCard, ArrowLeft, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAddresses } from '../../services/userService';
import { createOrder } from '../../services/orderService';
import MapSelector from '../../components/MapSelector';
import { VehicleSelector } from '../../components/VehicleSelector';
import { StripeWrapper } from '../../components/payment/StripeWrapper';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment, calculateDistanceAPI } from '../../services/paymentService';

// Helper function to convert 12-hour time to 24-hour format
const convertTo24Hour = (time12h) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
};

// Vehicle pricing configuration
const VEHICLE_PRICING = {
  van: { baseRate: 300, perKmRate: 50 },
  pickup: { baseRate: 400, perKmRate: 75 },
  truck: { baseRate: 500, perKmRate: 100 },
};

// Calculate delivery fee based on vehicle and distance
const calculateDeliveryFee = (vehicleType, distance) => {
  if (!vehicleType || !distance) return 0;
  const vehicle = VEHICLE_PRICING[vehicleType];
  if (!vehicle) return 0;
  return vehicle.baseRate + (vehicle.perKmRate * distance);
};

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Stripe Card Form Component
const StripeCardForm = ({ onPaymentSuccess, onPaymentError, amount, disabled, orderData, createOrderAndPay }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      // Step 1: Create orders and get payment intent
      const result = await createOrderAndPay();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      const { clientSecret, orderId, orderNumber } = result;

      // Step 2: Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Step 3: Confirm payment on backend
        await onPaymentSuccess(paymentIntent.id, orderId);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
      
    } catch (err) {
      setError(err.message || 'Payment failed');
      if (onPaymentError) {
        onPaymentError(err.message);
      }
      toast.error(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg bg-white">
        <CardElement
          options={{
            hidePostalCode: true, // Hide postal code - we collect address separately
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
      
      <Button
        type="submit"
        disabled={!stripe || processing || disabled}
        className="w-full"
        size="lg"
      >
        {processing ? 'Processing...' : `Pay ৳${amount?.toLocaleString() || 0}`}
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        🔒 Secured by Stripe. Your card details are encrypted.
      </p>
    </form>
  );
};

export const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [mapAddress, setMapAddress] = useState('');
  const [deliverySlot, setDeliverySlot] = useState({
    date: '',
    timeSlot: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('van');
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  // Generate available time slots
  const timeSlots = [
    '09:00 AM - 12:00 PM',
    '12:00 PM - 03:00 PM',
    '03:00 PM - 06:00 PM',
    '06:00 PM - 09:00 PM'
  ];

  // Generate available dates (next 7 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/buyer/cart');
      return;
    }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await getAddresses();
      const addressList = response.data || [];
      setAddresses(addressList);
      
      // Set default address if available
      const defaultAddress = addressList.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (addressList.length > 0) {
        setSelectedAddress(addressList[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load delivery addresses');
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setMapCoordinates(null);
    setMapAddress(''); // Clear map address when selecting saved address
  };

  // Calculate distance when address or cart items change
  useEffect(() => {
    const calculateDeliveryDistance = async () => {
      if (cartItems.length === 0) {
        setEstimatedDistance(null);
        return;
      }

      // Need either a selected address with coords or map coordinates
      const buyerCoords = mapCoordinates || selectedAddress?.coordinates;
      
      if (!buyerCoords || !buyerCoords.lat || !buyerCoords.lng) {
        setEstimatedDistance(10); // Default 10km if no buyer coords
        return;
      }

      setCalculatingDistance(true);

      try {
        // Get seller coordinates from first cart item
        const firstProduct = cartItems[0]?.product;
        const sellerCoords = firstProduct?.location?.coordinates;
        
        // Check if seller coordinates exist as object {lat, lng}
        if (sellerCoords && sellerCoords.lat && sellerCoords.lng) {
          const fromCoords = {
            lat: sellerCoords.lat,
            lng: sellerCoords.lng
          };
          const toCoords = {
            lat: buyerCoords.lat,
            lng: buyerCoords.lng
          };

          console.log('📍 Calculating distance from seller:', fromCoords, 'to buyer:', toCoords);

          try {
            // Try API call first for accurate road distance
            const result = await calculateDistanceAPI(fromCoords, toCoords);
            if (result && result.success && result.distance) {
              console.log('✅ API distance:', result.distance, 'km');
              setEstimatedDistance(Math.round(result.distance * 10) / 10);
            } else {
              // Fallback to local calculation
              const distance = calculateDistance(
                fromCoords.lat, fromCoords.lng,
                toCoords.lat, toCoords.lng
              );
              console.log('📐 Haversine distance:', distance, 'km (x1.3 for road)');
              setEstimatedDistance(Math.round(distance * 1.3 * 10) / 10); // 1.3x for road estimate
            }
          } catch (apiError) {
            console.warn('Distance API failed, using local calculation:', apiError);
            // Fallback to local Haversine calculation
            const distance = calculateDistance(
              fromCoords.lat, fromCoords.lng,
              toCoords.lat, toCoords.lng
            );
            setEstimatedDistance(Math.round(distance * 1.3 * 10) / 10); // 1.3x for road estimate
          }
        } else if (sellerCoords && Array.isArray(sellerCoords) && sellerCoords.length === 2) {
          // Handle legacy array format [lng, lat]
          const fromCoords = {
            lat: sellerCoords[1],
            lng: sellerCoords[0]
          };
          const toCoords = {
            lat: buyerCoords.lat,
            lng: buyerCoords.lng
          };

          console.log('📍 Calculating distance (array format) from seller:', fromCoords, 'to buyer:', toCoords);

          const distance = calculateDistance(
            fromCoords.lat, fromCoords.lng,
            toCoords.lat, toCoords.lng
          );
          setEstimatedDistance(Math.round(distance * 1.3 * 10) / 10);
        } else {
          // Default distance if seller location not available
          console.warn('⚠️ Seller coordinates not found, using default 10km');
          setEstimatedDistance(10);
        }
      } catch (error) {
        console.error('Distance calculation error:', error);
        setEstimatedDistance(10); // Default fallback
      } finally {
        setCalculatingDistance(false);
      }
    };

    calculateDeliveryDistance();
  }, [selectedAddress, mapCoordinates, cartItems]);

  // Helper function to parse address and extract district/thana
  const parseAddress = (addressString) => {
    if (!addressString) return { district: 'Unknown', thana: 'Unknown' };
    
    const parts = addressString.split(',').map(p => p.trim());
    let district = 'Unknown';
    let thana = 'Unknown';
    
    // Try to find district (usually contains "District" or is a major city)
    const districtIndex = parts.findIndex(p => 
      p.toLowerCase().includes('district') || 
      p.toLowerCase().includes('zilla')
    );
    
    if (districtIndex !== -1) {
      district = parts[districtIndex].replace(/district|zilla/gi, '').trim();
      // If district found, thana might be before it
      if (districtIndex > 0) {
        thana = parts[districtIndex - 1];
      }
    } else {
      // Try to identify district from common patterns
      // Usually format: "Place, Thana, District, Division, Country"
      if (parts.length >= 3) {
        // Second to last might be district
        district = parts[parts.length - 3] || parts[parts.length - 2] || 'Unknown';
        // Third to last might be thana
        if (parts.length >= 4) {
          thana = parts[parts.length - 4] || parts[parts.length - 3] || 'Unknown';
        }
      } else if (parts.length === 2) {
        // Simple format: "City, District"
        district = parts[1] || 'Unknown';
        thana = parts[0] || 'Unknown';
      } else if (parts.length === 1) {
        // Just a place name
        district = parts[0] || 'Unknown';
        thana = parts[0] || 'Unknown';
      }
    }
    
    // Clean up common suffixes
    district = district.replace(/district|zilla|division/gi, '').trim() || 'Unknown';
    thana = thana.replace(/thana|upazila|upazilla/gi, '').trim() || 'Unknown';
    
    return { district, thana };
  };

  const handleMapSelect = (coordinates, address) => {
    setMapCoordinates(coordinates);
    setMapAddress(address); // Store the address/place name
    setShowMapSelector(false);
    
    // Parse address to extract district and thana
    const { district, thana } = parseAddress(address);
    
    // Create a temporary address object from map selection
    setSelectedAddress({
      addressLine: address,
      thana: thana,
      district: district,
      coordinates: coordinates,
      isMapSelected: true
    });
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!deliverySlot.date || !deliverySlot.timeSlot) {
      toast.error('Please select a delivery date and time slot');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Create orders for each cart item
      const orderPromises = cartItems.map((item) => {
        const deliveryAddress = {
          addressLine: selectedAddress.addressLine || selectedAddress.addressLine1 || '',
          thana: selectedAddress.thana || 'Unknown',
          district: selectedAddress.district || 'Unknown',
          coordinates: mapCoordinates || selectedAddress.coordinates || null
        };
        
        // Ensure required fields are not empty
        if (!deliveryAddress.thana || deliveryAddress.thana.trim() === '') {
          deliveryAddress.thana = 'Unknown';
        }
        if (!deliveryAddress.district || deliveryAddress.district.trim() === '') {
          deliveryAddress.district = 'Unknown';
        }

        // Combine date and time slot for estimated delivery
        let deliveryDateTime = null;
        if (deliverySlot.date && deliverySlot.timeSlot) {
          try {
            const [startTime] = deliverySlot.timeSlot.split(' - ');
            // Convert "09:00 AM" to "09:00:00" format
            const time24 = convertTo24Hour(startTime.trim());
            const dateTimeString = `${deliverySlot.date}T${time24}`;
            deliveryDateTime = new Date(dateTimeString);
            
            // Validate the date
            if (isNaN(deliveryDateTime.getTime())) {
              throw new Error('Invalid date');
            }
          } catch (error) {
            console.error('Error parsing delivery date:', error);
            // Fallback to date only
            deliveryDateTime = new Date(deliverySlot.date);
          }
        }
        
        return createOrder({
          productId: item.product._id,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          deliveryAddress,
          paymentMethod,
          vehicleType: selectedVehicle,
          deliveryFee: calculateDeliveryFee(selectedVehicle, estimatedDistance),
          deliverySlot: {
            date: deliverySlot.date,
            timeSlot: deliverySlot.timeSlot,
            estimatedDateTime: deliveryDateTime ? deliveryDateTime.toISOString() : undefined
          },
          notes: notes.trim() || undefined,
          isPreOrder: item.product.isPreOrder || false
        });
      });

      await Promise.all(orderPromises);
      
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/buyer/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create order and get payment intent for Stripe
  const createOrderAndGetPaymentIntent = async () => {
    if (!selectedAddress) {
      return { success: false, error: 'Please select a delivery address' };
    }

    if (!deliverySlot.date || !deliverySlot.timeSlot) {
      return { success: false, error: 'Please select a delivery date and time slot' };
    }

    try {
      // Create the first order (for simplicity, handling single order for now)
      const item = cartItems[0];
      const deliveryAddress = {
        addressLine: selectedAddress.addressLine || selectedAddress.addressLine1 || '',
        thana: selectedAddress.thana || 'Unknown',
        district: selectedAddress.district || 'Unknown',
        coordinates: mapCoordinates || selectedAddress.coordinates || null
      };

      let deliveryDateTime = null;
      if (deliverySlot.date && deliverySlot.timeSlot) {
        try {
          const [startTime] = deliverySlot.timeSlot.split(' - ');
          const time24 = convertTo24Hour(startTime.trim());
          const dateTimeString = `${deliverySlot.date}T${time24}`;
          deliveryDateTime = new Date(dateTimeString);
        } catch (error) {
          deliveryDateTime = new Date(deliverySlot.date);
        }
      }

      // Create order with pending payment status
      const orderResponse = await createOrder({
        productId: item.product._id,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        deliveryAddress,
        paymentMethod: 'stripe',
        vehicleType: selectedVehicle,
        deliveryFee: calculateDeliveryFee(selectedVehicle, estimatedDistance),
        deliverySlot: {
          date: deliverySlot.date,
          timeSlot: deliverySlot.timeSlot,
          estimatedDateTime: deliveryDateTime ? deliveryDateTime.toISOString() : undefined
        },
        notes: notes.trim() || undefined,
        isPreOrder: item.product.isPreOrder || false
      });

      const orderId = orderResponse.data?._id || orderResponse.order?._id;
      const orderNumber = orderResponse.data?.orderNumber || orderResponse.order?.orderNumber;

      if (!orderId) {
        throw new Error('Failed to create order - no order ID returned');
      }

      console.log('Order created successfully:', orderId, orderNumber);

      // Get payment intent from backend
      let paymentResult;
      try {
        paymentResult = await createPaymentIntent(orderId, selectedVehicle);
        console.log('Payment intent API response:', paymentResult);
      } catch (apiError) {
        console.error('Payment intent API error:', apiError);
        console.error('API error details:', JSON.stringify(apiError));
        throw new Error(apiError.message || apiError.error || 'Failed to create payment intent');
      }
      
      if (!paymentResult) {
        throw new Error('Payment intent API returned null/undefined');
      }
      
      if (!paymentResult.clientSecret) {
        console.error('Payment result missing clientSecret:', paymentResult);
        throw new Error(paymentResult.message || paymentResult.error || 'Payment intent missing client secret');
      }

      console.log('Payment intent created successfully:', paymentResult.paymentIntentId);

      return {
        success: true,
        clientSecret: paymentResult.clientSecret,
        paymentIntentId: paymentResult.paymentIntentId,
        orderId,
        orderNumber,
      };
    } catch (error) {
      console.error('Error creating order and payment intent:', error);
      return { success: false, error: error.message || 'Failed to process payment' };
    }
  };

  // Handle Stripe payment success (called after successful payment)
  const handleStripePaymentSuccess = async (paymentIntentId, orderId) => {
    setLoading(true);

    try {
      // Confirm payment on backend
      const confirmResult = await confirmPayment(paymentIntentId);
      
      if (confirmResult.success) {
        toast.success('🎉 Payment successful! Order confirmed.');
        clearCart();
        navigate('/buyer/orders');
      } else {
        toast.error('Payment confirmation failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Payment was processed but confirmation failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Stripe payment error
  const handleStripePaymentError = (errorMessage) => {
    console.error('Stripe payment error:', errorMessage);
    // Order was created but payment failed - it will remain as 'pending'
  };

  const subtotal = getCartTotal();
  const deliveryFee = calculateDeliveryFee(selectedVehicle, estimatedDistance);
  const platformFee = Math.round((subtotal + deliveryFee) * 0.05); // 5% platform fee
  const total = subtotal + deliveryFee + platformFee;

  if (cartItems.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/buyer/cart')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold">Delivery Address</h2>
              </div>

              {addresses.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedAddress?._id === address._id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address._id}
                        checked={selectedAddress?._id === address._id}
                        onChange={() => handleAddressSelect(address)}
                        className="sr-only"
                      />
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{address.label}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.thana}, {address.district}
                            </p>
                            <p className="text-sm text-gray-600">{address.recipientPhone}</p>
                          </div>
                          {address.isDefault && (
                            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-4">No saved addresses. Please add one first.</p>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/buyer/addresses')}
                >
                  {addresses.length > 0 ? 'Manage Addresses' : 'Add Address'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowMapSelector(true)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Select on Map
                </Button>
              </div>

              {selectedAddress?.isMapSelected && mapCoordinates && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📍 Map location selected: {mapAddress || `${mapCoordinates.lat.toFixed(6)}, ${mapCoordinates.lng.toFixed(6)}`}
                  </p>
                </div>
              )}
            </Card>

            {/* Delivery Slot */}
            <Card>
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold">Delivery Slot</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Select Date"
                  value={deliverySlot.date}
                  onChange={(e) => setDeliverySlot({ ...deliverySlot, date: e.target.value })}
                  required
                >
                  <option value="">Choose a date</option>
                  {getAvailableDates().map((date) => (
                    <option key={date.value} value={date.value}>
                      {date.label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Select Time Slot"
                  value={deliverySlot.timeSlot}
                  onChange={(e) => setDeliverySlot({ ...deliverySlot, timeSlot: e.target.value })}
                  required
                >
                  <option value="">Choose a time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </Select>
              </div>

              {deliverySlot.date && deliverySlot.timeSlot && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Delivery scheduled for {new Date(deliverySlot.date).toLocaleDateString()} between {deliverySlot.timeSlot}
                  </p>
                </div>
              )}
            </Card>

            {/* Vehicle Selection */}
            <Card>
              <div className="flex items-center mb-4">
                <Truck className="w-5 h-5 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold">Delivery Vehicle</h2>
              </div>
              
              <VehicleSelector
                selected={selectedVehicle}
                onSelect={setSelectedVehicle}
                distance={estimatedDistance}
                disabled={loading}
              />
            </Card>

            {/* Payment Method */}
            <Card>
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'stripe', label: '💳 Credit/Debit Card', description: 'Pay securely with Stripe' },
                  { value: 'cash_on_delivery', label: '💵 Cash on Delivery', description: 'Pay when you receive' },
                  { value: 'bkash', label: '📱 bKash', description: 'Mobile payment' },
                  { value: 'nagad', label: '📱 Nagad', description: 'Mobile payment' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      paymentMethod === method.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{method.label}</span>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                      {paymentMethod === method.value && (
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Stripe Card Input - Show only when stripe is selected */}
              {paymentMethod === 'stripe' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium mb-3">Card Details</h3>
                  <StripeWrapper>
                    <StripeCardForm
                      onPaymentSuccess={handleStripePaymentSuccess}
                      onPaymentError={handleStripePaymentError}
                      createOrderAndPay={createOrderAndGetPaymentIntent}
                      amount={total}
                      disabled={loading || !selectedAddress || !deliverySlot.date || !deliverySlot.timeSlot}
                    />
                  </StripeWrapper>
                </div>
              )}
            </Card>

            {/* Order Notes */}
            <Card>
              <Input
                label="Order Notes (Optional)"
                type="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for delivery..."
                rows={3}
              />
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.cropName} × {item.quantity}
                    </span>
                    <span>৳{(item.pricePerUnit * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    Delivery ({selectedVehicle})
                    {calculatingDistance ? (
                      <span className="text-xs text-blue-500">calculating...</span>
                    ) : estimatedDistance ? (
                      <span className="text-xs text-gray-400">~{estimatedDistance}km</span>
                    ) : (
                      <span className="text-xs text-gray-400">~10km est.</span>
                    )}
                  </span>
                  <span>
                    {calculatingDistance ? (
                      <span className="text-gray-400">...</span>
                    ) : (
                      `৳${deliveryFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee (5%)</span>
                  <span>৳{platformFee.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-primary-600">৳{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Show Place Order button only for non-Stripe payments */}
              {paymentMethod !== 'stripe' && (
                <Button
                  onClick={handlePlaceOrder}
                  className="w-full mt-6"
                  size="lg"
                  disabled={loading || !selectedAddress || !deliverySlot.date || !deliverySlot.timeSlot}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              )}

              {/* Show info for Stripe - card form handles submission */}
              {paymentMethod === 'stripe' && (
                <div className="mt-6 p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-800">
                    👆 Complete payment using the card form above
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Map Selector Modal */}
      {showMapSelector && (
        <MapSelector
          onSelect={handleMapSelect}
          onClose={() => setShowMapSelector(false)}
        />
      )}
    </div>
  );
};

