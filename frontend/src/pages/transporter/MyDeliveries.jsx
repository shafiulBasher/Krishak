import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, MapPin, Phone, Calendar, Clock, CheckCircle, 
  Truck, Camera, AlertCircle, ChevronRight, User, X, Upload, Image
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { getMyDeliveries, updateDeliveryStatus, uploadDeliveryPhoto } from '../../services/transporterService';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageHelper';

const STATUS_CONFIG = {
  assigned: {
    label: 'Assigned',
    color: 'bg-yellow-100 text-yellow-700',
    icon: Package,
    nextStatus: 'picked',
    nextLabel: 'Mark as Picked Up',
    requiresPhoto: true
  },
  picked: {
    label: 'Picked Up',
    color: 'bg-blue-100 text-blue-700',
    icon: CheckCircle,
    nextStatus: 'in_transit',
    nextLabel: 'Start Delivery',
    requiresPhoto: false
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-purple-100 text-purple-700',
    icon: Truck,
    nextStatus: 'delivered',
    nextLabel: 'Mark as Delivered',
    requiresPhoto: false, // Optional photo for delivery
    optionalPhoto: true
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    nextStatus: null,
    nextLabel: null
  }
};

const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('active'); // 'active' or 'completed'
  
  // Photo upload modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await getMyDeliveries();
      setDeliveries(response.data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const openPhotoModal = (delivery, status) => {
    setSelectedDelivery(delivery);
    setPendingStatus(status);
    setShowPhotoModal(true);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedDelivery(null);
    setPendingStatus(null);
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };

  const handlePhotoUploadAndStatusUpdate = async () => {
    const statusConfig = STATUS_CONFIG[selectedDelivery?.deliveryStatus];
    
    // Check if photo is required (for pickup) or optional (for delivery)
    if (statusConfig?.requiresPhoto && !photoFile) {
      toast.error('Please upload a photo of the product');
      return;
    }

    try {
      setUploading(true);
      
      let photoUrl = null;
      
      // Upload photo if one is selected
      if (photoFile) {
        const photoResponse = await uploadDeliveryPhoto(selectedDelivery._id, photoFile);
        photoUrl = photoResponse.data?.photoUrl;

        if (!photoUrl) {
          throw new Error('Failed to get photo URL');
        }
      }

      // Update the status with or without photo URL
      await updateDeliveryStatus(selectedDelivery._id, { 
        status: pendingStatus, 
        photo: photoUrl,
        note: photoUrl 
          ? `Product ${pendingStatus === 'picked' ? 'picked up from farmer' : 'delivered to buyer'} - Photo verified`
          : `Product ${pendingStatus === 'delivered' ? 'delivered to buyer' : 'status updated'}`
      });

      toast.success(`Status updated to ${STATUS_CONFIG[pendingStatus]?.label || pendingStatus}`);
      closePhotoModal();
      fetchDeliveries();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update status');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, note = '', skipPhoto = false) => {
    const delivery = deliveries.find(d => d._id === orderId);
    const statusConfig = STATUS_CONFIG[delivery?.deliveryStatus];

    // If photo is required, open modal instead
    if (statusConfig?.requiresPhoto && !skipPhoto) {
      openPhotoModal(delivery, newStatus);
      return;
    }

    // If photo is optional, ask user
    if (statusConfig?.optionalPhoto && !skipPhoto) {
      openPhotoModal(delivery, newStatus);
      return;
    }

    try {
      setUpdating(orderId);
      await updateDeliveryStatus(orderId, { status: newStatus, note });
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      fetchDeliveries();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filter === 'active') {
      return delivery.deliveryStatus !== 'delivered';
    }
    return delivery.deliveryStatus === 'delivered';
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-gray-600 mt-1">Manage and track your assigned deliveries</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filter === 'active' 
                ? 'bg-primary-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active ({deliveries.filter(d => d.deliveryStatus !== 'delivered').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filter === 'completed' 
                ? 'bg-primary-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Completed ({deliveries.filter(d => d.deliveryStatus === 'delivered').length})
          </button>
        </div>

        {/* Deliveries List */}
        {filteredDeliveries.length === 0 ? (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                {filter === 'active' ? (
                  <Truck className="w-12 h-12 text-gray-400" />
                ) : (
                  <CheckCircle className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'active' ? 'No Active Deliveries' : 'No Completed Deliveries'}
              </h3>
              <p className="text-gray-600 max-w-md mb-4">
                {filter === 'active' 
                  ? 'You don\'t have any active deliveries. Check available jobs to accept new deliveries.'
                  : 'You haven\'t completed any deliveries yet.'}
              </p>
              {filter === 'active' && (
                <Link to="/transporter/available-jobs">
                  <Button>Browse Available Jobs</Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map(delivery => {
              const statusConfig = STATUS_CONFIG[delivery.deliveryStatus] || STATUS_CONFIG.assigned;
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={delivery._id} className="hover:shadow-lg transition-shadow">
                  {/* Status Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </span>
                      <span className="text-gray-500 text-sm">
                        Order #{delivery.orderNumber}
                      </span>
                    </div>
                    <Link 
                      to={`/transporter/delivery/${delivery._id}`}
                      className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
                    >
                      View Details <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {delivery.product?.photos?.[0] ? (
                        <img 
                          src={getImageUrl(delivery.product.photos[0])} 
                          alt={delivery.product.cropName}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>';
                          }}
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {delivery.product?.cropName || 'Product'} - {delivery.quantity} kg
                      </h3>
                      <p className="text-sm text-gray-500">
                        Total: ৳{delivery.totalAmount}
                      </p>
                    </div>
                  </div>

                  {/* Pickup & Delivery Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Pickup */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-green-500 text-white p-2 rounded-full">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">Pickup</p>
                        <p className="font-medium text-gray-900 truncate">{delivery.farmer?.name}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {delivery.product?.location?.village}, {delivery.product?.location?.district}
                        </p>
                        <a 
                          href={`tel:${delivery.farmer?.phone}`} 
                          className="inline-flex items-center gap-1 text-sm text-primary-600 mt-1"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      </div>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-blue-500 text-white p-2 rounded-full">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">Deliver To</p>
                        <p className="font-medium text-gray-900 truncate">{delivery.buyer?.name}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {delivery.deliveryAddress?.thana}, {delivery.deliveryAddress?.district}
                        </p>
                        <a 
                          href={`tel:${delivery.buyer?.phone}`} 
                          className="inline-flex items-center gap-1 text-sm text-primary-600 mt-1"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline Preview */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg mb-4">
                    {['assigned', 'picked', 'in_transit', 'delivered'].map((status, index) => {
                      const isCompleted = 
                        ['assigned', 'picked', 'in_transit', 'delivered'].indexOf(delivery.deliveryStatus) >= index;
                      const isCurrent = delivery.deliveryStatus === status;
                      
                      return (
                        <div key={status} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-gray-200 text-gray-400'
                          } ${isCurrent ? 'ring-2 ring-offset-2 ring-primary-600' : ''}`}>
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <span className="text-xs">{index + 1}</span>
                            )}
                          </div>
                          {index < 3 && (
                            <div className={`w-12 md:w-20 h-1 ${
                              ['assigned', 'picked', 'in_transit', 'delivered'].indexOf(delivery.deliveryStatus) > index
                                ? 'bg-primary-600'
                                : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  {statusConfig.nextStatus && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleStatusUpdate(delivery._id, statusConfig.nextStatus)}
                        disabled={updating === delivery._id}
                        fullWidth
                        className="flex items-center justify-center gap-2"
                      >
                        {updating === delivery._id ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Updating...
                          </>
                        ) : (
                          <>
                            {statusConfig.requiresPhoto && <Camera className="w-4 h-4" />}
                            {statusConfig.nextLabel}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Completed Badge */}
                  {delivery.deliveryStatus === 'delivered' && (
                    <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Delivery Completed</span>
                    </div>
                  )}

                  {/* Order Date */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Ordered: {formatDate(delivery.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {delivery.statusHistory?.length > 0 
                          ? `Last update: ${formatDate(delivery.statusHistory[delivery.statusHistory.length - 1]?.timestamp)}`
                          : 'No updates yet'}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {pendingStatus === 'picked' ? 'Pickup Verification' : 'Delivery Proof'}
              </h3>
              <p className="text-gray-600 mt-2">
                {pendingStatus === 'picked' 
                  ? 'Please take a photo of the product before picking it up. This verifies the product condition for the buyer and farmer.'
                  : 'You can optionally add a photo as proof of delivery. This helps build trust with buyers.'}
              </p>
              {pendingStatus === 'delivered' && (
                <p className="text-sm text-primary-600 mt-1">
                  📷 Photo is optional for delivery confirmation
                </p>
              )}
            </div>

            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Order:</span> #{selectedDelivery?.orderNumber}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Product:</span> {selectedDelivery?.product?.cropName} - {selectedDelivery?.quantity}kg
              </p>
            </div>

            {/* Photo Upload Area */}
            <div className="mb-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                capture="environment"
                className="hidden"
              />

              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setPhotoFile(null);
                      URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-center text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Photo ready to upload
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-700">Tap to take photo</p>
                    <p className="text-sm text-gray-500">or choose from gallery</p>
                  </div>
                </button>
              )}
            </div>

            {/* Alert */}
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">
                  {pendingStatus === 'picked' ? 'Required' : 'Optional'}
                </p>
                <p>
                  {pendingStatus === 'picked' 
                    ? 'Pickup photo is mandatory for verification purposes.'
                    : 'You can proceed without a photo, but adding one builds customer trust.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={closePhotoModal}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              {pendingStatus === 'delivered' && !photoFile && (
                <Button
                  onClick={handlePhotoUploadAndStatusUpdate}
                  disabled={uploading}
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Skip Photo
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={handlePhotoUploadAndStatusUpdate}
                disabled={(pendingStatus === 'picked' && !photoFile) || uploading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {photoFile ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {photoFile 
                      ? `Confirm ${pendingStatus === 'picked' ? 'Pickup' : 'Delivery'}`
                      : `Confirm ${pendingStatus === 'picked' ? 'Pickup' : 'Delivery'}`
                    }
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
