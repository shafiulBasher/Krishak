import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Package, MapPin, Calendar, Phone, User,
  Truck, CheckCircle, Clock, CreditCard, FileText, Camera, Image, Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { reviewService } from '../../services/reviewService';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import Card from '../../components/Card';
import OrderTracking from '../../components/OrderTracking';
import ReviewForm from '../../components/ReviewForm';
import { getImageUrl, getPhotoUrl } from '../../utils/imageHelper';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  // Only buyers can review
  const isBuyer = user?.role === 'buyer';

  useEffect(() => {
    fetchOrderDetails();
    // Set up polling for live updates every 10 seconds (only if no connection errors)
    const interval = setInterval(() => {
      if (!connectionError) {
        fetchOrderDetails(true); // silent fetch
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [orderId, connectionError]);

  useEffect(() => {
    if (order && isBuyer) {
      checkReviewStatus();
    }
  }, [order, isBuyer]);

  const checkReviewStatus = async () => {
    // Only buyers can check review status
    if (!isBuyer) {
      console.log('⏭️ Skipping review check: User is not a buyer');
      return;
    }
    
    try {
      const response = await reviewService.checkCanReview(orderId);
      setCanReview(response.canReview);
      setHasReviewed(response.hasReviewed);
      
      // Also check locally if order is completed/delivered
      if (order && (order.orderStatus === 'completed' || order.deliveryStatus === 'delivered')) {
        if (!response.hasReviewed) {
          setCanReview(true);
        }
      }
    } catch (error) {
      console.log('⚠️ Review check failed (using fallback logic):', error.message);
      // Silently handle - use fallback logic below
      // If API fails, check local order state
      if (order && (order.orderStatus === 'completed' || order.deliveryStatus === 'delivered')) {
        setCanReview(true);
      }
    }
  };

  const fetchOrderDetails = async (silent = false) => {
    try {
      const response = await orderService.getOrderById(orderId);
      // API returns { success: true, data: order }
      const orderData = response.data || response;
      
      // Detailed logging for debugging photo issues
      console.log('📦 Order data received:', {
        userRole: user?.role,
        deliveryStatus: orderData.deliveryInfo?.status,
        statusHistory: orderData.deliveryInfo?.statusHistory?.map(h => ({
          status: h.status,
          photo: h.photo,
          timestamp: h.timestamp
        })),
        pickupPhoto: orderData.deliveryInfo?.pickupPhoto,
        deliveryProofPhoto: orderData.deliveryInfo?.deliveryProofPhoto
      });
      
      setOrder(orderData);
      setError('');
      setConnectionError(false); // Reset on success
    } catch (err) {
      // Stop polling on network errors
      if (err.message?.includes('Network Error') || err.code === 'ERR_CONNECTION_REFUSED') {
        setConnectionError(true);
      }
      if (!silent) {
        setError(err.message || 'Failed to load order details');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <Package className="w-16 h-16 mx-auto mb-2" />
            <p className="text-lg">{error}</p>
          </div>
          <Button onClick={() => navigate('/buyer/orders')}>
            Back to Orders
          </Button>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
              <Package className="w-4 h-4 mr-2" />
              {order.orderStatus}
            </span>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
              <CreditCard className="w-4 h-4 mr-2" />
              Payment: {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Tracking */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Live Shipment Tracking</h2>
              </div>
              <p className="text-sm text-gray-600">
                Real-time updates on your order delivery status
              </p>
            </div>
            <div className="p-6">
              <OrderTracking
                currentStatus={order.deliveryInfo?.status || 'not_assigned'}
                statusHistory={order.deliveryInfo?.statusHistory || []}
                transporterInfo={order.deliveryInfo?.transporter}
                showTransporter={true}
                compact={false}
              />
            </div>
          </Card>

          {/* Pickup & Delivery Photos */}
          {(order.deliveryInfo?.pickupPhoto?.url || order.deliveryInfo?.deliveryProofPhoto?.url) && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Verification Photos</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Photos uploaded by the delivery partner for verification
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pickup Photo */}
                  {order.deliveryInfo?.pickupPhoto?.url ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Image className="w-4 h-4 text-green-600" />
                        Pickup Verification
                      </div>
                      <div className="relative group">
                        <img
                          src={getPhotoUrl(order.deliveryInfo.pickupPhoto)}
                          alt="Pickup verification"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          onLoad={(e) => {
                            console.log('✅ Pickup photo loaded:', getPhotoUrl(order.deliveryInfo.pickupPhoto));
                          }}
                          onError={(e) => {
                            console.error('❌ Pickup photo failed:', {
                              photoObject: order.deliveryInfo.pickupPhoto,
                              constructedUrl: getPhotoUrl(order.deliveryInfo.pickupPhoto)
                            });
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="14">Photo unavailable</text></svg>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <a
                            href={getPhotoUrl(order.deliveryInfo.pickupPhoto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
                          >
                            View Full Image
                          </a>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Uploaded: {order.deliveryInfo.pickupPhoto.uploadedAt ? new Date(order.deliveryInfo.pickupPhoto.uploadedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  ) : order.deliveryStatus === 'picked' || order.deliveryStatus === 'in_transit' || order.deliveryStatus === 'delivered' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Image className="w-4 h-4 text-gray-400" />
                        Pickup Verification
                      </div>
                      <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                        <div className="text-center p-4">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Photo not available</p>
                          <p className="text-xs text-gray-400 mt-1">Transporter did not upload pickup photo</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Delivery Proof Photo */}
                  {order.deliveryInfo?.deliveryProofPhoto?.url ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        Delivery Proof
                      </div>
                      <div className="relative group">
                        <img
                          src={getPhotoUrl(order.deliveryInfo.deliveryProofPhoto)}
                          alt="Delivery proof"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="14">Photo unavailable</text></svg>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <a
                            href={getPhotoUrl(order.deliveryInfo.deliveryProofPhoto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
                          >
                            View Full Image
                          </a>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Uploaded: {order.deliveryInfo.deliveryProofPhoto.uploadedAt ? new Date(order.deliveryInfo.deliveryProofPhoto.uploadedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  ) : order.deliveryStatus === 'delivered' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        Delivery Proof
                      </div>
                      <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                        <div className="text-center p-4">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Photo not uploaded</p>
                          <p className="text-xs text-gray-400 mt-1">Optional - Transporter chose not to upload</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          )}

          {/* Product Details */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
            </div>
            <div className="p-6">
              {order.product && (
                <div className="flex items-start gap-4">
                  {order.product.photos && order.product.photos.length > 0 ? (
                    <img
                      src={getImageUrl(order.product.photos[0])}
                      alt={order.product.cropName}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Image load error:', e.target.src);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center" style={{ display: order.product.photos && order.product.photos.length > 0 ? 'none' : 'flex' }}>
                    <span className="text-5xl">🌾</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {order.product.cropName}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">Grade: <span className="font-medium">{order.product.grade}</span></p>
                      <p className="text-gray-600">Quantity: <span className="font-medium">{order.quantity} {order.product.unit || 'kg'}</span></p>
                      <p className="text-gray-600">Price per unit: <span className="font-medium">৳{order.pricePerUnit?.toLocaleString()}/{order.product.unit || 'kg'}</span></p>
                      <p className="text-lg font-semibold text-primary-600 mt-2">
                        Total: ৳{order.totalPrice?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Price Breakdown */}
          {order.priceBreakdown && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Price Breakdown</h2>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">৳{order.totalPrice?.toLocaleString()}</span>
                  </div>
                  {order.priceBreakdown.transportFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transport Fee</span>
                      <span className="font-medium">৳{order.priceBreakdown.transportFee?.toLocaleString()}</span>
                    </div>
                  )}
                  {order.priceBreakdown.platformFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="font-medium">৳{order.priceBreakdown.platformFee?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-lg font-bold text-primary-600">
                        ৳{(
                          (order.totalPrice || 0) +
                          (order.priceBreakdown.transportFee || 0) +
                          (order.priceBreakdown.platformFee || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery Address */}
          {order.deliveryAddress && (
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  Delivery Address
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-1">{order.deliveryAddress.addressLine}</p>
                <p className="text-sm text-gray-600">{order.deliveryAddress.thana}, {order.deliveryAddress.district}</p>
              </div>
            </Card>
          )}

          {/* Delivery Slot */}
          {order.deliverySlot && (
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  Delivery Schedule
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-1">
                  {formatDate(order.deliverySlot.date)}
                </p>
                {order.deliverySlot.timeSlot && (
                  <p className="text-sm text-gray-600">{order.deliverySlot.timeSlot}</p>
                )}
              </div>
            </Card>
          )}

          {/* Farmer Info */}
          {order.farmer && (
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Farmer Details
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">{order.farmer.name}</p>
                {order.farmer.phone && (
                  <a 
                    href={`tel:${order.farmer.phone}`}
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    {order.farmer.phone}
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Payment Info */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                Payment Information
              </h3>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Method</span>
                <span className="font-medium capitalize">{order.paymentMethod?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Order Notes
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            </Card>
          )}

          {/* Review Section - Show for completed or delivered orders (Buyers only) */}
          {isBuyer && (order.orderStatus === 'completed' || order.deliveryStatus === 'delivered') && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Product Review</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Share your experience with this product to help other buyers
                </p>
              </div>
              <div className="p-6">
                {hasReviewed ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">You have already reviewed this product</p>
                    <p className="text-sm text-gray-500 mt-1">Thank you for your feedback!</p>
                  </div>
                ) : canReview ? (
                  <div>
                    {showReviewForm ? (
                      <ReviewForm
                        order={order}
                        product={order.product}
                        onReviewSubmitted={() => {
                          setShowReviewForm(false);
                          setHasReviewed(true);
                          setCanReview(false);
                          checkReviewStatus();
                        }}
                        onClose={() => setShowReviewForm(false)}
                      />
                    ) : (
                      <div className="text-center py-4">
                        <Button onClick={() => setShowReviewForm(true)}>
                          <Star className="w-4 h-4 mr-2" />
                          Write a Review
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">This order is not yet eligible for review</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Order Status: {order.orderStatus} | Delivery Status: {order.deliveryStatus || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Orders can be reviewed when they are completed or delivered.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
