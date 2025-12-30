import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Package, MapPin, Calendar, Phone, User,
  Truck, CheckCircle, Clock, CreditCard, FileText, Camera, Image, Star, X
} from 'lucide-react';
import { orderService, submitProductReview } from '../../services/orderService';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import Card from '../../components/Card';
import OrderTracking from '../../components/OrderTracking';
import { getImageUrl, getPhotoUrl } from '../../utils/imageHelper';
import { toast } from 'react-toastify';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    // Set up polling for live updates every 10 seconds
    const interval = setInterval(fetchOrderDetails, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderService.getOrderById(orderId);
      // API returns { success: true, data: order }
      const orderData = response.data || response;
      console.log('📦 Order data received:', orderData);
      setOrder(orderData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load order details');
      console.error('❌ Error fetching order:', err);
    } finally {
      setLoading(false);
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

  const handleSubmitReview = async () => {
    if (reviewData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmittingReview(true);
      await submitProductReview(orderId, reviewData);
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewData({ rating: 0, review: '' });
      fetchOrderDetails(); // Refresh order data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const canReview = () => {
    return order && 
           order.deliveryStatus === 'delivered' && 
           order.orderStatus === 'completed' &&
           !order.farmerRating?.rating;
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
                  {order.deliveryInfo?.pickupPhoto?.url && (
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
                          onError={(e) => {
                            console.error('Pickup photo load error:', e.target.src);
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af">Image not available</text></svg>';
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
                  )}

                  {/* Delivery Proof Photo */}
                  {order.deliveryInfo?.deliveryProofPhoto?.url && (
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
                            console.error('Delivery photo load error:', e.target.src);
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af">Image not available</text></svg>';
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
                  )}
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
                      <span className="text-lg font-bold text-primary-600">৳{order.totalPrice?.toLocaleString()}</span>
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

          {/* Review Section */}
          {order.farmerRating?.rating ? (
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  Your Review
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= order.farmerRating.rating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {order.farmerRating.rating}/5
                  </span>
                </div>
                {order.farmerRating.review && (
                  <p className="text-sm text-gray-700 mt-2">{order.farmerRating.review}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Reviewed on {formatDate(order.farmerRating.createdAt)}
                </p>
              </div>
            </Card>
          ) : canReview() && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <div className="p-6 text-center">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Rate Your Experience
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Help other buyers by sharing your feedback about {order.farmer?.name}'s product
                </p>
                <Button onClick={() => setShowReviewModal(true)}>
                  <Star className="w-4 h-4 mr-2" />
                  Write a Review
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Rate Your Experience</h3>
              <p className="text-gray-600 mt-2">
                How was the product quality from {order.farmer?.name}?
              </p>
            </div>

            {/* Rating Stars */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Select Rating
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= reviewData.rating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {reviewData.rating > 0 && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  {reviewData.rating === 5 && 'Excellent! 🌟'}
                  {reviewData.rating === 4 && 'Very Good! 👍'}
                  {reviewData.rating === 3 && 'Good 👌'}
                  {reviewData.rating === 2 && 'Fair 🤔'}
                  {reviewData.rating === 1 && 'Poor 👎'}
                </p>
              )}
            </div>

            {/* Review Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={reviewData.review}
                onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Share your experience with this product..."
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {reviewData.review.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
                disabled={submittingReview}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={reviewData.rating === 0 || submittingReview}
                className="flex-1"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
