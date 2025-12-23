import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, MapPin, Truck, Clock, Star, AlertCircle, CheckCircle, XCircle, Package } from 'lucide-react';
import api from '../../services/api';

const MyOrders = () => {
  const { user } = useAuth();
  const { status: statusFilter } = useParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState(statusFilter || 'all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [ratingType, setRatingType] = useState('farmer');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch buyer's orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const params = {};
        if (filterStatus !== 'all') {
          params.status = filterStatus;
        }
        
        const response = await api.get('/orders/buyer', { params });
        setOrders(response.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filterStatus]);

  // Handle order cancellation
  const handleCancelOrder = async (orderId) => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      setCancellingOrder(orderId);
      const response = await api.put(`/orders/${orderId}/cancel`, {
        reason: cancelReason
      });

      if (response.success) {
        // Update orders list
        setOrders(orders.map(order =>
          order._id === orderId ? response.data : order
        ));
        setCancelReason('');
        alert('Order cancelled successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  // Handle rating submission
  const handleSubmitRating = async (orderId) => {
    if (rating < 1 || rating > 5) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmittingRating(true);
      const response = await api.put(`/orders/${orderId}/rate`, {
        rating,
        review,
        rateType
      });

      if (response.success) {
        // Update orders list
        setOrders(orders.map(order =>
          order._id === orderId ? response.data : order
        ));
        setRatingOrder(null);
        setReview('');
        setRating(5);
        alert('Rating submitted successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get delivery status icon
  const getDeliveryStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="text-green-600" />;
      case 'in_transit':
        return <Truck className="text-blue-600" />;
      case 'picked':
        return <Package className="text-orange-600" />;
      case 'assigned':
        return <Clock className="text-yellow-600" />;
      default:
        return <AlertCircle className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                filterStatus === tab
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600">Start shopping to place your first order</p>
            <Link to="/" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Order Header */}
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          time: 'short'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        ৳{(order.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Status */}
                  <div className="flex items-center gap-2 text-gray-700">
                    {getDeliveryStatusIcon(order.deliveryStatus)}
                    <span className="text-sm font-medium">
                      {order.deliveryStatus.replace('_', ' ').charAt(0).toUpperCase() + order.deliveryStatus.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6 border-b grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Product */}
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Product</p>
                    <p className="font-medium">{order.product.cropName}</p>
                    <p className="text-sm text-gray-600">{order.quantity} kg</p>
                  </div>

                  {/* Farmer */}
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Farmer</p>
                    <p className="font-medium">{order.farmer.name}</p>
                    <p className="text-sm text-gray-600">{order.farmer.phone}</p>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Delivery Address</p>
                    <p className="font-medium text-sm">{order.deliveryAddress.addressLine}</p>
                    <p className="text-sm text-gray-600">
                      {order.deliveryAddress.thana}, {order.deliveryAddress.district}
                    </p>
                  </div>

                  {/* Payment */}
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Payment</p>
                    <p className="font-medium capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                    <p className={`text-sm font-medium ${
                      order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-6 bg-gray-50 text-sm space-y-2 border-b">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>৳{(order.priceBreakdown?.farmerEarnings * 1.05 || 0).toFixed(2)}</span>
                  </div>
                  {order.priceBreakdown?.platformFee > 0 && (
                    <div className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span>৳{(order.priceBreakdown.platformFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {order.priceBreakdown?.transportFee > 0 && (
                    <div className="flex justify-between">
                      <span>Transport Fee:</span>
                      <span>৳{(order.priceBreakdown.transportFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-6 flex gap-3 flex-wrap">
                  <button
                    onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    {selectedOrder === order._id ? 'Hide Details' : 'View Details'}
                  </button>

                  {order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed' && order.deliveryStatus !== 'in_transit' && (
                    <button
                      onClick={() => setCancellingOrder(order._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Cancel Order
                    </button>
                  )}

                  {order.orderStatus === 'completed' && !order.farmerRating && (
                    <button
                      onClick={() => {
                        setRatingOrder(order._id);
                        setRatingType('farmer');
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium flex items-center gap-2"
                    >
                      <Star size={16} />
                      Rate Farmer
                    </button>
                  )}

                  {order.orderStatus === 'completed' && order.transporter && !order.transporterRating && (
                    <button
                      onClick={() => {
                        setRatingOrder(order._id);
                        setRatingType('transporter');
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium flex items-center gap-2"
                    >
                      <Star size={16} />
                      Rate Delivery
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedOrder === order._id && (
                  <div className="p-6 bg-gray-50 border-t space-y-4">
                    {/* Status History */}
                    <div>
                      <h4 className="font-semibold mb-3">Order Timeline</h4>
                      <div className="space-y-2">
                        {order.statusHistory && order.statusHistory.map((history, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-2 h-2 mt-2 bg-green-600 rounded-full flex-shrink-0"></div>
                            <div>
                              <p className="font-medium capitalize">
                                {history.status.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(history.timestamp).toLocaleDateString('en-BD', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {history.note && (
                                <p className="text-sm text-gray-700 mt-1">{history.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ratings if available */}
                    {order.farmerRating && (
                      <div>
                        <h4 className="font-semibold mb-2">Your Rating for Farmer</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < order.farmerRating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="text-sm">{order.farmerRating.rating}/5</span>
                        </div>
                        {order.farmerRating.review && (
                          <p className="text-sm text-gray-700 mt-2">{order.farmerRating.review}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold mb-4">Cancel Order</h2>
            <p className="text-gray-600 mb-4">Are you sure you want to cancel this order?</p>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (required)"
              className="w-full p-2 border rounded-lg mb-4 h-20"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancellingOrder(null);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(cancellingOrder)}
                disabled={!cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold mb-4">
              Rate {ratingType === 'farmer' ? 'Farmer' : 'Delivery'}
            </h2>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2 text-4xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="cursor-pointer"
                  >
                    <Star
                      size={32}
                      className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Review (Optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience..."
                className="w-full p-2 border rounded-lg h-20"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRatingOrder(null);
                  setReview('');
                  setRating(5);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitRating(ratingOrder)}
                disabled={submittingRating}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
