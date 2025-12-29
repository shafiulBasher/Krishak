import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Loading } from '../../components/Loading';
import { MapPin, Calendar, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAddresses } from '../../services/userService';
import { createOrder } from '../../services/orderService';
import MapSelector from '../../components/MapSelector';

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

export const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [deliverySlot, setDeliverySlot] = useState({
    date: '',
    timeSlot: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');

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
  };

  const handleMapSelect = (coordinates, address) => {
    setMapCoordinates(coordinates);
    setShowMapSelector(false);
    // Create a temporary address object from map selection
    setSelectedAddress({
      addressLine: address,
      thana: '',
      district: '',
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
          thana: selectedAddress.thana || '',
          district: selectedAddress.district || '',
          coordinates: mapCoordinates || selectedAddress.coordinates || null
        };

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

  const subtotal = getCartTotal();
  const deliveryFee = subtotal * 0.05;
  const total = subtotal + deliveryFee;

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
                    📍 Map location selected: {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}
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

            {/* Payment Method */}
            <Card>
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
                  { value: 'bkash', label: 'bKash' },
                  { value: 'nagad', label: 'Nagad' },
                  { value: 'bank_transfer', label: 'Bank Transfer' }
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
                    <span className="font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
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
                  <span>Delivery Fee</span>
                  <span>৳{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-primary-600">৳{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                className="w-full mt-6"
                size="lg"
                disabled={loading || !selectedAddress || !deliverySlot.date || !deliverySlot.timeSlot}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
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

